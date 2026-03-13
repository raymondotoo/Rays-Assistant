from sqlalchemy import Column, Integer, String, Text, Float, DateTime, JSON, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.database import Base
import uuid

class Conversation(Base):
    __tablename__ = "conversations"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationship
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan")
    feedback = relationship("Feedback", back_populates="conversation", cascade="all, delete-orphan")

class Message(Base):
    __tablename__ = "messages"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    conversation_id = Column(String, ForeignKey("conversations.id"), nullable=False)
    role = Column(String, nullable=False)  # "user" or "assistant"
    content = Column(Text, nullable=False)
    models_used = Column(JSON, nullable=True)  # List of models that generated response
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationship
    conversation = relationship("Conversation", back_populates="messages")
    feedback = relationship("Feedback", back_populates="message", cascade="all, delete-orphan")

class Feedback(Base):
    __tablename__ = "feedback"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    conversation_id = Column(String, ForeignKey("conversations.id"), nullable=False)
    message_id = Column(String, ForeignKey("messages.id"), nullable=False)
    model_name = Column(String, nullable=False)
    rating = Column(Integer, nullable=False)  # 1-5 stars
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    conversation = relationship("Conversation", back_populates="feedback")
    message = relationship("Message", back_populates="feedback")

class ModelMetric(Base):
    __tablename__ = "model_metrics"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    model_name = Column(String, unique=True, nullable=False)
    model_size_mb = Column(Float, nullable=False)
    avg_response_time = Column(Float, nullable=False, default=0.0)
    total_requests = Column(Integer, nullable=False, default=0)
    avg_rating = Column(Float, nullable=False, default=0.0)
    total_feedback_count = Column(Integer, nullable=False, default=0)
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    model_info = Column(JSON, nullable=True)  # Additional model info

class UserProfile(Base):
    __tablename__ = "user_profile"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    # User information learned from conversations
    name = Column(String, nullable=True)
    bio = Column(Text, nullable=True)  # Short bio/description
    interests = Column(JSON, nullable=True)  # List of interests (coding, bioinformatics, writing, etc)
    expertise_areas = Column(JSON, nullable=True)  # Areas they're expert in
    learning_topics = Column(JSON, nullable=True)  # Topics they want to learn
    
    # Learning stats
    total_conversations = Column(Integer, default=0)
    total_messages = Column(Integer, default=0)
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Profile metadata
    profile_data = Column(JSON, nullable=True)  # Flexible storage for other learned facts
