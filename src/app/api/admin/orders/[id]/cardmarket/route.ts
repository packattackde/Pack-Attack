import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  CardmarketBrowserFulfillment,
  isCardmarketBrowserConfigured,
  loadCardmarketBrowserConfigFromEnv,
  notifyAdminsCardmarketCartReady,
} from '@/lib/cardmarket-browser';
import {
  preparePullforgeOrderInCardmarket,
  pullforgeOrderToShipment,
} from '@/lib/cardmarket-browser/prepare-pullforge-order';
import { cardmarketShoppingCartUrl } from '@/lib/cardmarket-browser/links';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

/**
 * Add order lines to Cardmarket cart + customer ship-to (Playwright). Marks Processing only on success.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let fulfillment: CardmarketBrowserFulfillment | null = null;

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
    if (!isCardmarketBrowserConfigured(config)) {
      return NextResponse.json(
        {
          error:
            'Cardmarket is not logged in on the server. In Admin → Orders, upload your session file (run npm run cardmarket:login locally first).',
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

    if (existing.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Only PENDING orders can be added to Cardmarket' },
        { status: 400 }
      );
    }

    if (existing.assignedShopId) {
      return NextResponse.json(
        { error: 'Unassign the shop first — Cardmarket and shop fulfillment are separate' },
        { status: 400 }
      );
    }

    if (existing.items.length === 0) {
      return NextResponse.json({ error: 'Order has no items' }, { status: 400 });
    }

    fulfillment = new CardmarketBrowserFulfillment(config);
    const browserPrep = await preparePullforgeOrderInCardmarket(
      fulfillment,
      pullforgeOrderToShipment(existing)
    );

    const cartUrl = browserPrep.cartUrl ?? cardmarketShoppingCartUrl();

    const order = await prisma.order.update({
      where: { id },
      data: {
        status: 'PROCESSING',
        fulfillmentChannel: 'CARDMARKET',
        cardmarketQueuedAt: new Date(),
        cardmarketPreparedAt: new Date(),
        cardmarketLastError: null,
      },
      include: {
        user: { select: { id: true, email: true, name: true } },
        items: true,
        assignedShop: {
          select: {
            id: true,
            name: true,
            owner: { select: { id: true, email: true, name: true } },
          },
        },
      },
    });

    notifyAdminsCardmarketCartReady({
      pullforgeOrderIds: [order.id],
      lines: order.items.map((i) => i.cardName),
      cartUrl,
    }).catch((err) => console.error('Cardmarket notify email failed:', err));

    return NextResponse.json({
      success: true,
      cartUrl,
      browserPrep,
      order: serializeOrder(order),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Cardmarket cart automation failed';
    console.error('Cardmarket order cart error:', error);

    const { id } = await params;
    await prisma.order
      .update({
        where: { id },
        data: { cardmarketLastError: message },
      })
      .catch(() => undefined);

    return NextResponse.json({ error: message }, { status: 502 });
  } finally {
    await fulfillment?.close();
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
