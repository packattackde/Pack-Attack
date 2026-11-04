import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createPayPalOrder, isPayPalConfigured } from '@/lib/paypal';
import { getPackageByPrice } from '@/lib/stripe';
import { z } from 'zod';
import { rateLimit } from '@/lib/rate-limit';

const createOrderSchema = z.object({
  /** Package price in EUR — must match a server-side COIN_PACKAGES tier */
  price: z.number().min(5).max(500),
});

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting - 3 payment attempts per minute
    const rateLimitResult = await rateLimit(request, 'payment');
    if (!rateLimitResult.success && rateLimitResult.response) {
      return rateLimitResult.response;
    }

    // Check if PayPal is configured
    if (!isPayPalConfigured()) {
      return NextResponse.json(
        { error: 'PayPal is not configured' },
        { status: 503 }
      );
    }

    // Check authentication
    const session = await getCurrentSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Parse request body
    const body = await request.json();
    const { price } = createOrderSchema.parse(body);
    const coinPackage = getPackageByPrice(price);
    if (!coinPackage) {
      return NextResponse.json({ error: 'Invalid coin package' }, { status: 400 });
    }

    const amount = coinPackage.price;
    const coins = coinPackage.amount;

    // Create PayPal order
    const paypalOrder = await createPayPalOrder(amount, coins);

    // Create pending transaction in database
    await prisma.transaction.create({
      data: {
        userId: user.id,
        amount: amount,
        coins: coins,
        paypalOrderId: paypalOrder.id,
        status: 'PENDING',
      },
    });

    // Return order ID to client
    return NextResponse.json({
      success: true,
      orderId: paypalOrder.id,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }
    console.error('Error creating PayPal order:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}


