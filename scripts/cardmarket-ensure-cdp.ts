import { spawn } from 'child_process';
import { resolve } from 'path';

const CDP = process.env.CARDMARKET_CDP_URL?.trim() ?? 'http://127.0.0.1:9222';

export async function ensureCdpChrome(): Promise<void> {
  if (await cdpAlive()) return;

  const ps1 = resolve(process.cwd(), 'scripts/cardmarket-chrome-debug.ps1');
  spawn('powershell.exe', ['-ExecutionPolicy', 'Bypass', '-File', ps1], {
    detached: true,
    stdio: 'ignore',
  }).unref();

  for (let i = 0; i < 45; i++) {
    await sleep(1000);
    if (await cdpAlive()) {
      console.log('[cardmarket] Chrome CDP ready on 9222');
      return;
    }
  }

  throw new Error(
    'Chrome debug not available. Run npm run cardmarket:agent and log into Cardmarket in the Chrome window it opens.'
  );
}

async function cdpAlive(): Promise<boolean> {
  try {
    const r = await fetch(`${CDP.replace(/\/$/, '')}/json/version`, { signal: AbortSignal.timeout(2000) });
    return r.ok;
  } catch {
    return false;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
