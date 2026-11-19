// PATH: desktop/src/main/ipcHandlers.ts
import { ipcMain, dialog, shell, BrowserWindow } from 'electron';
import fs from 'fs';
import path from 'path';

export function registerIpcHandlers(getBackendUrl: () => string, getPort: () => number) {
  // Native Video File Picker Dialog
  ipcMain.handle('dialog:open-video', async () => {
    const window = BrowserWindow.getFocusedWindow();
    if (!window) return null;

    const result = await dialog.showOpenDialog(window, {
      title: 'Select Video Episode to Ingest',
      buttonLabel: 'Select Episode',
      properties: ['openFile'],
      filters: [
        { name: 'Video Files', extensions: ['mp4', 'mov', 'mkv', 'webm', 'avi', 'm4v'] },
        { name: 'All Files', extensions: ['*'] },
      ],
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }
    return result.filePaths[0];
  });

  // Native File Picker for custom transcripts (SRT, VTT, TXT)
  ipcMain.handle('dialog:open-transcript', async () => {
    const window = BrowserWindow.getFocusedWindow();
    if (!window) return null;

    const result = await dialog.showOpenDialog(window, {
      title: 'Select Transcript File (SRT, VTT, TXT)',
      buttonLabel: 'Select Transcript',
      properties: ['openFile'],
      filters: [
        { name: 'Transcript Files', extensions: ['srt', 'vtt', 'txt', 'json'] },
        { name: 'All Files', extensions: ['*'] },
      ],
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }
    return result.filePaths[0];
  });

  // Reveal exported video in Windows Explorer
  ipcMain.handle('shell:show-in-folder', async (_, targetPath: string) => {
    if (!targetPath) return false;
    try {
      const resolved = path.resolve(targetPath);
      if (fs.existsSync(resolved)) {
        shell.showItemInFolder(resolved);
        return true;
      }
    } catch (e) {
      console.warn('Failed to reveal item in folder:', e);
    }
    return false;
  });

  // Open external URL in default system browser
  ipcMain.handle('shell:open-external', async (_, url: string) => {
    if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
      await shell.openExternal(url);
      return true;
    }
    return false;
  });

  // Provide backend port and URL to frontend
  ipcMain.handle('app:get-backend-info', () => {
    return {
      port: getPort(),
      baseUrl: getBackendUrl(),
    };
  });

  // Window controls
  ipcMain.on('window:minimize', () => {
    const window = BrowserWindow.getFocusedWindow();
    window?.minimize();
  });

  ipcMain.on('window:maximize', () => {
    const window = BrowserWindow.getFocusedWindow();
    if (window?.isMaximized()) {
      window.unmaximize();
    } else {
      window?.maximize();
    }
  });

  ipcMain.on('window:close', () => {
    const window = BrowserWindow.getFocusedWindow();
    window?.close();
  });
}
