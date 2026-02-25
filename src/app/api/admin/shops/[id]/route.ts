import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentSession } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const shop = await prisma.shop.findUnique({
      where: { id },
      include: {
        owner: {
          select: { id: true, email: true, name: true, createdAt: true },
        },
        products: {
          orderBy: { createdAt: 'desc' },
        },
        boxes: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
            price: true,
            isActive: true,
            createdAt: true,
            _count: { select: { cards: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }

    const orders = await prisma.shopBoxOrder.findMany({
      where: { shopId: id },
      include: {
        user: { select: { id: true, email: true, name: true } },
        box: { select: { id: true, name: true, imageUrl: true } },
        shop: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const [pendingOrders, totalStock, revenue] = await Promise.all([
      prisma.shopBoxOrder.count({
        where: { shopId: id, status: { in: ['PENDING', 'CONFIRMED', 'PROCESSING'] } },
      }),
      prisma.shopProduct.aggregate({
        where: { shopId: id },
        _sum: { stock: true },
      }),
      prisma.shopBoxOrder.aggregate({
        where: { shopId: id },
        _sum: { cardValue: true },
      }),
    ]);

    const serializedOrders = orders.map((order) => ({
      ...order,
      cardValue: Number(order.cardValue),
      shippingCost: Number(order.shippingCost),
    }));

    const serializedProducts = shop.products.map((p) => ({
      ...p,
      price: Number(p.price),
      comparePrice: p.comparePrice ? Number(p.comparePrice) : null,
    }));

    return NextResponse.json({
      success: true,
      shop: {
        id: shop.id,
        name: shop.name,
        description: shop.description,
        logo: shop.logo,
        banner: shop.banner,
        taxId: shop.taxId,
        isActive: shop.isActive,
        createdAt: shop.createdAt,
        updatedAt: shop.updatedAt,
        owner: shop.owner,
        products: serializedProducts,
        boxes: shop.boxes,
      },
      orders: serializedOrders,
      stats: {
        totalOrders: orders.length,
        pendingOrders,
        totalRevenue: Number(revenue._sum.cardValue || 0),
        productCount: shop.products.length,
        totalStock: totalStock._sum.stock || 0,
        boxCount: shop.boxes.length,
      },
    });
  } catch (error) {
    console.error('Error fetching shop:', error);
    return NextResponse.json({ error: 'Failed to fetch shop' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const body = await request.json();
    const { name, description, isActive } = body;

    const updated = await prisma.shop.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(isActive !== undefined && { isActive }),
      },
      include: {
        owner: { select: { id: true, email: true, name: true } },
      },
    });

    return NextResponse.json({ success: true, shop: updated });
  } catch (error) {
    console.error('Error updating shop:', error);
    return NextResponse.json({ error: 'Failed to update shop' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    await prisma.shop.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Shop deleted' });
  } catch (error) {
    console.error('Error deleting shop:', error);
    return NextResponse.json({ error: 'Failed to delete shop' }, { status: 500 });
  }
}
