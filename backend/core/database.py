from supabase import create_client, Client
from core.config import settings
import logging

logger = logging.getLogger(__name__)

_supabase_admin: Client = None

def get_supabase_admin() -> Client:
    global _supabase_admin
    if _supabase_admin is None:
        _supabase_admin = create_client(
            settings.supabase_url,
            settings.supabase_secret_key
        )
    return _supabase_admin

def init_db():
    get_supabase_admin()
    logger.info("✅ Database connected")
