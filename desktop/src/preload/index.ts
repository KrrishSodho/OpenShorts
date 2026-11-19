// PATH: desktop/src/preload/index.ts
import { contextBridge, ipcRenderer } from 'electron';

export interface ElectronAPI {
  openVideoDialog: () => Promise<string | null>;
  openTranscriptDialog: () => Promise<string | null>;
  showItemInFolder: (path: string) => Promise<boolean>;
  openExternal: (url: string) => Promise<boolean>;
  getBackendInfo: () => Promise<{ port: number; baseUrl: string }>;
  minimizeWindow: () => void;
  maximizeWindow: () => void;
  closeWindow: () => void;
  onStatusUpdate?: (callback: (status: string) => void) => void;
}

const api: ElectronAPI = {
  openVideoDialog: () => ipcRenderer.invoke('dialog:open-video'),
  openTranscriptDialog: () => ipcRenderer.invoke('dialog:open-transcript'),
  showItemInFolder: (filePath: string) => ipcRenderer.invoke('shell:show-in-folder', filePath),
  openExternal: (url: string) => ipcRenderer.invoke('shell:open-external', url),
  getBackendInfo: () => ipcRenderer.invoke('app:get-backend-info'),
  minimizeWindow: () => ipcRenderer.send('window:minimize'),
  maximizeWindow: () => ipcRenderer.send('window:maximize'),
  closeWindow: () => ipcRenderer.send('window:close'),
};

contextBridge.exposeInMainWorld('electronAPI', api);
