import { prisma } from '@/lib/prisma';

/** Legacy monthly coin-based leaderboard row (prizes) */
export interface MonthlyLeaderboardRow {
  rank: number;
  points: number;
  userId: string;
  userName: string;
  userAvatar: string | null;
  battlesWon: number;
  battlesPlayed: number;
  totalCoinsWon: number;
  prize: number;
  title: string | null;
}

export const PRIZE_CONFIG = [
  { rank: 1, prize: 5000, title: 'Champion' },
  { rank: 2, prize: 2500, title: 'Runner Up' },
  { rank: 3, prize: 1000, title: 'Third Place' },
  { rank: 4, prize: 500, title: 'Top 5' },
  { rank: 5, prize: 500, title: 'Top 5' },
  { rank: 6, prize: 250, title: 'Top 10' },
  { rank: 7, prize: 250, title: 'Top 10' },
  { rank: 8, prize: 250, title: 'Top 10' },
  { rank: 9, prize: 250, title: 'Top 10' },
  { rank: 10, prize: 250, title: 'Top 10' },
];

/**
 * Fetch leaderboard data for a given month/year.
 * Aggregates battle wins and participation from the database.
 */
export async function getLeaderboard(month: number, year: number, limit = 100): Promise<MonthlyLeaderboardRow[]> {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59, 999);

  try {
  const data = await prisma.$queryRaw<Array<{
    userId: string;
    userName: string | null;
    userAvatar: string | null;
    battlesWon: bigint;
    battlesPlayed: bigint;
    totalCoinsWon: bigint;
  }>>`
    SELECT
      u.id as "userId",
      u.name as "userName",
      u.avatar as "userAvatar",
      COALESCE(COUNT(DISTINCT CASE WHEN b."winnerId" = u.id THEN b.id END), 0) as "battlesWon",
      COALESCE(COUNT(DISTINCT bp."battleId"), 0) as "battlesPlayed",
      COALESCE(SUM(CASE WHEN b."winnerId" = u.id THEN bp."totalValue" ELSE 0 END), 0) as "totalCoinsWon"
    FROM "User" u
    LEFT JOIN "BattleParticipant" bp ON bp."userId" = u.id
    LEFT JOIN "Battle" b ON b.id = bp."battleId"
      AND b.status IN ('FINISHED_WIN', 'FINISHED_DRAW')
      AND b."finishedAt" >= ${startDate}
      AND b."finishedAt" <= ${endDate}
    WHERE u."isBot" = false
    GROUP BY u.id, u.name, u.avatar
    HAVING COUNT(DISTINCT bp."battleId") > 0
    ORDER BY
      COALESCE(SUM(CASE WHEN b."winnerId" = u.id THEN bp."totalValue" ELSE 0 END), 0) DESC,
      COALESCE(COUNT(DISTINCT CASE WHEN b."winnerId" = u.id THEN b.id END), 0) DESC
    LIMIT ${limit}
  `;

  return data.map((entry, index) => {
    const battlesWon = Number(entry.battlesWon);
    const battlesPlayed = Number(entry.battlesPlayed);
    const totalCoinsWon = Number(entry.totalCoinsWon);
    const points = totalCoinsWon + (battlesWon * 1000);
    const rank = index + 1;
    const prizeInfo = PRIZE_CONFIG.find(p => p.rank === rank);

    return {
      rank,
      points,
      userId: entry.userId,
      userName: entry.userName || 'Anonymous',
      userAvatar: entry.userAvatar || null,
      battlesWon,
      battlesPlayed,
      totalCoinsWon,
      prize: prizeInfo?.prize ?? 0,
      title: prizeInfo?.title ?? null,
    };
  });
  } catch (e) {
    console.error('[getLeaderboard] query failed', e);
    return [];
  }
}
