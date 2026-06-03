from core.database import get_supabase_admin
from core.security import create_access_token
from fastapi import HTTPException
from typing import Optional
import logging
import httpx
import time

logger = logging.getLogger(__name__)

SUPABASE_URL = "https://qhxhetjspjzdbpbeucfh.supabase.co"
SUPABASE_ANON_KEY = "sb_publishable_4Swh9me3ZBRvz6fzwV-dWQ_TnDN12dX"


def check_bot(website: Optional[str], form_load_time: Optional[float]):
    """Honeypot + time check. Raises HTTPException if bot detected."""
    if website:
        logger.warning(f"Bot detected via honeypot — website field: {website}")
        raise HTTPException(status_code=400, detail="Invalid request.")
    if form_load_time is not None:
        elapsed = time.time() - form_load_time
        if elapsed < 2.0:
            logger.warning(f"Bot detected via time check — elapsed: {elapsed:.2f}s")
            raise HTTPException(status_code=400, detail="Invalid request.")


async def signup(data) -> dict:
    check_bot(data.website, data.form_load_time)
    db = get_supabase_admin()
    user_id = None
    try:
        auth_response = db.auth.admin.create_user({
            "email": data.email,
            "password": data.password,
            "email_confirm": True
        })
        user_id = auth_response.user.id
        db.table("users").insert({
            "id": user_id,
            "role": "student",
            "full_name": data.full_name,
            "email": data.email,
            "phone": data.phone,
            "city": data.city,
            "age": data.age,
            "preferred_language": data.preferred_language
        }).execute()
        db.table("student_profiles").insert({
            "user_id": user_id,
            "status": "pending",
            "onboarding_status": "not_started"
        }).execute()
        db.table("chat_sessions").insert({
            "student_id": user_id,
            "total_messages": 0
        }).execute()
        return {
            "message": "Account created successfully.",
            "user_id": user_id
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Signup error: {e}")
        if user_id:
            try:
                db.auth.admin.delete_user(user_id)
            except:
                pass
        raise HTTPException(status_code=400, detail=str(e))


async def login(data) -> dict:
    check_bot(data.website, data.form_load_time)
    db = get_supabase_admin()
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{SUPABASE_URL}/auth/v1/token?grant_type=password",
                headers={
                    "apikey": SUPABASE_ANON_KEY,
                    "Content-Type": "application/json"
                },
                json={"email": data.email, "password": data.password}
            )
        if response.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid email or password.")

        user_result = db.table("users").select("*").eq("email", data.email).execute()
        if not user_result.data:
            raise HTTPException(status_code=404, detail="User not found.")

        user_data = user_result.data[0]
        user_id = user_data["id"]
        student_status = "active"
        onboarding_status = "not_started"

        if user_data["role"] == "student":
            profile = db.table("student_profiles").select("status, onboarding_status").eq("user_id", user_id).execute()
            if profile.data:
                student_status = profile.data[0].get("status", "pending")
                onboarding_status = profile.data[0].get("onboarding_status", "not_started")
                if student_status == "suspended":
                    raise HTTPException(status_code=403, detail="Account suspended.")
                if student_status == "expired":
                    raise HTTPException(status_code=403, detail="Subscription expired.")
            db.table("activity_logs").insert({
                "student_id": user_id,
                "action": "login"
            }).execute()

        token = create_access_token({
            "sub": user_id,
            "email": user_data["email"],
            "role": user_data["role"],
            "full_name": user_data["full_name"]
        })

        return {
            "access_token": token,
            "token_type": "bearer",
            "user_id": user_id,
            "role": user_data["role"],
            "full_name": user_data["full_name"],
            "preferred_language": user_data.get("preferred_language", "en"),
            "status": student_status,
            "onboarding_status": onboarding_status
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {e}")
        raise HTTPException(status_code=401, detail="Invalid email or password.")


async def forgot_password(data) -> dict:
    check_bot(data.website, data.form_load_time)
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{SUPABASE_URL}/auth/v1/recover",
                headers={
                    "apikey": SUPABASE_ANON_KEY,
                    "Content-Type": "application/json"
                },
                json={"email": data.email}
            )
        return {"message": "If this email exists, a reset link has been sent."}
    except Exception as e:
        logger.error(f"Forgot password error: {e}")
        return {"message": "If this email exists, a reset link has been sent."}


async def reset_password(data) -> dict:
    check_bot(data.website, data.form_load_time)
    try:
        async with httpx.AsyncClient() as client:
            response = await client.put(
                f"{SUPABASE_URL}/auth/v1/user",
                headers={
                    "apikey": SUPABASE_ANON_KEY,
                    "Authorization": f"Bearer {data.access_token}",
                    "Content-Type": "application/json"
                },
                json={"password": data.new_password}
            )
        if response.status_code != 200:
            raise HTTPException(status_code=400, detail="Invalid or expired reset link.")
        return {"message": "Password updated successfully."}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Reset password error: {e}")
        raise HTTPException(status_code=400, detail="Password reset failed.")
