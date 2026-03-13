const { app, BrowserWindow } = require('electron');
const { spawn } = require('child_process');
const path = require('path');

let backendProcess;

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  // Serve the React build
  win.loadURL('http://localhost:5000');
}

app.on('ready', () => {
  // Start backend
  const backendPath = path.join(__dirname, '../backend/dist/main');
  backendProcess = spawn(backendPath, [], {
    cwd: path.join(__dirname, '../backend'),
    shell: true,
  });

  backendProcess.stdout.on('data', (data) => {
    console.log(`[Backend]: ${data}`);
  });
  backendProcess.stderr.on('data', (data) => {
    console.error(`[Backend Error]: ${data}`);
  });

  // Start frontend (React build)
  // You can use serve or http-server to serve the build
  // Example: npx serve -s ../frontend/dist
  // Or run npm run dev for development

  createWindow();
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
