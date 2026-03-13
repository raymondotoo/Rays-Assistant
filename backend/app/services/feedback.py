from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.schema import Feedback, ModelMetric, Message
from typing import Optional
import logging

logger = logging.getLogger(__name__)

class FeedbackService:
    """Service to handle feedback and learning mechanisms"""
    
    @staticmethod
    async def submit_feedback(
        db: AsyncSession,
        conversation_id: str,
        message_id: str,
        model_name: str,
        rating: int,
        comment: Optional[str] = None
    ) -> Feedback:
        """Store user feedback for a model response"""
        feedback = Feedback(
            conversation_id=conversation_id,
            message_id=message_id,
            model_name=model_name,
            rating=rating,
            comment=comment
        )
        db.add(feedback)
        await db.commit()
        await db.refresh(feedback)
        
        # Update model metrics with new feedback
        await ModelMetricsService.update_feedback_metrics(db, model_name, rating)
        
        return feedback
    
    @staticmethod
    async def get_model_rating(db: AsyncSession, model_name: str) -> float:
        """Calculate average rating for a model"""
        result = await db.execute(
            select(func.avg(Feedback.rating)).where(Feedback.model_name == model_name)
        )
        avg_rating = result.scalar()
        return float(avg_rating) if avg_rating else 0.0
    
    @staticmethod
    async def get_feedback_count(db: AsyncSession, model_name: str) -> int:
        """Get total feedback count for a model"""
        result = await db.execute(
            select(func.count(Feedback.id)).where(Feedback.model_name == model_name)
        )
        return result.scalar()
    
    @staticmethod
    async def get_model_weights(db: AsyncSession, models: list) -> dict:
        """
        Calculate model weights based on average ratings and feedback count.
        Better models get higher weights for ensemble voting.
        """
        weights = {}
        
        for model in models:
            avg_rating = await FeedbackService.get_model_rating(db, model)
            feedback_count = await FeedbackService.get_feedback_count(db, model)
            
            # Weight calculation: (average_rating / 5) * (1 + log(feedback_count))
            # This considers both quality and amount of feedback
            if feedback_count > 0:
                import math
                weight = (avg_rating / 5.0) * (1 + math.log(feedback_count + 1))
            else:
                # Equal weight for new models with no feedback
                weight = 1.0
            
            weights[model] = max(weight, 0.1)  # Minimum weight of 0.1
        
        # Normalize weights to sum to 1
        total_weight = sum(weights.values())
        weights = {model: w / total_weight for model, w in weights.items()}
        
        return weights

class ModelMetricsService:
    """Service to track and update model metrics"""
    
    @staticmethod
    async def update_metrics(
        db: AsyncSession,
        model_name: str,
        response_time: float,
        model_size_mb: Optional[float] = None
    ):
        """Update model metrics after a generation"""
        # Get or create metric record
        result = await db.execute(
            select(ModelMetric).where(ModelMetric.model_name == model_name)
        )
        metric = result.scalar_one_or_none()
        
        if not metric:
            metric = ModelMetric(
                model_name=model_name,
                model_size_mb=model_size_mb or 0.0,
                avg_response_time=response_time,
                total_requests=1
            )
            db.add(metric)
        else:
            # Update moving average of response time
            new_avg = (metric.avg_response_time * metric.total_requests + response_time) / (metric.total_requests + 1)
            metric.avg_response_time = new_avg
            metric.total_requests += 1
            if model_size_mb:
                metric.model_size_mb = model_size_mb
        
        await db.commit()
        await db.refresh(metric)
        return metric
    
    @staticmethod
    async def update_feedback_metrics(db: AsyncSession, model_name: str, new_rating: int):
        """Update model metrics with new feedback rating"""
        result = await db.execute(
            select(ModelMetric).where(ModelMetric.model_name == model_name)
        )
        metric = result.scalar_one_or_none()
        
        if not metric:
            # Create new metric if doesn't exist
            metric = ModelMetric(
                model_name=model_name,
                model_size_mb=0.0,
                avg_response_time=0.0,
                total_requests=0,
                avg_rating=float(new_rating),
                total_feedback_count=1
            )
            db.add(metric)
        else:
            # Update average rating
            new_avg_rating = (metric.avg_rating * metric.total_feedback_count + new_rating) / (metric.total_feedback_count + 1)
            metric.avg_rating = new_avg_rating
            metric.total_feedback_count += 1
        
        await db.commit()
        await db.refresh(metric)
        return metric
    
    @staticmethod
    async def get_all_metrics(db: AsyncSession) -> list:
        """Get metrics for all models"""
        result = await db.execute(select(ModelMetric))
        return result.scalars().all()
    
    @staticmethod
    async def get_metric(db: AsyncSession, model_name: str) -> Optional[ModelMetric]:
        """Get metrics for a specific model"""
        result = await db.execute(
            select(ModelMetric).where(ModelMetric.model_name == model_name)
        )
        return result.scalar_one_or_none()
