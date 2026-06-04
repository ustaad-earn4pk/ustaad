from fastapi import APIRouter, Depends, HTTPException
from core.database import get_supabase_admin
from core.security import get_current_user
from typing import Optional

router = APIRouter(prefix="/notifications", tags=["Notifications"])


# ─── Internal helper — call this from any module to create a notification ───

async def create_notification(
    db,
    user_id: str,
    type: str,
    title: str,
    body: str
):
    """
    Call this from payments, tasks, support modules to fire a notification.
    Fails silently — never breaks the main flow.
    """
    try:
        db.table("notifications").insert({
            "user_id": user_id,
            "type": type,
            "title": title,
            "body": body,
            "is_read": False
        }).execute()
    except Exception as e:
        print(f"[NOTIFY ERROR] user={user_id} type={type} error={e}")


# ─── GET /notifications/my ───

@router.get("/my")
async def get_my_notifications(
    unread_only: bool = False,
    limit: int = 20,
    current_user: dict = Depends(get_current_user),
):
    db = get_supabase_admin()
    try:
        query = db.table("notifications") \
            .select("*") \
            .eq("user_id", current_user["id"]) \
            .order("created_at", desc=True) \
            .limit(limit)

        if unread_only:
            query = query.eq("is_read", False)

        result = query.execute()

        unread_result = db.table("notifications") \
            .select("id", count="exact") \
            .eq("user_id", current_user["id"]) \
            .eq("is_read", False) \
            .execute()

        return {
            "notifications": result.data,
            "unread_count": unread_result.count or 0
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch notifications: {str(e)}")


# ─── POST /notifications/mark-read ───

@router.post("/mark-read")
async def mark_notifications_read(
    notification_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
):
    db = get_supabase_admin()
    try:
        query = db.table("notifications") \
            .update({"is_read": True}) \
            .eq("user_id", current_user["id"])

        if notification_id:
            query = query.eq("id", notification_id)

        query.execute()
        return {"success": True}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to mark read: {str(e)}")


# ─── DELETE /notifications/clear ───

@router.delete("/clear")
async def clear_all_notifications(
    current_user: dict = Depends(get_current_user),
):
    db = get_supabase_admin()
    try:
        db.table("notifications") \
            .delete() \
            .eq("user_id", current_user["id"]) \
            .execute()

        return {"success": True}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to clear: {str(e)}")
