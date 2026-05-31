from core.database import get_supabase_admin
from core.security import create_access_token
from fastapi import HTTPException
import logging
import httpx

logger = logging.getLogger(__name__)

SUPABASE_URL = "https://qhxhetjspjzdbpbeucfh.supabase.co"
SUPABASE_ANON_KEY = "sb_publishable_4Swh9me3ZBRvz6fzwV-dWQ_TnDN12dX"

async def signup(data) -> dict:
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
            "message": "Account created successfully. Please wait for admin approval.",
            "user_id": user_id
        }
    except Exception as e:
        logger.error(f"Signup error: {e}")
        if user_id:
            try:
                db.auth.admin.delete_user(user_id)
            except:
                pass
        raise HTTPException(status_code=400, detail=str(e))

async def login(data) -> dict:
    db = get_supabase_admin()
    try:
        # Step 1: verify password via Supabase REST auth
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
            raise HTTPException(status_code=401, detail="Invalid email or password")

        # Step 2: get user from our users table
        user_result = db.table("users").select("*").eq("email", data.email).execute()

        if not user_result.data:
            raise HTTPException(status_code=404, detail="User not found")

        user_data = user_result.data[0]
        user_id = user_data["id"]
        student_status = "active"

        if user_data["role"] == "student":
            profile = db.table("student_profiles").select("status").eq("user_id", user_id).execute()
            if profile.data:
                student_status = profile.data[0]["status"]
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
            "status": student_status
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {e}")
        raise HTTPException(status_code=401, detail="Invalid email or password")
