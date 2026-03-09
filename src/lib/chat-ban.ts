import { prisma } from './prisma';

export interface BanStatus {
  banned: boolean;
  type: 'TIMEOUT' | 'BAN' | null;
  expiresAt: Date | null;
  reason: string | null;
}

/**
 * Check if a user is currently banned or timed out from chat.
 */
export async function getUserChatBanStatus(userId: string): Promise<BanStatus> {
  const now = new Date();

  const activeBan = await prisma.chatBan.findFirst({
    where: {
      userId,
      active: true,
      OR: [
        { type: 'BAN' },
        { type: 'TIMEOUT', expiresAt: { gt: now } },
      ],
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!activeBan) {
    // Also mark any expired timeouts as inactive (housekeeping)
    await prisma.chatBan.updateMany({
      where: {
        userId,
        type: 'TIMEOUT',
        active: true,
        expiresAt: { lt: now },
      },
      data: { active: false },
    }).catch(() => {}); // non-critical

    return { banned: false, type: null, expiresAt: null, reason: null };
  }

  return {
    banned: true,
    type: activeBan.type,
    expiresAt: activeBan.expiresAt,
    reason: activeBan.reason,
  };
}
