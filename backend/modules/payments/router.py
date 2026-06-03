from fastapi import APIRouter, Depends, UploadFile, File, Form
from typing import Optional
from core.security import get_current_user
from core.database import get_supabase_admin
from core.config import settings
from pydantic import BaseModel
import logging
import uuid

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/payments", tags=["Payments"])


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
    }


@router.post("/submit")
async def submit_payment(
    plan_id: Optional[str] = Form(None),
    amount_pkr: int = Form(999),
    transaction_id: str = Form(...),
    sender_number: str = Form(...),
    screenshot_url: UploadFile = File(...),
    user=Depends(get_current_user)
):
    db = get_supabase_admin()

    file_bytes = await screenshot_url.read()
    ext = screenshot_url.filename.rsplit(".", 1)[-1].lower() if "." in screenshot_url.filename else "jpg"
    file_path = f"{user['sub']}/{uuid.uuid4()}.{ext}"

    try:
        db.storage.from_("payment-screenshots").upload(
            file_path,
            file_bytes,
            {"content-type": screenshot_url.content_type}
        )
        public_url = db.storage.from_("payment-screenshots").get_public_url(file_path)
    except Exception as e:
        logger.error(f"Storage upload failed: {e}")
        public_url = None

    result = db.table("payments").insert({
        "student_id": user["sub"],
        "plan_id": None,
        "amount_pkr": amount_pkr,
        "payment_method": "manual",
        "gateway": "jazzcash",
        "screenshot_url": public_url,
        "transaction_id": transaction_id,
        "sender_number": sender_number,
        "status": "pending"
    }).execute()

    return {"message": "Payment submitted. Admin will verify shortly.", "payment_id": result.data[0]["id"]}


@router.get("/my-payments")
async def get_my_payments(user=Depends(get_current_user)):
    db = get_supabase_admin()
    result = db.table("payments").select("*").eq("student_id", user["sub"]).order("created_at", desc=True).execute()
    return result.data or []


class ReviewPayment(BaseModel):
    action: str
    admin_note: Optional[str] = None


@router.get("/admin/pending")
async def admin_pending_payments(user=Depends(get_current_user)):
    db = get_supabase_admin()
    result = db.table("payments").select("*").eq("status", "pending").order("created_at", desc=False).execute()
    return result.data or []


@router.post("/admin/{payment_id}/review")
async def admin_review_payment(payment_id: str, body: ReviewPayment, user=Depends(get_current_user)):
    from fastapi import HTTPException
    db = get_supabase_admin()

    payment = db.table("payments").select("*").eq("id", payment_id).single().execute()
    if not payment.data:
        raise HTTPException(status_code=404, detail="Payment not found")

    new_status = "approved" if body.action == "approve" else "rejected"

    db.table("payments").update({
        "status": new_status,
        "notes": body.admin_note,
        "verified_at": "now()",
        "verified_by": user["sub"]
    }).eq("id", payment_id).execute()

    if body.action == "approve":
        db.table("student_profiles").update({
            "status": "approved",
            "approved_at": "now()",
            "approved_by": user["sub"],
            "current_plan": "normal",
            "payment_id": payment_id
        }).eq("user_id", payment.data["student_id"]).execute()

    return {"message": f"Payment {new_status}", "payment_id": payment_id}
