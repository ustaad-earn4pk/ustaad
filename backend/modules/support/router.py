from fastapi import APIRouter, Depends, HTTPException
from core.security import get_current_user
from core.database import get_supabase_admin
from pydantic import BaseModel
from datetime import datetime, timedelta, timezone
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/support", tags=["Support"])


class SendMessage(BaseModel):
    message: str


def is_session_expired(expires_at: str) -> bool:
    if not expires_at:
        return True
    try:
        exp = datetime.fromisoformat(expires_at.replace("Z", "+00:00"))
        return datetime.now(timezone.utc) > exp
    except:
        return True


def get_user_role(user: dict) -> str:
    return user.get("role", "student")


# ── STUDENT ENDPOINTS ─────────────────────────────────────────────────────────

@router.post("/send")
async def student_send_message(body: SendMessage, user=Depends(get_current_user)):
    db = get_supabase_admin()
    student_id = user["sub"]
    role = get_user_role(user)

    if role not in ["student"]:
        raise HTTPException(status_code=403, detail="Only students can use this endpoint")

    if not body.message.strip():
        raise HTTPException(status_code=400, detail="Message empty hai")

    # Session check/create
    session = db.table("support_sessions").select("*").eq(
        "student_id", student_id
    ).execute()

    if not session.data:
        # New session banao
        db.table("support_sessions").insert({
            "student_id": student_id,
            "status": "open"
        }).execute()
    
    # Message save karo
    db.table("support_messages").insert({
        "student_id": student_id,
        "sender_id": user["sub"],
        "sender_role": "student",
        "message": body.message.strip(),
    }).execute()

    return {"message": "Message sent"}


@router.get("/messages")
async def student_get_messages(user=Depends(get_current_user)):
    db = get_supabase_admin()
    student_id = user["sub"]

    messages = db.table("support_messages").select(
        "id, sender_role, message, is_read, created_at"
    ).eq("student_id", student_id).order("created_at", desc=False).execute()

    # Admin messages mark as read
    unread_ids = [
        m["id"] for m in (messages.data or [])
        if m["sender_role"] in ["admin", "super_admin"] and not m["is_read"]
    ]
    if unread_ids:
        db.table("support_messages").update({"is_read": True}).in_(
            "id", unread_ids
        ).execute()

    return messages.data or []


@router.get("/unread-count")
async def student_unread_count(user=Depends(get_current_user)):
    db = get_supabase_admin()
    result = db.table("support_messages").select("id").eq(
        "student_id", user["sub"]
    ).in_("sender_role", ["admin", "super_admin"]).eq("is_read", False).execute()
    return {"unread": len(result.data or [])}


# ── ADMIN ENDPOINTS ───────────────────────────────────────────────────────────

@router.get("/admin/conversations")
async def admin_get_conversations(user=Depends(get_current_user)):
    """
    Admin: assigned students ki conversations
    Super admin: sab students ki conversations
    """
    db = get_supabase_admin()
    role = get_user_role(user)
    admin_id = user["sub"]

    if role == "super_admin":
        # Sab sessions
        sessions = db.table("support_sessions").select(
            "*, users!support_sessions_student_id_fkey(full_name, email)"
        ).eq("status", "open").order("updated_at", desc=True).execute()
        student_ids = [s["student_id"] for s in (sessions.data or [])]

    elif role == "admin":
        # Sirf assigned students
        assignments = db.table("admin_student_assignments").select(
            "student_id"
        ).eq("admin_id", admin_id).execute()

        student_ids = [a["student_id"] for a in (assignments.data or [])]

        if not student_ids:
            return []

        sessions = db.table("support_sessions").select(
            "*, users!support_sessions_student_id_fkey(full_name, email)"
        ).in_("student_id", student_ids).eq("status", "open").order(
            "updated_at", desc=True
        ).execute()

    else:
        raise HTTPException(status_code=403, detail="Access denied")

    result = []
    for session in (sessions.data or []):
        # Unread count (student messages jo admin ne nahi parhe)
        unread = db.table("support_messages").select("id").eq(
            "student_id", session["student_id"]
        ).eq("sender_role", "student").eq("is_read", False).execute()

        # Last message
        last_msg = db.table("support_messages").select(
            "message, created_at, sender_role"
        ).eq("student_id", session["student_id"]).order(
            "created_at", desc=True
        ).limit(1).execute()

        # Session ownership
        owner_id = session.get("owner_admin_id")
        expires_at = session.get("expires_at")
        is_owned_by_me = owner_id == admin_id
        is_expired = is_session_expired(expires_at)
        is_owned_by_other = owner_id and owner_id != admin_id and not is_expired

        # Super admin sab dekhe
        if role == "super_admin":
            is_owned_by_other = False

        result.append({
            "student_id": session["student_id"],
            "student_name": session.get("users", {}).get("full_name", "Unknown"),
            "student_email": session.get("users", {}).get("email", ""),
            "unread_count": len(unread.data or []),
            "last_message": last_msg.data[0] if last_msg.data else None,
            "owner_admin_id": owner_id,
            "is_owned_by_me": is_owned_by_me,
            "is_owned_by_other": is_owned_by_other,
            "session_expires_at": expires_at,
        })

    return result


@router.get("/admin/messages/{student_id}")
async def admin_get_student_messages(student_id: str, user=Depends(get_current_user)):
    db = get_supabase_admin()
    role = get_user_role(user)
    admin_id = user["sub"]

    if role == "admin":
        # Assignment check
        assigned = db.table("admin_student_assignments").select("id").eq(
            "admin_id", admin_id
        ).eq("student_id", student_id).execute()
        if not assigned.data:
            raise HTTPException(status_code=403, detail="Ye student aapko assign nahi hai")

    elif role not in ["super_admin"]:
        raise HTTPException(status_code=403, detail="Access denied")

    messages = db.table("support_messages").select("*").eq(
        "student_id", student_id
    ).order("created_at", desc=False).execute()

    # Student messages mark as read
    unread_ids = [
        m["id"] for m in (messages.data or [])
        if m["sender_role"] == "student" and not m["is_read"]
    ]
    if unread_ids:
        db.table("support_messages").update({"is_read": True}).in_(
            "id", unread_ids
        ).execute()

    return messages.data or []


@router.post("/admin/reply/{student_id}")
async def admin_reply(student_id: str, body: SendMessage, user=Depends(get_current_user)):
    db = get_supabase_admin()
    role = get_user_role(user)
    admin_id = user["sub"]

    if role not in ["admin", "super_admin"]:
        raise HTTPException(status_code=403, detail="Access denied")

    if not body.message.strip():
        raise HTTPException(status_code=400, detail="Message empty hai")

    if role == "admin":
        # Assignment check
        assigned = db.table("admin_student_assignments").select("id").eq(
            "admin_id", admin_id
        ).eq("student_id", student_id).execute()
        if not assigned.data:
            raise HTTPException(status_code=403, detail="Ye student aapko assign nahi hai")

    # Session ownership logic
    session = db.table("support_sessions").select("*").eq(
        "student_id", student_id
    ).execute()

    if session.data:
        s = session.data[0]
        owner_id = s.get("owner_admin_id")
        expires_at = s.get("expires_at")
        session_id = s["id"]
        expired = is_session_expired(expires_at)

        if role == "admin":
            if owner_id and owner_id != admin_id and not expired:
                raise HTTPException(
                    status_code=403,
                    detail="Ye session kisi aur admin ke paas hai. 4 ghante baad available hoga."
                )

            # Ownership lo
            new_expires = datetime.now(timezone.utc) + timedelta(hours=4)
            db.table("support_sessions").update({
                "owner_admin_id": admin_id,
                "owned_at": datetime.now(timezone.utc).isoformat(),
                "expires_at": new_expires.isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }).eq("id", session_id).execute()

    # Message save karo
    db.table("support_messages").insert({
        "student_id": student_id,
        "sender_id": admin_id,
        "sender_role": role,
        "message": body.message.strip(),
    }).execute()

    logger.info(f"[SUPPORT] {role} {admin_id} replied to student {student_id}")
    return {"message": "Reply sent"}


# ── SUPER ADMIN — ASSIGNMENT ENDPOINTS ───────────────────────────────────────

class AssignStudent(BaseModel):
    admin_id: str
    student_id: str


@router.post("/admin/assign")
async def assign_student_to_admin(body: AssignStudent, user=Depends(get_current_user)):
    db = get_supabase_admin()
    if get_user_role(user) != "super_admin":
        raise HTTPException(status_code=403, detail="Sirf super admin assign kar sakta hai")

    try:
        db.table("admin_student_assignments").insert({
            "admin_id": body.admin_id,
            "student_id": body.student_id,
            "assigned_by": user["sub"]
        }).execute()
        return {"message": "Student assigned"}
    except Exception as e:
        raise HTTPException(status_code=400, detail="Already assigned ya error: " + str(e))


@router.delete("/admin/unassign")
async def unassign_student(body: AssignStudent, user=Depends(get_current_user)):
    db = get_supabase_admin()
    if get_user_role(user) != "super_admin":
        raise HTTPException(status_code=403, detail="Sirf super admin unassign kar sakta hai")

    db.table("admin_student_assignments").delete().eq(
        "admin_id", body.admin_id
    ).eq("student_id", body.student_id).execute()
    return {"message": "Student unassigned"}


@router.get("/admin/admins-list")
async def get_admins_list(user=Depends(get_current_user)):
    db = get_supabase_admin()
    if get_user_role(user) != "super_admin":
        raise HTTPException(status_code=403, detail="Access denied")

    result = db.table("users").select(
        "id, full_name, email, role"
    ).in_("role", ["admin", "super_admin"]).execute()
    return result.data or []
