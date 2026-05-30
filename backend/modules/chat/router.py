from fastapi import APIRouter, Depends
from core.security import get_current_user
from modules.chat.service import send_message
from core.database import get_supabase_admin
from pydantic import BaseModel

router = APIRouter(prefix="/chat", tags=["Chat"])

class ChatRequest(BaseModel):
    message: str
    language: str = "en"

@router.post("/send")
async def chat(data: ChatRequest, user=Depends(get_current_user)):
    return await send_message(user["sub"], data.message, data.language)

@router.get("/history")
async def get_history(limit: int = 50, user=Depends(get_current_user)):
    db = get_supabase_admin()
    session = db.table("chat_sessions").select("id").eq("student_id", user["sub"]).single().execute()
    if not session.data:
        return []
    msgs = db.table("chat_messages").select("*").eq("session_id", session.data["id"]).order("created_at", desc=False).limit(limit).execute()
    return msgs.data or []
