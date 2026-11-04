#!/usr/bin/env tsx
/**
 * Run on your PC (not the server): npm run cardmarket:local-bridge
 * Admin “Add to cart” on pack-attack.de calls http://127.0.0.1:3847/fill/:orderId
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

const PORT = Number.parseInt(process.env.CARDMARKET_LOCAL_BRIDGE_PORT ?? '3847', 10);
const BASE = process.env.PULLFORGE_URL?.trim() ?? 'https://pack-attack.de';
const KEY = process.env.FULFILLMENT_SCRIPT_KEY?.trim();

if (!KEY) {
  console.error('Missing FULFILLMENT_SCRIPT_KEY in .env.local (same value as on the server).');
  process.exit(1);
}

const fillCors = {
  'Access-Control-Allow-Origin': 'https://pack-attack.de',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://127.0.0.1:${PORT}`);

  if (req.method === 'OPTIONS' && url.pathname.startsWith('/fill/')) {
    res.writeHead(204, fillCors);
    res.end();
    return;
  }

  const match = url.pathname.match(/^\/fill\/([^/]+)$/);
  if (req.method === 'POST' && match) {
    const orderId = decodeURIComponent(match[1]!);
    res.writeHead(200, { ...fillCors, 'Content-Type': 'application/json' });

    try {
      console.log(`[cardmarket-bridge] Filling order ${orderId}…`);
      const shipment = await fetchShipmentFromPullforge(BASE, orderId, KEY);
      const { cartUrl } = await fulfillPullforgeOrderLocally(shipment);
      await markOrderPreparedOnPullforge(BASE, orderId, KEY, cartUrl);
      console.log(`[cardmarket-bridge] Done → ${cartUrl}`);
      res.end(JSON.stringify({ success: true, cartUrl }));
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Fill failed';
      console.error('[cardmarket-bridge]', message);
      res.end(JSON.stringify({ success: false, error: message }));
    }
    return;
  }

  if (req.method === 'GET' && url.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Cardmarket local bridge http://127.0.0.1:${PORT}`);
  console.log('Keep this running. Use Admin → Orders → Add to cart on this PC.');
});
