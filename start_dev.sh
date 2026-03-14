#!/bin/bash

# Exit script and kill child processes on Ctrl+C or exit
cleanup() {
    echo ""
    echo "🛑 Shutting down Rays Assistant environment..."
    kill $(jobs -p) 2>/dev/null
    exit
}
trap cleanup SIGINT SIGTERM EXIT

echo "🚀 Starting Rays Assistant Development Environment..."

# 1. Start Ollama (if not already running)
if ! pgrep -x "ollama" > /dev/null; then
    echo "🦙 Starting Ollama..."
    ollama serve &
    sleep 2
else
    echo "🦙 Ollama is already running."
fi

# 2. Start Backend (FastAPI with Hot Reload)
echo "🐍 Starting Backend (Port 8000)..."
cd backend
if [ ! -d "venv" ]; then
    echo "   Creating Python virtual environment..."
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
else
    source venv/bin/activate
fi
# Run uvicorn in background
uvicorn main:app --reload --port 8000 > /dev/null 2>&1 &
BACKEND_PID=$!
cd ..

# 3. Start Frontend (Vite)
echo "⚛️  Starting Frontend (Port 3000)..."
cd frontend
npm run dev -- --host > /dev/null 2>&1 &
cd ..

# Wait for services to initialize
echo "⏳ Waiting for services to respond..."
sleep 5

# 4. Start Electron
echo "⚡ Launching Electron..."
cd electron-app
npm start