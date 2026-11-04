import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  isCardmarketBrowserConfigured,
  loadCardmarketBrowserConfigFromEnv,
} from '@/lib/cardmarket-browser';
import { cardmarketShoppingCartUrl } from '@/lib/cardmarket-browser/links';
import {
  isCardmarketCartJobRunning,
  startCardmarketCartJob,
} from '@/lib/cardmarket-browser/run-order-cart-job';
import { inferCardmarketGameSlug } from '@/lib/cardmarket-browser/cardmarket-game';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

function canQueueForCardmarket(order: {
  status: string;
  assignedShopId: string | null;
  fulfillmentChannel: string | null;
  cardmarketPreparedAt: Date | null;
  cardmarketLastError: string | null;
}): boolean {
  if (order.assignedShopId) return false;
  if (order.status === 'PENDING') return true;
  if (
    order.status === 'PROCESSING' &&
    order.fulfillmentChannel === 'CARDMARKET' &&
    !order.cardmarketPreparedAt
  ) {
    return true;
  }
  return false;
}

/** Poll cart job status (background Playwright). */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getCurrentSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!admin || admin.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true },
  });
  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  const game =
    order.items.length > 0
      ? inferCardmarketGameSlug(order.items[0]!.cardName)
      : 'Magic';
  const cartUrl = cardmarketShoppingCartUrl({ game });

  if (order.cardmarketPreparedAt && !order.cardmarketLastError) {
    return NextResponse.json({
      state: 'ready',
      cartUrl,
      order: serializeOrder(order),
    });
  }
  if (order.cardmarketLastError) {
    return NextResponse.json({
      state: 'error',
      error: order.cardmarketLastError,
      cartUrl,
    });
  }
  if (isCardmarketCartJobRunning(id) || order.cardmarketQueuedAt) {
    return NextResponse.json({ state: 'running', cartUrl });
  }

  return NextResponse.json({ state: 'idle', cartUrl });
}

/** Start background job: add to MKM cart + ship-to (avoids nginx 60s timeout). */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCurrentSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    if (!admin || admin.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const config = loadCardmarketBrowserConfigFromEnv();
    if (!config.allowServerAutomation) {
      return NextResponse.json(
        {
          error:
            'Use “Add to cart on this PC” (Cardmarket blocks the server). Start: npm run cardmarket:local-bridge',
          useLocalBridge: true,
        },
        { status: 503 }
      );
    }
    if (!isCardmarketBrowserConfigured(config)) {
      return NextResponse.json(
        {
          error: 'No Cardmarket session on server. Use local bridge on your PC instead.',
          useLocalBridge: true,
        },
        { status: 503 }
      );
    }

    const { id } = await params;

    const existing = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (!canQueueForCardmarket(existing)) {
      return NextResponse.json(
        {
          error:
            existing.status !== 'PENDING'
              ? 'Order is not pending (or already prepared on Cardmarket). Set back to Pending to retry.'
              : 'Cannot add this order to Cardmarket',
        },
        { status: 400 }
      );
    }

    if (existing.items.length === 0) {
      return NextResponse.json({ error: 'Order has no items' }, { status: 400 });
    }

    const started = await startCardmarketCartJob(id);
    if (started === 'already_running') {
      return NextResponse.json(
        { accepted: true, state: 'running', message: 'Already adding to cart…' },
        { status: 202 }
      );
    }

    return NextResponse.json(
      {
        accepted: true,
        state: 'running',
        message: 'Adding to Cardmarket cart (about 1–2 minutes). This page will update automatically.',
      },
      { status: 202 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to start Cardmarket job';
    console.error('Cardmarket POST error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function serializeOrder(order: {
  totalCoins: unknown;
  shippingCost: unknown;
  items: { coinValue: unknown }[];
  createdAt: Date;
  updatedAt: Date;
  assignedAt: Date | null;
  cardmarketQueuedAt: Date | null;
  cardmarketPreparedAt: Date | null;
  [key: string]: unknown;
}) {
  return {
    ...order,
    totalCoins: Number(order.totalCoins),
    shippingCost: Number(order.shippingCost),
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    assignedAt: order.assignedAt?.toISOString() ?? null,
    cardmarketQueuedAt: order.cardmarketQueuedAt?.toISOString() ?? null,
    cardmarketPreparedAt: order.cardmarketPreparedAt?.toISOString() ?? null,
    items: order.items.map((item) => ({
      ...item,
      coinValue: Number(item.coinValue),
    })),
  };
}
