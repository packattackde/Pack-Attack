#!/usr/bin/env tsx
/**
 * Run on your PC: npm run cardmarket:local-bridge
 * Admin opens http://127.0.0.1:3847/go/:orderId (avoids HTTPS→localhost fetch blocks).
 */
import dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });
dotenv.config();

import { createServer } from 'http';
import {
  fetchShipmentFromPullforge,
  fulfillPullforgeOrderLocally,
  markOrderPreparedOnPullforge,
} from '../src/lib/cardmarket-browser/fulfill-order-locally';
import { ensureCdpChrome } from './cardmarket-ensure-cdp';

const PORT = Number.parseInt(process.env.CARDMARKET_LOCAL_BRIDGE_PORT ?? '3847', 10);
const BASE = process.env.PULLFORGE_URL?.trim() ?? 'https://pack-attack.de';
function requireFulfillmentKey(): string {
  const k = process.env.FULFILLMENT_SCRIPT_KEY?.trim();
  if (!k) {
    console.error('Missing FULFILLMENT_SCRIPT_KEY in .env.local (same value as on the server).');
    process.exit(1);
  }
  return k;
}

const FULFILLMENT_KEY = requireFulfillmentKey();

async function runFill(orderId: string): Promise<{ success: true; cartUrl: string } | { success: false; error: string }> {
  try {
    console.log(`[cardmarket-bridge] Filling order ${orderId}…`);
    await ensureCdpChrome();
    const shipment = await fetchShipmentFromPullforge(BASE, orderId, FULFILLMENT_KEY);
    const { cartUrl } = await fulfillPullforgeOrderLocally(shipment);
    await markOrderPreparedOnPullforge(BASE, orderId, FULFILLMENT_KEY, cartUrl);
    console.log(`[cardmarket-bridge] Done → ${cartUrl}`);
    return { success: true, cartUrl };
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Fill failed';
    console.error('[cardmarket-bridge]', message);
    return { success: false, error: message };
  }
}

function htmlPage(title: string, body: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title>
<style>body{font-family:system-ui;max-width:32rem;margin:3rem auto;padding:0 1rem;color:#111}
.err{color:#b91c1c}.ok{color:#15803d}a.btn{display:inline-block;margin-top:1rem;padding:.6rem 1rem;background:#0284c7;color:#fff;text-decoration:none;border-radius:8px}</style></head>
<body>${body}</body></html>`;
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://127.0.0.1:${PORT}`);

  const goMatch = url.pathname.match(/^\/go\/([^/]+)$/);
  if (req.method === 'GET' && goMatch) {
    const orderId = encodeURIComponent(decodeURIComponent(goMatch[1]!));
    res.writeHead(302, { Location: `/fill/${orderId}` });
    res.end();
    return;
  }

  const fillMatch = url.pathname.match(/^\/fill\/([^/]+)$/);
  if (req.method === 'POST' && fillMatch) {
    const orderId = decodeURIComponent(fillMatch[1]!);
    const result = await runFill(orderId);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(result));
    return;
  }

  if (req.method === 'GET' && fillMatch) {
    const orderId = decodeURIComponent(fillMatch[1]!);
    const result = await runFill(orderId);
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    if (result.success) {
      res.end(
        htmlPage(
          'Cart ready',
          `<p class="ok">Cart filled and shipping address set.</p>
           <a class="btn" href="${result.cartUrl}" target="_blank" rel="noopener">Open Cardmarket cart</a>
           <p>Refresh Admin → Orders on pack-attack.de.</p>`
        )
      );
    } else {
      res.end(
        htmlPage(
          'Cart fill failed',
          `<p class="err">${result.error.replace(/</g, '&lt;')}</p>
           <p>Run <code>npm run cardmarket:chrome-debug</code>, log into Cardmarket in that Chrome window.</p>
           <p>Keep <code>npm run cardmarket:local-bridge</code> running, then retry auto-fill from the fulfill page.</p>`
        )
      );
    }
    return;
  }

  if (req.method === 'GET' && url.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, hasKey: true }));
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Cardmarket local bridge http://127.0.0.1:${PORT}`);
  console.log('Open Admin → Orders → Add to cart on this PC (opens /go/… tab).');
});
