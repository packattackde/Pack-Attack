import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { invalidateUserCache } from '@/lib/cache';

/**
 * Deletes a user and all related rows that would otherwise block FK constraints.
 * Prisma schema uses many User relations without onDelete: Cascade; a plain
 * user.delete() fails with a foreign key error in PostgreSQL.
 */
export async function deleteUserWithRelations(userId: string, userEmail: string | null) {
  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    // Orphaned Twitch link rows (no Prisma relation on User model)
    await tx.twitchLinkToken.deleteMany({ where: { userId } });

    // BattlePull rows pointing at this user's Pulls (Pull FK blocks delete)
    await tx.battlePull.deleteMany({ where: { pull: { userId } } });

    // Moderation rows where this user was the moderator
    await tx.chatBan.deleteMany({ where: { createdById: userId } });

    // Remove user from battles; cascades BattlePull for those participants
    await tx.battleParticipant.deleteMany({ where: { userId } });

    // Battles created by this user (cascade removes participants & battle pulls for those battles)
    await tx.battle.deleteMany({ where: { creatorId: userId } });

    await tx.battle.updateMany({
      where: { winnerId: userId },
      data: { winnerId: null },
    });

    await tx.transaction.deleteMany({ where: { userId } });
    await tx.saleHistory.deleteMany({ where: { userId } });
    await tx.order.deleteMany({ where: { userId } });
    await tx.shopOrder.deleteMany({ where: { userId } });
    await tx.shopBoxOrder.deleteMany({ where: { userId } });

    // Shop owner: clear shop-scoped data before Shop (otherwise FK blocks)
    const shop = await tx.shop.findUnique({ where: { ownerId: userId } });
    if (shop) {
      await tx.shopBoxOrder.deleteMany({ where: { shopId: shop.id } });
      await tx.shopPayout.deleteMany({ where: { shopId: shop.id } });
      await tx.shopOrder.deleteMany({ where: { shopId: shop.id } });
      await tx.shop.delete({ where: { id: shop.id } });
    }

    // Cart holds CartItems that reference Pull — remove cart before deleting pulls
    await tx.cart.deleteMany({ where: { userId } });

    await tx.pull.deleteMany({ where: { userId } });

    await tx.user.delete({ where: { id: userId } });
  });

  invalidateUserCache(userId, userEmail ?? undefined);
}
