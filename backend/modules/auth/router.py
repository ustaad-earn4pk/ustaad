from fastapi import APIRouter
from modules.auth.schemas import SignupRequest, LoginRequest, ForgotPasswordRequest, ResetPasswordRequest
from modules.auth import service

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/signup")
async def signup(data: SignupRequest):
    return await service.signup(data)

@router.post("/login")
async def login(data: LoginRequest):
    return await service.login(data)

@router.post("/forgot-password")
async def forgot_password(data: ForgotPasswordRequest):
    return await service.forgot_password(data)

@router.post("/reset-password")
async def reset_password(data: ResetPasswordRequest):
    return await service.reset_password(data)
