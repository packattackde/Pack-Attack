import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const COIN_TO_EURO_RATE = 5;

const payoutItemSelect = {
  id: true,
  orderNumber: true,
  cardName: true,
  cardImage: true,
  cardValue: true,
  cardRarity: true,
  status: true,
  createdAt: true,
  user: { select: { id: true, name: true, email: true } },
};

function serializePayout(p: any) {
  return {
    ...p,
    coinAmount: Number(p.coinAmount),
    euroAmount: Number(p.euroAmount),
    items: (p.items || []).map((item: any) => ({
      ...item,
      cardValue: Number(item.cardValue),
      createdAt: typeof item.createdAt === 'string' ? item.createdAt : item.createdAt.toISOString(),
    })),
    createdAt: typeof p.createdAt === 'string' ? p.createdAt : p.createdAt.toISOString(),
    updatedAt: typeof p.updatedAt === 'string' ? p.updatedAt : p.updatedAt.toISOString(),
    processedAt: p.processedAt
      ? (typeof p.processedAt === 'string' ? p.processedAt : p.processedAt.toISOString())
      : null,
    resubmittedAt: p.resubmittedAt
      ? (typeof p.resubmittedAt === 'string' ? p.resubmittedAt : p.resubmittedAt.toISOString())
      : null,
  };
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCurrentSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { shop: true },
    });

    if (!user || (user.role !== 'SHOP_OWNER' && user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Shop access required' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { action, shopMessage } = body;

    if (action !== 'resubmit') {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const payout = await prisma.shopPayout.findUnique({
      where: { id },
      include: { items: { select: { id: true } } },
    });

    if (!payout) {
      return NextResponse.json({ error: 'Payout not found' }, { status: 404 });
    }

    if (user.role === 'SHOP_OWNER' && payout.shopId !== user.shop?.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (payout.status !== 'REJECTED') {
      return NextResponse.json({ error: 'Only rejected payouts can be resubmitted' }, { status: 400 });
    }

    if (payout.resubmittedAt) {
      return NextResponse.json({ error: 'This payout has already been resubmitted once' }, { status: 400 });
    }

    if (!shopMessage || typeof shopMessage !== 'string' || shopMessage.trim().length === 0) {
      return NextResponse.json({ error: 'A message is required when resubmitting' }, { status: 400 });
    }

    if (shopMessage.trim().length > 2000) {
      return NextResponse.json({ error: 'Message is too long (max 2000 characters)' }, { status: 400 });
    }

    const hasPending = await prisma.shopPayout.findFirst({
      where: { shopId: payout.shopId, status: { in: ['REQUESTED', 'PROCESSING'] } },
    });
    if (hasPending) {
      return NextResponse.json({ error: 'There is already a pending payout request for this shop' }, { status: 400 });
    }

    const txResult = await prisma.$transaction(async (tx) => {
      const deliveredOrders = await tx.shopBoxOrder.findMany({
        where: { shopId: payout.shopId, status: 'DELIVERED' },
      });

      if (deliveredOrders.length === 0) {
        throw new Error('NO_ELIGIBLE_ORDERS');
      }

      const totalCoins = deliveredOrders.reduce((sum, o) => sum + Number(o.cardValue), 0);
      const euroAmount = totalCoins / COIN_TO_EURO_RATE;

      const shop = await tx.shop.findUnique({
        where: { id: payout.shopId },
        select: { coinBalance: true },
      });

      if (Number(shop?.coinBalance || 0) < totalCoins) {
        throw new Error('INSUFFICIENT_BALANCE');
      }

      await tx.shopBoxOrder.updateMany({
        where: { id: { in: deliveredOrders.map(o => o.id) } },
        data: { status: 'PAYOUT_REQUESTED', payoutId: payout.id },
      });

      await tx.shop.update({
        where: { id: payout.shopId },
        data: { coinBalance: { decrement: totalCoins } },
      });

      const updated = await tx.shopPayout.update({
        where: { id },
        data: {
          status: 'REQUESTED',
          coinAmount: totalCoins,
          euroAmount,
          shopMessage: shopMessage.trim(),
          resubmittedAt: new Date(),
          processedAt: null,
          processedById: null,
        },
        include: { items: { select: payoutItemSelect } },
      });

      return updated;
    });

    return NextResponse.json({
      success: true,
      payout: serializePayout(txResult),
    });
  } catch (error: any) {
    if (error.message === 'NO_ELIGIBLE_ORDERS') {
      return NextResponse.json({ error: 'No delivered orders eligible for payout' }, { status: 400 });
    }
    if (error.message === 'INSUFFICIENT_BALANCE') {
      return NextResponse.json({ error: 'Insufficient coin balance for payout' }, { status: 400 });
    }
    console.error('Error resubmitting payout:', error);
    return NextResponse.json({ error: 'Failed to resubmit payout' }, { status: 500 });
  }
}
