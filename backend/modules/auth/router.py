from fastapi import APIRouter
from modules.auth.schemas import SignupRequest, LoginRequest
from modules.auth import service

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/signup")
async def signup(data: SignupRequest):
    return await service.signup(data)

@router.post("/login")
async def login(data: LoginRequest):
    return await service.login(data)
