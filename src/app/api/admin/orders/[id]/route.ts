import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET single order
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCurrentSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { id } = await params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        items: true,
        assignedShop: {
          select: {
            id: true,
            name: true,
            owner: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      order: {
        ...order,
        totalCoins: Number(order.totalCoins),
        shippingCost: Number(order.shippingCost),
        items: order.items.map(item => ({
          ...item,
          coinValue: Number(item.coinValue),
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 });
  }
}

// PATCH update order status or assign to shop
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCurrentSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status, assignedShopId, trackingNumber, trackingUrl, notes } = body;

    const updateData: any = {};

    if (status) {
      const validStatuses = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
      }
      updateData.status = status;
    }

    if (trackingNumber !== undefined) {
      updateData.trackingNumber = trackingNumber || null;
    }
    if (trackingUrl !== undefined) {
      updateData.trackingUrl = trackingUrl || null;
    }
    if (notes !== undefined) {
      updateData.notes = notes || null;
    }

    // Handle shop assignment — creates ShopBoxOrder entries so the shop sees them as normal orders
    if (assignedShopId !== undefined) {
      const existingOrder = await prisma.order.findUnique({
        where: { id },
        include: { items: true },
      });

      if (!existingOrder) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }

      if (assignedShopId === null || assignedShopId === '') {
        // Unassign: remove ShopBoxOrder entries created from this order
        await prisma.$transaction([
          prisma.shopBoxOrder.deleteMany({ where: { sourceOrderId: id } }),
          prisma.order.update({
            where: { id },
            data: { ...updateData, assignedShopId: null, assignedAt: null },
          }),
        ]);
      } else {
        const shop = await prisma.shop.findUnique({ where: { id: assignedShopId } });
        if (!shop) {
          return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
        }

        // Remove any previous ShopBoxOrder entries if re-assigning to a different shop
        await prisma.shopBoxOrder.deleteMany({ where: { sourceOrderId: id } });

        // Create one ShopBoxOrder per OrderItem — the shop sees each card as a separate order line
        const shopBoxOrders = existingOrder.items.map((item) => ({
          shopId: assignedShopId,
          userId: existingOrder.userId,
          status: 'PENDING' as const,
          cardName: item.cardName,
          cardImage: item.cardImage,
          cardValue: item.coinValue,
          shippingName: existingOrder.shippingName,
          shippingEmail: existingOrder.shippingEmail,
          shippingAddress: existingOrder.shippingAddress,
          shippingCity: existingOrder.shippingCity,
          shippingZip: existingOrder.shippingZip,
          shippingCountry: existingOrder.shippingCountry,
          shippingMethod: existingOrder.shippingMethod,
          shippingCost: existingOrder.shippingCost,
          notes: existingOrder.notes,
          sourceOrderId: id,
          sourceItemId: item.id,
        }));

        await prisma.$transaction([
          ...shopBoxOrders.map((data) =>
            prisma.shopBoxOrder.create({ data })
          ),
          prisma.order.update({
            where: { id },
            data: { ...updateData, assignedShopId, assignedAt: new Date() },
          }),
        ]);
      }
    } else if (Object.keys(updateData).length > 0) {
      await prisma.order.update({ where: { id }, data: updateData });
    }

    // Re-fetch the updated order
    const order = await prisma.order.findUnique({
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
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      order: {
        ...order,
        totalCoins: Number(order.totalCoins),
        shippingCost: Number(order.shippingCost),
        items: order.items.map(item => ({
          ...item,
          coinValue: Number(item.coinValue),
        })),
      },
    });
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}











