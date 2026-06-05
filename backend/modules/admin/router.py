from fastapi import APIRouter, Depends, HTTPException
from core.security import get_current_admin
from core.database import get_supabase_admin
from pydantic import BaseModel
from typing import Optional, Any
import logging
import httpx

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/admin", tags=["Admin"])

SUPABASE_URL = "https://qhxhetjspjzdbpbeucfh.supabase.co"
SUPABASE_ANON_KEY = "sb_publishable_4Swh9me3ZBRvz6fzwV-dWQ_TnDN12dX"


def require_super_admin(admin: dict):
    if admin.get("role") != "super_admin":
        raise HTTPException(status_code=403, detail="Sirf super admin ye action kar sakta hai")


# ── Schemas ───────────────────────────────────────────────────────────────────

class SettingUpdate(BaseModel):
    key: str
    value: Any

class PromptUpdate(BaseModel):
    category: str
    key: str
    prompt_en: str
    prompt_ur: str = ""
    prompt_roman: str = ""
    description: str = ""

class TunerUpdate(BaseModel):
    grading_strictness: Optional[str] = None   # sakht / normal / naram
    feedback_length: Optional[str] = None       # chota / normal / lamba
    encouragement_level: Optional[str] = None   # kam / medium / zyada
    language_tone: Optional[str] = None         # formal / normal / dost
    chat_daily_limit: Optional[int] = None      # number

class PasswordVerifyRequest(BaseModel):
    password: str
    email: str


# ── Dashboard stats ───────────────────────────────────────────────────────────

@router.get("/dashboard")
async def get_dashboard(admin=Depends(get_current_admin)):
    db = get_supabase_admin()
    total = db.table("student_profiles").select("status").execute()
    data = total.data or []
    stats = {
        "total": len(data),
        "pending": len([s for s in data if s["status"] == "pending"]),
        "trial": len([s for s in data if s["status"] == "trial"]),
        "active": len([s for s in data if s["status"] == "active"]),
        "suspended": len([s for s in data if s["status"] == "suspended"]),
        "expired": len([s for s in data if s["status"] == "expired"]),
    }
    cost = db.table("api_cost_logs").select("estimated_cost_usd").execute()
    total_cost = sum(float(r.get("estimated_cost_usd", 0)) for r in (cost.data or []))
    stats["monthly_cost_usd"] = round(total_cost, 4)
    return stats


# ── Settings ──────────────────────────────────────────────────────────────────

@router.get("/settings")
async def get_settings(admin=Depends(get_current_admin)):
    db = get_supabase_admin()
    result = db.table("admin_settings").select("*").execute()
    return {r["key"]: r["value"] for r in (result.data or [])}

@router.put("/settings")
async def update_setting(data: SettingUpdate, admin=Depends(get_current_admin)):
    db = get_supabase_admin()
    db.table("admin_settings").upsert({
        "key": data.key,
        "value": data.value,
        "updated_by": admin["sub"]
    }).execute()
    return {"message": f"Setting '{data.key}' updated"}


# ── TUNERS — super admin only ─────────────────────────────────────────────────

@router.get("/tuners")
async def get_tuners(admin=Depends(get_current_admin)):
    """Get current global tuner settings."""
    require_super_admin(admin)
    db = get_supabase_admin()

    keys = ["grading_strictness", "feedback_length", "encouragement_level", "language_tone", "chat_daily_limit"]
    result = db.table("admin_settings").select("key, value").in_("key", keys).execute()

    defaults = {
        "grading_strictness": "normal",
        "feedback_length": "normal",
        "encouragement_level": "medium",
        "language_tone": "normal",
        "chat_daily_limit": 20
    }

    tuners = dict(defaults)
    for row in (result.data or []):
        tuners[row["key"]] = row["value"]

    return tuners


@router.put("/tuners")
async def update_tuners(data: TunerUpdate, admin=Depends(get_current_admin)):
    """Update global tuner settings. Super admin only."""
    require_super_admin(admin)
    db = get_supabase_admin()

    updates = {k: v for k, v in data.dict().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="Kuch update karne ke liye nahi bheja")

    for key, value in updates.items():
        db.table("admin_settings").upsert({
            "key": key,
            "value": value,
            "updated_by": admin["sub"]
        }).execute()

    return {"message": "Tuners update ho gaye", "updated": list(updates.keys())}


# ── VERIFY PASSWORD (for advanced prompt edit) ────────────────────────────────

@router.post("/verify-password")
async def verify_password(data: PasswordVerifyRequest, admin=Depends(get_current_admin)):
    """Verify super admin password before allowing prompt edit."""
    require_super_admin(admin)

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
        if response.status_code == 200:
            return {"verified": True}
        else:
            raise HTTPException(status_code=401, detail="Password galat hai")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Password verify error: {e}")
        raise HTTPException(status_code=500, detail="Verification fail ho gayi")


# ── PROMPTS — super admin only ────────────────────────────────────────────────

@router.get("/prompts")
async def get_prompts(admin=Depends(get_current_admin)):
    require_super_admin(admin)
    db = get_supabase_admin()
    result = db.table("prompt_settings").select("*").order("category").execute()
    return result.data or []

@router.put("/prompts")
async def update_prompt(data: PromptUpdate, admin=Depends(get_current_admin)):
    require_super_admin(admin)
    db = get_supabase_admin()
    db.table("prompt_settings").upsert({
        "category": data.category,
        "key": data.key,
        "prompt_en": data.prompt_en,
        "prompt_ur": data.prompt_ur,
        "prompt_roman": data.prompt_roman,
        "description": data.description,
        "updated_by": admin["sub"]
    }).execute()
    return {"message": "Prompt updated"}


# ── Notices ───────────────────────────────────────────────────────────────────

class NoticeCreate(BaseModel):
    title: str
    title_ur: str = ""
    body: str
    body_ur: str = ""
    target_all: bool = True
    target_student_id: Optional[str] = None
    is_pinned: bool = False

@router.post("/notices")
async def create_notice(data: NoticeCreate, admin=Depends(get_current_admin)):
    db = get_supabase_admin()
    db.table("notices").insert({
        "title": data.title,
        "title_ur": data.title_ur,
        "body": data.body,
        "body_ur": data.body_ur,
        "target_all": data.target_all,
        "target_student_id": data.target_student_id,
        "is_pinned": data.is_pinned,
        "created_by": admin["sub"]
    }).execute()
    return {"message": "Notice created"}

@router.get("/notices")
async def get_notices(admin=Depends(get_current_admin)):
    db = get_supabase_admin()
    result = db.table("notices").select("*").order("created_at", desc=True).execute()
    return result.data or []


# ── Cost monitor ──────────────────────────────────────────────────────────────

@router.get("/costs")
async def get_costs(admin=Depends(get_current_admin)):
    db = get_supabase_admin()
    result = db.table("admin_cost_summary").select("*").execute()
    return result.data or []


# ── Payments ──────────────────────────────────────────────────────────────────

@router.get("/payments")
async def get_payments(status: Optional[str] = None, admin=Depends(get_current_admin)):
    db = get_supabase_admin()
    query = db.table("payments").select("*, users(full_name, email)").order("created_at", desc=True)
    if status:
        query = query.eq("status", status)
    result = query.execute()
    return result.data or []

@router.post("/payments/{payment_id}/verify")
async def verify_payment(payment_id: str, admin=Depends(get_current_admin)):
    db = get_supabase_admin()
    payment = db.table("payments").select("*").eq("id", payment_id).single().execute()
    if not payment.data:
        raise HTTPException(status_code=404, detail="Payment not found")

    db.table("payments").update({
        "status": "verified",
        "verified_by": admin["sub"],
        "verified_at": "now()"
    }).eq("id", payment_id).execute()

    db.table("student_profiles").update({
        "status": "active",
        "current_plan": payment.data.get("plan_id", "normal")
    }).eq("user_id", payment.data["student_id"]).execute()

    return {"message": "Payment verified, student activated"}
