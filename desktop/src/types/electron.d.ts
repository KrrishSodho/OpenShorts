// PATH: desktop/src/types/electron.d.ts
export {};

declare global {
  namespace NodeJS {
    interface Process {
      resourcesPath: string;
    }
  }
}

declare module 'electron' {
  export const app: {
    isPackaged: boolean;
    whenReady: () => Promise<void>;
    requestSingleInstanceLock: () => boolean;
    quit: () => void;
    getPath: (name: string) => string;
    on: (event: string, listener: (...args: any[]) => void) => void;
  };

  export interface BrowserWindowOptions {
    width?: number;
    height?: number;
    minWidth?: number;
    minHeight?: number;
    backgroundColor?: string;
    show?: boolean;
    transparent?: boolean;
    frame?: boolean;
    alwaysOnTop?: boolean;
    resizable?: boolean;
    icon?: string;
    webPreferences?: {
      preload?: string;
      nodeIntegration?: boolean;
      contextIsolation?: boolean;
      webSecurity?: boolean;
    };
  }

  export class BrowserWindow {
    constructor(options?: BrowserWindowOptions);
    static getFocusedWindow(): BrowserWindow | null;
    show(): void;
    close(): void;
    isDestroyed(): boolean;
    minimize(): void;
    maximize(): void;
    unmaximize(): void;
    isMaximized(): boolean;
    isMinimized(): boolean;
    restore(): void;
    focus(): void;
    loadFile(filePath: string): Promise<void>;
    loadURL(url: string): Promise<void>;
    once(event: string, listener: (...args: any[]) => void): void;
    on(event: string, listener: (...args: any[]) => void): void;
    webContents: {
      send(channel: string, ...args: any[]): void;
      executeJavaScript(code: string): Promise<any>;
    };
  }

  export const dialog: {
    showOpenDialog(
      window: BrowserWindow,
      options: {
        title?: string;
        buttonLabel?: string;
        properties?: Array<'openFile' | 'openDirectory' | 'multiSelections'>;
        filters?: Array<{ name: string; extensions: string[] }>;
      }
    ): Promise<{ canceled: boolean; filePaths: string[] }>;
  };

  export const shell: {
    showItemInFolder(path: string): void;
    openExternal(url: string): Promise<void>;
  };

  export const ipcMain: {
    handle(channel: string, listener: (event: any, ...args: any[]) => any): void;
    on(channel: string, listener: (event: any, ...args: any[]) => void): void;
  };

  export const ipcRenderer: {
    invoke(channel: string, ...args: any[]): Promise<any>;
    send(channel: string, ...args: any[]): void;
  };

  export const contextBridge: {
    exposeInMainWorld(apiKey: string, api: any): void;
  };
}
