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

    // Build update data
    const updateData: any = {};

    // Handle status update
    if (status) {
      const validStatuses = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
      }
      updateData.status = status;
    }

    // Handle shop assignment
    if (assignedShopId !== undefined) {
      if (assignedShopId === null || assignedShopId === '') {
        // Unassign from shop
        updateData.assignedShopId = null;
        updateData.assignedAt = null;
      } else {
        // Verify shop exists
        const shop = await prisma.shop.findUnique({
          where: { id: assignedShopId },
        });
        if (!shop) {
          return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
        }
        updateData.assignedShopId = assignedShopId;
        updateData.assignedAt = new Date();
      }
    }

    // Handle tracking info
    if (trackingNumber !== undefined) {
      updateData.trackingNumber = trackingNumber || null;
    }
    if (trackingUrl !== undefined) {
      updateData.trackingUrl = trackingUrl || null;
    }
    if (notes !== undefined) {
      updateData.notes = notes || null;
    }

    const order = await prisma.order.update({
      where: { id },
      data: updateData,
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











