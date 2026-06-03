from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from typing import Optional
from core.security import get_current_user
from core.database import get_supabase_admin
from ai.computer_basics_curriculum import get_day_curriculum
from ai.curriculum import get_curriculum
from pydantic import BaseModel
from datetime import datetime, timedelta, timezone
import anthropic
import logging
import uuid

router = APIRouter(prefix="/tasks", tags=["Tasks"])
logger = logging.getLogger(__name__)


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

    db.table("tasks").update({
        "status": "submitted",
    }).eq("id", task_id).execute()

    db.table("submissions").insert({
        "task_id": task_id,
        "student_id": student_id,
        "text_content": body.text_answer,
        "submitted_at": datetime.utcnow().isoformat(),
    }).execute()

    feedback = await grade_task(task.data, body.text_answer, None, student_id)

    return {"message": "Task submitted!", "feedback": feedback}


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

    return {"message": "Task submitted!", "feedback": feedback}


async def grade_task(task: dict, submission_text: str, screenshot_url: Optional[str], student_id: str) -> dict:
    db = get_supabase_admin()

    try:
        from core.config import settings
        client = anthropic.Anthropic(api_key=settings.anthropic_api_key)

        guidelines = task.get("guidelines_en", [])
        if isinstance(guidelines, list):
            guidelines_text = "\n".join([f"- {g}" for g in guidelines])
        else:
            guidelines_text = str(guidelines)

        prompt = f"""You are USTAAD, an AI learning assistant grading a student task.

Task: {task.get('title', 'Task')}
Task Description: {task.get('description', '')}
Guidelines: {guidelines_text}
Student Submission: {submission_text}
Screenshot submitted: {'Yes' if screenshot_url else 'No'}

Grade this submission (0-100) and provide feedback.
Be encouraging, warm, like a Pakistani mentor.
IMPORTANT: Reply in plain text only. No markdown, no bold, no asterisks.

Format:
SCORE: [number]
WELL_DONE: [what student did well]
IMPROVE: [what to improve]
MOTIVATION: [motivational message in Roman Urdu or English]
PRO_TIP: [extra GHL/digital skills tip]"""

        response = client.messages.create(
            model="claude-haiku-4-5",
            max_tokens=500,
            messages=[{"role": "user", "content": prompt}]
        )

        feedback_text = response.content[0].text
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
