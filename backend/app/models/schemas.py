from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

# Message schemas
class MessageCreate(BaseModel):
    content: str
    role: str = "user"

class MessageResponse(BaseModel):
    id: str
    conversation_id: str
    role: str
    content: str
    models_used: Optional[List[str]]
    created_at: datetime

    class Config:
        from_attributes = True

# Conversation schemas
class ConversationCreate(BaseModel):
    title: str

class ConversationResponse(BaseModel):
    id: str
    title: str
    created_at: datetime
    updated_at: datetime
    messages: List[MessageResponse]

    class Config:
        from_attributes = True

# Feedback schemas
class FeedbackCreate(BaseModel):
    message_id: str
    model_name: str
    rating: int  # 1-5
    comment: Optional[str] = None

class FeedbackResponse(BaseModel):
    id: str
    conversation_id: str
    message_id: str
    model_name: str
    rating: int
    comment: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

# Model metrics schema
class ModelMetricResponse(BaseModel):
    model_name: str
    model_size_mb: float
    avg_response_time: float
    total_requests: int
    avg_rating: float
    total_feedback_count: int
    last_updated: datetime

    class Config:
        from_attributes = True

# Chat request/response
class ChatRequest(BaseModel):
    conversation_id: Optional[str] = None
    message: str
    models: Optional[List[str]] = None  # Which models to use
    use_ensemble: bool = True  # Whether to query all models

class ChatResponse(BaseModel):
    conversation_id: str
    user_message_id: str
    responses: dict  # {model_name: response_text}
    ensemble_response: Optional[str] = None  # Aggregated response
    models_used: List[str]
    message_ids: Optional[dict] = None  # {model_name: message_id}
    timestamp: datetime

# Code Review schemas
class CodeReviewRequest(BaseModel):
    original_code: str
    issue_description: str

class CodeReviewResponse(BaseModel):
    suggested_code: str
    explanation: str
    improvements: Optional[List[str]] = None
    timestamp: datetime

# User Profile schema
class UserProfileResponse(BaseModel):
    id: str
    name: Optional[str]
    bio: Optional[str]
    interests: Optional[List[str]]
    expertise_areas: Optional[List[str]]
    learning_topics: Optional[List[str]]
    total_conversations: int
    total_messages: int
    last_updated: datetime
    profile_data: Optional[dict]

    class Config:
        from_attributes = True
