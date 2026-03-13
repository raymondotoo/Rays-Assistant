#!/bin/bash

# Rays LLM Dashboard - Complete Setup Script
# This script sets up the entire project from scratch

set -e  # Exit on error

echo "🚀 Rays LLM Dashboard - Setup Script"
echo "======================================"
echo ""

# Check prerequisites
echo "📋 Checking prerequisites..."
command -v python3 >/dev/null 2>&1 || { echo "❌ Python 3 is required. Please install it."; exit 1; }
command -v node >/dev/null 2>&1 || { echo "❌ Node.js is required. Please install it."; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "❌ npm is required. Please install it."; exit 1; }

echo "✅ Python $(python3 --version)"
echo "✅ Node $(node --version)"
echo "✅ npm $(npm --version)"
echo ""

# Backend Setup
echo "🔧 Setting up Backend..."
cd backend

if [ ! -d "venv" ]; then
    echo "  Creating virtual environment..."
    python3 -m venv venv
fi

echo "  Activating virtual environment..."
source venv/bin/activate

echo "  Installing dependencies..."
pip install -r requirements.txt

echo "✅ Backend setup complete"
cd ..
echo ""

# Frontend Setup
echo "🎨 Setting up Frontend..."
cd frontend

if [ ! -d "node_modules" ]; then
    echo "  Installing dependencies..."
    npm install
else
    echo "  Dependencies already installed"
fi

echo "✅ Frontend setup complete"
cd ..
echo ""

# Create .env file if it doesn't exist
if [ ! -f "backend/.env" ]; then
    echo "📝 Creating backend/.env from example..."
    cp backend/.env.example backend/.env
    echo "✅ Created backend/.env - customize if needed"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "==========="
echo "1. Start Ollama: ollama serve"
echo "2. Pull models: ollama pull mistral && ollama pull neural-chat && ollama pull openhermes"
echo "3. Start backend: cd backend && source venv/bin/activate && uvicorn main:app --reload"
echo "4. Start frontend: cd frontend && npm run dev"
echo ""
echo "Dashboard: http://localhost:3000"
echo "API Docs: http://localhost:8000/docs"
echo ""
