// Native desktop shell: the same React client as the web app, in its own window.
const { app, BrowserWindow, shell } = require('electron');
const path = require('node:path');

const DEV = process.argv.includes('--dev');
const DEV_URL = 'http://localhost:5173';

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 640,
    title: 'METAVERSE',
    backgroundColor: '#1d2433',
    autoHideMenuBar: true,
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true },
  });

  if (DEV) {
    // Vite may still be starting — keep retrying until it answers.
    win.webContents.on('did-fail-load', () => setTimeout(() => win.loadURL(DEV_URL), 1000));
    win.loadURL(DEV_URL);
  } else {
    win.loadFile(path.join(__dirname, '../client/dist/index.html'));
  }

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => BrowserWindow.getAllWindows().length === 0 && createWindow());
});

app.on('window-all-closed', () => process.platform !== 'darwin' && app.quit());
