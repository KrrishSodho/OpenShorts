// PATH: desktop/src/main/backendSupervisor.ts
import { app } from 'electron';
import path from 'path';
import fs from 'fs';
import { spawn, ChildProcess, execSync } from 'child_process';
import http from 'http';

export interface BackendProcessInfo {
  port: number;
  url: string;
  process: ChildProcess | null;
}

export class BackendSupervisor {
  private backendProcess: ChildProcess | null = null;
  private port: number = 8000;
  private isTerminating: boolean = false;

  constructor() {}

  public getPort(): number {
    return this.port;
  }

  public getBaseUrl(): string {
    return `http://127.0.0.1:${this.port}`;
  }

  /**
   * Resolve the path to the backend executable.
   */
  private resolveBackendExecutable(): { exePath: string; cwd: string; isPythonModule: boolean } {
    const isPackaged = app.isPackaged;

    if (isPackaged) {
      // Packaged app path: resources/backend/viral-studio-backend/viral-studio-backend.exe
      const packagedExe = path.join(
        process.resourcesPath,
        'backend',
        'viral-studio-backend',
        'viral-studio-backend.exe'
      );
      if (fs.existsSync(packagedExe)) {
        return {
          exePath: packagedExe,
          cwd: path.dirname(packagedExe),
          isPythonModule: false,
        };
      }
    }

    // Development / pre-package check: desktop/dist/backend/viral-studio-backend/viral-studio-backend.exe
    const compiledDevExe = path.join(
      __dirname,
      '../../dist/backend/viral-studio-backend/viral-studio-backend.exe'
    );
    if (fs.existsSync(compiledDevExe)) {
      return {
        exePath: compiledDevExe,
        cwd: path.dirname(compiledDevExe),
        isPythonModule: false,
      };
    }

    // Fallback: run directly with system Python in development
    const projectRoot = path.resolve(__dirname, '../../../');
    return {
      exePath: process.platform === 'win32' ? 'py' : 'python3',
      cwd: projectRoot,
      isPythonModule: true,
    };
  }

  /**
   * Launch the Python backend and wait for the /api/health endpoint to return 200 OK.
   */
  public async start(
    port: number,
    onStatusUpdate?: (status: string) => void
  ): Promise<BackendProcessInfo> {
    this.port = port;
    const { exePath, cwd, isPythonModule } = this.resolveBackendExecutable();

    const storageDir = path.join(app.getPath('userData'), 'storage');
    if (!fs.existsSync(storageDir)) {
      fs.mkdirSync(storageDir, { recursive: true });
    }

    const env: Record<string, string | undefined> = {
      ...process.env,
      VIRAL_STUDIO_STORAGE_DIR: storageDir,
      PORT: String(this.port),
      PYTHONUNBUFFERED: '1',
    };

    // Provide frontend static directory location
    const frontendDir = app.isPackaged
      ? path.join(process.resourcesPath, 'frontend')
      : path.join(__dirname, '../../dist/frontend');
    if (fs.existsSync(frontendDir)) {
      env.VIRAL_STUDIO_FRONTEND_DIR = frontendDir;
    }

    // Prepend bundled bin (ffmpeg, ffprobe) to PATH
    const resourcesBin = app.isPackaged
      ? path.join(process.resourcesPath, 'bin')
      : path.join(__dirname, '../../resources/bin');
    if (fs.existsSync(resourcesBin)) {
      env.PATH = `${resourcesBin}${path.delimiter}${env.PATH || ''}`;
    }

    let spawnArgs: string[] = [];
    if (isPythonModule) {
      // In development mode: python -m desktop.pyinstaller.entrypoint --port ...
      const entryScript = path.join(__dirname, '../../pyinstaller/entrypoint.py');
      spawnArgs = ['-3', entryScript, '--port', String(this.port), '--storage-dir', storageDir, '--frontend-dir', frontendDir];
    } else {
      spawnArgs = ['--port', String(this.port), '--storage-dir', storageDir, '--frontend-dir', frontendDir];
    }

    if (onStatusUpdate) onStatusUpdate('Launching AI & Video Processing Engine...');
    console.log(`[Supervisor] Spawning backend: ${exePath} ${spawnArgs.join(' ')}`);

    this.backendProcess = spawn(exePath, spawnArgs, {
      cwd,
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    });

    this.backendProcess.stdout?.on('data', (data) => {
      const msg = data.toString().trim();
      if (msg) console.log(`[Backend Out] ${msg}`);
    });

    this.backendProcess.stderr?.on('data', (data) => {
      const msg = data.toString().trim();
      if (msg) console.error(`[Backend Err] ${msg}`);
    });

    this.backendProcess.on('exit', (code, signal) => {
      console.log(`[Supervisor] Backend process exited with code ${code}, signal: ${signal}`);
      if (!this.isTerminating && code !== 0) {
        console.error('[Supervisor] Backend crashed unexpectedly!');
      }
    });

    // Wait for health endpoint
    if (onStatusUpdate) onStatusUpdate('Waiting for local services to be ready...');
    await this.waitForHealth(60);

    return {
      port: this.port,
      url: this.getBaseUrl(),
      process: this.backendProcess,
    };
  }

  /**
   * Polls the /api/health endpoint until responsive.
   */
  private waitForHealth(timeoutSec = 45): Promise<void> {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const interval = 250;

      const check = () => {
        if (Date.now() - startTime > timeoutSec * 1000) {
          return reject(new Error(`Backend failed to become healthy within ${timeoutSec} seconds.`));
        }

        const req = http.get(`http://127.0.0.1:${this.port}/api/health`, (res) => {
          if (res.statusCode === 200) {
            resolve();
          } else {
            setTimeout(check, interval);
          }
        });

        req.on('error', () => {
          setTimeout(check, interval);
        });

        req.setTimeout(500, () => {
          req.destroy();
          setTimeout(check, interval);
        });
      };

      check();
    });
  }

  /**
   * Gracefully terminate the backend process and all its children.
   */
  public stop(): void {
    if (this.isTerminating || !this.backendProcess) return;
    this.isTerminating = true;

    const pid = this.backendProcess.pid;
    console.log(`[Supervisor] Terminating backend process (PID ${pid})...`);

    if (process.platform === 'win32' && pid) {
      try {
        execSync(`taskkill /F /T /PID ${pid}`, { stdio: 'ignore' });
      } catch {
        try {
          this.backendProcess.kill('SIGKILL');
        } catch {}
      }
    } else if (this.backendProcess) {
      try {
        this.backendProcess.kill('SIGTERM');
      } catch {}
    }

    this.backendProcess = null;
  }
}
