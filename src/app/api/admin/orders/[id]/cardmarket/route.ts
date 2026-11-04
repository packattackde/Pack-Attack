import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  CardmarketBrowserFulfillment,
  CardmarketBrowserSession,
  loadCardmarketBrowserConfigFromEnv,
  notifyAdminsCardmarketCartReady,
} from '@/lib/cardmarket-browser';
import {
  preparePullforgeOrderInCardmarket,
  pullforgeOrderToShipment,
} from '@/lib/cardmarket-browser/prepare-pullforge-order';
import { cardmarketShoppingCartUrl } from '@/lib/cardmarket-browser/links';

/**
 * Queue a single Pullforge order for Cardmarket fulfillment:
 * status → PROCESSING, fulfillmentChannel → CARDMARKET.
 * Optionally runs browser cart prep when CARDMARKET_RUN_BROWSER=true (dev / worker machine).
 */
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
        { error: 'Only PENDING orders can be sent to Cardmarket' },
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

    const order = await prisma.order.update({
      where: { id },
      data: {
        status: 'PROCESSING',
        fulfillmentChannel: 'CARDMARKET',
        cardmarketQueuedAt: new Date(),
        cardmarketPreparedAt: null,
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

    let browserPrep: unknown = null;
    let cartUrl = cardmarketShoppingCartUrl();

    if (process.env.CARDMARKET_RUN_BROWSER === 'true') {
      const config = loadCardmarketBrowserConfigFromEnv();
      CardmarketBrowserSession.requireStorageFile(config);
      const fulfillment = new CardmarketBrowserFulfillment(config);
      try {
        browserPrep = await preparePullforgeOrderInCardmarket(
          fulfillment,
          pullforgeOrderToShipment(order)
        );
        cartUrl = (browserPrep as { cartUrl: string }).cartUrl;
        await prisma.order.update({
          where: { id },
          data: { cardmarketPreparedAt: new Date(), cardmarketLastError: null },
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Cardmarket browser prep failed';
        await prisma.order.update({
          where: { id },
          data: { cardmarketLastError: message },
        });
        await fulfillment.close();
        return NextResponse.json(
          { error: message, order: serializeOrder(order) },
          { status: 502 }
        );
      } finally {
        await fulfillment.close();
      }
    }

    const notifyLines = order.items.map((i) => i.cardName);
    notifyAdminsCardmarketCartReady({
      pullforgeOrderIds: [order.id],
      lines: notifyLines,
      cartUrl,
    }).catch((err) => console.error('Cardmarket notify email failed:', err));

    return NextResponse.json({
      success: true,
      cartUrl,
      browserPrep,
      order: serializeOrder(
        await prisma.order.findUniqueOrThrow({
          where: { id },
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
        })
      ),
    });
  } catch (error) {
    console.error('Cardmarket order queue error:', error);
    return NextResponse.json({ error: 'Failed to queue Cardmarket fulfillment' }, { status: 500 });
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
