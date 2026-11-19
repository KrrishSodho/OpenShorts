// PATH: desktop/src/main/index.ts
import { app, BrowserWindow } from 'electron';
import path from 'path';
import fs from 'fs';
import { findFreePort } from './portFinder';
import { BackendSupervisor } from './backendSupervisor';
import { registerIpcHandlers } from './ipcHandlers';

let mainWindow: BrowserWindow | null = null;
let splashWindow: BrowserWindow | null = null;
const supervisor = new BackendSupervisor();

// Enforce single instance lock
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

function createSplashWindow(): BrowserWindow {
  const splashPath = app.isPackaged
    ? path.join(process.resourcesPath, 'splash', 'splash.html')
    : path.join(__dirname, '../../resources/splash/splash.html');

  const win = new BrowserWindow({
    width: 460,
    height: 300,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    resizable: false,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  if (fs.existsSync(splashPath)) {
    win.loadFile(splashPath);
  } else {
    win.loadURL('data:text/html;charset=utf-8,<html><body style="background:#07090E;color:white;display:flex;align-items:center;justify-content:center;font-family:sans-serif;"><h3>Starting Viral Studio...</h3></body></html>');
  }

  win.once('ready-to-show', () => {
    win.show();
  });

  return win;
}

function createMainWindow(backendPort: number): BrowserWindow {
  const iconPath = app.isPackaged
    ? path.join(process.resourcesPath, 'icons', 'icon.png')
    : path.join(__dirname, '../../resources/icons/icon.png');

  const win = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1100,
    minHeight: 720,
    backgroundColor: '#07090E',
    show: false,
    icon: fs.existsSync(iconPath) ? iconPath : undefined,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
    },
  });

  // If dev server URL is explicitly provided or we're in dev mode with port 3000 alive, try devUrl;
  // otherwise load the seamless embedded backend HTTP root (which serves frontend + api + storage).
  const isPackaged = app.isPackaged;
  const backendUrl = `http://127.0.0.1:${backendPort}/`;

  if (!isPackaged && process.env.VITE_DEV_SERVER_URL) {
    const devUrl = process.env.VITE_DEV_SERVER_URL;
    console.log(`[Main] Attempting frontend dev server: ${devUrl}`);
    win.loadURL(devUrl).catch(() => {
      console.log(`[Main] Dev server unreachable, falling back to backend: ${backendUrl}`);
      win.loadURL(backendUrl);
    });
  } else {
    console.log(`[Main] Loading frontend from local backend service: ${backendUrl}`);
    win.loadURL(backendUrl);
  }

  win.once('ready-to-show', () => {
    if (splashWindow && !splashWindow.isDestroyed()) {
      splashWindow.close();
      splashWindow = null;
    }
    win.show();
  });

  win.on('closed', () => {
    mainWindow = null;
  });

  return win;
}

async function startApplication() {
  splashWindow = createSplashWindow();

  try {
    const port = await findFreePort(8000);
    console.log(`[Main] Assigned local backend port: ${port}`);

    registerIpcHandlers(
      () => supervisor.getBaseUrl(),
      () => supervisor.getPort()
    );

    await supervisor.start(port, (statusText) => {
      if (splashWindow && !splashWindow.isDestroyed()) {
        splashWindow.webContents.executeJavaScript(`
          const el = document.getElementById('statusText');
          if (el) el.innerText = ${JSON.stringify(statusText)};
        `).catch(() => {});
      }
    });

    mainWindow = createMainWindow(port);
  } catch (err: any) {
    console.error('[Main] Failed to initialize desktop application:', err);
    if (splashWindow && !splashWindow.isDestroyed()) {
      splashWindow.webContents.executeJavaScript(`
        const el = document.getElementById('statusText');
        if (el) {
          el.style.color = '#EF4444';
          el.innerText = 'Initialization Error: ' + ${JSON.stringify(err?.message || 'Failed')};
        }
      `).catch(() => {});
    }
  }
}

app.whenReady().then(startApplication);

app.on('window-all-closed', () => {
  supervisor.stop();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  supervisor.stop();
});

process.on('SIGINT', () => {
  supervisor.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  supervisor.stop();
  process.exit(0);
});
