from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.database import get_db
from app.models.schema import Conversation, Message, Feedback
from app.models.schemas import (
    ConversationCreate, ConversationResponse, MessageResponse,
    FeedbackCreate, FeedbackResponse, ChatRequest, ChatResponse,
    CodeReviewRequest, CodeReviewResponse
)
from app.services.ollama import ollama_service
from app.services.feedback import FeedbackService, ModelMetricsService
from app.services.learning import LearningService
from typing import List
from datetime import datetime
import uuid

router = APIRouter(prefix="/api/chat", tags=["chat"])

@router.post("/conversations", response_model=ConversationResponse)
async def create_conversation(
    conv_data: ConversationCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create a new conversation"""
    conversation = Conversation(
        id=str(uuid.uuid4()),
        title=conv_data.title
    )
    db.add(conversation)
    await db.commit()
    await db.refresh(conversation)
    # Manually query messages (should be empty)
    messages = []
    return ConversationResponse(
        id=conversation.id,
        title=conversation.title,
        created_at=conversation.created_at,
        updated_at=conversation.updated_at,
        messages=messages
    )

@router.get("/conversations/{conv_id}", response_model=ConversationResponse)
async def get_conversation(
    conv_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Get a conversation with all messages"""
    result = await db.execute(
        select(Conversation).where(Conversation.id == conv_id)
    )
    conversation = result.scalar_one_or_none()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    # Manually query messages
    msg_result = await db.execute(
        select(Message).where(Message.conversation_id == conv_id).order_by(Message.created_at)
    )
    messages = msg_result.scalars().all()
    # Serialize messages
    serialized_messages = [
        MessageResponse(
            id=m.id,
            conversation_id=m.conversation_id,
            role=m.role,
            content=m.content,
            models_used=m.models_used,
            created_at=m.created_at
        ) for m in messages
    ]
    return ConversationResponse(
        id=conversation.id,
        title=conversation.title,
        created_at=conversation.created_at,
        updated_at=conversation.updated_at,
        messages=serialized_messages
    )

@router.post("/send", response_model=ChatResponse)
async def send_message(
    chat_request: ChatRequest,
    db: AsyncSession = Depends(get_db)
):
    """Send a message and get responses from selected models"""
    
    # Create or get conversation
    if not chat_request.conversation_id:
        conversation = Conversation(
            id=str(uuid.uuid4()),
            title="New Conversation"
        )
        db.add(conversation)
        await db.commit()
        await db.refresh(conversation)
        conv_id = conversation.id
    else:
        conv_id = chat_request.conversation_id
    
    # Store user message
    user_msg = Message(
        id=str(uuid.uuid4()),
        conversation_id=conv_id,
        role="user",
        content=chat_request.message
    )
    db.add(user_msg)
    await db.commit()

    # Get conversation history (last 20 messages)
    result = await db.execute(
        select(Message).where(Message.conversation_id == conv_id).order_by(Message.created_at)
    )
    history_msgs = result.scalars().all()
    history_text = "\n".join([
        f"{'User' if m.role == 'user' else 'Assistant'}: {m.content}" for m in history_msgs[-20:]])

    # Get user profile and build system prompt
    user_profile = await LearningService.get_or_create_user_profile(db)
    system_prompt = LearningService.build_system_prompt(user_profile)

    # Determine which models to use
    if chat_request.models:
        models_to_use = chat_request.models
    else:
        models_to_use = ["mistral", "neural-chat", "openhermes"]
    
    # Get model weights based on feedback
    weights = await FeedbackService.get_model_weights(db, models_to_use)
    
    # Generate responses from all models
    responses = {}
    models_used = []

    for model in models_to_use:
        # Pass system prompt and conversation context
        full_prompt = f"{system_prompt}\n\nCONVERSATION HISTORY:\n{history_text}\n\nUSER MESSAGE:\n{chat_request.message}"
        result = await ollama_service.generate_response(model, full_prompt)
        if result["success"]:
            responses[model] = result["response"]
            models_used.append(model)
            await ModelMetricsService.update_metrics(db, model, result["response_time"])

    # Create ensemble response (weighted summary)
    ensemble_response = None
    if chat_request.use_ensemble and responses:
        ensemble_response = f"[Ensemble Response based on {len(responses)} models]\n"
        for model, weight in sorted(weights.items(), key=lambda x: x[1], reverse=True):
            if model in responses:
                ensemble_response += f"\n[{model} (weight: {weight:.2%})]\n{responses[model][:200]}...\n"
    
    # Store assistant messages
    message_ids = {}  # Track message IDs for each model
    for model, response_text in responses.items():
        msg_id = str(uuid.uuid4())
        msg = Message(
            id=msg_id,
            conversation_id=conv_id,
            role="assistant",
            content=response_text,
            models_used=[model]
        )
        db.add(msg)
        message_ids[model] = msg_id
    
    await db.commit()
    
    return ChatResponse(
        conversation_id=conv_id,
        user_message_id=user_msg.id,
        responses=responses,
        ensemble_response=ensemble_response,
        models_used=models_used,
        timestamp=datetime.utcnow(),
        message_ids=message_ids  # Return the real message IDs
    )

@router.post("/feedback", response_model=FeedbackResponse)
async def submit_feedback(
    feedback: FeedbackCreate,
    db: AsyncSession = Depends(get_db)
):
    """Submit feedback for a model response"""
    
    # Get the message's conversation ID
    result = await db.execute(
        select(Message).where(Message.id == feedback.message_id)
    )
    message = result.scalar_one_or_none()
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    
    feedback_obj = await FeedbackService.submit_feedback(
        db,
        message.conversation_id,
        feedback.message_id,
        feedback.model_name,
        feedback.rating,
        feedback.comment
    )
    
    return feedback_obj

@router.post("/code-review", response_model=CodeReviewResponse)
async def review_code(code_request: CodeReviewRequest):
    """Review code and provide suggestions using LLM"""
    
    # Create a detailed prompt for code review
    prompt = f"""You are an expert code reviewer. A user has shared their code and described an issue with it.

CODE:
```
{code_request.original_code}
```

ISSUE/PROBLEM:
{code_request.issue_description}

Please provide:
1. A corrected/improved version of the code that fixes the issue
2. A clear explanation of what was wrong and how you fixed it

Format your response as follows:
CORRECTED_CODE:
[Insert the complete corrected code here]

EXPLANATION:
[Explain what was wrong and what you changed]"""

    try:
        # Use the best-performing model for code review
        # By default, use the first available model or a specified one
        response = await ollama_service.generate_response(model="mistral", prompt=prompt)
        
        if not response.get("success"):
            raise HTTPException(
                status_code=500,
                detail=f"Model error: {response.get('error', 'Unknown error')}"
            )
        
        # Parse the response to extract corrected code and explanation
        response_text = response.get("response", "").strip()
        
        # Try to extract code and explanation from the response
        if "CORRECTED_CODE:" in response_text and "EXPLANATION:" in response_text:
            parts = response_text.split("EXPLANATION:")
            code_part = parts[0].replace("CORRECTED_CODE:", "").strip()
            explanation_part = parts[1].strip()
        else:
            # Fallback: treat first half as code, second half as explanation
            mid = len(response_text) // 2
            code_part = response_text[:mid].strip()
            explanation_part = response_text[mid:].strip()
        
        return CodeReviewResponse(
            suggested_code=code_part,
            explanation=explanation_part,
            improvements=None,
            timestamp=datetime.now()
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error reviewing code: {str(e)}"
        )
