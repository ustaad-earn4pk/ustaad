from fastapi import APIRouter, Depends
from core.security import get_current_user
from core.database import get_supabase_admin
from core.config import settings
from pydantic import BaseModel
from typing import Optional
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/payments", tags=["Payments"])

class PaymentSubmit(BaseModel):
    plan_id: str
    amount_pkr: int
    gateway: str = "jazzcash"
    screenshot_url: Optional[str] = None
    transaction_id: Optional[str] = None

@router.get("/plans")
async def get_plans():
    db = get_supabase_admin()
    result = db.table("subscription_plans").select("*").eq("is_active", True).execute()
    return result.data or []

@router.get("/account-info")
async def get_account_info():
    db = get_supabase_admin()
    jc = db.table("admin_settings").select("value").eq("key", "manual_jazzcash_number").single().execute()
    ep = db.table("admin_settings").select("value").eq("key", "manual_easypaisa_number").single().execute()
    mode = db.table("admin_settings").select("value").eq("key", "payment_mode").single().execute()
    return {
        "payment_mode": mode.data["value"]["mode"] if mode.data else "manual",
        "jazzcash": jc.data["value"]["number"] if jc.data else settings.jazzcash_number,
        "easypaisa": ep.data["value"]["number"] if ep.data else "",
        "instructions": {
            "en": f"Send payment to JazzCash: {settings.jazzcash_number} and upload screenshot below.",
            "ur_nastaliq": f"JazzCash نمبر {settings.jazzcash_number} پر رقم بھیجیں اور سکرین شاٹ اپلوڈ کریں۔",
            "ur_roman": f"JazzCash {settings.jazzcash_number} par raqam bhejein aur screenshot upload karein."
        }
    }

@router.post("/submit")
async def submit_payment(data: PaymentSubmit, user=Depends(get_current_user)):
    db = get_supabase_admin()
    result = db.table("payments").insert({
        "student_id": user["sub"],
        "plan_id": data.plan_id,
        "amount_pkr": data.amount_pkr,
        "payment_method": "manual",
        "gateway": data.gateway,
        "screenshot_url": data.screenshot_url,
        "transaction_id": data.transaction_id,
        "status": "pending"
    }).execute()
    return {"message": "Payment submitted. Admin will verify shortly.", "payment_id": result.data[0]["id"]}

@router.get("/my-payments")
async def get_my_payments(user=Depends(get_current_user)):
    db = get_supabase_admin()
    result = db.table("payments").select("*").eq("student_id", user["sub"]).order("created_at", desc=True).execute()
    return result.data or []
