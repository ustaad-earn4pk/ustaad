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

async def get_message_limit(student_id: str) -> int:
    db = get_supabase_admin()
    profile = db.table("student_profiles").select("current_plan").eq("user_id", student_id).single().execute()
    plan = profile.data.get("current_plan", "trial") if profile.data else "trial"
    limits = {
        "trial": 10,
        "normal": settings.chat_limit_normal,
        "fast": settings.chat_limit_fast,
        "turbo": settings.chat_limit_turbo,
        "unlimited": settings.chat_limit_unlimited
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

async def send_message(student_id: str, message: str, language: str = "en") -> dict:
    db = get_supabase_admin()
    try:
        # Check limit
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

        # Get student context
        profile = db.table("admin_student_overview").select("*").eq("id", student_id).single().execute()
        student = profile.data or {}

        # Get recent chat history (last 10 messages only - cost saving)
        session = db.table("chat_sessions").select("*").eq("student_id", student_id).single().execute()
        session_id = session.data["id"] if session.data else None

        recent_messages = []
        if session_id:
            msgs = db.table("chat_messages").select("role, content").eq("session_id", session_id).order("created_at", desc=True).limit(10).execute()
            recent_messages = list(reversed(msgs.data or []))

        # Get current task
        current_task = db.table("tasks").select("title").eq("student_id", student_id).eq("status", "assigned").order("scheduled_for", desc=True).limit(1).execute()
        task_title = current_task.data[0]["title"] if current_task.data else "No active task"

        # Get bot behavior
        bot_profile = db.table("student_profiles").select("bot_behavior").eq("user_id", student_id).single().execute()
        bot_behavior = bot_profile.data.get("bot_behavior", {}) if bot_profile.data else {}

        # Build system prompt
        system = await get_prompt("chat", "system", language)
        system = fill_vars(system, {
            "student_name": student.get("full_name", "Student"),
            "level": student.get("skill_level", 1),
            "track": student.get("current_track", "Not assigned"),
            "current_task": task_title,
            "progress": student.get("completion_rate_pct", 0),
            "messages_remaining": remaining - 1,
            "bot_behavior": str(bot_behavior)
        })

        # Detect language switch
        lang_suggestion = should_suggest_switch(message, language)

        # Add current message
        recent_messages.append({"role": "user", "content": message})

        # Call Claude
        client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
        response = client.messages.create(
            model=settings.anthropic_model,
            max_tokens=800,
            system=system,
            messages=recent_messages
        )

        bot_reply = response.content[0].text
        tokens = response.usage.input_tokens + response.usage.output_tokens

        # Determine emoji
        emoji = BOT_EMOJIS["happy"]
        if any(w in message.lower() for w in ["help", "stuck", "samajh", "nahi"]):
            emoji = BOT_EMOJIS["thinking"]
        elif any(w in bot_reply.lower() for w in ["zabardast", "excellent", "great", "wah"]):
            emoji = BOT_EMOJIS["excited"]

        # Save messages
        today = date.today().isoformat()
        if session_id:
            db.table("chat_messages").insert([
                {"session_id": session_id, "student_id": student_id, "role": "user", "content": message},
                {"session_id": session_id, "student_id": student_id, "role": "assistant", "content": bot_reply, "bot_emoji": emoji, "tokens_used": tokens}
            ]).execute()

            # Update session
            db.table("chat_sessions").update({
                "total_messages": session.data.get("total_messages", 0) + 2,
                "messages_today": (session.data.get("messages_today", 0) if session.data.get("last_message_date") == today else 0) + 1,
                "last_message_date": today,
                "last_message_at": "now()"
            }).eq("student_id", student_id).execute()

        # Log cost
        db.table("api_cost_logs").insert({
            "student_id": student_id,
            "module": "chat",
            "tokens_input": response.usage.input_tokens,
            "tokens_output": response.usage.output_tokens,
            "estimated_cost_usd": tokens * 0.000003
        }).execute()

        # Log activity
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
