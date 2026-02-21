import { Hono } from 'hono';
import { spawn, ChildProcess } from 'child_process';

let tunnelProcess: ChildProcess | null = null;
let tunnelUrl: string | null = null;
let tunnelExpiresAt: number | null = null;
let tunnelTimeoutHandle: ReturnType<typeof setTimeout> | null = null;

function isAlive(): boolean {
  return tunnelProcess !== null && tunnelProcess.exitCode === null;
}

function clearTunnelTimeout() {
  if (tunnelTimeoutHandle) {
    clearTimeout(tunnelTimeoutHandle);
    tunnelTimeoutHandle = null;
  }
  tunnelExpiresAt = null;
}

function waitForUrl(proc: ChildProcess, timeoutMs: number): Promise<string | null> {
  return new Promise((resolve) => {
    const urlPattern = /https?:\/\/[a-zA-Z0-9-]+\.lhr\.life/;
    let resolved = false;

    const onData = (chunk: Buffer) => {
      const text = chunk.toString();
      const match = text.match(urlPattern);
      if (match && !resolved) {
        resolved = true;
        resolve(match[0]);
      }
    };

    proc.stdout?.on('data', onData);
    proc.stderr?.on('data', onData);

    proc.on('exit', () => {
      if (!resolved) {
        resolved = true;
        resolve(null);
      }
    });

    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        resolve(null);
      }
    }, timeoutMs);
  });
}

export const tunnelRoute = new Hono();

tunnelRoute.post('/tunnel/start', async (c) => {
  if (isAlive() && tunnelUrl) {
    return c.json({ url: tunnelUrl, ...(tunnelExpiresAt ? { expiresAt: tunnelExpiresAt } : {}) });
  }

  // Kill any dead/stale process reference
  if (tunnelProcess) {
    tunnelProcess.kill('SIGTERM');
    tunnelProcess = null;
    tunnelUrl = null;
    clearTunnelTimeout();
  }

  const body = (await c.req.json().catch(() => ({}))) as { duration?: number };
  const durationMs = body.duration && body.duration > 0 ? body.duration * 60 * 1000 : null;

  const args = [
    '-o', 'ServerAliveInterval=60',
    '-o', 'StrictHostKeyChecking=accept-new',
    '-R', `80:localhost:${process.env.PORT ?? '3000'}`,
    'localhost.run',
  ];

  const proc = spawn('ssh', args, { stdio: ['ignore', 'pipe', 'pipe'] });
  tunnelProcess = proc;

  proc.on('exit', () => {
    if (tunnelProcess === proc) {
      tunnelProcess = null;
      tunnelUrl = null;
      clearTunnelTimeout();
    }
  });

  const url = await waitForUrl(proc, 30_000);

  if (!url) {
    if (tunnelProcess === proc) {
      proc.kill('SIGTERM');
      tunnelProcess = null;
    }
    return c.json({ error: 'Failed to establish tunnel — no URL received within 30s' }, 500);
  }

  tunnelUrl = url;

  if (durationMs) {
    tunnelExpiresAt = Date.now() + durationMs;
    tunnelTimeoutHandle = setTimeout(() => {
      if (tunnelProcess) {
        tunnelProcess.kill('SIGTERM');
        tunnelProcess = null;
        tunnelUrl = null;
      }
      tunnelExpiresAt = null;
      tunnelTimeoutHandle = null;
    }, durationMs);
  }

  return c.json({ url, ...(tunnelExpiresAt ? { expiresAt: tunnelExpiresAt } : {}) });
});

tunnelRoute.post('/tunnel/stop', async (c) => {
  if (tunnelProcess) {
    tunnelProcess.kill('SIGTERM');
    tunnelProcess = null;
    tunnelUrl = null;
    clearTunnelTimeout();
  }
  return c.json({ success: true });
});

tunnelRoute.get('/tunnel/status', async (c) => {
  return c.json({
    running: isAlive(),
    ...(tunnelUrl ? { url: tunnelUrl } : {}),
    ...(tunnelExpiresAt ? { expiresAt: tunnelExpiresAt } : {}),
  });
});
