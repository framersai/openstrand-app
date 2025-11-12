/**
 * Electron main process for OpenStrand App.
 * 
 * Loads Next.js dev server in development and static export in production.
 * For production packaging, we use `next export` to generate `out/` and
 * load its `index.html`.
 */
const { app, BrowserWindow } = require('electron');
const path = require('path');
const url = require('url');

const isDev = process.env.NODE_ENV === 'development' || process.env.ELECTRON_START_URL;

/** @type {BrowserWindow|null} */
let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false
    },
    show: false
  });

  mainWindow.once('ready-to-show', () => mainWindow && mainWindow.show());

  if (isDev) {
    const devUrl = process.env.ELECTRON_START_URL || 'http://localhost:3000';
    mainWindow.loadURL(devUrl);
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    // Load static export from out/index.html
    // In packaged app, resources are under process.resourcesPath/app/*
    const appRoot =
      app.isPackaged
        ? path.join(process.resourcesPath, 'app')
        : path.join(__dirname, '..');
    const indexPath = path.join(appRoot, 'out', 'index.html');

    mainWindow.loadURL(
      url.format({
        pathname: indexPath,
        protocol: 'file:',
        slashes: true
      })
    );
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', createWindow);
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
app.on('activate', () => {
  if (mainWindow === null) createWindow();
});


