"""
Learning service for extracting user profile and building personalized prompts
"""
import json
import logging
from typing import Optional, Dict, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime
from app.models.schema import UserProfile, Conversation, Message
from app.services.ollama import ollama_service

logger = logging.getLogger(__name__)

class LearningService:
    """Service for extracting user information and managing learning"""
    
    @staticmethod
    async def get_or_create_user_profile(db: AsyncSession) -> UserProfile:
        """Get existing user profile or create new one"""
        result = await db.execute(select(UserProfile))
        profile = result.scalar_one_or_none()
        
        if not profile:
            profile = UserProfile(
                name=None,
                bio=None,
                interests=[],
                expertise_areas=[],
                learning_topics=[],
                total_conversations=0,
                total_messages=0,
                profile_data={}
            )
            db.add(profile)
            await db.commit()
            await db.refresh(profile)
        
        return profile
    
    @staticmethod
    async def extract_user_info_from_messages(
        messages: List[Message],
        current_profile: Dict
    ) -> Dict:
        """
        Use LLM to extract user information from conversation messages
        Returns updated profile data
        """
        if not messages:
            return current_profile
        
        # Build conversation text for analysis
        conversation_text = "\n".join([
            f"{'User' if m.role == 'user' else 'Assistant'}: {m.content}"
            for m in messages[-20:]  # Last 20 messages for efficiency
        ])
        
        prompt = f"""Analyze this conversation and extract user profile information.

CONVERSATION HISTORY:
{conversation_text}

CURRENT PROFILE:
{json.dumps(current_profile, indent=2)}

Extract and update the following (be precise and concise):
1. User's name (if mentioned)
2. Key interests (list top 3-5)
3. Areas of expertise
4. What they want to learn
5. Work/profession
6. Any other important facts

Format as JSON with these fields:
{{
  "name": "string or null",
  "profession": "bioinformatician/researcher/etc or null",
  "interests": ["list", "of", "interests"],
  "expertise_areas": ["area1", "area2"],
  "learning_goals": ["goal1", "goal2"],
  "facts": {{"key": "value"}}
}}

IMPORTANT: Only include information explicitly mentioned in conversation. Don't assume.
Merge with existing profile data, don't replace it.
"""
        
        try:
            response = await ollama_service.generate_response(
                model="mistral",
                prompt=prompt
            )
            
            if response.get("success"):
                response_text = response.get("response", "")
                # Extract JSON from response
                json_start = response_text.find('{')
                json_end = response_text.rfind('}') + 1
                
                if json_start >= 0 and json_end > json_start:
                    json_str = response_text[json_start:json_end]
                    extracted = json.loads(json_str)
                    
                    # Merge with existing profile
                    return LearningService._merge_profile(current_profile, extracted)
        except Exception as e:
            logger.error(f"Error extracting user info: {e}")
        
        return current_profile
    
    @staticmethod
    def _merge_profile(existing: Dict, new: Dict) -> Dict:
        """Merge new profile data with existing, keeping all information"""
        merged = existing.copy()
        
        # Update name if provided
        if new.get("name"):
            merged["name"] = new["name"]
        
        # Update profession
        if new.get("profession"):
            merged["profession"] = new["profession"]
        
        # Merge interests (unique)
        if new.get("interests"):
            existing_interests = set(merged.get("interests", []))
            new_interests = set(new.get("interests", []))
            merged["interests"] = list(existing_interests.union(new_interests))
        
        # Merge expertise
        if new.get("expertise_areas"):
            existing_expertise = set(merged.get("expertise_areas", []))
            new_expertise = set(new.get("expertise_areas", []))
            merged["expertise_areas"] = list(existing_expertise.union(new_expertise))
        
        # Merge learning goals
        if new.get("learning_goals"):
            existing_goals = set(merged.get("learning_goals", []))
            new_goals = set(new.get("learning_goals", []))
            merged["learning_goals"] = list(existing_goals.union(new_goals))
        
        # Merge facts
        if new.get("facts"):
            merged.setdefault("facts", {}).update(new["facts"])
        
        return merged
    
    @staticmethod
    async def update_user_profile(
        db: AsyncSession,
        conversation_id: str
    ) -> Optional[UserProfile]:
        """
        Update user profile based on a conversation
        Should be called after each conversation
        """
        try:
            # Get user profile
            profile = await LearningService.get_or_create_user_profile(db)
            
            # Get conversation messages
            result = await db.execute(
                select(Message).where(Message.conversation_id == conversation_id)
            )
            messages = result.scalars().all()
            
            if not messages:
                return profile
            
            # Extract user info from messages
            current_data = {
                "name": profile.name,
                "profession": None,
                "interests": profile.interests or [],
                "expertise_areas": profile.expertise_areas or [],
                "learning_goals": profile.learning_topics or [],
                "facts": profile.profile_data or {}
            }
            
            updated_data = await LearningService.extract_user_info_from_messages(
                messages,
                current_data
            )
            
            # Update profile
            profile.name = updated_data.get("name")
            profile.interests = updated_data.get("interests", [])
            profile.expertise_areas = updated_data.get("expertise_areas", [])
            profile.learning_topics = updated_data.get("learning_goals", [])
            profile.profile_data = updated_data.get("facts", {})
            profile.total_conversations = (profile.total_conversations or 0) + 1
            profile.total_messages = (profile.total_messages or 0) + len(messages)
            profile.last_updated = datetime.utcnow()
            
            await db.commit()
            await db.refresh(profile)
            
            logger.info(f"Updated user profile: {profile.name}")
            return profile
            
        except Exception as e:
            logger.error(f"Error updating user profile: {e}")
            return None
    
    @staticmethod
    def build_system_prompt(user_profile: Optional[UserProfile]) -> str:
        """
        Build a personalized system prompt based on user profile
        """
        base_prompt = """You are an intelligent assistant in a multi-model ensemble system.
You provide helpful, accurate, and insightful responses.
You adapt your communication style to the user's needs.
You remember context from previous conversations and reference it when relevant.
"""
        
        if not user_profile or not user_profile.name:
            return base_prompt
        
        # Build personalized prompt
        personalization = f"""
PERSONALIZATION - About the User:
"""
        
        if user_profile.name:
            personalization += f"- Name: {user_profile.name}\n"
        
        if user_profile.profile_data and user_profile.profile_data.get("profession"):
            personalization += f"- Profession: {user_profile.profile_data.get('profession')}\n"
        
        if user_profile.interests:
            personalization += f"- Interests: {', '.join(user_profile.interests[:5])}\n"
        
        if user_profile.expertise_areas:
            personalization += f"- Expertise: {', '.join(user_profile.expertise_areas[:3])}\n"
        
        if user_profile.learning_topics:
            personalization += f"- Learning Goals: {', '.join(user_profile.learning_topics[:3])}\n"
        
        personalization += """
GUIDANCE:
- When the user mentions their name, remember it for future conversations
- Tailor your explanations to their expertise level
- Reference their interests when relevant
- Provide resources for their learning goals
- Use examples from their domains when explaining concepts
"""
        
        return base_prompt + personalization
