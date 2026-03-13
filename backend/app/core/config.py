import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    PROJECT_NAME: str = "Rays LLM Dashboard"
    PROJECT_VERSION: str = "1.0.0"
    
    # Ollama Configuration
    OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./llm_dashboard.db")
    
    # Default models to use
    DEFAULT_MODELS: list = [
        "mistral:latest",
        "neural-chat:latest",
        "openhermes:latest",
        "gpt-neo:latest",
        "gpt-oss:20b"
    ]
    
    # API Configuration
    CORS_ORIGINS: list = [
        "http://localhost",
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173"
    ]

settings = Settings()
