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
  const serverAutomation = config.allowServerAutomation && hasSession;
  const hasFulfillmentKey = Boolean(process.env.FULFILLMENT_SCRIPT_KEY?.trim());

  return NextResponse.json({
    ready: hasFulfillmentKey,
    serverAutomation,
    hasSession,
    hasFulfillmentKey,
    useLocalBridge: !serverAutomation,
    message: hasFulfillmentKey
      ? 'Use Add to cart on this PC with npm run cardmarket:local-bridge running.'
      : 'Set FULFILLMENT_SCRIPT_KEY on the server and in your PC .env.local, then run the local bridge.',
  });
}
