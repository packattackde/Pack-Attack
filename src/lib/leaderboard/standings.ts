import { Prisma } from '@prisma/client';
import type { PrismaClient } from '@prisma/client';
import { LEADERBOARD_CONFIG } from './config';

export type StandingsScope = 'weekly' | 'monthly' | 'all-time';

export type StandingRow = {
  rank: number;
  userId: string;
  userName: string | null;
  userAvatar: string | null;
  points: number;
  weeklyPoints: number;
  monthlyPoints: number;
  totalPoints: number;
  totalBattles: number;
  totalWins: number;
  totalLosses: number;
  currentStreak: number;
  battlesThisWeek: number;
};

function orderColumnSql(scope: StandingsScope) {
  switch (scope) {
    case 'weekly':
      return Prisma.sql`le."weeklyPoints"`;
    case 'monthly':
      return Prisma.sql`le."monthlyPoints"`;
    case 'all-time':
    default:
      return Prisma.sql`le."totalPoints"`;
  }
}

export async function getLeaderboardStandingsPage(
  prisma: PrismaClient,
  params: {
    scope: StandingsScope;
    page: number;
    pageSize: number;
    search?: string | null;
  }
): Promise<{ rows: StandingRow[]; total: number }> {
  const pageSize = Math.min(
    Math.max(1, params.pageSize),
    LEADERBOARD_CONFIG.pagination.maxPageSize
  );
  const page = Math.max(1, params.page);
  const skip = (page - 1) * pageSize;
  const search = params.search?.trim() ?? '';
  const orderCol = orderColumnSql(params.scope);

  const whereSearch =
    search.length > 0
      ? Prisma.sql`AND u.name ILIKE ${'%' + search + '%'}`
      : Prisma.empty;

  const totalRows = await prisma.$queryRaw<[{ c: bigint }]>`
    SELECT COUNT(*)::bigint AS c
    FROM "LeaderboardEntry" le
    INNER JOIN "User" u ON u.id = le."userId"
    WHERE u."isBot" = false
    ${whereSearch}
  `;
  const total = Number(totalRows[0]?.c ?? BigInt(0));

  const rawRows = await prisma.$queryRaw<
    Array<{
      rnk: bigint;
      userId: string;
      name: string | null;
      avatar: string | null;
      weeklyPoints: number;
      monthlyPoints: number;
      totalPoints: number;
      totalBattles: number;
      totalWins: number;
      totalLosses: number;
      currentStreak: number;
      battlesThisWeek: number;
    }>
  >`
    WITH ranked AS (
      SELECT
        le."userId",
        u.name,
        u.avatar,
        le."weeklyPoints",
        le."monthlyPoints",
        le."totalPoints",
        le."totalBattles",
        le."totalWins",
        le."totalLosses",
        le."currentStreak",
        le."battlesThisWeek",
        RANK() OVER (ORDER BY ${orderCol} DESC) AS rnk
      FROM "LeaderboardEntry" le
      INNER JOIN "User" u ON u.id = le."userId"
      WHERE u."isBot" = false
      ${whereSearch}
    )
    SELECT * FROM ranked
    ORDER BY rnk ASC
    LIMIT ${pageSize} OFFSET ${skip}
  `;

  const rows: StandingRow[] = rawRows.map(r => {
    const pts =
      params.scope === 'weekly'
        ? r.weeklyPoints
        : params.scope === 'monthly'
          ? r.monthlyPoints
          : r.totalPoints;
    return {
      rank: Number(r.rnk),
      userId: r.userId,
      userName: r.name,
      userAvatar: r.avatar,
      points: pts,
      weeklyPoints: r.weeklyPoints,
      monthlyPoints: r.monthlyPoints,
      totalPoints: r.totalPoints,
      totalBattles: r.totalBattles,
      totalWins: r.totalWins,
      totalLosses: r.totalLosses,
      currentStreak: r.currentStreak,
      battlesThisWeek: r.battlesThisWeek,
    };
  });

  return { rows, total };
}

export function winRatePercent(wins: number, losses: number): number {
  const played = wins + losses;
  if (played === 0) return 0;
  return Math.round((wins / played) * 1000) / 10;
}

export async function getUserStandingRank(
  prisma: PrismaClient,
  userId: string,
  scope: StandingsScope
): Promise<number | null> {
  const orderCol = orderColumnSql(scope);
  const rows = await prisma.$queryRaw<[{ rnk: bigint }]>`
    WITH ranked AS (
      SELECT
        le."userId",
        RANK() OVER (ORDER BY ${orderCol} DESC) AS rnk
      FROM "LeaderboardEntry" le
      INNER JOIN "User" u ON u.id = le."userId"
      WHERE u."isBot" = false
    )
    SELECT rnk FROM ranked WHERE "userId" = ${userId}
  `;
  const r = rows[0]?.rnk;
  return r !== undefined && r !== null ? Number(r) : null;
}
