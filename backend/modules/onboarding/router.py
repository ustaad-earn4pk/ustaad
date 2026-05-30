from fastapi import APIRouter, Depends
from core.security import get_current_user
from modules.onboarding.bot import start_onboarding, continue_onboarding
from pydantic import BaseModel

router = APIRouter(prefix="/onboarding", tags=["Onboarding"])

class MessageRequest(BaseModel):
    message: str
    language: str = "en"

@router.post("/start")
async def start(user=Depends(get_current_user)):
    db_user = user
    language = "en"
    return await start_onboarding(user["sub"], language)

@router.post("/message")
async def send_message(data: MessageRequest, user=Depends(get_current_user)):
    return await continue_onboarding(user["sub"], data.message, data.language)

@router.get("/status")
async def get_status(user=Depends(get_current_user)):
    from core.database import get_supabase_admin
    db = get_supabase_admin()
    profile = db.table("student_profiles").select("onboarding_status, skill_profile").eq("user_id", user["sub"]).single().execute()
    return profile.data
