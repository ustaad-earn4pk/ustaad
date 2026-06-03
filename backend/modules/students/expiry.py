from datetime import datetime, timezone, timedelta
from core.database import get_supabase_admin
import logging

logger = logging.getLogger(__name__)

GRACE_PERIOD_DAYS = 1

TRACK_ORDER = [
    "computer_basics",
    "web_fundamentals", 
    "ghl_developer",
    "integration_expert",
    "full_stack_automation",
    "client_hunting"
]

LAST_LEVEL = 5


def get_next_track(current_track: str) -> str | None:
    """Next track return karo — agar last hai to None."""
    try:
        idx = TRACK_ORDER.index(current_track)
        if idx + 1 < len(TRACK_ORDER):
            return TRACK_ORDER[idx + 1]
        return None
    except ValueError:
        return None


def calculate_expiry_status(plan_ends_at: str, grace_period_ends_at: str | None) -> dict:
    """
    Returns:
        status: 'active' | 'warning_7' | 'warning_3' | 'warning_1' | 'grace' | 'expired'
        days_left: int
    """
    now = datetime.now(timezone.utc)
    ends_at = datetime.fromisoformat(plan_ends_at.replace("Z", "+00:00"))
    days_left = (ends_at - now).days

    if days_left > 7:
        return {"status": "active", "days_left": days_left}
    elif days_left >= 7:
        return {"status": "warning_7", "days_left": days_left}
    elif days_left >= 3:
        return {"status": "warning_3", "days_left": days_left}
    elif days_left >= 1:
        return {"status": "warning_1", "days_left": days_left}
    elif days_left >= 0:
        # Expired — check grace period
        if grace_period_ends_at:
            grace_ends = datetime.fromisoformat(grace_period_ends_at.replace("Z", "+00:00"))
            if now < grace_ends:
                grace_left = (grace_ends - now).days
                return {"status": "grace", "days_left": 0, "grace_days_left": grace_left}
        # Grace period set nahi — set karo
        return {"status": "grace_needed", "days_left": 0}
    else:
        return {"status": "expired", "days_left": 0}


def calculate_completion(total_tasks: int, completed_tasks: int, average_score: float) -> dict:
    """
    Course completion check karo.
    Returns: grade, trophy, is_complete
    """
    if total_tasks == 0:
        return {"is_complete": False, "grade": None, "trophy": None}

    completion_pct = (completed_tasks / total_tasks) * 100

    # Minimum 80% tasks submit hone chahiye
    if completion_pct < 80:
        return {"is_complete": False, "grade": None, "trophy": None}

    # Score ke hisaab se grade
    if average_score >= 80:
        return {"is_complete": True, "grade": "distinction", "trophy": "gold"}
    elif average_score >= 65:
        return {"is_complete": True, "grade": "pass", "trophy": "silver"}
    elif average_score >= 50:
        return {"is_complete": True, "grade": "bare_pass", "trophy": "bronze"}
    else:
        return {"is_complete": False, "grade": "incomplete", "trophy": None}


async def check_and_update_expiry(student_id: str) -> dict:
    """
    Student ka expiry status check karo aur DB update karo agar zaroorat ho.
    Returns expiry info for frontend.
    """
    db = get_supabase_admin()
    try:
        profile = db.table("student_profiles").select(
            "status, plan_ends_at, grace_period_ends_at, current_track, current_plan"
        ).eq("user_id", student_id).single().execute()

        if not profile.data:
            return {"expiry_status": "unknown"}

        data = profile.data
        plan_ends_at = data.get("plan_ends_at")

        if not plan_ends_at:
            return {"expiry_status": "no_plan"}

        expiry = calculate_expiry_status(plan_ends_at, data.get("grace_period_ends_at"))

        # Grace period set karni hai
        if expiry["status"] == "grace_needed":
            grace_ends = datetime.now(timezone.utc) + timedelta(days=GRACE_PERIOD_DAYS)
            db.table("student_profiles").update({
                "grace_period_ends_at": grace_ends.isoformat()
            }).eq("user_id", student_id).execute()
            expiry["status"] = "grace"
            expiry["grace_days_left"] = GRACE_PERIOD_DAYS

        # Expired — status update karo
        if expiry["status"] == "expired":
            db.table("student_profiles").update({
                "status": "expired"
            }).eq("user_id", student_id).execute()
            logger.info(f"Student {student_id} marked as expired")

        # Next track info add karo
        current_track = data.get("current_track")
        next_track = get_next_track(current_track) if current_track else None

        return {
            "expiry_status": expiry["status"],
            "days_left": expiry.get("days_left", 0),
            "grace_days_left": expiry.get("grace_days_left", 0),
            "next_track": next_track,
            "current_track": current_track
        }

    except Exception as e:
        logger.error(f"Expiry check error for {student_id}: {e}")
        return {"expiry_status": "unknown"}


async def check_course_completion(student_id: str, course_id: str) -> dict:
    """
    Course complete hua ya nahi check karo.
    Agar complete — grade, trophy set karo.
    """
    db = get_supabase_admin()
    try:
        # Tasks count
        tasks = db.table("tasks").select(
            "id, status"
        ).eq("student_id", student_id).eq("course_id", course_id).execute()

        if not tasks.data:
            return {"is_complete": False}

        total = len(tasks.data)
        completed = len([t for t in tasks.data if t["status"] == "graded"])

        # Average score
        profile = db.table("student_profiles").select(
            "average_score"
        ).eq("user_id", student_id).single().execute()

        avg_score = float(profile.data.get("average_score") or 0)

        result = calculate_completion(total, completed, avg_score)

        if result["is_complete"]:
            # Course update
            db.table("courses").update({
                "completed_at": datetime.now(timezone.utc).isoformat(),
                "completion_grade": result["grade"],
                "trophy_level": result["trophy"],
                "progress_pct": 100
            }).eq("id", course_id).execute()

            logger.info(f"Course {course_id} completed by {student_id} — grade: {result['grade']}")

        return result

    except Exception as e:
        logger.error(f"Completion check error: {e}")
        return {"is_complete": False}
