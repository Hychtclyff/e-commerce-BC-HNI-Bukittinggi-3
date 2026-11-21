import { spawn } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { AppError } from '@/utils/AppError';

const BROWSER_CANDIDATES = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  path.join(process.env.LOCALAPPDATA || '', 'Google\\Chrome\\Application\\chrome.exe'),
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
];

const HSIS_LOGIN_URL = 'https://hsis.hni.net/login/';
const CDP_PORT = 9223;

function findBrowserExecutable(): string | null {
  for (const candidate of BROWSER_CANDIDATES) {
    if (candidate && fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return null;
}

async function fetchCdpTargets(port: number): Promise<any[]> {
  for (let i = 0; i < 15; i++) {
    try {
      const resp = await fetch(`http://127.0.0.1:${port}/json`);
      if (resp.ok) {
        const data = (await resp.json()) as any[];
        const pages = data.filter((t) => t.type === 'page' && t.webSocketDebuggerUrl);
        if (pages.length > 0) return pages;
      }
    } catch {
      // Browser still starting
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  return [];
}

/**
 * Launches a small interactive Chrome/Edge app window to https://hsis.hni.net/login/
 * so the store admin can log in (including typing the Security Code CAPTCHA),
 * and captures the real Authorization Bearer token and session cookies via CDP.
 */
export async function captureHsisTokenInteractive(timeoutMs = 180000): Promise<{
  token: string;
  cookie?: string;
}> {
  const browserPath = findBrowserExecutable();
  if (!browserPath) {
    throw new AppError(
      'Google Chrome / Microsoft Edge tidak ditemukan di server lokal ini. Gunakan tab "Tempel Token Manual".',
      400
    );
  }

  const userDataDir = path.join(os.tmpdir(), `tijarah_hsis_cdp_${Date.now()}`);
  const proc = spawn(
    browserPath,
    [
      `--remote-debugging-port=${CDP_PORT}`,
      `--user-data-dir=${userDataDir}`,
      `--app=${HSIS_LOGIN_URL}`,
      '--window-size=480,680',
      '--no-first-run',
      '--no-default-browser-check',
    ],
    { detached: false, stdio: 'ignore' }
  );

  let ws: WebSocket | null = null;
  let capturedToken: string | null = null;
  let capturedCookie: string | undefined;
  let cmdId = 1;

  const sendCdp = (method: string, params: Record<string, any> = {}) => {
    return new Promise<any>((resolve) => {
      if (!ws || ws.readyState !== WebSocket.OPEN) {
        resolve(null);
        return;
      }
      const id = cmdId++;
      const handler = (event: MessageEvent) => {
        try {
          const msg = JSON.parse(String(event.data));
          if (msg.id === id) {
            ws?.removeEventListener('message', handler);
            resolve(msg.result || null);
          }
        } catch {
          // ignore parse error
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id, method, params }));
      setTimeout(() => {
        ws?.removeEventListener('message', handler);
        resolve(null);
      }, 2500);
    });
  };

  try {
    const pages = await fetchCdpTargets(CDP_PORT);
    if (pages.length === 0) {
      throw new AppError('Gagal membuka koneksi Chrome DevTools untuk login HSIS.', 500);
    }

    const wsUrl = pages[0].webSocketDebuggerUrl as string;
    ws = new WebSocket(wsUrl);

    await new Promise<void>((resolve, reject) => {
      if (!ws) return reject(new Error('No WebSocket'));
      ws.addEventListener('open', () => resolve());
      ws.addEventListener('error', (err) => reject(err));
    });

    await sendCdp('Network.enable');

    ws.addEventListener('message', (event) => {
      try {
        const msg = JSON.parse(String(event.data));
        if (msg.method === 'Network.requestWillBeSent') {
          const reqUrl = String(msg.params?.request?.url || '');
          const headers = msg.params?.request?.headers || {};
          const authHeader = headers.Authorization || headers.authorization;
          if (
            authHeader &&
            typeof authHeader === 'string' &&
            authHeader.toLowerCase().startsWith('bearer ') &&
            reqUrl.includes('hni.net')
          ) {
            capturedToken = authHeader.replace(/^Bearer\s+/i, '').trim();
          }
        }
      } catch {
        // ignore
      }
    });

    const deadline = Date.now() + timeoutMs;
    let processExited = false;
    proc.on('exit', () => {
      processExited = true;
    });

    while (!capturedToken && !processExited && Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 1500));

      // Check localStorage / sessionStorage on authenticated non-login pages
      const evalRes = await sendCdp('Runtime.evaluate', {
        expression: `(() => {
          const href = window.location.href || '';
          if (href.includes('/login')) return null;
          const keys = ['token', 'access_token', 'auth_token', 'jwt', 'hsis_token'];
          for (const k of keys) {
            const v = localStorage.getItem(k) || sessionStorage.getItem(k);
            if (v && v.length > 12) return v;
          }
          for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            const v = k ? localStorage.getItem(k) : null;
            if (v && v.startsWith('eyJ') && v.length > 30) return v;
          }
          return null;
        })()`,
        returnByValue: true,
      });

      const storageToken = evalRes?.result?.value;
      if (typeof storageToken === 'string' && storageToken.trim().length > 12) {
        capturedToken = storageToken.replace(/^Bearer\s+/i, '').trim();
      }

      // Grab cookies if we navigated away from /login
      if (capturedToken || !evalRes?.result?.value) {
        const cookieRes = await sendCdp('Network.getCookies', { urls: ['https://hsis.hni.net'] });
        const cookies = Array.isArray(cookieRes?.cookies) ? cookieRes.cookies : [];
        if (cookies.length > 0) {
          capturedCookie = cookies.map((c: any) => `${c.name}=${c.value}`).join('; ');
        }
      }
    }

    if (!capturedToken) {
      throw new AppError(
        'Login HSIS dibatalkan atau waktu tunggu habis sebelum token Bearer tertangkap. Jika HSIS hanya menggunakan sesi cookie atau token dari Postman, silakan gunakan tab "Tempel Token Manual".',
        400
      );
    }

    return { token: capturedToken, cookie: capturedCookie };
  } finally {
    try {
      ws?.close();
    } catch {
      // ignore
    }
    try {
      proc.kill();
    } catch {
      // ignore
    }
    try {
      fs.rmSync(userDataDir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  }
}
