from datetime import date, timedelta
from core.database import get_supabase_admin
import logging

logger = logging.getLogger(__name__)

BADGES = [
    {"id": "streak_3",  "days": 3,  "label": "3 Day Streak",  "emoji": "🔥"},
    {"id": "streak_7",  "days": 7,  "label": "7 Day Streak",  "emoji": "⚡"},
    {"id": "streak_14", "days": 14, "label": "14 Day Streak", "emoji": "💪"},
    {"id": "streak_30", "days": 30, "label": "30 Day Streak", "emoji": "🏆"},
]

async def update_streak(student_id: str) -> dict:
    try:
        # Fetch current profile
        res = get_supabase_admin().table("student_profiles").select(
            "current_streak, longest_streak, last_activity_date, streak_freeze_used, streak_badges"
        ).eq("user_id", student_id).single().execute()

        if not res.data:
            logger.error(f"[STREAK] Profile not found for student {student_id}")
            return {"error": "profile_not_found"}

        profile = res.data
        today = date.today()
        last_activity = profile.get("last_activity_date")
        current_streak = profile.get("current_streak") or 0
        longest_streak = profile.get("longest_streak") or 0
        freeze_used = profile.get("streak_freeze_used") or False
        badges = profile.get("streak_badges") or []

        # Convert string date to date object
        if isinstance(last_activity, str):
            last_activity = date.fromisoformat(last_activity)

        # Already submitted today — no change needed
        if last_activity == today:
            return {
                "current_streak": current_streak,
                "longest_streak": longest_streak,
                "badges": badges,
                "new_badge": None,
                "already_counted": True
            }

        # Submitted yesterday — continue streak
        if last_activity == today - timedelta(days=1):
            current_streak += 1
            freeze_used = False  # reset freeze for new streak day

        # Submitted after 1 day gap — freeze used previously, now reset
        elif last_activity == today - timedelta(days=2) and not freeze_used:
            # Grace was already given (freeze), now reset
            current_streak = 1
            freeze_used = False

        # First ever submission or long gap
        else:
            current_streak = 1
            freeze_used = False

        # Update longest streak
        if current_streak > longest_streak:
            longest_streak = current_streak

        # Check for new badge
        new_badge = None
        for badge in BADGES:
            if current_streak == badge["days"]:
                already_earned = any(b.get("id") == badge["id"] for b in badges)
                if not already_earned:
                    badges.append({
                        "id": badge["id"],
                        "label": badge["label"],
                        "emoji": badge["emoji"],
                        "earned_at": today.isoformat()
                    })
                    new_badge = badge
                break

        # Save to DB
        get_supabase_admin().table("student_profiles").update({
            "current_streak": current_streak,
            "longest_streak": longest_streak,
            "last_activity_date": today.isoformat(),
            "streak_freeze_used": freeze_used,
            "streak_badges": badges
        }).eq("user_id", student_id).execute()

        logger.info(f"[STREAK] student={student_id} streak={current_streak} badge={new_badge}")

        return {
            "current_streak": current_streak,
            "longest_streak": longest_streak,
            "badges": badges,
            "new_badge": new_badge,
            "already_counted": False
        }

    except Exception as e:
        logger.error(f"[STREAK] update failed for {student_id}: {e}")
        return {"error": str(e)}


async def check_streak_warning(student_id: str) -> dict:
    """
    Called on dashboard load.
    Returns warning if student hasn't submitted today and yesterday was last activity.
    """
    try:
        res = get_supabase_admin().table("student_profiles").select(
            "current_streak, last_activity_date, streak_freeze_used"
        ).eq("user_id", student_id).single().execute()

        if not res.data:
            return {"warning": False}

        profile = res.data
        today = date.today()
        last_activity = profile.get("last_activity_date")
        current_streak = profile.get("current_streak") or 0
        freeze_used = profile.get("streak_freeze_used") or False

        if isinstance(last_activity, str):
            last_activity = date.fromisoformat(last_activity)

        # No streak to warn about
        if current_streak == 0 or not last_activity:
            return {"warning": False}

        # Student already submitted today
        if last_activity == today:
            return {"warning": False}

        # Last activity was yesterday — warn them
        if last_activity == today - timedelta(days=1):
            return {
                "warning": True,
                "freeze_available": not freeze_used,
                "current_streak": current_streak,
                "message": f"Aaj task submit karo warna {current_streak} day streak reset ho jaye ga! 🔥"
            }

        # Last activity was 2 days ago and freeze not used — last chance
        if last_activity == today - timedelta(days=2) and not freeze_used:
            # Mark freeze as used
            get_supabase_admin().table("student_profiles").update({
                "streak_freeze_used": True
            }).eq("user_id", student_id).execute()

            return {
                "warning": True,
                "freeze_available": False,
                "current_streak": current_streak,
                "message": f"Aakhri mauka! Aaj submit nahi kiya tu streak reset ho jaye ga. 🚨"
            }

        return {"warning": False}

    except Exception as e:
        logger.error(f"[STREAK] warning check failed for {student_id}: {e}")
        return {"warning": False}
