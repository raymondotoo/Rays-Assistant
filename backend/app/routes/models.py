from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import get_db
from app.services.ollama import ollama_service
from app.services.feedback import ModelMetricsService
from app.models.schemas import ModelMetricResponse
from typing import List

router = APIRouter(prefix="/api/models", tags=["models"])

@router.get("/available")
async def get_available_models():
    """Get list of available models from Ollama"""
    models = await ollama_service.list_models()
    return {"models": models, "count": len(models)}

@router.get("/metrics", response_model=List[ModelMetricResponse])
async def get_model_metrics(db: AsyncSession = Depends(get_db)):
    """Get metrics for all models"""
    metrics = await ModelMetricsService.get_all_metrics(db)
    return metrics

@router.get("/metrics/{model_name}", response_model=ModelMetricResponse)
async def get_model_metric(model_name: str, db: AsyncSession = Depends(get_db)):
    """Get metrics for a specific model"""
    metric = await ModelMetricsService.get_metric(db, model_name)
    if not metric:
        raise HTTPException(status_code=404, detail="Model metric not found")
    return metric
