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

class LoginRequest(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    role: str
    full_name: str
    preferred_language: str
    status: str
