from pydantic import BaseModel, EmailStr
from typing import Optional


class SignupRequest(BaseModel):
    full_name: str
    email: str
    password: str
    phone: Optional[str] = None
    city: Optional[str] = None
    age: Optional[int] = None
    preferred_language: str = "en"
    # Honeypot + time check
    website: Optional[str] = None       # honeypot field
    form_load_time: Optional[float] = None  # timestamp when form loaded


class LoginRequest(BaseModel):
    email: str
    password: str
    # Honeypot + time check
    website: Optional[str] = None
    form_load_time: Optional[float] = None


class ForgotPasswordRequest(BaseModel):
    email: str
    website: Optional[str] = None
    form_load_time: Optional[float] = None


class ResetPasswordRequest(BaseModel):
    access_token: str
    new_password: str
    website: Optional[str] = None
    form_load_time: Optional[float] = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    role: str
    full_name: str
    preferred_language: str
    status: str
