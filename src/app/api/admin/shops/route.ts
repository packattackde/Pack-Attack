import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getCurrentSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!admin || admin.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const shops = await prisma.shop.findMany({
      include: {
        owner: {
          select: { id: true, email: true, name: true },
        },
        _count: {
          select: {
            products: true,
            boxOrders: true,
            boxes: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const shopsWithStats = await Promise.all(
      shops.map(async (shop) => {
        const [pendingOrders, totalStock, revenue] = await Promise.all([
          prisma.shopBoxOrder.count({
            where: { shopId: shop.id, status: { in: ['PENDING', 'CONFIRMED', 'PROCESSING'] } },
          }),
          prisma.shopProduct.aggregate({
            where: { shopId: shop.id },
            _sum: { stock: true },
          }),
          prisma.shopBoxOrder.aggregate({
            where: { shopId: shop.id },
            _sum: { cardValue: true },
          }),
        ]);

        return {
          id: shop.id,
          name: shop.name,
          description: shop.description,
          logo: shop.logo,
          isActive: shop.isActive,
          taxId: shop.taxId,
          createdAt: shop.createdAt,
          owner: shop.owner,
          productCount: shop._count.products,
          orderCount: shop._count.boxOrders,
          boxCount: shop._count.boxes,
          pendingOrders,
          totalStock: totalStock._sum.stock || 0,
          totalRevenue: Number(revenue._sum.cardValue || 0),
        };
      })
    );

    const totals = {
      shops: shops.length,
      orders: shopsWithStats.reduce((sum, s) => sum + s.orderCount, 0),
      pendingOrders: shopsWithStats.reduce((sum, s) => sum + s.pendingOrders, 0),
      revenue: shopsWithStats.reduce((sum, s) => sum + s.totalRevenue, 0),
    };

    return NextResponse.json({ success: true, shops: shopsWithStats, totals });
  } catch (error) {
    console.error('Error fetching shops:', error);
    return NextResponse.json({ error: 'Failed to fetch shops' }, { status: 500 });
  }
}
