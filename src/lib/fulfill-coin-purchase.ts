import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export type FulfillCoinPurchaseResult = {
  completed: boolean;
  alreadyCompleted: boolean;
  coinsAdded: number;
  userId?: string;
  newBalance?: number;
};

type TransactionLookup =
  | { id: string }
  | { stripePaymentId: string }
  | { paypalOrderId: string };

/**
 * Idempotently completes a PENDING coin purchase transaction and credits the user once.
 */
export async function fulfillPendingCoinPurchase(
  lookup: TransactionLookup,
  options?: { expectedUserId?: string; paypalPayerId?: string }
): Promise<FulfillCoinPurchaseResult> {
  const whereLookup = lookup as Prisma.TransactionWhereInput;

  return prisma.$transaction(async (tx) => {
    const pending = await tx.transaction.findFirst({
      where: { ...whereLookup, status: 'PENDING' },
    });

    if (!pending) {
      const existing = await tx.transaction.findFirst({ where: whereLookup });
      return {
        completed: false,
        alreadyCompleted: existing?.status === 'COMPLETED',
        coinsAdded: Number(existing?.coins ?? 0),
        userId: existing?.userId,
      };
    }

    if (options?.expectedUserId && pending.userId !== options.expectedUserId) {
      throw new Error('TRANSACTION_USER_MISMATCH');
    }

    const updated = await tx.transaction.updateMany({
      where: { id: pending.id, status: 'PENDING' },
      data: {
        status: 'COMPLETED',
        ...(options?.paypalPayerId ? { paypalPayerId: options.paypalPayerId } : {}),
      },
    });

    if (updated.count !== 1) {
      const existing = await tx.transaction.findUnique({ where: { id: pending.id } });
      return {
        completed: false,
        alreadyCompleted: existing?.status === 'COMPLETED',
        coinsAdded: Number(existing?.coins ?? 0),
        userId: existing?.userId,
      };
    }

    const coins = Number(pending.coins);
    const user = await tx.user.update({
      where: { id: pending.userId },
      data: { coins: { increment: coins } },
    });

    return {
      completed: true,
      alreadyCompleted: false,
      coinsAdded: coins,
      userId: pending.userId,
      newBalance: Number(user.coins),
    };
  });
}
