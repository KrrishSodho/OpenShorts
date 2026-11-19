// PATH: desktop/src/main/portFinder.ts
import net from 'net';

/**
 * Checks if a specific TCP port is currently free on localhost.
 */
export function isPortAvailable(port: number, host = '127.0.0.1'): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => {
      resolve(false);
    });
    server.once('listening', () => {
      server.close(() => resolve(true));
    });
    server.listen(port, host);
  });
}

/**
 * Finds the first available port in a given range, starting from preferredPort.
 */
export async function findFreePort(preferredPort = 8000, maxAttempts = 50): Promise<number> {
  for (let i = 0; i < maxAttempts; i++) {
    const candidate = preferredPort + i;
    const available = await isPortAvailable(candidate);
    if (available) {
      return candidate;
    }
  }
  throw new Error(`Could not find an available port in range ${preferredPort}-${preferredPort + maxAttempts}`);
}
