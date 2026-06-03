from fastapi import APIRouter, Depends
from core.security import get_current_user
from core.database import get_supabase_admin
from modules.onboarding.bot import start_onboarding, continue_onboarding
from ai.curriculum import assess_student_level
from pydantic import BaseModel
from typing import Optional, List
import logging

router = APIRouter(prefix="/onboarding", tags=["Onboarding"])
logger = logging.getLogger(__name__)


class MessageRequest(BaseModel):
    message: str
    language: str = "en"


class OnboardingFormData(BaseModel):
    full_name: str
    gender: str
    age: int
    city: str
    address: Optional[str] = None
    phone: str
    education_level: str
    education_subject: Optional[str] = None
    currently_studying: bool = False
    has_computer_skills: bool = False
    computer_skills: Optional[List[str]] = []
    has_laptop: bool = False
    internet_quality: Optional[str] = None
    goal: str
    time_per_day: str
    target_income: Optional[str] = None
    timeline: Optional[str] = None
    english_level: str
    preferred_language: str = "en"


@router.post("/start")
async def start(user=Depends(get_current_user)):
    return await start_onboarding(user["sub"], "en")


@router.post("/message")
async def send_message(data: MessageRequest, user=Depends(get_current_user)):
    return await continue_onboarding(user["sub"], data.message, data.language)


@router.get("/status")
async def get_status(user=Depends(get_current_user)):
    db = get_supabase_admin()
    profile = db.table("student_profiles").select(
        "onboarding_status, skill_profile"
    ).eq("user_id", user["sub"]).single().execute()
    return profile.data


@router.post("/submit-form")
async def submit_form(data: OnboardingFormData, user=Depends(get_current_user)):
    db = get_supabase_admin()
    student_id = user["sub"]

    # Assess student level — hardcoded, no Claude
    assessment = assess_student_level(data.dict())

    # Save to student_profiles
    try:
        db.table("student_profiles").update({
            "onboarding_status": "completed",
            "skill_level": assessment["recommended_level"],
            "current_track": assessment["recommended_track"],
            "skill_profile": {
                "form_data": data.dict(),
                "assessment": assessment
            },
        }).eq("user_id", student_id).execute()

        # Update users table
        db.table("users").update({
            "full_name": data.full_name,
            "phone": data.phone,
            "city": data.city,
            "age": data.age,
            "preferred_language": data.preferred_language,
        }).eq("id", student_id).execute()

    except Exception as e:
        logger.error(f"Onboarding save error: {e}")

    return {
        "success": True,
        "assessment": assessment
    }
