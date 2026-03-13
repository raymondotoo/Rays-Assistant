import aiohttp
import asyncio
import time
from typing import List, Dict, Optional
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

class OllamaService:
    def __init__(self):
        self.base_url = settings.OLLAMA_BASE_URL
        self.session = None
    
    async def get_session(self):
        if self.session is None or self.session.closed:
            self.session = aiohttp.ClientSession()
        return self.session
    
    async def close_session(self):
        if self.session and not self.session.closed:
            await self.session.close()
    
    async def list_models(self) -> List[Dict]:
        """Get list of available models from Ollama"""
        try:
            session = await self.get_session()
            async with session.get(f"{self.base_url}/api/tags") as resp:
                if resp.status == 200:
                    data = await resp.json()
                    return data.get("models", [])
                return []
        except Exception as e:
            logger.error(f"Error listing models: {e}")
            return []
    
    async def generate_response(self, model: str, prompt: str, stream: bool = False) -> Dict:
        """Generate response from Ollama model"""
        try:
            session = await self.get_session()
            payload = {
                "model": model,
                "prompt": prompt,
                "stream": stream
            }
            
            start_time = time.time()
            
            async with session.post(
                f"{self.base_url}/api/generate",
                json=payload,
                timeout=aiohttp.ClientTimeout(total=300)
            ) as resp:
                if resp.status == 200:
                    if stream:
                        response_text = ""
                        async for line in resp.content:
                            import json
                            if line:
                                data = json.loads(line.decode())
                                response_text += data.get("response", "")
                    else:
                        data = await resp.json()
                        response_text = data.get("response", "")
                    
                    response_time = time.time() - start_time
                    
                    return {
                        "success": True,
                        "response": response_text,
                        "response_time": response_time,
                        "model": model
                    }
                else:
                    return {"success": False, "error": f"Ollama returned status {resp.status}"}
        except asyncio.TimeoutError:
            return {"success": False, "error": "Request timeout"}
        except Exception as e:
            logger.error(f"Error generating response: {e}")
            return {"success": False, "error": str(e)}
    
    async def get_model_info(self, model: str) -> Dict:
        """Get detailed info about a model"""
        try:
            session = await self.get_session()
            async with session.post(
                f"{self.base_url}/api/show",
                json={"name": model}
            ) as resp:
                if resp.status == 200:
                    return await resp.json()
                return {}
        except Exception as e:
            logger.error(f"Error getting model info: {e}")
            return {}

# Create global instance
ollama_service = OllamaService()
