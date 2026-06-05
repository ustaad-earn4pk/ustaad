import anthropic
from core.config import settings
from core.database import get_supabase_admin
from core.language import should_suggest_switch
from ai.prompts import get_prompt, fill_vars
from modules.onboarding.bot import get_emoji_for_context, BOT_EMOJIS
from fastapi import HTTPException
from datetime import date
import logging

logger = logging.getLogger(__name__)


async def get_tuners() -> dict:
    db = get_supabase_admin()
    try:
        keys = ["grading_strictness", "feedback_length", "encouragement_level", "language_tone", "chat_daily_limit"]
        result = db.table("admin_settings").select("key, value").in_("key", keys).execute()
        tuners = {
            "grading_strictness": "normal",
            "feedback_length": "normal",
            "encouragement_level": "medium",
            "language_tone": "normal",
            "chat_daily_limit": 20
        }
        for row in (result.data or []):
            tuners[row["key"]] = row["value"]
        return tuners
    except Exception as e:
        logger.error(f"Tuners fetch error: {e}")
        return {"grading_strictness": "normal", "feedback_length": "normal",
                "encouragement_level": "medium", "language_tone": "normal", "chat_daily_limit": 20}


async def get_message_limit(student_id: str) -> int:
    db = get_supabase_admin()
    profile = db.table("student_profiles").select(
        "current_plan, chat_limit_override"
    ).eq("user_id", student_id).single().execute()

    if profile.data and profile.data.get("chat_limit_override") is not None:
        return int(profile.data["chat_limit_override"])

    tuners = await get_tuners()
    global_limit = tuners.get("chat_daily_limit", 20)
    if global_limit:
        return int(global_limit)

    plan = profile.data.get("current_plan", "trial") if profile.data else "trial"
    limits = {
        "trial": 10,
        "normal": settings.chat_limit_normal,
        "fast": settings.chat_limit_fast,
        "turbo": settings.chat_limit_turbo,
        "unlimited": 9999
    }
    return limits.get(plan, 10)


async def check_daily_limit(student_id: str) -> tuple[bool, int]:
    db = get_supabase_admin()
    session = db.table("chat_sessions").select("*").eq("student_id", student_id).single().execute()
    if not session.data:
        return True, await get_message_limit(student_id)

    today = date.today().isoformat()
    last_date = session.data.get("last_message_date")
    messages_today = session.data.get("messages_today", 0)

    if last_date != today:
        messages_today = 0

    limit = await get_message_limit(student_id)
    remaining = limit - messages_today
    return remaining > 0, remaining


def build_tone_instruction(tuners: dict, student_overrides: dict = None) -> str:
    t = dict(tuners)
    if student_overrides:
        for k, v in student_overrides.items():
            if v and v != "global":
                t[k] = v

    tone_map = {
        "formal": "Formal aur professional tone rakhein.",
        "normal": "Normal dost jaisa tone — naa zyada formal naa zyada casual.",
        "dost": "Bilkul dost jaisa baat karo — jaise WhatsApp pe baat kar rahe ho."
    }
    encourage_map = {
        "kam": "Encouragement kam rakhein — sirf jab genuine ho.",
        "medium": "Normal encouragement — jab student kuch acha kare.",
        "zyada": "Har response mein warmth aur encouragement zaroor ho."
    }

    tone_str = tone_map.get(t.get("language_tone", "normal"), tone_map["normal"])
    encourage_str = encourage_map.get(t.get("encouragement_level", "medium"), encourage_map["medium"])
    return f"{tone_str} {encourage_str}"


async def send_message(student_id: str, message: str, language: str = "en") -> dict:
    db = get_supabase_admin()
    try:
        can_send, remaining = await check_daily_limit(student_id)
        if not can_send:
            limit_msg = {
                "en": "You've reached today's message limit. Come back tomorrow! 😊",
                "ur_nastaliq": "آج کی حد پوری ہو گئی۔ کل واپس آئیں! 😊",
                "ur_roman": "Aaj ki limit poori ho gayi. Kal wapas aana! 😊"
            }
            return {
                "message": limit_msg.get(language, limit_msg["en"]),
                "emoji": BOT_EMOJIS["sleeping"],
                "messages_remaining": 0,
                "language_suggestion": None
            }

        tuners = await get_tuners()

        # Student overview
        profile = db.table("admin_student_overview").select("*").eq("id", student_id).single().execute()
        student = profile.data or {}

        # Student profile — full context
        student_profile = db.table("student_profiles").select(
            "bot_behavior, tuner_overrides, current_streak, longest_streak, "
            "total_tasks_assigned, total_tasks_completed, average_score, total_points, "
            "streak_badges, last_activity_date"
        ).eq("user_id", student_id).single().execute()

        bot_behavior = {}
        student_tuner_overrides = {}
        streak = 0
        avg_score = 0
        tasks_completed = 0
        tasks_assigned = 0
        total_points = 0
        streak_badges = []

        if student_profile.data:
            bot_behavior = student_profile.data.get("bot_behavior") or {}
            student_tuner_overrides = student_profile.data.get("tuner_overrides") or {}
            streak = student_profile.data.get("current_streak") or 0
            avg_score = student_profile.data.get("average_score") or 0
            tasks_completed = student_profile.data.get("total_tasks_completed") or 0
            tasks_assigned = student_profile.data.get("total_tasks_assigned") or 0
            total_points = student_profile.data.get("total_points") or 0
            streak_badges = student_profile.data.get("streak_badges") or []

        # Current task — full detail
        current_task_res = db.table("tasks").select(
            "title, description, guidelines_en, status, task_number, due_at"
        ).eq("student_id", student_id).eq("status", "assigned").order(
            "scheduled_for", desc=True
        ).limit(1).execute()

        task_info = "No active task"
        task_description = ""
        if current_task_res.data:
            t = current_task_res.data[0]
            task_info = t.get("title", "Task")
            task_description = t.get("description", "")
            guidelines = t.get("guidelines_en", [])
            if isinstance(guidelines, list) and guidelines:
                steps_text = " | ".join(guidelines[:5])
                task_description += f" Steps: {steps_text}"

        # Last graded task
        last_graded = db.table("tasks").select(
            "title, ai_score"
        ).eq("student_id", student_id).eq("status", "graded").order(
            "graded_at", desc=True
        ).limit(1).execute()

        last_task_score = None
        last_task_title = None
        if last_graded.data:
            last_task_score = last_graded.data[0].get("ai_score")
            last_task_title = last_graded.data[0].get("title")

        # Recent chat history
        session = db.table("chat_sessions").select("*").eq("student_id", student_id).single().execute()
        session_id = session.data["id"] if session.data else None

        recent_messages = []
        if session_id:
            msgs = db.table("chat_messages").select("role, content").eq(
                "session_id", session_id
            ).order("created_at", desc=True).limit(10).execute()
            recent_messages = list(reversed(msgs.data or []))

        tone_instruction = build_tone_instruction(tuners, student_tuner_overrides)

        # Rich context block
        badge_names = [b.get("label", "") for b in streak_badges] if streak_badges else []
        context_block = f"""
STUDENT CONTEXT (use this to give personalized responses):
- Name: {student.get("full_name", "Student")}
- Level: {student.get("skill_level", 1)} | Track: {student.get("current_track", "Not assigned")}
- Course Progress: {student.get("completion_rate_pct", 0)}%
- Tasks: {tasks_completed}/{tasks_assigned} completed | Avg Score: {round(avg_score, 1)}% | Points: {total_points}
- Streak: {streak} days | Badges: {", ".join(badge_names) if badge_names else "None yet"}
- Last Task: {last_task_title or "None"} | Score: {last_task_score or "N/A"}
- Today's Task: {task_info}
- Task Details: {task_description[:300] if task_description else "N/A"}
- Messages Left Today: {remaining - 1}
"""

        system = await get_prompt("chat", "system", language)
        system = fill_vars(system, {
            "student_name": student.get("full_name", "Student"),
            "level": student.get("skill_level", 1),
            "track": student.get("current_track", "Not assigned"),
            "current_task": task_info,
            "progress": student.get("completion_rate_pct", 0),
            "messages_remaining": remaining - 1,
            "bot_behavior": str(bot_behavior),
            "tone_instruction": tone_instruction,
            "student_context": context_block
        })

        lang_suggestion = should_suggest_switch(message, language)
        recent_messages.append({"role": "user", "content": message})

        length_map = {"chota": 400, "normal": 700, "lamba": 1000}
        max_tokens = length_map.get(str(tuners.get("feedback_length", "normal")), 700)

        client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
        response = client.messages.create(
            model=settings.anthropic_model,
            max_tokens=max_tokens,
            system=system,
            messages=recent_messages
        )

        bot_reply = response.content[0].text
        tokens = response.usage.input_tokens + response.usage.output_tokens

        emoji = BOT_EMOJIS["happy"]
        if any(w in message.lower() for w in ["help", "stuck", "samajh", "nahi"]):
            emoji = BOT_EMOJIS["thinking"]
        elif any(w in bot_reply.lower() for w in ["zabardast", "excellent", "great", "wah"]):
            emoji = BOT_EMOJIS["excited"]

        today = date.today().isoformat()
        if session_id:
            db.table("chat_messages").insert([
                {"session_id": session_id, "student_id": student_id, "role": "user", "content": message},
                {"session_id": session_id, "student_id": student_id, "role": "assistant",
                 "content": bot_reply, "bot_emoji": emoji, "tokens_used": tokens}
            ]).execute()

            db.table("chat_sessions").update({
                "total_messages": session.data.get("total_messages", 0) + 2,
                "messages_today": (session.data.get("messages_today", 0)
                    if session.data.get("last_message_date") == today else 0) + 1,
                "last_message_date": today,
                "last_message_at": "now()"
            }).eq("student_id", student_id).execute()

        db.table("api_cost_logs").insert({
            "student_id": student_id,
            "module": "chat",
            "tokens_input": response.usage.input_tokens,
            "tokens_output": response.usage.output_tokens,
            "estimated_cost_usd": tokens * 0.000003
        }).execute()

        db.table("activity_logs").insert({
            "student_id": student_id,
            "action": "chat_message"
        }).execute()

        return {
            "message": bot_reply,
            "emoji": emoji,
            "messages_remaining": remaining - 1,
            "language_suggestion": lang_suggestion
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
