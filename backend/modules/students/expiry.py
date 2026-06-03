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


def get_next_track(current_track: str):
    try:
        idx = TRACK_ORDER.index(current_track)
        if idx + 1 < len(TRACK_ORDER):
            return TRACK_ORDER[idx + 1]
        return None
    except ValueError:
        return None


def calculate_expiry_status(plan_ends_at: str, grace_period_ends_at=None) -> dict:
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
        if grace_period_ends_at:
            grace_ends = datetime.fromisoformat(grace_period_ends_at.replace("Z", "+00:00"))
            if now < grace_ends:
                grace_left = (grace_ends - now).days
                return {"status": "grace", "days_left": 0, "grace_days_left": grace_left}
        return {"status": "grace_needed", "days_left": 0}
    else:
        return {"status": "expired", "days_left": 0}


def calculate_completion(total_tasks: int, completed_tasks: int, average_score: float) -> dict:
    if total_tasks == 0:
        return {"is_complete": False, "grade": None, "trophy": None}

    completion_pct = (completed_tasks / total_tasks) * 100

    if completion_pct < 80:
        return {"is_complete": False, "grade": None, "trophy": None}

    if average_score >= 80:
        return {"is_complete": True, "grade": "distinction", "trophy": "gold"}
    elif average_score >= 65:
        return {"is_complete": True, "grade": "pass", "trophy": "silver"}
    elif average_score >= 50:
        return {"is_complete": True, "grade": "bare_pass", "trophy": "bronze"}
    else:
        return {"is_complete": False, "grade": "incomplete", "trophy": None}


async def check_and_update_expiry(student_id: str) -> dict:
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

        if expiry["status"] == "grace_needed":
            grace_ends = datetime.now(timezone.utc) + timedelta(days=GRACE_PERIOD_DAYS)
            db.table("student_profiles").update({
                "grace_period_ends_at": grace_ends.isoformat()
            }).eq("user_id", student_id).execute()
            expiry["status"] = "grace"
            expiry["grace_days_left"] = GRACE_PERIOD_DAYS

        if expiry["status"] == "expired":
            # ← RENEWAL CHECK — expired but renewal pending hai to access band nahi hoga
            renewal_pending = db.table("payments").select("id").eq(
                "student_id", student_id
            ).eq("status", "pending").in_(
                "payment_type", ["renewal_same", "renewal_next"]
            ).execute()

            if renewal_pending.data:
                # Renewal pending hai — grace extend karo, expired mat karo
                logger.info(f"[EXPIRY] student={student_id} expired but renewal pending — access maintained")
                expiry["status"] = "renewal_pending"
            else:
                db.table("student_profiles").update({
                    "status": "expired"
                }).eq("user_id", student_id).execute()
                logger.info(f"Student {student_id} marked as expired")

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
    db = get_supabase_admin()
    try:
        tasks = db.table("tasks").select(
            "id, status"
        ).eq("student_id", student_id).eq("course_id", course_id).execute()

        if not tasks.data:
            return {"is_complete": False}

        total = len(tasks.data)
        completed = len([t for t in tasks.data if t["status"] == "graded"])

        profile = db.table("student_profiles").select(
            "average_score"
        ).eq("user_id", student_id).single().execute()

        avg_score = float(profile.data.get("average_score") or 0)

        result = calculate_completion(total, completed, avg_score)

        if result["is_complete"]:
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
