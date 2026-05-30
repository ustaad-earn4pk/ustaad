import anthropic
from core.config import settings
from core.database import get_supabase_admin
from core.language import detect_language, should_suggest_switch
from ai.prompts import get_prompt, fill_vars
from fastapi import HTTPException
import logging
import json

logger = logging.getLogger(__name__)

BOT_EMOJIS = {
    "thinking": "🤔",
    "happy": "😊",
    "excited": "🤩",
    "proud": "🥹",
    "encouraging": "💪",
    "gentle_strict": "😤",
    "celebrating": "🎉",
    "laughing": "😄",
    "confused": "😅",
    "welcoming": "🤗",
    "sleeping": "😴",
}

def get_emoji_for_context(context: str, score: float = None) -> str:
    if score is not None:
        if score >= 90: return BOT_EMOJIS["excited"]
        if score >= 70: return BOT_EMOJIS["happy"]
        if score >= 50: return BOT_EMOJIS["encouraging"]
        return BOT_EMOJIS["gentle_strict"]
    emoji_map = {
        "greeting": BOT_EMOJIS["welcoming"],
        "joke": BOT_EMOJIS["laughing"],
        "celebration": BOT_EMOJIS["celebrating"],
        "thinking": BOT_EMOJIS["thinking"],
        "confused": BOT_EMOJIS["confused"],
        "proud": BOT_EMOJIS["proud"],
    }
    return emoji_map.get(context, BOT_EMOJIS["happy"])

async def start_onboarding(student_id: str, language: str = "en") -> dict:
    db = get_supabase_admin()
    try:
        # Get or create assessment session
        existing = db.table("assessment_sessions").select("*").eq("student_id", student_id).execute()

        if not existing.data:
            db.table("assessment_sessions").insert({
                "student_id": student_id,
                "messages": [],
                "is_complete": False
            }).execute()

        # Update onboarding status
        db.table("student_profiles").update({
            "onboarding_status": "in_progress"
        }).eq("user_id", student_id).execute()

        # Get welcome prompt
        prompt = await get_prompt("onboarding", "day1_welcome", language)

        # Call Claude
        client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
        response = client.messages.create(
            model=settings.anthropic_model,
            max_tokens=1000,
            system=prompt,
            messages=[{"role": "user", "content": "Start the onboarding conversation."}]
        )

        bot_message = response.content[0].text
        tokens_used = response.usage.input_tokens + response.usage.output_tokens

        # Save to session
        messages = [
            {"role": "assistant", "content": bot_message, "timestamp": "now"}
        ]
        db.table("assessment_sessions").update({
            "messages": messages
        }).eq("student_id", student_id).execute()

        # Log cost
        db.table("api_cost_logs").insert({
            "student_id": student_id,
            "module": "onboarding_bot",
            "tokens_input": response.usage.input_tokens,
            "tokens_output": response.usage.output_tokens,
            "estimated_cost_usd": tokens_used * 0.000003
        }).execute()

        return {
            "message": bot_message,
            "emoji": BOT_EMOJIS["welcoming"],
            "language_suggestion": None,
            "is_complete": False
        }

    except Exception as e:
        logger.error(f"Onboarding start error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

async def continue_onboarding(student_id: str, user_message: str, language: str = "en") -> dict:
    db = get_supabase_admin()
    try:
        # Get session
        session = db.table("assessment_sessions").select("*").eq("student_id", student_id).single().execute()
        if not session.data:
            return await start_onboarding(student_id, language)

        messages = session.data.get("messages", [])

        # Detect language switch suggestion
        lang_suggestion = should_suggest_switch(user_message, language)

        # Add user message
        messages.append({"role": "user", "content": user_message})

        # Check turn limit
        user_turns = len([m for m in messages if m["role"] == "user"])
        is_last_turn = user_turns >= settings.onboarding_max_turns

        # Build conversation for Claude
        system_prompt = await get_prompt("onboarding", "day1_welcome", language)
        if is_last_turn:
            system_prompt += "\n\nThis is the LAST turn. Summarize what you learned about the student, confirm their schedule, and tell them what happens next. Generate their skill profile in JSON at the end wrapped in <profile></profile> tags."

        claude_messages = [{"role": m["role"], "content": m["content"]} for m in messages]

        client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
        response = client.messages.create(
            model=settings.anthropic_model,
            max_tokens=1000,
            system=system_prompt,
            messages=claude_messages
        )

        bot_message = response.content[0].text
        tokens_used = response.usage.input_tokens + response.usage.output_tokens

        # Add bot response
        messages.append({"role": "assistant", "content": bot_message})

        # Check if complete - extract profile
        is_complete = is_last_turn or "<profile>" in bot_message
        final_profile = None

        if is_complete and "<profile>" in bot_message:
            try:
                profile_str = bot_message.split("<profile>")[1].split("</profile>")[0]
                final_profile = json.loads(profile_str)
            except:
                final_profile = {"raw": bot_message}

            # Update student profile
            if final_profile:
                db.table("student_profiles").update({
                    "onboarding_status": "completed",
                    "skill_profile": final_profile,
                    "available_days": final_profile.get("available_days", []),
                    "learning_pace": final_profile.get("pace", "normal"),
                    "preferred_time": final_profile.get("preferred_time", "18:00")
                }).eq("user_id", student_id).execute()

        # Save session
        db.table("assessment_sessions").update({
            "messages": messages,
            "is_complete": is_complete,
            "final_profile": final_profile
        }).eq("student_id", student_id).execute()

        # Log cost
        db.table("api_cost_logs").insert({
            "student_id": student_id,
            "module": "onboarding_bot",
            "tokens_input": response.usage.input_tokens,
            "tokens_output": response.usage.output_tokens,
            "estimated_cost_usd": tokens_used * 0.000003
        }).execute()

        return {
            "message": bot_message,
            "emoji": BOT_EMOJIS["happy"],
            "language_suggestion": lang_suggestion,
            "is_complete": is_complete,
            "turns_remaining": max(0, settings.onboarding_max_turns - user_turns)
        }

    except Exception as e:
        logger.error(f"Onboarding continue error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
