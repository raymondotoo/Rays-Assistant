from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.database import get_db
from app.models.schema import UserProfile
from app.models.schemas import UserProfileResponse
from app.services.learning import LearningService

router = APIRouter(prefix="/api/learning", tags=["learning"])

@router.get("/profile", response_model=UserProfileResponse)
async def get_user_profile(db: AsyncSession = Depends(get_db)):
    """Get the current user profile"""
    profile = await LearningService.get_or_create_user_profile(db)
    if not profile:
        raise HTTPException(status_code=404, detail="User profile not found")
    return profile

@router.post("/update", response_model=UserProfileResponse)
async def update_user_profile(conversation_id: str, db: AsyncSession = Depends(get_db)):
    """Update user profile based on conversation history"""
    profile = await LearningService.update_user_profile(db, conversation_id)
    if not profile:
        raise HTTPException(status_code=500, detail="Failed to update user profile")
    return profile
