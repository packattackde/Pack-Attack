import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  isCardmarketBrowserConfigured,
  loadCardmarketBrowserConfigFromEnv,
} from '@/lib/cardmarket-browser';

export async function GET() {
  const session = await getCurrentSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!admin || admin.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const config = loadCardmarketBrowserConfigFromEnv();
  const hasSession = isCardmarketBrowserConfigured(config);
  const hasCreds =
    Boolean(process.env.CARDMARKET_BROWSER_USERNAME?.trim()) &&
    Boolean(process.env.CARDMARKET_BROWSER_PASSWORD?.trim());
  const ready = hasSession || hasCreds;

  return NextResponse.json({
    ready,
    hasSession,
    hasCreds,
    message: ready
      ? hasSession
        ? 'Server can add orders to Cardmarket cart.'
        : 'Server will log in to Cardmarket on first cart run (env credentials).'
      : 'Upload a session file or set CARDMARKET_BROWSER_USERNAME/PASSWORD on the server.',
  });
}
