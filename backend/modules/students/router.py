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


# ADMIN — get all students
@router.get("/all")
async def get_all_students(status: Optional[str] = None, admin=Depends(get_current_admin)):
    db = get_supabase_admin()
    query = db.table("admin_student_overview").select("*")
    if status:
        query = query.eq("status", status)
    result = query.order("registered_at", desc=True).execute()
    return result.data or []


# ADMIN — get one student
@router.get("/detail/{student_id}")
async def get_student(student_id: str, admin=Depends(get_current_admin)):
    db = get_supabase_admin()
    result = db.table("admin_student_overview").select("*").eq("id", student_id).single().execute()
    return result.data


# ADMIN — approve student
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


# ADMIN — suspend student
@router.post("/suspend/{student_id}")
async def suspend_student(student_id: str, reason: str = "", admin=Depends(get_current_admin)):
    db = get_supabase_admin()
    db.table("student_profiles").update({
        "status": "suspended",
        "suspended_at": datetime.utcnow().isoformat(),
        "suspension_reason": reason
    }).eq("user_id", student_id).execute()
    return {"message": "Student suspended"}


# ADMIN — update bot behavior
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


# STUDENT — get own profile
@router.get("/me")
async def get_my_profile(user=Depends(get_current_user)):
    db = get_supabase_admin()
    u = db.table("users").select("*").eq("id", user["sub"]).single().execute()
    p = db.table("student_profiles").select("*").eq("user_id", user["sub"]).single().execute()
    return {**u.data, **p.data}


# STUDENT — update own profile
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


# STUDENT — expiry status check
@router.get("/expiry-status")
async def get_expiry_status(user=Depends(get_current_user)):
    return await check_and_update_expiry(user["sub"])


# STUDENT — course completion check
@router.post("/check-completion/{course_id}")
async def trigger_completion_check(course_id: str, user=Depends(get_current_user)):
    return await check_course_completion(user["sub"], course_id)
