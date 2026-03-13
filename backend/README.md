# Rays LLM Dashboard Backend

FastAPI backend for multi-model LLM system with feedback-driven learning.

## Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

## Prerequisites

1. **Ollama**: Download from https://ollama.ai
2. **Models**: Pull your desired models
   ```bash
   ollama pull mistral
   ollama pull neural-chat
   ollama pull openhermes
   ```

## Running

```bash
# Make sure Ollama is running (ollama serve)
uvicorn main:app --reload --port 8000
```

API will be available at http://localhost:8000
Docs at http://localhost:8000/docs
