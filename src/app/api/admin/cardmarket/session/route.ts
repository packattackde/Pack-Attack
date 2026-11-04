import { mkdirSync, writeFileSync, chmodSync } from 'fs';
import { dirname } from 'path';
import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { loadCardmarketBrowserConfigFromEnv } from '@/lib/cardmarket-browser';

/** Admin uploads Playwright storageState after local `npm run cardmarket:login`. */
export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!admin || admin.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const body = await request.text();
  if (!body || body.length < 50) {
    return NextResponse.json({ error: 'Invalid session file' }, { status: 400 });
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: 'Session must be JSON from Playwright storageState' }, { status: 400 });
  }

  if (typeof parsed !== 'object' || parsed === null || !('cookies' in parsed)) {
    return NextResponse.json({ error: 'Not a Playwright storage state file' }, { status: 400 });
  }

  const config = loadCardmarketBrowserConfigFromEnv();
  mkdirSync(dirname(config.storageStatePath), { recursive: true });
  writeFileSync(config.storageStatePath, JSON.stringify(parsed), { encoding: 'utf8' });
  try {
    chmodSync(config.storageStatePath, 0o600);
  } catch {
    /* Windows dev */
  }

  return NextResponse.json({ success: true, message: 'Cardmarket session saved on server.' });
}
