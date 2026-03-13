# Rays LLM Electron App

This Electron wrapper lets you package your FastAPI backend and React frontend as a downloadable macOS .dmg.

## Setup

1. Build your React frontend:
   ```bash
   cd ../frontend
   npm run build
   ```
   (You can use `npx serve -s dist` to serve the build for testing.)

2. Package your FastAPI backend:
   ```bash
   cd ../backend
   pip install pyinstaller
   pyinstaller --onefile main.py
   ```
   This creates `dist/main`.

3. Install Electron dependencies:
   ```bash
   cd ../electron-app
   npm install
   ```

4. Start the Electron app:
   ```bash
   npm start
   ```

5. Build the .dmg installer:
   ```bash
   npm run build
   ```
   The .dmg will be in the `dist/` folder.

## Model Management

- Ollama must be installed separately.
- After installing the app, use the UI to select and download models (e.g., `mistral`, `gpt-oss:20b`).

## Download and Install

- Upload the .dmg to GitHub Releases for users to download.
- Users can install and run the app, then select models to download.

---

**Note:** You may need to adjust paths and add UI for model selection in Electron. This template provides a starting point for packaging your app.
