import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const COIN_TO_EURO_RATE = 5;

async function resolveShopId(userEmail: string, requestedShopId?: string): Promise<{ shopId: string } | { error: string; status: number }> {
  const user = await prisma.user.findUnique({
    where: { email: userEmail },
    include: { shop: true },
  });

  if (!user) return { error: 'User not found', status: 403 };

  if (user.role === 'ADMIN' && requestedShopId) {
    const shop = await prisma.shop.findUnique({ where: { id: requestedShopId }, select: { id: true } });
    if (!shop) return { error: 'Shop not found', status: 404 };
    return { shopId: shop.id };
  }

  if (user.role === 'ADMIN' && user.shop) {
    return { shopId: user.shop.id };
  }

  if (user.role === 'SHOP_OWNER' && user.shop) {
    return { shopId: user.shop.id };
  }

  return { error: 'Shop access required', status: 403 };
}

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const shopIdParam = request.nextUrl.searchParams.get('shopId') || undefined;
    const result = await resolveShopId(session.user.email, shopIdParam);
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const shopId = result.shopId;

    const [payouts, shop, eligibleOrders] = await Promise.all([
      prisma.shopPayout.findMany({
        where: { shopId },
        orderBy: { createdAt: 'desc' },
        include: {
          items: {
            select: {
              id: true,
              orderNumber: true,
              cardName: true,
              cardImage: true,
              cardValue: true,
              cardRarity: true,
              status: true,
              createdAt: true,
              user: { select: { id: true, name: true, email: true } },
            },
          },
        },
      }),
      prisma.shop.findUnique({
        where: { id: shopId },
        select: { coinBalance: true },
      }),
      prisma.shopBoxOrder.findMany({
        where: { shopId, status: 'DELIVERED' },
        select: { cardValue: true },
      }),
    ]);

    const eligibleCount = eligibleOrders.length;
    const eligibleTotal = eligibleOrders.reduce((sum, o) => sum + Number(o.cardValue), 0);

    return NextResponse.json({
      success: true,
      coinBalance: Number(shop?.coinBalance || 0),
      rate: COIN_TO_EURO_RATE,
      eligibleCount,
      eligibleTotal,
      eligibleEuro: eligibleTotal / COIN_TO_EURO_RATE,
      payouts: payouts.map(p => ({
        ...p,
        coinAmount: Number(p.coinAmount),
        euroAmount: Number(p.euroAmount),
        items: p.items.map(item => ({
          ...item,
          cardValue: Number(item.cardValue),
          createdAt: item.createdAt.toISOString(),
        })),
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
        processedAt: p.processedAt?.toISOString() || null,
      })),
    });
  } catch (error) {
    console.error('Error fetching payouts:', error);
    return NextResponse.json({ error: 'Failed to fetch payouts' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let bodyShopId: string | undefined;
    try {
      const body = await request.json();
      bodyShopId = body.shopId;
    } catch {
      // No body or invalid JSON — that's fine
    }

    const result = await resolveShopId(session.user.email, bodyShopId);
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const shopId = result.shopId;

    const hasPending = await prisma.shopPayout.findFirst({
      where: { shopId, status: { in: ['REQUESTED', 'PROCESSING'] } },
    });
    if (hasPending) {
      return NextResponse.json({ error: 'There is already a pending payout request for this shop' }, { status: 400 });
    }

    const txResult = await prisma.$transaction(async (tx) => {
      const deliveredOrders = await tx.shopBoxOrder.findMany({
        where: { shopId, status: 'DELIVERED' },
      });

      if (deliveredOrders.length === 0) {
        throw new Error('NO_ELIGIBLE_ORDERS');
      }

      const totalCoins = deliveredOrders.reduce((sum, o) => sum + Number(o.cardValue), 0);
      const euroAmount = totalCoins / COIN_TO_EURO_RATE;

      const shop = await tx.shop.findUnique({
        where: { id: shopId },
        select: { coinBalance: true },
      });

      if (Number(shop?.coinBalance || 0) < totalCoins) {
        throw new Error('INSUFFICIENT_BALANCE');
      }

      const payout = await tx.shopPayout.create({
        data: {
          shopId,
          coinAmount: totalCoins,
          euroAmount,
          status: 'REQUESTED',
        },
      });

      await tx.shopBoxOrder.updateMany({
        where: {
          id: { in: deliveredOrders.map(o => o.id) },
        },
        data: {
          status: 'PAYOUT_REQUESTED',
          payoutId: payout.id,
        },
      });

      await tx.shop.update({
        where: { id: shopId },
        data: { coinBalance: { decrement: totalCoins } },
      });

      const payoutWithItems = await tx.shopPayout.findUnique({
        where: { id: payout.id },
        include: {
          items: {
            select: {
              id: true,
              orderNumber: true,
              cardName: true,
              cardImage: true,
              cardValue: true,
              cardRarity: true,
              status: true,
              createdAt: true,
              user: { select: { id: true, name: true, email: true } },
            },
          },
        },
      });

      return payoutWithItems!;
    });

    return NextResponse.json({
      success: true,
      payout: {
        ...txResult,
        coinAmount: Number(txResult.coinAmount),
        euroAmount: Number(txResult.euroAmount),
        items: txResult.items.map(item => ({
          ...item,
          cardValue: Number(item.cardValue),
          createdAt: item.createdAt.toISOString(),
        })),
        createdAt: txResult.createdAt.toISOString(),
        updatedAt: txResult.updatedAt.toISOString(),
        processedAt: txResult.processedAt?.toISOString() || null,
      },
    });
  } catch (error: any) {
    if (error.message === 'NO_ELIGIBLE_ORDERS') {
      return NextResponse.json({ error: 'No delivered orders eligible for payout' }, { status: 400 });
    }
    if (error.message === 'INSUFFICIENT_BALANCE') {
      return NextResponse.json({ error: 'Insufficient coin balance for payout' }, { status: 400 });
    }
    console.error('Error requesting payout:', error);
    return NextResponse.json({ error: 'Failed to request payout' }, { status: 500 });
  }
}
