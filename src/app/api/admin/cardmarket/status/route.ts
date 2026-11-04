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
  const ready = isCardmarketBrowserConfigured(config);

  return NextResponse.json({
    ready,
    storagePath: ready ? undefined : config.storageStatePath.replace(process.cwd(), '…'),
    message: ready
      ? 'Server can add orders to Cardmarket cart.'
      : 'Upload a session file (from npm run cardmarket:login) to enable one-click cart fill.',
  });
}
