import { prisma } from '@/lib/prisma';

function logRejected(label: string, reason: unknown) {
  console.error(`[home-dashboard] ${label} failed:`, reason);
}

/** Safe defaults when a Prisma query rejects (e.g. enum mismatch on production DB). */
export async function loadHomeDashboardQueries(userEmail: string) {
  const results = await Promise.allSettled([
    prisma.user.findUnique({
      where: { email: userEmail },
      select: {
        id: true,
        name: true,
        email: true,
        coins: true,
        xp: true,
        level: true,
        levelCoinsEarnedThisMonth: true,
      },
    }),
    prisma.pull.findMany({
      where: {
        user: { email: userEmail },
        cardId: { not: null },
        cardValue: { gte: 100 },
      },
      orderBy: { timestamp: 'desc' },
      take: 3,
      include: {
        card: { select: { name: true, imageUrlGatherer: true, rarity: true, coinValue: true } },
      },
    }),
    prisma.pull.findMany({
      where: {
        user: { email: userEmail },
        cardId: { not: null },
      },
      orderBy: { timestamp: 'desc' },
      take: 5,
      include: {
        card: { select: { name: true, imageUrlGatherer: true, rarity: true, coinValue: true } },
      },
    }),
    prisma.pull.count({ where: { user: { email: userEmail } } }),
    prisma.battleParticipant.count({ where: { user: { email: userEmail } } }),
    prisma.pull.findFirst({
      where: {
        timestamp: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        cardValue: { not: null },
        cardId: { not: null },
      },
      orderBy: { cardValue: 'desc' },
      include: {
        user: { select: { name: true } },
        card: {
          select: {
            name: true,
            imageUrlGatherer: true,
            rarity: true,
            coinValue: true,
          },
        },
        box: { select: { id: true, name: true } },
      },
    }),
    prisma.battle.findMany({
      where: { status: { in: ['OPEN', 'FULL', 'READY', 'ACTIVE'] } },
      orderBy: { createdAt: 'desc' },
      take: 3,
      include: {
        box: { select: { name: true } },
        _count: { select: { participants: true } },
      },
    }),
    prisma.box.findFirst({
      where: { isActive: true },
      orderBy: { price: 'asc' },
      select: { price: true },
    }),
    prisma.pull.aggregate({
      where: { user: { email: userEmail }, cardId: { not: null } },
      _sum: { cardValue: true },
    }),
  ]);

  const labels = [
    'user',
    'recentHits',
    'recentPulls',
    'totalPulls',
    'totalBattles',
    'bestPullToday',
    'activeBattles',
    'cheapestBox',
    'collectionValueAgg',
  ] as const;

  results.forEach((r, i) => {
    if (r.status === 'rejected') logRejected(labels[i], r.reason);
  });

  const user = results[0].status === 'fulfilled' ? results[0].value : null;
  const recentHits = results[1].status === 'fulfilled' ? results[1].value : [];
  const recentPulls = results[2].status === 'fulfilled' ? results[2].value : [];
  const totalPulls = results[3].status === 'fulfilled' ? results[3].value : 0;
  const totalBattles = results[4].status === 'fulfilled' ? results[4].value : 0;
  const bestPullToday = results[5].status === 'fulfilled' ? results[5].value : null;
  const activeBattles = results[6].status === 'fulfilled' ? results[6].value : [];
  const cheapestBox = results[7].status === 'fulfilled' ? results[7].value : null;
  const collectionValueAgg =
    results[8].status === 'fulfilled'
      ? results[8].value
      : { _sum: { cardValue: null } };

  return {
    user,
    recentHits,
    recentPulls,
    totalPulls,
    totalBattles,
    bestPullToday,
    activeBattles,
    cheapestBox,
    collectionValueAgg,
  };
}
