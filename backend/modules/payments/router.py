from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from typing import Optional
from core.security import get_current_user
from core.database import get_supabase_admin
from core.config import settings
from pydantic import BaseModel
from datetime import datetime, timedelta
import logging
import uuid

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/payments", tags=["Payments"])

TRACK_DURATIONS = {
    "computer_basics": 30,
    "web_fundamentals": 30,
    "ghl_developer": 45,
    "integration_expert": 45,
    "full_stack_automation": 60,
    "client_hunting": 45,
}

TRACK_NAMES = {
    "computer_basics": "Computer & Internet Basics",
    "web_fundamentals": "Web & Business Basics",
    "ghl_developer": "GoHighLevel Developer",
    "integration_expert": "Integration Expert",
    "full_stack_automation": "Full Stack Automation",
    "client_hunting": "Client Hunting & Portfolio",
}

TRACK_LEVELS = {
    "computer_basics": 1,
    "web_fundamentals": 2,
    "ghl_developer": 3,
    "integration_expert": 4,
    "full_stack_automation": 5,
    "client_hunting": 5,
}

TRACK_PRICES = {
    "computer_basics": 5000,
    "web_fundamentals": 5000,
    "ghl_developer": 7000,
    "integration_expert": 8000,
    "full_stack_automation": 10000,
    "client_hunting": 12000,
}

TRACK_ORDER = [
    "computer_basics",
    "web_fundamentals",
    "ghl_developer",
    "integration_expert",
    "full_stack_automation",
    "client_hunting"
]


def get_next_track(current_track: str):
    try:
        idx = TRACK_ORDER.index(current_track)
        if idx + 1 < len(TRACK_ORDER):
            return TRACK_ORDER[idx + 1]
        return None
    except ValueError:
        return None


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
            file_path, file_bytes, {"content-type": screenshot_url.content_type}
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
        "status": "pending",
        "payment_type": "new_enrollment"
    }).execute()

    return {"message": "Payment submitted. Admin will verify shortly.", "payment_id": result.data[0]["id"]}


@router.get("/my-payments")
async def get_my_payments(user=Depends(get_current_user)):
    db = get_supabase_admin()
    result = db.table("payments").select("*").eq("student_id", user["sub"]).order("created_at", desc=True).execute()
    return result.data or []


# ── RENEWAL ENDPOINTS ─────────────────────────────────────────────────────────

@router.get("/renewal-options")
async def get_renewal_options(user=Depends(get_current_user)):
    """
    Student ka current status dekh ke renewal options return kare.
    - renewal_same: same course extend (agar incomplete hai)
    - renewal_next: next course unlock (agar complete ya last warning)
    """
    db = get_supabase_admin()
    try:
        profile = db.table("student_profiles").select(
            "current_track, status, plan_ends_at, total_tasks_assigned, total_tasks_completed"
        ).eq("user_id", user["sub"]).single().execute()

        if not profile.data:
            raise HTTPException(status_code=404, detail="Profile not found")

        data = profile.data
        current_track = data.get("current_track")
        next_track = get_next_track(current_track)

        # Pending renewal check — duplicate submit block
        pending = db.table("payments").select("id").eq(
            "student_id", user["sub"]
        ).eq("status", "pending").eq("payment_type", "renewal_same").execute()

        pending_next = db.table("payments").select("id").eq(
            "student_id", user["sub"]
        ).eq("status", "pending").eq("payment_type", "renewal_next").execute()

        total = data.get("total_tasks_assigned") or 0
        completed = data.get("total_tasks_completed") or 0
        completion_pct = (completed / total * 100) if total > 0 else 0

        options = []

        # Same course extend option
        if completion_pct < 80:
            options.append({
                "type": "renewal_same",
                "track": current_track,
                "track_name": TRACK_NAMES.get(current_track, current_track),
                "duration_days": TRACK_DURATIONS.get(current_track, 30),
                "price_pkr": TRACK_PRICES.get(current_track, 5000),
                "label": "Same Course Extend Karo",
                "description": f"{TRACK_NAMES.get(current_track)} — {TRACK_DURATIONS.get(current_track, 30)} din aur",
                "pending": len(pending.data) > 0
            })

        # Next course option
        if next_track:
            options.append({
                "type": "renewal_next",
                "track": next_track,
                "track_name": TRACK_NAMES.get(next_track, next_track),
                "duration_days": TRACK_DURATIONS.get(next_track, 30),
                "price_pkr": TRACK_PRICES.get(next_track, 5000),
                "label": "Next Course Unlock Karo",
                "description": f"{TRACK_NAMES.get(next_track)} — {TRACK_DURATIONS.get(next_track, 30)} din",
                "pending": len(pending_next.data) > 0
            })

        return {
            "current_track": current_track,
            "current_track_name": TRACK_NAMES.get(current_track, current_track),
            "completion_pct": round(completion_pct, 1),
            "options": options
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Renewal options error for {user['sub']}: {e}")
        raise HTTPException(status_code=500, detail="Could not load renewal options")


@router.post("/submit-renewal")
async def submit_renewal(
    renewal_type: str = Form(...),  # renewal_same or renewal_next
    transaction_id: str = Form(...),
    sender_number: str = Form(...),
    screenshot: UploadFile = File(...),
    user=Depends(get_current_user)
):
    db = get_supabase_admin()

    # Validate renewal type
    if renewal_type not in ["renewal_same", "renewal_next"]:
        raise HTTPException(status_code=400, detail="Invalid renewal type")

    # Duplicate pending check
    existing = db.table("payments").select("id").eq(
        "student_id", user["sub"]
    ).eq("status", "pending").eq("payment_type", renewal_type).execute()

    if existing.data:
        raise HTTPException(status_code=400, detail="Renewal already pending. Admin verify kar raha hai.")

    # Get profile for track + amount
    profile = db.table("student_profiles").select(
        "current_track"
    ).eq("user_id", user["sub"]).single().execute()

    if not profile.data:
        raise HTTPException(status_code=404, detail="Profile not found")

    current_track = profile.data.get("current_track")

    if renewal_type == "renewal_next":
        target_track = get_next_track(current_track)
        if not target_track:
            raise HTTPException(status_code=400, detail="Aap already highest level pe hain")
    else:
        target_track = current_track

    amount = TRACK_PRICES.get(target_track, 5000)

    # Upload screenshot
    file_bytes = await screenshot.read()
    ext = screenshot.filename.rsplit(".", 1)[-1].lower() if "." in screenshot.filename else "jpg"
    file_path = f"{user['sub']}/renewal/{uuid.uuid4()}.{ext}"

    try:
        db.storage.from_("payment-screenshots").upload(
            file_path, file_bytes, {"content-type": screenshot.content_type}
        )
        public_url = db.storage.from_("payment-screenshots").get_public_url(file_path)
    except Exception as e:
        logger.error(f"Renewal screenshot upload failed: {e}")
        public_url = None

    result = db.table("payments").insert({
        "student_id": user["sub"],
        "plan_id": None,
        "amount_pkr": amount,
        "payment_method": "manual",
        "gateway": "jazzcash",
        "screenshot_url": public_url,
        "transaction_id": transaction_id,
        "sender_number": sender_number,
        "status": "pending",
        "payment_type": renewal_type,
        "notes": f"Target track: {target_track}"
    }).execute()

    return {
        "message": "Renewal submitted. Admin verify karega.",
        "payment_id": result.data[0]["id"],
        "target_track": target_track,
        "amount_pkr": amount
    }


@router.get("/my-renewal-status")
async def get_my_renewal_status(user=Depends(get_current_user)):
    db = get_supabase_admin()
    result = db.table("payments").select("*").eq(
        "student_id", user["sub"]
    ).in_("payment_type", ["renewal_same", "renewal_next"]).order(
        "created_at", desc=True
    ).limit(1).execute()

    if not result.data:
        return {"has_renewal": False}

    renewal = result.data[0]
    return {
        "has_renewal": True,
        "status": renewal["status"],
        "payment_type": renewal["payment_type"],
        "amount_pkr": renewal["amount_pkr"],
        "created_at": renewal["created_at"],
        "notes": renewal["notes"]
    }


# ── ADMIN ENDPOINTS ───────────────────────────────────────────────────────────

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
    db = get_supabase_admin()

    payment = db.table("payments").select("*").eq("id", payment_id).single().execute()
    if not payment.data:
        raise HTTPException(status_code=404, detail="Payment not found")

    new_status = "approved" if body.action == "approve" else "rejected"

    db.table("payments").update({
        "status": new_status,
        "notes": body.admin_note,
        "verified_at": datetime.utcnow().isoformat(),
        "verified_by": user["sub"]
    }).eq("id", payment_id).execute()

    if body.action == "approve":
        payment_type = payment.data.get("payment_type", "new_enrollment")

        if payment_type == "new_enrollment":
            # Original flow — unchanged
            student_profile = db.table("student_profiles").select(
                "current_track"
            ).eq("user_id", payment.data["student_id"]).single().execute()

            current_track = student_profile.data.get("current_track", "ghl_developer") if student_profile.data else "ghl_developer"
            duration = TRACK_DURATIONS.get(current_track, 30)
            plan_started = datetime.utcnow()
            plan_ends = plan_started + timedelta(days=duration)

            db.table("student_profiles").update({
                "status": "approved",
                "approved_at": plan_started.isoformat(),
                "approved_by": user["sub"],
                "current_plan": current_track,
                "plan_started_at": plan_started.isoformat(),
                "plan_ends_at": plan_ends.isoformat(),
                "payment_id": payment_id
            }).eq("user_id", payment.data["student_id"]).execute()

            try:
                db.table("courses").insert({
                    "student_id": payment.data["student_id"],
                    "track": current_track,
                    "level": TRACK_LEVELS.get(current_track, 1),
                    "title": TRACK_NAMES.get(current_track, "USTAAD Course"),
                    "roadmap": {},
                    "is_active": True,
                }).execute()
            except Exception as e:
                logger.error(f"Course creation failed: {e}")

        elif payment_type == "renewal_same":
            # Same course extend
            student_profile = db.table("student_profiles").select(
                "current_track, plan_ends_at"
            ).eq("user_id", payment.data["student_id"]).single().execute()

            current_track = student_profile.data.get("current_track")
            duration = TRACK_DURATIONS.get(current_track, 30)

            # Extend from today or from current end date (whichever is later)
            now = datetime.utcnow()
            current_end = student_profile.data.get("plan_ends_at")
            if current_end:
                try:
                    current_end_dt = datetime.fromisoformat(current_end.replace("Z", ""))
                    base = max(now, current_end_dt)
                except:
                    base = now
            else:
                base = now

            new_end = base + timedelta(days=duration)

            db.table("student_profiles").update({
                "status": "approved",
                "plan_ends_at": new_end.isoformat(),
                "grace_period_ends_at": None,
                "payment_id": payment_id
            }).eq("user_id", payment.data["student_id"]).execute()

            logger.info(f"[RENEWAL_SAME] student={payment.data['student_id']} extended to {new_end}")

        elif payment_type == "renewal_next":
            # Next course unlock
            student_profile = db.table("student_profiles").select(
                "current_track"
            ).eq("user_id", payment.data["student_id"]).single().execute()

            current_track = student_profile.data.get("current_track")
            next_track = get_next_track(current_track)

            if not next_track:
                logger.error(f"[RENEWAL_NEXT] No next track for {current_track}")
                return {"message": "approved", "warning": "No next track found"}

            duration = TRACK_DURATIONS.get(next_track, 30)
            now = datetime.utcnow()
            new_end = now + timedelta(days=duration)

            # Deactivate current course
            db.table("courses").update({
                "is_active": False
            }).eq("student_id", payment.data["student_id"]).eq("is_active", True).execute()

            # Update profile to next track
            db.table("student_profiles").update({
                "status": "approved",
                "current_track": next_track,
                "current_plan": next_track,
                "plan_started_at": now.isoformat(),
                "plan_ends_at": new_end.isoformat(),
                "grace_period_ends_at": None,
                "payment_id": payment_id,
                "total_tasks_assigned": 0,
                "total_tasks_completed": 0,
            }).eq("user_id", payment.data["student_id"]).execute()

            # Create new course record
            try:
                db.table("courses").insert({
                    "student_id": payment.data["student_id"],
                    "track": next_track,
                    "level": TRACK_LEVELS.get(next_track, 1),
                    "title": TRACK_NAMES.get(next_track, "USTAAD Course"),
                    "roadmap": {},
                    "is_active": True,
                }).execute()
            except Exception as e:
                logger.error(f"[RENEWAL_NEXT] Course creation failed: {e}")

            logger.info(f"[RENEWAL_NEXT] student={payment.data['student_id']} moved to {next_track}")

    return {"message": f"Payment {new_status}", "payment_id": payment_id}
