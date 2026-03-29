/**
 * Dev seed for LeaderboardEntry (optional). Run: npx tsx prisma/seed.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: { isBot: false },
    take: 5,
    orderBy: { createdAt: 'asc' },
  });
  if (users.length === 0) {
    console.log('No users to seed leaderboard entries.');
    return;
  }

  let i = 0;
  for (const u of users) {
    i += 1;
    await prisma.leaderboardEntry.upsert({
      where: { userId: u.id },
      create: {
        userId: u.id,
        totalPoints: 5000 - i * 200,
        weeklyPoints: 400 - i * 40,
        monthlyPoints: 1200 - i * 100,
        allTimePoints: 8000 - i * 300,
        currentStreak: i % 4,
        bestStreak: 5 + i,
        battlesThisWeek: 3 + i,
        totalBattles: 20 + i * 2,
        totalWins: 10 + i,
        totalLosses: 5 + i,
        lastBattleAt: new Date(),
      },
      update: {},
    });
  }

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

  console.log(`Seeded ${users.length} leaderboard rows.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
