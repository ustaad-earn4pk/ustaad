from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from typing import Optional
from core.security import get_current_user
from core.database import get_supabase_admin
from ai.computer_basics_curriculum import get_day_curriculum
from ai.curriculum import get_curriculum
from modules.tasks.streak_service import update_streak
from modules.notifications.router import create_notification
from pydantic import BaseModel
from datetime import datetime, timedelta, timezone
import anthropic
import httpx
import base64
import logging
import uuid

router = APIRouter(prefix="/tasks", tags=["Tasks"])
logger = logging.getLogger(__name__)


async def get_tuners() -> dict:
    """Fetch global tuners from admin_settings."""
    db = get_supabase_admin()
    try:
        keys = ["grading_strictness", "feedback_length", "encouragement_level", "language_tone"]
        result = db.table("admin_settings").select("key, value").in_("key", keys).execute()
        tuners = {
            "grading_strictness": "normal",
            "feedback_length": "normal",
            "encouragement_level": "medium",
            "language_tone": "normal",
        }
        for row in (result.data or []):
            tuners[row["key"]] = row["value"]
        return tuners
    except Exception:
        return {"grading_strictness": "normal", "feedback_length": "normal",
                "encouragement_level": "medium", "language_tone": "normal"}


@router.get("/my")
async def get_my_tasks(user=Depends(get_current_user)):
    db = get_supabase_admin()
    result = db.table("tasks").select("*").eq(
        "student_id", user["sub"]
    ).order("scheduled_for", desc=True).limit(10).execute()
    return result.data or []


@router.get("/today")
async def get_today_task(user=Depends(get_current_user)):
    db = get_supabase_admin()
    student_id = user["sub"]
    today = datetime.now(timezone.utc).date().isoformat()

    result = db.table("tasks").select("*").eq(
        "student_id", student_id
    ).gte("scheduled_for", f"{today}T00:00:00").lte(
        "scheduled_for", f"{today}T23:59:59"
    ).execute()

    if result.data:
        return result.data[0]

    return await assign_next_task(student_id, db)


@router.get("/{task_id}")
async def get_task(task_id: str, user=Depends(get_current_user)):
    db = get_supabase_admin()
    result = db.table("tasks").select("*").eq("id", task_id).eq(
        "student_id", user["sub"]
    ).single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Task not found")
    return result.data


class TaskSubmitText(BaseModel):
    text_answer: str


@router.post("/{task_id}/submit-text")
async def submit_task_text(
    task_id: str,
    body: TaskSubmitText,
    user=Depends(get_current_user)
):
    db = get_supabase_admin()
    student_id = user["sub"]

    task = db.table("tasks").select("*").eq("id", task_id).single().execute()
    if not task.data:
        raise HTTPException(status_code=404, detail="Task not found")
    if task.data["student_id"] != student_id:
        raise HTTPException(status_code=403, detail="Not your task")
    if task.data["status"] == "graded":
        raise HTTPException(status_code=400, detail="Already submitted")

    db.table("tasks").update({"status": "submitted"}).eq("id", task_id).execute()

    db.table("submissions").insert({
        "task_id": task_id,
        "student_id": student_id,
        "text_content": body.text_answer,
        "submitted_at": datetime.utcnow().isoformat(),
    }).execute()

    feedback = await grade_task(task.data, body.text_answer, None, student_id)

    streak_result = await update_streak(student_id)

    return {
        "message": "Task submitted!",
        "feedback": feedback,
        "streak": {
            "current_streak": streak_result.get("current_streak", 0),
            "new_badge": streak_result.get("new_badge")
        }
    }


@router.post("/{task_id}/submit-screenshot")
async def submit_task_screenshot(
    task_id: str,
    screenshot: UploadFile = File(...),
    notes: Optional[str] = Form(None),
    user=Depends(get_current_user)
):
    db = get_supabase_admin()
    student_id = user["sub"]

    task = db.table("tasks").select("*").eq("id", task_id).single().execute()
    if not task.data:
        raise HTTPException(status_code=404, detail="Task not found")
    if task.data["student_id"] != student_id:
        raise HTTPException(status_code=403, detail="Not your task")

    file_bytes = await screenshot.read()
    ext = screenshot.filename.rsplit(".", 1)[-1].lower() if "." in screenshot.filename else "jpg"
    file_path = f"tasks/{student_id}/{task_id}/{uuid.uuid4()}.{ext}"

    try:
        db.storage.from_("task-submissions").upload(
            file_path, file_bytes, {"content-type": screenshot.content_type}
        )
        screenshot_url = db.storage.from_("task-submissions").get_public_url(file_path)
    except Exception as e:
        logger.error(f"Upload failed: {e}")
        screenshot_url = None

    db.table("tasks").update({"status": "submitted"}).eq("id", task_id).execute()

    db.table("submissions").insert({
        "task_id": task_id,
        "student_id": student_id,
        "text_content": notes or "Screenshot submitted",
        "file_url": screenshot_url,
        "file_type": "image",
        "file_name": screenshot.filename,
        "submitted_at": datetime.utcnow().isoformat(),
    }).execute()

    feedback = await grade_task(task.data, notes or "", screenshot_url, student_id)

    streak_result = await update_streak(student_id)

    return {
        "message": "Task submitted!",
        "feedback": feedback,
        "streak": {
            "current_streak": streak_result.get("current_streak", 0),
            "new_badge": streak_result.get("new_badge")
        }
    }


async def grade_task(task: dict, submission_text: str, screenshot_url: Optional[str], student_id: str) -> dict:
    db = get_supabase_admin()

    try:
        from core.config import settings
        client = anthropic.Anthropic(api_key=settings.anthropic_api_key)

        user_data = db.table("users").select("preferred_language").eq("id", student_id).single().execute()
        preferred_language = user_data.data.get("preferred_language", "en") if user_data.data else "en"

        if preferred_language == "ur_roman":
            lang_instruction = "STRICTLY respond in Roman Urdu only (Urdu written in English letters). Every single word must be Roman Urdu. Example: 'Bohat acha kiya, lekin aur mehnat chahiye.' Never mix English sentences."
        elif preferred_language == "ur_nastaliq":
            lang_instruction = "STRICTLY respond in Urdu script only (اردو). Example: 'بہت اچھا کام کیا۔' Never mix English."
        else:
            lang_instruction = "STRICTLY respond in English only. Do not use any Urdu words."

        # Fetch global tuners
        tuners = await get_tuners()
        strictness = str(tuners.get("grading_strictness", "normal"))
        encouragement = str(tuners.get("encouragement_level", "medium"))
        feedback_length = str(tuners.get("feedback_length", "normal"))
        tone = str(tuners.get("language_tone", "normal"))

        # Tuner instructions
        strictness_map = {
            "sakht": "Be VERY strict. Low scores for incomplete work. No leniency.",
            "normal": "Be balanced — strict but fair.",
            "naram": "Be lenient and encouraging. Give benefit of doubt."
        }
        encourage_map = {
            "kam": "Minimal encouragement. Be direct and factual.",
            "medium": "Normal encouragement when deserved.",
            "zyada": "Always be warm and encouraging, even for low scores."
        }
        length_map = {
            "chota": "Keep feedback very brief — 2-3 lines max per section.",
            "normal": "Normal feedback length.",
            "lamba": "Give detailed, comprehensive feedback."
        }
        tone_map = {
            "formal": "Use formal professional tone.",
            "normal": "Normal mentor tone.",
            "dost": "Use friendly, dost jaisa tone like WhatsApp."
        }

        tuner_instruction = f"""
TUNER SETTINGS (follow strictly):
- Strictness: {strictness_map.get(strictness, strictness_map['normal'])}
- Encouragement: {encourage_map.get(encouragement, encourage_map['medium'])}
- Feedback Length: {length_map.get(feedback_length, length_map['normal'])}
- Tone: {tone_map.get(tone, tone_map['normal'])}"""

        # Max tokens from feedback length
        max_tokens_map = {"chota": 300, "normal": 600, "lamba": 900}
        grading_max_tokens = max_tokens_map.get(feedback_length, 600)

        guidelines = task.get("guidelines_en", [])
        if isinstance(guidelines, list):
            guidelines_text = "\n".join([f"- {g}" for g in guidelines])
        else:
            guidelines_text = str(guidelines)

        prompt_text = f"""You are USTAAD, a strict but caring Pakistani mentor grading a student task.

LANGUAGE RULE — MOST IMPORTANT: {lang_instruction}
{tuner_instruction}

Task: {task.get('title', 'Task')}
Task Description: {task.get('description', '')}
Required Steps:
{guidelines_text}
Student Notes: {submission_text}

STRICT GRADING RULES:
1. VULGAR/ABUSIVE LANGUAGE = SCORE 0, no exceptions. Give firm but professional warning.
2. "ho gya" / "done" / one-liners without details = SCORE 10-20 maximum
3. Screenshot provided but unrelated to task = SCORE 20-30
4. Screenshot matches task but no notes = SCORE 40-50
5. Good notes but no screenshot when task required it = SCORE 30-40
6. Genuinely completed with screenshot proof = SCORE 70-85
7. All steps + screenshot + detailed notes = SCORE 85-100

IF SCREENSHOT PROVIDED: Examine it very carefully.
- What exactly is shown in the screenshot?
- Does it actually prove the task was completed?
- Are the required steps visible?
- Is this related to the task at all?

Be specific in feedback. Name exactly what was done and what was missing.
Do not be vague. Do not give fake encouragement for incomplete work.
IMPORTANT: Plain text only. No markdown. No asterisks. No bold.

CRITICAL OUTPUT RULES:
- Do NOT write any preamble, introduction, or acknowledgment.
- Do NOT say "I understand", "I am ready", "I will evaluate", or anything similar.
- Do NOT explain what you are about to do.
- Start your response DIRECTLY and IMMEDIATELY with "SCORE:" on the very first line.
- Nothing before SCORE:. No exceptions.

Format exactly as:
SCORE: [number 0-100]
WELL_DONE: [specific things done correctly]
IMPROVE: [exact steps missing or wrong]
MOTIVATION: [honest message — firm if needed, warm if deserved]
PRO_TIP: [one practical GHL/digital skills tip]"""

        messages_content = []

        if screenshot_url:
            try:
                async with httpx.AsyncClient(timeout=15.0) as http_client:
                    img_response = await http_client.get(screenshot_url)
                    if img_response.status_code == 200:
                        img_base64 = base64.standard_b64encode(img_response.content).decode("utf-8")
                        content_type = img_response.headers.get("content-type", "image/jpeg")
                        if content_type not in ["image/jpeg", "image/png", "image/gif", "image/webp"]:
                            content_type = "image/jpeg"
                        messages_content = [
                            {
                                "type": "image",
                                "source": {
                                    "type": "base64",
                                    "media_type": content_type,
                                    "data": img_base64,
                                }
                            },
                            {"type": "text", "text": prompt_text}
                        ]
                    else:
                        messages_content = [{"type": "text", "text": prompt_text}]
            except Exception as e:
                logger.error(f"Image fetch failed: {e}")
                messages_content = [{"type": "text", "text": prompt_text}]
        else:
            messages_content = [{"type": "text", "text": prompt_text}]

        response = client.messages.create(
            model="claude-haiku-4-5",
            max_tokens=grading_max_tokens,
            messages=[{"role": "user", "content": messages_content}]
        )

        feedback_text = response.content[0].text

        # Strip any preamble that slipped through before SCORE:
        if "SCORE:" in feedback_text:
            feedback_text = feedback_text[feedback_text.index("SCORE:"):]

        score = 70

        for line in feedback_text.split('\n'):
            if line.startswith('SCORE:'):
                try:
                    score = int(line.replace('SCORE:', '').strip())
                except:
                    pass

        db.table("tasks").update({
            "status": "graded",
            "ai_score": score,
            "ai_feedback_en": feedback_text,
            "graded_at": datetime.utcnow().isoformat(),
            "points_awarded": score,
        }).eq("id", task["id"]).execute()

        profile = db.table("student_profiles").select(
            "total_points, total_tasks_completed, total_tasks_assigned"
        ).eq("user_id", student_id).single().execute()

        if profile.data:
            total_completed = (profile.data.get("total_tasks_completed") or 0) + 1
            total_points = (profile.data.get("total_points") or 0) + score
            avg_score = round(total_points / total_completed, 2)

            db.table("student_profiles").update({
                "total_tasks_completed": total_completed,
                "total_points": total_points,
                "average_score": avg_score,
                "last_active_at": datetime.utcnow().isoformat(),
            }).eq("user_id", student_id).execute()

        tokens = response.usage.input_tokens + response.usage.output_tokens
        db.table("api_cost_logs").insert({
            "student_id": student_id,
            "module": "task_grading",
            "tokens_input": response.usage.input_tokens,
            "tokens_output": response.usage.output_tokens,
            "estimated_cost_usd": tokens * 0.000003
        }).execute()

        # ── NOTIFY student: task graded (language-aware) ──
        if preferred_language == "ur_nastaliq":
            if score >= 80:
                emoji, verdict = "🌟", "شاندار کام!"
            elif score >= 60:
                emoji, verdict = "✅", "اچھا کام!"
            else:
                emoji, verdict = "📝", "مزید محنت کریں۔"
            title = f"{emoji} ٹاسک گریڈ ہو گیا — {score}/100"
            body = f"{task.get('title', 'Task')} — اسکور: {score}/100. {verdict}"
        elif preferred_language == "ur_roman":
            if score >= 80:
                emoji, verdict = "🌟", "Zabardast!"
            elif score >= 60:
                emoji, verdict = "✅", "Acha kaam!"
            else:
                emoji, verdict = "📝", "Aur mehnat karo."
            title = f"{emoji} Task Graded — {score}/100"
            body = f"{task.get('title', 'Task')} — Score: {score}/100. {verdict}"
        else:
            if score >= 80:
                emoji, verdict = "🌟", "Excellent work!"
            elif score >= 60:
                emoji, verdict = "✅", "Good job!"
            else:
                emoji, verdict = "📝", "Keep pushing, you can do better."
            title = f"{emoji} Task Graded — {score}/100"
            body = f"{task.get('title', 'Task')} — Score: {score}/100. {verdict}"

        await create_notification(
            db=db,
            user_id=student_id,
            type="task_graded",
            title=title,
            body=body
        )

        return {"score": score, "feedback": feedback_text}

    except Exception as e:
        logger.error(f"Grading error: {e}")
        db.table("tasks").update({
            "status": "graded",
            "ai_score": 70,
            "ai_feedback_en": "Bohat acha kaam kiya! Keep it up.",
            "graded_at": datetime.utcnow().isoformat(),
            "points_awarded": 70,
        }).eq("id", task["id"]).execute()
        return {"score": 70, "feedback": "Bohat acha kaam kiya! Keep it up."}


async def assign_next_task(student_id: str, db) -> Optional[dict]:
    try:
        profile = db.table("student_profiles").select(
            "current_track, plan_started_at, total_tasks_assigned"
        ).eq("user_id", student_id).single().execute()

        if not profile.data:
            return None

        current_track = profile.data.get("current_track")
        plan_started = profile.data.get("plan_started_at")
        tasks_assigned = profile.data.get("total_tasks_assigned") or 0

        if not current_track or not plan_started:
            return None

        started_dt = datetime.fromisoformat(plan_started.replace("Z", "+00:00"))
        today = datetime.now(timezone.utc)
        day_number = (today - started_dt).days + 1

        if current_track == "computer_basics":
            day_data = get_day_curriculum(day_number)
        else:
            curriculum = get_curriculum(current_track)
            day_data = _get_day_from_curriculum(curriculum, day_number)

        if not day_data:
            return None

        course = db.table("courses").select("id").eq(
            "student_id", student_id
        ).eq("is_active", True).execute()

        if not course.data:
            return None

        course_id = course.data[0]["id"]

        task_data = {
            "student_id": student_id,
            "course_id": course_id,
            "title": day_data.get("title", f"Day {day_number} Task"),
            "description": day_data.get("task", day_data.get("concept", "")),
            "guidelines_en": day_data.get("how_to", "").split("\n") if day_data.get("how_to") else [],
            "task_type": "do_it",
            "task_number": day_number,
            "day": datetime.now(timezone.utc).strftime("%A").lower(),
            "scheduled_for": datetime.now(timezone.utc).isoformat(),
            "due_at": (datetime.now(timezone.utc) + timedelta(days=1)).isoformat(),
            "status": "assigned",
            "points_awarded": day_data.get("points", 50),
        }

        result = db.table("tasks").insert(task_data).execute()

        db.table("student_profiles").update({
            "total_tasks_assigned": tasks_assigned + 1
        }).eq("user_id", student_id).execute()

        if result.data:
            return result.data[0]

    except Exception as e:
        logger.error(f"Task assignment error: {e}")
        return None


def _get_day_from_curriculum(curriculum: dict, day_number: int) -> Optional[dict]:
    if not curriculum:
        return None

    day_count = 0
    for week in curriculum.get("weeks", []):
        for lesson in week.get("lessons", []):
            day_count += 1
            if day_count == day_number:
                return {
                    "title": lesson.get("title"),
                    "concept": lesson.get("content"),
                    "task": week.get("task", {}).get("description") if week.get("task") else None,
                    "how_to": "",
                    "points": week.get("task", {}).get("points", 50) if week.get("task") else 50,
                }
    return None
