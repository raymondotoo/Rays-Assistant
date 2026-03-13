# Windows Setup Guide for Rays LLM Dashboard

## Prerequisites
1. Python 3.8+ (https://www.python.org/downloads/)
2. Node.js 16+ (https://nodejs.org/)
3. Ollama (https://ollama.ai/)

## Backend Setup

```cmd
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy example .env
copy .env.example .env
```

## Ollama Setup

```cmd
# Start Ollama server
ollama serve

# In another command prompt, pull models
ollama pull mistral
ollama pull neural-chat
ollama pull openhermes

# List available models
ollama list
```

## Frontend Setup

```cmd
cd frontend

# Install dependencies
npm install
```

## Running the Application

### Terminal 1: Ollama
```cmd
ollama serve
```

### Terminal 2: Backend
```cmd
cd backend
venv\Scripts\activate
uvicorn main:app --reload --port 8000
```

### Terminal 3: Frontend
```cmd
cd frontend
npm run dev
```

## Access Points

- Dashboard: http://localhost:3000
- API Docs: http://localhost:8000/docs
- API Health: http://localhost:8000/health

## Troubleshooting

**"Ollama connection refused"**
- Make sure Terminal 1 has Ollama running
- Check `curl http://localhost:11434/api/tags`

**"Port 3000/8000 already in use"**
- Change port in `frontend/vite.config.js` or `backend/main.py`
- Or kill the process: `netstat -ano | findstr :3000`

**"Module not found"**
- Backend: Make sure venv is activated
- Frontend: Run `npm install` again

**"Models not available"**
- Run `ollama list` to see what's installed
- Pull missing: `ollama pull mistral`
