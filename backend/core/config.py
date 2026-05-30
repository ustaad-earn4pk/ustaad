from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    supabase_url: str = ""
    supabase_publishable_key: str = ""
    supabase_secret_key: str = ""
    anthropic_api_key: str = ""
    anthropic_model: str = "claude-sonnet-4-20250514"
    platform_name: str = "USTAAD"
    platform_url: str = "https://ustaad.earn4pk.com"
    admin_email: str = "yasirisback@gmail.com"
    jazzcash_number: str = "03217305400"
    jwt_secret: str = "ustaad_jwt_secret_change_in_production"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 10080
    payment_mode: str = "manual"
    easypaisa_number: str = ""
    chat_limit_normal: int = 20
    chat_limit_fast: int = 40
    chat_limit_turbo: int = 60
    chat_limit_unlimited: int = 100
    onboarding_max_turns: int = 15
    assessment_days: int = 5
    task_assign_time: str = "09:00"
    timezone: str = "Asia/Karachi"
    debug: bool = True
    environment: str = "development"

    class Config:
        env_file = ".env"
        case_sensitive = False

@lru_cache()
def get_settings() -> Settings:
    return Settings()

settings = get_settings()
