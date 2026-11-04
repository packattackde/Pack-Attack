import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyFulfillmentScriptKey } from '@/lib/fulfillment-script-auth';

export const dynamic = 'force-dynamic';

/** Local bridge marks order prepared after cart fill on admin PC. */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!verifyFulfillmentScriptKey(request)) {
    return NextResponse.json({ error: 'Invalid fulfillment key' }, { status: 401 });
  }

  const { id } = await params;
  let cartUrl: string | undefined;
  try {
    const body = (await request.json()) as { cartUrl?: string };
    cartUrl = body.cartUrl;
  } catch {
    /* optional body */
  }

  const order = await prisma.order.update({
    where: { id },
    data: {
      status: 'PROCESSING',
      fulfillmentChannel: 'CARDMARKET',
      cardmarketQueuedAt: new Date(),
      cardmarketPreparedAt: new Date(),
      cardmarketLastError: null,
    },
  });

  return NextResponse.json({
    success: true,
    cartUrl,
    orderId: order.id,
  });
}
