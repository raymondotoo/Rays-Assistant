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
- **Default Model Sizes:**
  - `mistral`: ~4.1 GB
  - `neural-chat`: ~4.1 GB
  - `openhermes`: ~4.1 GB
  - **Total Required:** ~12.3 GB


## Download and Install

- Upload the .dmg to GitHub Releases for users to download.
- Users can install and run the app, then select models to download.

### macOS Gatekeeper & Notarization

If users see "App is damaged and can’t be opened" or "Apple cannot verify the developer" errors:

1. Ensure the app is properly signed and notarized (see build config and notarize.js).
2. If you are the user, you can override Gatekeeper for testing:
    - Right-click the app and choose **Open** (the warning will allow you to open it anyway).
    - Or, run in Terminal:
       ```bash
       sudo xattr -rd com.apple.quarantine /Applications/rays-llm-electron.app
       ```
3. For production, always notarize and staple the app:
    - Ensure you have valid Apple Developer credentials and environment variables set:
       - `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, `APPLE_TEAM_ID`
    - The build process will automatically notarize if these are set.

### Troubleshooting Java Errors

This app does **not** require Java. If you see Java-related errors, they may be from a misconfigured backend or system. Ensure your backend is built as a standalone binary (see backend/README.md).

---

**Note:** You may need to adjust paths and add UI for model selection in Electron. This template provides a starting point for packaging your app.
