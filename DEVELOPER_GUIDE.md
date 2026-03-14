# Rays-Assistant: Developer Guide

This guide is for developers who want to build, customize, or contribute to the Rays-Assistant project. For user installation instructions, please see the main [README.md](README.md).

## Quick Start (Development Environment)

To run the application in a development environment with hot-reloading, you will need three separate terminal sessions.

**Prerequisites:**
-   Python 3.8+ & `pip`
-   Node.js 16+ & `npm`
-   Ollama installed and running.

---

**Terminal 1: Start Ollama**
Ensure the Ollama service is running. This makes the local models available via an API.
```bash
ollama serve
```
In another terminal, you can pull the required models:
```bash
# Total ~12.3 GB
ollama pull mistral
ollama pull neural-chat
ollama pull openhermes
```

---

**Terminal 2: Start Backend (FastAPI)**
This runs the Python backend server on `http://localhost:8000`.
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
API documentation will be available at `http://localhost:8000/docs`.

---

**Terminal 3: Start Frontend (React)**
This runs the React development server on `http://localhost:3000`.
```bash
cd frontend
npm install
npm run dev
```
You can now access the dashboard by opening **http://localhost:3000** in your browser.

---

## How It Works

The application is composed of three main parts that work together:

```
React Frontend (Port 3000) ←→ FastAPI Backend (Port 8000) ←→ Ollama API + SQLite DB
```

1.  **Multi-Model Chat**: The frontend sends user messages to the FastAPI backend.
2.  **Parallel Processing**: The backend queries multiple LLMs simultaneously via the Ollama API.
3.  **Rate & Learn**: The user rates responses. This feedback is stored in the SQLite database.
4.  **Weighted Ensemble**: The backend calculates model weights based on historical ratings. Future queries use these weights to prioritize better-performing models.
5.  **View Metrics**: The frontend displays real-time performance data fetched from the backend.

For a deep dive into the learning algorithm, see LEARNING_MECHANISM.md.

---

## Step-by-Step Creation & Packaging Guide (for macOS)

This section explains how to build the application from source and package it into a distributable `.dmg` installer.

### 1. Build the Frontend (React)
This compiles the React app into static HTML, CSS, and JS files.
```bash
cd frontend
npm install
npm run build
```
The output will be in the `frontend/dist/` folder.

### 2. Package the Backend (FastAPI)
This uses PyInstaller to create a single, standalone executable from the Python backend.
```bash
cd backend
pip install -r requirements.txt
pip install pyinstaller aiosqlite
pyinstaller --onefile main.py --hidden-import=aiosqlite
```
The executable will be created at `backend/dist/main`.

### 3. Set Up and Package the Electron App
This step bundles the static frontend, the backend executable, and the Electron wrapper into a final `.app` and `.dmg`.
```bash
cd electron-app
npm install

# Build the .dmg installer
npm run build
```
The final installer will be located in `electron-app/dist/`.

---

## Customization

-   **Change Default Models:** Edit `DEFAULT_MODELS` in `backend/app/core/config.py`.
-   **Adjust Learning Algorithm:** Modify the `get_model_weights()` function in `backend/app/services/feedback.py`.
-   **Modify Frontend UI:** Edit the React components in `frontend/src/components/`.
-   **Update Electron Settings:** Edit `electron-app/main.js` to change window size, paths, etc.
-   **Change Installer Name/Icons:** Update the `build` configuration in `electron-app/package.json`.

---

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

---

## API Endpoints

The backend exposes the following RESTful API endpoints. See `http://localhost:8000/docs` for a full Swagger UI.

-   `POST /api/chat/send`: Send a message to the models.
-   `POST /api/chat/feedback`: Submit a rating for a response.
-   `GET /api/models/metrics`: Get performance statistics for all models.
-   `GET /api/models/available`: List the models currently available via Ollama.