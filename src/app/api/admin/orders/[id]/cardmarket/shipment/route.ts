import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyFulfillmentScriptKey } from '@/lib/fulfillment-script-auth';
import { pullforgeOrderToShipment } from '@/lib/cardmarket-browser/prepare-pullforge-order';

export const dynamic = 'force-dynamic';

/** Local bridge fetches order ship-to + lines (x-fulfillment-key). */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!verifyFulfillmentScriptKey(request)) {
    return NextResponse.json({ error: 'Invalid fulfillment key' }, { status: 401 });
  }

  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true },
  });

  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  if (order.assignedShopId) {
    return NextResponse.json({ error: 'Order assigned to shop' }, { status: 400 });
  }

  if (order.items.length === 0) {
    return NextResponse.json({ error: 'Order has no items' }, { status: 400 });
  }

  return NextResponse.json({
    shipment: pullforgeOrderToShipment(order),
  });
}
