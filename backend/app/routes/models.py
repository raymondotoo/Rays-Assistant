from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import get_db
from app.services.ollama import ollama_service
import subprocess
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


# New endpoint: Download model via Ollama
@router.post("/download")
async def download_model(model: str = Body(..., embed=True)):
    """Download a model using Ollama (ollama pull <model>)"""
    try:
        result = subprocess.run(["ollama", "pull", model], capture_output=True, text=True, timeout=600)
        if result.returncode == 0:
            return {"success": True, "output": result.stdout}
        else:
            return {"success": False, "error": result.stderr}
    except Exception as e:
        return {"success": False, "error": str(e)}
