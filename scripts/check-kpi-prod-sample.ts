import { prisma } from '../src/lib/prisma';
import { aggregateKpi } from '../src/lib/kpi/aggregate-kpi';

async function main() {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [pullCount, pullCoinSum, pageViewCount] = await Promise.all([
    prisma.pull.count({
      where: { timestamp: { gte: since }, user: { isBot: false } },
    }),
    prisma.$queryRaw<Array<{ coins: number }>>`
      SELECT COALESCE(SUM(b.price), 0)::float as coins
      FROM "Pull" p
      INNER JOIN "Box" b ON b.id = p."boxId"
      INNER JOIN "User" u ON u.id = p."userId"
      WHERE p."timestamp" >= ${since} AND u."isBot" = false
    `,
    prisma.pageView.count({ where: { viewedAt: { gte: since } } }).catch(() => -1),
  ]);

  const kpi = await aggregateKpi(7);
  const today = kpi.pnlByDay[kpi.pnlByDay.length - 1]?.date;
  const todayEv = kpi.evPerCardByDay[kpi.evPerCardByDay.length - 1];

  console.log(
    JSON.stringify(
      {
        since: since.toISOString(),
        pulls24h: pullCount,
        estimatedCoinSpendOnPacks24h: pullCoinSum[0]?.coins ?? 0,
        pageViews24h: pageViewCount,
        kpiTodayDateKey: today,
        kpiEvToday: todayEv,
        kpiEvSeriesNonZero: kpi.evPerCardByDay.filter((d) => d.avgEv > 0).length,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());