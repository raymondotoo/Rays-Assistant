#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

echo "🚀 Starting Rays Assistant Build Process..."

# --- Step 1: Build Frontend (React) ---
echo "📦 Building Frontend..."
cd frontend
npm install
# Use relative base path so assets load correctly in Electron (file:// protocol)
npm run build -- --base=./
if [ ! -d "dist" ]; then
    echo "❌ Frontend build failed: 'dist' directory created."
    exit 1
fi
cd ..

# --- Step 2: Build Backend (FastAPI) ---
echo "🐍 Building Backend..."
cd backend
# Setup/Activate venv to ensure we have isolated dependencies
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi
source venv/bin/activate

# Use relaxed version constraints (>=) to support Python 3.14
sed 's/==/>=/g' requirements.txt > requirements.temp.txt
pip install -r requirements.temp.txt
rm requirements.temp.txt
pip install pyinstaller

# Build single-file executable (Attempt Universal2 for Intel/M1 support)
echo "🔨 Attempting to build Universal Binary..."
if ! pyinstaller --noconfirm --onefile --clean --target-arch universal2 --name main --hidden-import=aiosqlite main.py; then
    echo "⚠️ Universal build failed (your Python might not be universal). Falling back to host architecture..."
    pyinstaller --noconfirm --onefile --clean --name main --hidden-import=aiosqlite main.py
fi

deactivate
cd ..

# --- Step 3: Package Electron App ---
echo "⚡ Packaging Electron App..."
cd electron-app
npm install
npm run build

echo "✅ Build Complete! Your installer is located in: electron-app/dist/"