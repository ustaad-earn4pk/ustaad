from fastapi import APIRouter, Depends, HTTPException
from core.security import get_current_user, get_current_admin
from core.database import get_supabase_admin
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/students", tags=["Students"])


class ApproveRequest(BaseModel):
    student_id: str
    trial_days: int = 7
    device_policy: str = "any"


class UpdateBotBehavior(BaseModel):
    student_id: str
    tone: str = "friendly"
    energy_level: str = "medium"
    strictness: str = "balanced"
    joke_frequency: str = "occasional"
    motivation_style: str = "encouragement_heavy"
    custom_instruction: str = ""


class ProfileUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    city: Optional[str] = None
    age: Optional[int] = None
    preferred_language: Optional[str] = None
    education: Optional[dict] = None
    portfolio_url: Optional[str] = None


class AdminStudentUpdateRequest(BaseModel):
    """Super admin only — update any student setting"""
    preferred_language: Optional[str] = None
    current_track: Optional[str] = None
    status: Optional[str] = None          # approved / suspended / trial
    assigned_admin_id: Optional[str] = None   # reassign admin


# ── ADMIN — get all students ──────────────────────────────────────────────────

@router.get("/all")
async def get_all_students(status: Optional[str] = None, admin=Depends(get_current_admin)):
    db = get_supabase_admin()
    query = db.table("admin_student_overview").select("*")
    if status:
        query = query.eq("status", status)
    result = query.order("registered_at", desc=True).execute()
    return result.data or []


# ── ADMIN — get one student (basic) ──────────────────────────────────────────

@router.get("/detail/{student_id}")
async def get_student(student_id: str, admin=Depends(get_current_admin)):
    db = get_supabase_admin()
    result = db.table("admin_student_overview").select("*").eq("id", student_id).single().execute()
    return result.data


# ── ADMIN — full student detail (tasks + submissions + chat + support) ────────

@router.get("/full-detail/{student_id}")
async def get_student_full_detail(student_id: str, admin=Depends(get_current_admin)):
    db = get_supabase_admin()
    role = admin.get("role", "admin")

    try:
        # Basic user info
        user_info = db.table("users").select(
            "id, full_name, email, phone, city, age, gender, preferred_language, avatar_url"
        ).eq("id", student_id).single().execute()

        if not user_info.data:
            raise HTTPException(status_code=404, detail="Student not found")

        # Student profile
        profile = db.table("student_profiles").select("*").eq(
            "user_id", student_id
        ).single().execute()

        # Current course
        course = db.table("courses").select("*").eq(
            "student_id", student_id
        ).eq("is_active", True).execute()

        # Tasks (last 30)
        tasks = db.table("tasks").select("*").eq(
            "student_id", student_id
        ).order("scheduled_for", desc=True).limit(30).execute()

        # Submissions
        submissions = db.table("submissions").select("*").eq(
            "student_id", student_id
        ).order("submitted_at", desc=True).limit(30).execute()

        # Payment history
        payments = db.table("payments").select("*").eq(
            "student_id", student_id
        ).order("created_at", desc=True).execute()

        # Support chat history
        support_messages = db.table("support_messages").select("*").eq(
            "student_id", student_id
        ).order("created_at", desc=False).execute()

        # AI chat history (super admin only)
        chat_sessions = None
        ai_messages = None
        if role == "super_admin":
            chat_sessions = db.table("chat_sessions").select("*").eq(
                "student_id", student_id
            ).execute()

            # AI messages from chat history
            try:
                ai_messages = db.table("chat_messages").select("*").eq(
                    "student_id", student_id
                ).order("created_at", desc=False).limit(50).execute()
            except Exception:
                ai_messages = None

        # Assigned admin
        assigned_admin = db.table("admin_student_assignments").select(
            "admin_id, assigned_at, users!admin_student_assignments_admin_id_fkey(full_name, email)"
        ).eq("student_id", student_id).execute()

        return {
            "user": user_info.data,
            "profile": profile.data,
            "course": course.data[0] if course.data else None,
            "tasks": tasks.data or [],
            "submissions": submissions.data or [],
            "payments": payments.data or [],
            "support_messages": support_messages.data or [],
            "chat_sessions": chat_sessions.data if chat_sessions else None,
            "ai_messages": ai_messages.data if ai_messages else None,
            "assigned_admin": assigned_admin.data[0] if assigned_admin.data else None,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Full detail error for {student_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to load student detail: {str(e)}")


# ── SUPER ADMIN — update student settings ────────────────────────────────────

@router.put("/admin-update/{student_id}")
async def admin_update_student(
    student_id: str,
    data: AdminStudentUpdateRequest,
    admin=Depends(get_current_admin)
):
    db = get_supabase_admin()
    role = admin.get("role", "admin")

    if role != "super_admin":
        raise HTTPException(status_code=403, detail="Sirf super admin ye action kar sakta hai")

    try:
        # Language update — users table
        if data.preferred_language:
            db.table("users").update({
                "preferred_language": data.preferred_language
            }).eq("id", student_id).execute()

        # Course / status update — student_profiles table
        profile_updates = {}
        if data.current_track:
            profile_updates["current_track"] = data.current_track
            profile_updates["current_plan"] = data.current_track
        if data.status:
            profile_updates["status"] = data.status
            if data.status == "suspended":
                profile_updates["suspended_at"] = datetime.utcnow().isoformat()
            elif data.status == "approved":
                profile_updates["approved_at"] = datetime.utcnow().isoformat()
                profile_updates["approved_by"] = admin["sub"]

        if profile_updates:
            db.table("student_profiles").update(profile_updates).eq(
                "user_id", student_id
            ).execute()

        # Assigned admin change
        if data.assigned_admin_id is not None:
            # Remove existing assignment
            db.table("admin_student_assignments").delete().eq(
                "student_id", student_id
            ).execute()

            # Add new assignment (if not empty string)
            if data.assigned_admin_id:
                db.table("admin_student_assignments").insert({
                    "admin_id": data.assigned_admin_id,
                    "student_id": student_id,
                    "assigned_by": admin["sub"]
                }).execute()

        return {"message": "Student updated successfully"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Admin update error for {student_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Update failed: {str(e)}")


# ── ADMIN — approve student ───────────────────────────────────────────────────

@router.post("/approve")
async def approve_student(data: ApproveRequest, admin=Depends(get_current_admin)):
    db = get_supabase_admin()
    now = datetime.utcnow()
    trial_end = now + timedelta(days=data.trial_days)
    db.table("student_profiles").update({
        "status": "trial",
        "trial_days": data.trial_days,
        "trial_started_at": now.isoformat(),
        "trial_ends_at": trial_end.isoformat(),
        "approved_by": admin["sub"],
        "approved_at": now.isoformat(),
        "device_policy": data.device_policy
    }).eq("user_id", data.student_id).execute()
    return {"message": "Student approved", "trial_ends_at": trial_end.isoformat()}


# ── ADMIN — suspend student ───────────────────────────────────────────────────

@router.post("/suspend/{student_id}")
async def suspend_student(student_id: str, reason: str = "", admin=Depends(get_current_admin)):
    db = get_supabase_admin()
    db.table("student_profiles").update({
        "status": "suspended",
        "suspended_at": datetime.utcnow().isoformat(),
        "suspension_reason": reason
    }).eq("user_id", student_id).execute()
    return {"message": "Student suspended"}


# ── ADMIN — update bot behavior ───────────────────────────────────────────────

@router.put("/bot-behavior")
async def update_bot_behavior(data: UpdateBotBehavior, admin=Depends(get_current_admin)):
    db = get_supabase_admin()
    db.table("student_profiles").update({
        "bot_behavior": {
            "tone": data.tone,
            "energy_level": data.energy_level,
            "strictness": data.strictness,
            "joke_frequency": data.joke_frequency,
            "motivation_style": data.motivation_style,
            "custom_instruction": data.custom_instruction
        }
    }).eq("user_id", data.student_id).execute()
    return {"message": "Bot behavior updated"}


# ── SUPER ADMIN — get all admins ──────────────────────────────────────────────

@router.get("/admins-list")
async def get_admins_list(admin=Depends(get_current_admin)):
    db = get_supabase_admin()
    role = admin.get("role", "admin")
    if role != "super_admin":
        raise HTTPException(status_code=403, detail="Access denied")

    result = db.table("users").select(
        "id, full_name, email, role, created_at"
    ).in_("role", ["admin", "super_admin"]).execute()

    admins = []
    for a in (result.data or []):
        # Assigned students count
        assigned = db.table("admin_student_assignments").select(
            "student_id", count="exact"
        ).eq("admin_id", a["id"]).execute()

        admins.append({
            **a,
            "assigned_students_count": assigned.count or 0
        })

    return admins


# ── SUPER ADMIN — suspend/activate admin ─────────────────────────────────────

@router.put("/admin-status/{admin_id}")
async def update_admin_status(
    admin_id: str,
    action: str,  # "suspend" or "activate"
    admin=Depends(get_current_admin)
):
    db = get_supabase_admin()
    role = admin.get("role", "admin")

    if role != "super_admin":
        raise HTTPException(status_code=403, detail="Sirf super admin ye action kar sakta hai")

    if action not in ["suspend", "activate"]:
        raise HTTPException(status_code=400, detail="Invalid action")

    # Users table mein role update — suspended admin ka role change
    new_role = "suspended_admin" if action == "suspend" else "admin"
    db.table("users").update({"role": new_role}).eq("id", admin_id).execute()

    return {"message": f"Admin {action}d successfully"}


# ── STUDENT — get own profile ─────────────────────────────────────────────────

@router.get("/me")
async def get_my_profile(user=Depends(get_current_user)):
    db = get_supabase_admin()
    u = db.table("users").select("*").eq("id", user["sub"]).single().execute()
    p = db.table("student_profiles").select("*").eq("user_id", user["sub"]).single().execute()
    return {**u.data, **p.data}


# ── STUDENT — update own profile ──────────────────────────────────────────────

@router.put("/me/profile")
async def update_my_profile(data: ProfileUpdateRequest, user=Depends(get_current_user)):
    db = get_supabase_admin()
    try:
        user_fields = {}
        if data.full_name: user_fields["full_name"] = data.full_name
        if data.phone: user_fields["phone"] = data.phone
        if data.city: user_fields["city"] = data.city
        if data.age: user_fields["age"] = data.age
        if data.preferred_language: user_fields["preferred_language"] = data.preferred_language

        if user_fields:
            db.table("users").update(user_fields).eq("id", user["sub"]).execute()

        profile_fields = {}
        if data.education is not None: profile_fields["education"] = data.education
        if data.portfolio_url is not None: profile_fields["portfolio_url"] = data.portfolio_url

        if profile_fields:
            db.table("student_profiles").update(profile_fields).eq("user_id", user["sub"]).execute()

        return {"message": "Profile updated successfully."}
    except Exception as e:
        logger.error(f"Profile update error: {e}")
        raise HTTPException(status_code=400, detail="Profile update failed.")


from modules.students.expiry import check_and_update_expiry, check_course_completion
from modules.tasks.streak_service import check_streak_warning


# ── STUDENT — expiry status check ────────────────────────────────────────────

@router.get("/expiry-status")
async def get_expiry_status(user=Depends(get_current_user)):
    return await check_and_update_expiry(user["sub"])


# ── STUDENT — course completion check ────────────────────────────────────────

@router.post("/check-completion/{course_id}")
async def trigger_completion_check(course_id: str, user=Depends(get_current_user)):
    return await check_course_completion(user["sub"], course_id)


# ── STUDENT — streak warning check ───────────────────────────────────────────

@router.get("/streak-warning")
async def get_streak_warning(user=Depends(get_current_user)):
    return await check_streak_warning(user["sub"])
