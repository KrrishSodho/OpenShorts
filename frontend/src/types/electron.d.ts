// PATH: frontend/src/types/electron.d.ts
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

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
