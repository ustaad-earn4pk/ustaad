from fastapi import APIRouter, Depends
from core.security import get_current_admin
from core.database import get_supabase_admin
from pydantic import BaseModel
from typing import Optional, Any
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/admin", tags=["Admin"])

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

class NoticeCreate(BaseModel):
    title: str
    title_ur: str = ""
    body: str
    body_ur: str = ""
    target_all: bool = True
    target_student_id: Optional[str] = None
    is_pinned: bool = False

# Dashboard stats
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

    # Cost this month
    cost = db.table("api_cost_logs").select("estimated_cost_usd").execute()
    total_cost = sum(float(r.get("estimated_cost_usd", 0)) for r in (cost.data or []))
    stats["monthly_cost_usd"] = round(total_cost, 4)

    return stats

# Settings
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

# Prompt settings
@router.get("/prompts")
async def get_prompts(admin=Depends(get_current_admin)):
    db = get_supabase_admin()
    result = db.table("prompt_settings").select("*").order("category").execute()
    return result.data or []

@router.put("/prompts")
async def update_prompt(data: PromptUpdate, admin=Depends(get_current_admin)):
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

# Notices
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

# Cost monitor
@router.get("/costs")
async def get_costs(admin=Depends(get_current_admin)):
    db = get_supabase_admin()
    result = db.table("admin_cost_summary").select("*").execute()
    return result.data or []

# Payments
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
        from fastapi import HTTPException
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
