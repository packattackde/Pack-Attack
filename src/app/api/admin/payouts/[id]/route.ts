import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const payoutInclude = {
  shop: {
    select: {
      id: true, name: true, taxId: true, coinBalance: true,
      owner: { select: { id: true, email: true, name: true } },
    },
  },
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
};

function serializePayout(p: any) {
  return {
    ...p,
    coinAmount: Number(p.coinAmount),
    euroAmount: Number(p.euroAmount),
    shop: { ...p.shop, coinBalance: Number(p.shop.coinBalance) },
    items: p.items.map((item: any) => ({
      ...item,
      cardValue: Number(item.cardValue),
      createdAt: typeof item.createdAt === 'string' ? item.createdAt : item.createdAt.toISOString(),
    })),
    createdAt: typeof p.createdAt === 'string' ? p.createdAt : p.createdAt.toISOString(),
    updatedAt: typeof p.updatedAt === 'string' ? p.updatedAt : p.updatedAt.toISOString(),
    processedAt: p.processedAt
      ? (typeof p.processedAt === 'string' ? p.processedAt : p.processedAt.toISOString())
      : null,
  };
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCurrentSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!admin || admin.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status, adminNotes } = body;

    const payout = await prisma.shopPayout.findUnique({
      where: { id },
      include: payoutInclude,
    });

    if (!payout) {
      return NextResponse.json({ error: 'Payout not found' }, { status: 404 });
    }

    // PROCESSING (Approve) — mark payout as being processed
    if (status === 'PROCESSING') {
      if (payout.status !== 'REQUESTED') {
        return NextResponse.json({ error: 'Can only process requested payouts' }, { status: 400 });
      }

      const updated = await prisma.shopPayout.update({
        where: { id },
        data: {
          status: 'PROCESSING',
          processedById: admin.id,
          ...(adminNotes !== undefined ? { adminNotes } : {}),
        },
        include: payoutInclude,
      });

      return NextResponse.json({ success: true, payout: serializePayout(updated) });
    }

    // COMPLETED (Mark as Paid) — items become PAID_OUT, coins already deducted on request
    if (status === 'COMPLETED') {
      if (payout.status !== 'PROCESSING' && payout.status !== 'REQUESTED') {
        return NextResponse.json({ error: 'Can only complete requested/processing payouts' }, { status: 400 });
      }

      const itemIds = payout.items.map((item: any) => item.id);

      await prisma.$transaction([
        prisma.shopBoxOrder.updateMany({
          where: { id: { in: itemIds } },
          data: { status: 'PAID_OUT' },
        }),
        prisma.shopPayout.update({
          where: { id },
          data: {
            status: 'COMPLETED',
            processedById: admin.id,
            processedAt: new Date(),
            ...(adminNotes !== undefined ? { adminNotes } : {}),
          },
        }),
      ]);

      const updated = await prisma.shopPayout.findUnique({
        where: { id },
        include: payoutInclude,
      });

      return NextResponse.json({ success: true, payout: serializePayout(updated) });
    }

    // REJECTED — revert items to DELIVERED, return coins to shop
    if (status === 'REJECTED') {
      if (payout.status === 'COMPLETED') {
        return NextResponse.json({ error: 'Cannot reject a completed payout' }, { status: 400 });
      }

      const itemIds = payout.items.map((item: any) => item.id);

      await prisma.$transaction([
        prisma.shopBoxOrder.updateMany({
          where: { id: { in: itemIds } },
          data: { status: 'DELIVERED', payoutId: null },
        }),
        prisma.shop.update({
          where: { id: payout.shopId },
          data: { coinBalance: { increment: payout.coinAmount } },
        }),
        prisma.shopPayout.update({
          where: { id },
          data: {
            status: 'REJECTED',
            processedById: admin.id,
            processedAt: new Date(),
            ...(adminNotes !== undefined ? { adminNotes } : {}),
          },
        }),
      ]);

      const updated = await prisma.shopPayout.findUnique({
        where: { id },
        include: payoutInclude,
      });

      return NextResponse.json({ success: true, payout: serializePayout(updated) });
    }

    // Notes-only update
    if (adminNotes !== undefined) {
      const updated = await prisma.shopPayout.update({
        where: { id },
        data: { adminNotes },
        include: payoutInclude,
      });
      return NextResponse.json({ success: true, payout: serializePayout(updated) });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating payout:', error);
    return NextResponse.json({ error: 'Failed to update payout' }, { status: 500 });
  }
}
