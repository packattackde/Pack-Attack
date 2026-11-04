import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getCheckoutSession, isStripeConfigured } from '@/lib/stripe';
import { fulfillPendingCoinPurchase } from '@/lib/fulfill-coin-purchase';
import { z } from 'zod';

const verifySchema = z.object({
  sessionId: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    // Check if Stripe is configured
    if (!isStripeConfigured()) {
      return NextResponse.json(
        { error: 'Stripe is not configured' },
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
    const { sessionId } = verifySchema.parse(body);

    // Get checkout session from Stripe
    const checkoutSession = await getCheckoutSession(sessionId);
    
    if (!checkoutSession) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Find the transaction
    const transaction = await prisma.transaction.findUnique({
      where: { stripePaymentId: sessionId },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    // Verify transaction belongs to this user
    if (transaction.userId !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Check payment status
    if (checkoutSession.payment_status === 'paid') {
      const result = await fulfillPendingCoinPurchase(
        { stripePaymentId: sessionId },
        { expectedUserId: user.id }
      );

      if (result.completed) {
        return NextResponse.json({
          success: true,
          status: 'completed',
          coinsAdded: result.coinsAdded,
          newBalance: result.newBalance ?? Number(user.coins),
        });
      }

      const updatedUser = await prisma.user.findUnique({ where: { id: user.id } });
      return NextResponse.json({
        success: true,
        status: result.alreadyCompleted ? 'already_completed' : 'pending',
        coinsAdded: result.alreadyCompleted ? result.coinsAdded : 0,
        newBalance: Number(updatedUser?.coins ?? user.coins),
      });
    }

    // Payment not completed
    return NextResponse.json({
      success: false,
      status: checkoutSession.payment_status,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }
    console.error('Error verifying Stripe payment:', error);
    return NextResponse.json(
      { error: 'Failed to verify payment' },
      { status: 500 }
    );
  }
}









