const { app, BrowserWindow, dialog } = require('electron');
const { spawn, execSync, exec } = require('child_process');
const path = require('path');
const http = require('http');
const fs = require('fs');

let backendProcess;
let mainWindow;
let splashWindow;

function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 400,
    height: 200,
    frame: false,
    resizable: false,
    center: true,
  });
  const splashHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #f0f0f0; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; color: #333; text-align: center; }
          .container { animation: fadeIn 1s; }
          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
          .spinner { border: 4px solid rgba(0, 0, 0, 0.1); width: 36px; height: 36px; border-radius: 50%; border-left-color: #09f; animation: spin 1s ease infinite; margin: 0 auto 20px; }
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        </style>
      </head>
      <body><div class="container"><div class="spinner"></div><p>Starting backend services...</p></div></body>
    </html>
  `;
  splashWindow.loadURL(`data:text/html;charset=UTF-8,${encodeURIComponent(splashHtml)}`);
  splashWindow.on('closed', () => (splashWindow = null));
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false, // Fix "Network Error" (CORS) when running from file://
    },
  });

  // Serve the React build
  if (app.isPackaged) {
    // In production, load the built frontend from the filesystem (Resources/dist/index.html)
    const indexPath = path.join(process.resourcesPath, 'dist', 'index.html');
    mainWindow.loadFile(indexPath);
  } else {
    // In development, load from Vite/React dev server
    mainWindow.loadURL('http://localhost:3000');
  }
}

async function ensureOllamaRunning() {
  // 1. Check if running (using 127.0.0.1 for reliability)
  const isRunning = await new Promise((resolve) => {
    const req = http.get('http://127.0.0.1:11434/api/tags', (res) => resolve(true));
    req.on('error', () => resolve(false));
    req.end();
  });
  if (isRunning) return true;

  // 2. Define robust PATH to find ollama binary
  const commonPaths = ['/usr/local/bin', '/opt/homebrew/bin', '/usr/bin', '/bin'];
  // Deduplicate and merge paths
  const currentPaths = (process.env.PATH || '').split(path.delimiter);
  const fixedPath = [...new Set([...currentPaths, ...commonPaths])].join(path.delimiter);
  const execEnv = { ...process.env, PATH: fixedPath };

  // 3. Check if installed
  let isInstalled = false;
  try {
    execSync('which ollama', { env: execEnv });
    isInstalled = true;
  } catch (e) { /* not found */ }

  if (isInstalled) {
    // Attempt to start it
    const child = spawn('ollama', ['serve'], { detached: true, stdio: 'ignore', env: execEnv });
    child.unref();
  } else {
    // 4. Not installed: Ask user to install
    const choice = dialog.showMessageBoxSync({
      type: 'question',
      buttons: ['Install Dependencies', 'Quit'],
      defaultId: 0,
      title: 'Missing Dependency',
      message: 'Rays Assistant requires "Ollama" to run local AI models.',
      detail: 'Click to open a Terminal and run the installation script (requires password).',
    });
    if (choice === 1) return false;

    // Open Terminal to run official install script
    const installCmd = 'curl -fsSL https://ollama.com/install.sh | sh';
    exec(`osascript -e 'tell application "Terminal" to do script "${installCmd}"'`);
  }

  // 5. Wait for it to start (poll for up to 5 minutes)
  for (let i = 0; i < 60; i++) { // 60 checks * 5000ms = 5 mins
    const up = await new Promise(r => {
      http.get('http://127.0.0.1:11434/api/tags', res => r(true)).on('error', () => r(false));
    });
    if (up) return true;
    await new Promise(r => setTimeout(r, 5000));
  }
  return false;
}

async function ensureModels() {
  return new Promise((resolve) => {
    const req = http.get('http://127.0.0.1:11434/api/tags', (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const installed = (json.models || []).map((m) => m.name.split(':')[0]);
          
          const required = ['mistral', 'neural-chat', 'openhermes'];
          const modelSizes = {
            'mistral': '4.1 GB',
            'neural-chat': '4.1 GB',
            'openhermes': '4.1 GB'
          };
          const missing = required.filter((r) => !installed.some((i) => i.includes(r)));

          if (missing.length > 0) {
            const missingList = missing.map(m => `• ${m} (~${modelSizes[m]})`).join('\n');
            const totalSize = missing.length * 4.1; // Approx total
            const choice = dialog.showMessageBoxSync({
              type: 'info',
              buttons: ['Download & Continue', 'Skip'],
              title: 'Install AI Models',
              message: `Rays Assistant needs the following AI models to function correctly:\n\n${missingList}\n\nTotal estimated download: ~${totalSize.toFixed(1)} GB\n\nWould you like to download them now? (This happens in the background)`,
            });

            if (choice === 0) {
              // Start background downloads
              downloadAndRefresh(missing);
            }
          }
          resolve();
        } catch (e) { resolve(); }
      });
    });
    req.on('error', () => resolve());
    req.end();
  });
}

async function downloadAndRefresh(models) {
  for (const model of models) {
    await new Promise((resolve) => {
      const req = http.request({
        hostname: '127.0.0.1', port: 11434, path: '/api/pull', method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, res => { res.resume(); res.on('end', resolve); });
      req.on('error', () => resolve()); // Continue even on error
      req.write(JSON.stringify({ name: model }));
      req.end();
    });
  }
  // Ask to refresh
  const choice = dialog.showMessageBoxSync({
    type: 'info',
    buttons: ['Refresh App', 'Later'],
    title: 'Setup Complete',
    message: 'AI models have been installed successfully.',
    detail: 'Reload the app to start using them.'
  });
  if (choice === 0 && mainWindow) mainWindow.reload();
}

function pollBackend(onReady, logPath) {
  const maxRetries = 120; // Increased to 120s (2 mins) for safety
  let retries = 0;

  const interval = setInterval(() => {
    if (retries >= maxRetries) {
      clearInterval(interval);
      
      // Read the last 20 lines of the log file to show the user
      let logContent = 'Could not read logs.';
      try {
        if (fs.existsSync(logPath)) {
          const logs = fs.readFileSync(logPath, 'utf8').split('\n');
          logContent = logs.slice(-20).join('\n');
        }
      } catch (e) { console.error(e); }

      dialog.showErrorBox('Backend Startup Timeout', `The backend failed to start.\n\nHere are the last logs:\n---------------------\n${logContent}`);
      if (splashWindow) splashWindow.close();
      app.quit();
      return;
    }
    retries++;
    
    // Check if the backend is ready by pinging an endpoint (e.g., /docs)
    // Use 127.0.0.1 to avoid potential IPv6 localhost issues
    const req = http.get('http://127.0.0.1:8000/docs', (res) => {
      if (res.statusCode === 200) {
        clearInterval(interval);
        onReady();
      }
      res.resume();
    });

    req.on('error', (err) => {
      // Connection refused, retry next tick
    });
    req.end();
  }, 1000); // Poll every second
}

app.on('ready', async () => {
  // In Development: Backend is managed externally (by start_dev.sh or manually)
  // to allow for hot-reloading and avoiding port conflicts.
  if (!app.isPackaged) {
    console.log('Development mode: Assuming Backend is running on port 8000');
    createMainWindow();
    return;
  }

  createSplashWindow();
  
  // Ensure Ollama is installed and running
  const isOllamaRunning = await ensureOllamaRunning();
  if (!isOllamaRunning) {
    dialog.showErrorBox(
      'Setup Failed',
      'Could not start or install the required AI service (Ollama). The app will now exit.'
    );
    app.quit();
    return;
  }

  await ensureModels();

  // In Production: Spawn the compiled backend binary
  const backendPath = path.join(process.resourcesPath, 'backend', 'dist', 'main');
  
  // CRITICAL FIX: Run backend in 'userData' directory so it can write the database (app.db)
  // The Resources folder is read-only on macOS.
  const userDataPath = app.getPath('userData');
  
  // Create a log file stream to debug backend issues in production
  const logPath = path.join(userDataPath, 'app.log');
  const logStream = fs.createWriteStream(logPath, { flags: 'a' });
  
  // Copy .env file to userData if it exists in Resources (so backend finds config)
  const envSource = path.join(process.resourcesPath, 'backend', '.env');
  const envDest = path.join(userDataPath, '.env');
  if (fs.existsSync(envSource) && !fs.existsSync(envDest)) {
    try {
      fs.copyFileSync(envSource, envDest);
    } catch (e) {
      console.error('Failed to copy .env:', e);
    }
  }

  try {
    // Ensure binary is executable
    if (process.platform !== 'win32') {
      fs.chmodSync(backendPath, '755');
    }

    // Kill any existing process on port 8000 to prevent EADDRINUSE errors
    try {
      if (process.platform !== 'win32') {
        execSync('lsof -ti:8000 | xargs kill -9');
      }
    } catch (e) { /* Port likely free */ }
    
    // Check if binary exists
    if (!fs.existsSync(backendPath)) {
      throw new Error(`Backend binary not found at: ${backendPath}`);
    }

    // CRITICAL FIX for [Errno 2]: Inject system paths so backend can find 'ollama'
    // Deduplicate and include sbin for safety
    const commonPaths = ['/usr/local/bin', '/opt/homebrew/bin', '/usr/bin', '/bin', '/usr/sbin', '/sbin'];
    const currentPaths = (process.env.PATH || '').split(path.delimiter);
    const fixedPath = [...new Set([...currentPaths, ...commonPaths])].join(path.delimiter);

    // Prepare environment variables (inherit system PATH, set unbuffered output)
    const env = { 
      ...process.env, 
      PATH: fixedPath,
      PYTHONUNBUFFERED: '1',
      PORT: '8000' 
    };

    backendProcess = spawn(backendPath, [], {
      cwd: userDataPath, // Backend will write app.db here
      env: env
    });

    // Detect spawn errors (e.g. binary not found, permissions)
    backendProcess.on('error', (err) => {
      logStream.write(`[Backend Spawn Error]: ${err.message}\n`);
      dialog.showErrorBox('Backend Spawn Error', `Failed to launch backend executable:\n${err.message}`);
      app.quit();
    });
    
    // Detect immediate startup crashes (e.g. dyld errors, permission issues)
    backendProcess.on('exit', (code) => {
      logStream.write(`[Backend] Process exited early with code ${code}\n`);
      if (!mainWindow) {
        if (splashWindow) splashWindow.close();
        dialog.showErrorBox('Startup Failed', `The backend process crashed unexpectedly (Exit Code: ${code}).\nPlease check app.log for details.`);
        app.quit();
      }
    });

    backendProcess.stdout.on('data', (data) => {
      logStream.write(`[Backend]: ${data}`); // Write to app.log
    });
    backendProcess.stderr.on('data', (data) => {
      logStream.write(`[Backend Error]: ${data}`); // Write to app.log
    });
  } catch (err) {
    logStream.write(`Failed to start backend process: ${err}\n`);
  }

  // Poll for the backend to be ready before creating the main window
  pollBackend(() => {
    if (splashWindow) {
      splashWindow.close();
    }
    createMainWindow();
  }, logPath);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
  if (backendProcess) {
    backendProcess.kill();
  }
});

app.on('quit', () => {
  if (backendProcess) {
    backendProcess.kill();
  }
});
