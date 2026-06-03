from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from core.database import init_db
from core.config import settings
import logging

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🚀 USTAAD Backend Starting...")
    logger.info(f"Platform: {settings.platform_name}")
    logger.info(f"Environment: {settings.environment}")
    init_db()
    logger.info("✅ Ready!")
    yield
    logger.info("👋 USTAAD Backend Shutting Down")

app = FastAPI(
    title="USTAAD API",
    description="AI-powered professional skills learning platform — ustaad.earn4pk.com",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "https://ustaad.earn4pk.com",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from modules.auth.router import router as auth_router
from modules.students.router import router as students_router
from modules.onboarding.router import router as onboarding_router
from modules.chat.router import router as chat_router
from modules.admin.router import router as admin_router
from modules.payments.router import router as payments_router
from modules.tasks.router import router as tasks_router

PREFIX = "/api/v1"
app.include_router(auth_router, prefix=PREFIX)
app.include_router(students_router, prefix=PREFIX)
app.include_router(onboarding_router, prefix=PREFIX)
app.include_router(chat_router, prefix=PREFIX)
app.include_router(admin_router, prefix=PREFIX)
app.include_router(payments_router, prefix=PREFIX)
app.include_router(tasks_router, prefix=PREFIX)

@app.get("/")
async def root():
    return {
        "platform": "USTAAD",
        "tagline": "Seekho. Karo. Kamao.",
        "status": "running",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/health")
async def health():
    return {"status": "healthy", "platform": settings.platform_name}
