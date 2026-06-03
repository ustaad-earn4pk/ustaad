from fastapi import APIRouter, Depends, HTTPException
from core.security import get_current_user
from core.database import get_supabase_admin
from datetime import datetime, timezone
import logging
import random
import string

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/reporting", tags=["Reporting"])


def generate_cert_number() -> str:
    year = datetime.now().year
    random_part = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
    return f"USTAAD-{year}-{random_part}"


@router.get("/progress-report")
async def get_progress_report(user=Depends(get_current_user)):
    db = get_supabase_admin()
    student_id = user["sub"]

    try:
        # Student info
        student = db.table("users").select(
            "full_name, email, city, created_at"
        ).eq("id", student_id).single().execute()

        # Profile
        profile = db.table("student_profiles").select(
            "current_track, skill_level, total_tasks_assigned, total_tasks_completed, "
            "total_points, average_score, current_streak, longest_streak, "
            "streak_badges, plan_started_at, plan_ends_at"
        ).eq("user_id", student_id).single().execute()

        # Active course
        course = db.table("courses").select(
            "id, title, track, level, progress_pct, is_active, completed_at, "
            "completion_grade, trophy_level"
        ).eq("student_id", student_id).eq("is_active", True).execute()

        # Tasks with scores
        tasks = db.table("tasks").select(
            "title, status, ai_score, points_awarded, scheduled_for, graded_at"
        ).eq("student_id", student_id).order(
            "scheduled_for", desc=False
        ).execute()

        # Certificate if exists
        cert = db.table("certificates").select("*").eq(
            "student_id", student_id
        ).order("issued_at", desc=True).limit(1).execute()

        return {
            "student": student.data,
            "profile": profile.data,
            "course": course.data[0] if course.data else None,
            "tasks": tasks.data or [],
            "certificate": cert.data[0] if cert.data else None,
            "generated_at": datetime.now(timezone.utc).isoformat()
        }

    except Exception as e:
        logger.error(f"Progress report error for {student_id}: {e}")
        raise HTTPException(status_code=500, detail="Report generate nahi ho saka")


@router.post("/issue-certificate")
async def issue_certificate(user=Depends(get_current_user)):
    db = get_supabase_admin()
    student_id = user["sub"]

    try:
        # Active course check
        course = db.table("courses").select("*").eq(
            "student_id", student_id
        ).eq("is_active", True).single().execute()

        if not course.data:
            raise HTTPException(status_code=404, detail="Active course nahi mila")

        course_data = course.data

        # Completion check
        if not course_data.get("completed_at"):
            raise HTTPException(status_code=400, detail="Course abhi complete nahi hua")

        grade = course_data.get("completion_grade")
        trophy = course_data.get("trophy_level")

        if not grade or not trophy:
            raise HTTPException(status_code=400, detail="Course grade available nahi")

        # Already issued check
        existing = db.table("certificates").select("*").eq(
            "student_id", student_id
        ).eq("course_id", course_data["id"]).execute()

        if existing.data:
            return {"certificate": existing.data[0], "already_issued": True}

        # Profile for stats
        profile = db.table("student_profiles").select(
            "total_tasks_assigned, total_tasks_completed, average_score"
        ).eq("user_id", student_id).single().execute()

        # Generate unique cert number
        cert_number = generate_cert_number()
        while True:
            check = db.table("certificates").select("id").eq(
                "certificate_number", cert_number
            ).execute()
            if not check.data:
                break
            cert_number = generate_cert_number()

        # Issue certificate
        result = db.table("certificates").insert({
            "student_id": student_id,
            "course_id": course_data["id"],
            "track": course_data["track"],
            "grade": grade,
            "trophy": trophy,
            "average_score": profile.data.get("average_score") if profile.data else 0,
            "total_tasks": profile.data.get("total_tasks_assigned") if profile.data else 0,
            "completed_tasks": profile.data.get("total_tasks_completed") if profile.data else 0,
            "certificate_number": cert_number,
        }).execute()

        logger.info(f"[CERT] Issued {cert_number} to student {student_id}")
        return {"certificate": result.data[0], "already_issued": False}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Certificate issue error for {student_id}: {e}")
        raise HTTPException(status_code=500, detail="Certificate issue nahi ho saka")


@router.get("/my-certificate")
async def get_my_certificate(user=Depends(get_current_user)):
    db = get_supabase_admin()
    result = db.table("certificates").select("*").eq(
        "student_id", user["sub"]
    ).order("issued_at", desc=True).execute()
    return result.data or []
