<!-- Badges -->
[![Build Status](https://github.com/raymondotoo/Rays-Assistant/actions/workflows/main.yml/badge.svg)](https://github.com/raymondotoo/Rays-Assistant/actions)
[![License](https://img.shields.io/github/license/raymondotoo/Rays-Assistant?style=for-the-badge)](https://github.com/raymondotoo/Rays-Assistant/blob/main/LICENSE)
[![Latest Release](https://img.shields.io/github/v/release/raymondotoo/Rays-Assistant?style=for-the-badge)](https://github.com/raymondotoo/Rays-Assistant/releases)
[![Downloads](https://img.shields.io/github/downloads/raymondotoo/Rays-Assistant/total?style=for-the-badge)](https://github.com/raymondotoo/Rays-Assistant/releases)
[![Issues](https://img.shields.io/github/issues/raymondotoo/Rays-Assistant?style=for-the-badge)](https://github.com/raymondotoo/Rays-Assistant/issues)
[![Pull Requests](https://img.shields.io/github/issues-pr/raymondotoo/Rays-Assistant?style=for-the-badge)](https://github.com/raymondotoo/Rays-Assistant/pulls)
[![Code Style: Black](https://img.shields.io/badge/code%20style-black-000000.svg?style=for-the-badge)](https://github.com/psf/black)
[![Code Style: Prettier](https://img.shields.io/badge/code%20style-prettier-ff69b4.svg?style=for-the-badge)](https://prettier.io)

## Rays-Assistant

Rays-Assistant is a privacy-focused desktop app for interacting with multiple local LLMs (Ollama, GPT-Neo, Mistral, etc.) via a modern dashboard. All models run entirely on your device—no cloud, no data sharing. Enjoy persistent learning, conversation history, and easy model switching with full control over your data.

## Dashboard Preview
![Rays-Assistant Dashboard](Rays%20LLM%20Dashboard.png)

## Download & Install

[![Download for macOS](https://img.shields.io/badge/Download-macOS%20.dmg-blue?style=for-the-badge)](https://github.com/raymondotoo/Rays-Assistant/releases/download/v1.0.0/rays-llm-electron-1.0.0-arm64.dmg)

1. Download the .dmg file above.
2. Open and drag the app to Applications.
3. Launch Rays-Assistant.

For more details, see INSTALL.md.
	- macOS 11+ (Apple Silicon or Intel)
	- Python 3.8+ (for backend)
	- Node.js 16+ (for frontend/Electron)
	- Ollama installed (for LLM models)
	- ~15 GB free disk space (for AI models)
	- 8 GB RAM minimum recommended

---
# Step-by-Step Creation & Packaging Guide

## 1. Project Setup

### Clone the Repo

```bash
git clone https://github.com/raymondotoo/Rays-Assistant.git
cd Rays-Assistant
```

### Prerequisites

- Python 3.8+
- Node.js 16+ and npm
- Ollama (https://ollama.ai) installed on your machine
- **Disk Space**: Approximately 12.3 GB for the default model set.

---

## 2. Build the Frontend (React)

```bash
cd frontend
npm install
npm run build
```
This creates a `dist` folder with static files.

---

## 3. Package the Backend (FastAPI)

```bash
cd ../backend
pip install -r requirements.txt
pip install pyinstaller aiosqlite
pyinstaller --onefile main.py --hidden-import=aiosqlite
```
This creates a standalone backend executable in `backend/dist/main`.

---

## 4. Set Up Electron App

```bash
cd ../electron-app
npm install
```

### Serve the React Build

```bash
cd ../frontend
npx serve -s dist -l 5000
```
(Leave this running.)

### Update Electron main.js

- Change the URL to `http://localhost:5000` in `electron-app/main.js`.

---

## 5. Start Electron App

```bash
cd ../electron-app
npm start
```
Electron will launch your dashboard and backend.

---

## 6. Package as macOS Installer (.dmg)

```bash
npm run build
```
The .dmg installer will be in `electron-app/dist/`.

---

## 7. Add Models After Install

After installing the app, open a terminal and run:

```bash
ollama pull mistral
ollama pull gpt-oss:20b
```
You can add more models by running `ollama pull <model-name>`.

---

## 8. Customizing the App

- **Change Default Models:** Edit `backend/app/core/config.py` and update the `DEFAULT_MODELS` list.
- **Modify Frontend UI:** Edit React components in `frontend/src/components/`.
- **Update Electron Settings:** Edit `electron-app/main.js` for window size, backend path, or frontend URL.
- **Change Installer Name/Icons:** Update `electron-app/package.json` build config and add icon files.

---

## 9. Upload Installer to GitHub

- Go to your repo’s Releases page.
- Upload the .dmg file.
- Add a download link in your README:

```markdown
[Download the macOS installer (.dmg)](https://github.com/raymondotoo/Rays-Assistant/releases/latest)
```

---

## 10. Troubleshooting

- If Electron shows a blank screen, check the frontend server and backend executable.
- If backend fails, ensure all Python dependencies are installed and included in PyInstaller.
- For model issues, make sure Ollama is running and models are pulled.

---

## 11. Updating the App

- Make changes to backend, frontend, or Electron code.
- Rebuild frontend and backend.
- Repackage Electron app and .dmg.

---

This guide lets anyone replicate, customize, and package the Rays-Assistant app for macOS. For advanced changes, refer to Electron, FastAPI, and React documentation.
# Rays LLM Dashboard 🚀

A sophisticated multi-model LLM dashboard that runs multiple excellent-performing language models locally and uses real-time feedback to continuously improve performance.

## Features ✨

- **Multi-Model Ensemble**: Query multiple LLMs simultaneously and compare responses
- **Feedback-Driven Learning**: Rate responses to update model weights over time
- **Real-Time Metrics**: Track model performance, response times, and model sizes
- **Beautiful Dashboard**: Modern React interface with model selection and metrics visualization
- **Local LLM Support**: Runs on your machine using Ollama with models like Mistral, Neural Chat, and OpenHermes
- **Persistent Storage**: SQLite database for conversations, feedback, and metrics

## Prerequisites 📋

1. **Python 3.8+**
2. **Node.js 16+** and npm
3. **Ollama**: Download from https://ollama.ai
4. **LLM Models**: Pull models via Ollama
5. **Storage**: ~15 GB free space recommended

## Quick Start 🚀

### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### Ollama Setup
```bash
# Start Ollama
ollama serve

# Pull models (in another terminal) - Total ~12.3 GB
ollama pull mistral
ollama pull neural-chat
ollama pull openhermes
```

### Frontend Setup
```bash
cd frontend
npm install
```

## Running 🏃

**Terminal 1:** `ollama serve`

**Terminal 2:** 
```bash
cd backend && source venv/bin/activate
uvicorn main:app --reload --port 8000
```

**Terminal 3:**
```bash
cd frontend && npm run dev
```

Dashboard: http://localhost:3000 | API Docs: http://localhost:8000/docs

## How It Works 🧠

1. **Multi-Model Chat**: Send messages to multiple LLMs simultaneously
2. **Compare Responses**: View model-specific responses side-by-side
3. **Rate & Learn**: Give feedback to improve model weights
4. **View Metrics**: Track performance, speed, and model sizes
5. **Smart Ensemble**: Future queries prioritize higher-rated models

## Key Features 🌟

- Real-time performance metrics
- Model size tracking (MB)
- Response time analysis
- User feedback collection
- Weighted ensemble voting
- Persistent conversation history
- SQLite database integration

## Architecture

```
React Frontend (3000) ←→ FastAPI Backend (8000) ←→ Ollama API + SQLite DB
```

## API Endpoints

- `POST /api/chat/send` - Send message to models
- `POST /api/chat/feedback` - Submit rating
- `GET /api/models/metrics` - Get model stats
- `GET /api/models/available` - List available models

## Troubleshooting

**Ollama not connecting:** Ensure `ollama serve` is running
**Frontend blank:** Check backend running on 8000 with `uvicorn`
**Models not available:** Run `ollama list` and pull missing models

## Project Structure

```
Rays-Assistant/
├── backend/              # FastAPI application
│   ├── app/
│   │   ├── core/        # Config & settings
│   │   ├── db/          # Database setup
│   │   ├── models/      # SQLAlchemy & Pydantic schemas
│   │   ├── routes/      # API endpoints
│   │   └── services/    # Business logic & Ollama integration
│   ├── main.py          # FastAPI entry point
│   └── requirements.txt
├── frontend/             # React dashboard
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── App.jsx
│   │   ├── store.js     # Zustand store
│   │   └── api.js       # API client
│   ├── vite.config.js
│   └── package.json
└── README.md
```

## Customization 🎨

- **Change Models:** Edit `DEFAULT_MODELS` in `backend/app/core/config.py`
- **Adjust Learning:** Modify `get_model_weights()` in `backend/app/services/feedback.py`
- **Dashboard Theme:** Customize `frontend/tailwind.config.js`

---

Built with ❤️ using FastAPI + React + Ollama + Tailwind CSS
