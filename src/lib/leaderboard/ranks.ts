import type { PrismaClient } from '@prisma/client';

/** Dense-style ties: same points share rank; next rank skips (1,2,2,4). Uses PostgreSQL RANK(). */
export async function recalculateAllRanks(prisma: PrismaClient): Promise<void> {
  await prisma.$executeRaw`
    WITH ranked AS (
      SELECT id, RANK() OVER (ORDER BY "totalPoints" DESC) AS rnk
      FROM "LeaderboardEntry"
    )
    UPDATE "LeaderboardEntry" AS le
    SET rank = ranked.rnk::integer
    FROM ranked
    WHERE le.id = ranked.id
  `;
}
