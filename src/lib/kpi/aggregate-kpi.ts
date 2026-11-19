import { prisma } from '@/lib/prisma';
import { coinsToEur } from './coin-eur';
import {
  buildDayKeys,
  dateKeyFromDb,
  KPI_TIMEZONE,
  sqlSinceBerlinDaysAgo,
} from './berlin-dates';
import type {
  KpiPayload,
  KpiRangeDays,
  KpiSummary,
  DailyBattles,
  DailyCoinPackages,
  DailyCount,
  DailyDelivery,
  DailyEv,
  DailyPnl,
} from './types';
import { COIN_PACKAGE_EUR_TIERS } from './types';

const COMPLAINT_CATEGORIES_SQL =
  "('PACK_ISSUE', 'BATTLE_ISSUE', 'SHOP_ISSUE', 'GENERAL')";

const OPEN_STATUSES = ['OPEN', 'CLAIMED', 'IN_PROGRESS'] as const;

const dayBerlin = (column: string) =>
  `((${column} AT TIME ZONE 'UTC') AT TIME ZONE '${KPI_TIMEZONE}')::date`;

/** Box.price is per pack open; each Pull row is one card inside that pack. */
const packCoinSpendSql = `COALESCE(SUM(b.price / NULLIF(b."cardsPerPack", 0)), 0)::float`;
const packOpenCountSql = `ROUND(COALESCE(SUM(1.0 / NULLIF(b."cardsPerPack", 0)), 0))::int`;

const sinceSql = sqlSinceBerlinDaysAgo();

function emptyByPrice(): Record<string, number> {
  const o: Record<string, number> = {};
  for (const tier of COIN_PACKAGE_EUR_TIERS) o[String(tier)] = 0;
  return o;
}

function fillCounts(dayKeys: string[], rows: Array<{ day: Date | string; count: number }>): DailyCount[] {
  const map = new Map<string, number>();
  for (const r of rows) {
    map.set(dateKeyFromDb(r.day), Number(r.count));
  }
  return dayKeys.map((date) => ({ date, count: map.get(date) ?? 0 }));
}

export { KPI_TIMEZONE };

export async function aggregateKpi(rangeDays: KpiRangeDays): Promise<KpiPayload> {
  const dayKeys = buildDayKeys(rangeDays);
  const todayKey = dayKeys[dayKeys.length - 1];

  const [
    revenueRows,
    saleCostRows,
    shippingCostRows,
    packCostRows,
    packageRows,
    hpHitRows,
    openComplaintsCount,
    complaintOpenedRows,
    cardsSoldRows,
    deliveryOrderRows,
    deliveryCardRows,
    evRows,
    battleRows,
    pullsByDayRows,
    packCoinsByDayRows,
  ] = await Promise.all([
    prisma.$queryRawUnsafe<Array<{ day: Date; revenue: number }>>(
      `SELECT ${dayBerlin('t."timestamp"')} as day,
              SUM(t.amount)::float as revenue
       FROM "Transaction" t
       INNER JOIN "User" u ON u.id = t."userId"
       WHERE t.status = 'COMPLETED'
         AND u."isBot" = false
         AND t."timestamp" >= ${sinceSql}
       GROUP BY 1
       ORDER BY 1`,
      rangeDays,
    ),
    prisma.$queryRawUnsafe<Array<{ day: Date; coins: number }>>(
      `SELECT ${dayBerlin('s."timestamp"')} as day,
              SUM(s."coinsReceived")::float as coins
       FROM "SaleHistory" s
       INNER JOIN "User" u ON u.id = s."userId"
       WHERE s."timestamp" >= ${sinceSql}
         AND u."isBot" = false
       GROUP BY 1
       ORDER BY 1`,
      rangeDays,
    ),
    prisma.$queryRawUnsafe<Array<{ day: Date; coins: number }>>(
      `SELECT ${dayBerlin('o."createdAt"')} as day,
              SUM(o."shippingCost")::float as coins
       FROM "Order" o
       INNER JOIN "User" u ON u.id = o."userId"
       WHERE o."shippingMethod" = 'COINS'
         AND o."createdAt" >= ${sinceSql}
         AND u."isBot" = false
       GROUP BY 1
       ORDER BY 1`,
      rangeDays,
    ),
    prisma.$queryRawUnsafe<Array<{ day: Date; coins: number }>>(
      `SELECT ${dayBerlin('p."timestamp"')} as day,
              ${packCoinSpendSql} as coins
       FROM "Pull" p
       INNER JOIN "Box" b ON b.id = p."boxId"
       INNER JOIN "User" u ON u.id = p."userId"
       WHERE p."timestamp" >= ${sinceSql}
         AND u."isBot" = false
       GROUP BY 1
       ORDER BY 1`,
      rangeDays,
    ),
    prisma.$queryRawUnsafe<Array<{ day: Date; amount: number; count: number }>>(
      `SELECT ${dayBerlin('t."timestamp"')} as day,
              t.amount::float as amount,
              COUNT(*)::int as count
       FROM "Transaction" t
       INNER JOIN "User" u ON u.id = t."userId"
       WHERE t.status = 'COMPLETED'
         AND u."isBot" = false
         AND t."timestamp" >= ${sinceSql}
       GROUP BY 1, t.amount
       ORDER BY 1`,
      rangeDays,
    ),
    prisma.$queryRawUnsafe<Array<{ day: Date; count: number }>>(
      `SELECT ${dayBerlin('"viewedAt"')} as day,
              COUNT(*)::int as count
       FROM "PageView"
       WHERE path = '/'
         AND "viewedAt" >= ${sinceSql}
       GROUP BY 1
       ORDER BY 1`,
      rangeDays,
    ).catch(() => [] as Array<{ day: Date; count: number }>),
    prisma.feedback.count({
      where: {
        category: { in: ['PACK_ISSUE', 'BATTLE_ISSUE', 'SHOP_ISSUE', 'GENERAL'] },
        status: { in: [...OPEN_STATUSES] },
      },
    }),
    prisma.$queryRawUnsafe<Array<{ day: Date; count: number }>>(
      `SELECT ${dayBerlin('"createdAt"')} as day,
              COUNT(*)::int as count
       FROM "Feedback"
       WHERE "createdAt" >= ${sinceSql}
         AND category IN ${COMPLAINT_CATEGORIES_SQL}
       GROUP BY 1
       ORDER BY 1`,
      rangeDays,
    ),
    prisma.$queryRawUnsafe<Array<{ day: Date; count: number }>>(
      `SELECT ${dayBerlin('s."timestamp"')} as day,
              COUNT(*)::int as count
       FROM "SaleHistory" s
       INNER JOIN "User" u ON u.id = s."userId"
       WHERE s."timestamp" >= ${sinceSql}
         AND u."isBot" = false
       GROUP BY 1
       ORDER BY 1`,
      rangeDays,
    ),
    prisma.$queryRawUnsafe<Array<{ day: Date; count: number }>>(
      `SELECT ${dayBerlin('o."createdAt"')} as day,
              COUNT(*)::int as count
       FROM "Order" o
       INNER JOIN "User" u ON u.id = o."userId"
       WHERE o."createdAt" >= ${sinceSql}
         AND u."isBot" = false
       GROUP BY 1
       ORDER BY 1`,
      rangeDays,
    ),
    prisma.$queryRawUnsafe<Array<{ day: Date; count: number }>>(
      `SELECT ${dayBerlin('o."createdAt"')} as day,
              COUNT(oi.id)::int as count
       FROM "Order" o
       INNER JOIN "User" u ON u.id = o."userId"
       INNER JOIN "OrderItem" oi ON oi."orderId" = o.id
       WHERE o."createdAt" >= ${sinceSql}
         AND u."isBot" = false
       GROUP BY 1
       ORDER BY 1`,
      rangeDays,
    ),
    prisma.$queryRawUnsafe<Array<{ day: Date; avg_ev: number }>>(
      `SELECT ${dayBerlin('p."timestamp"')} as day,
              AVG(COALESCE(p."cardValue", c."coinValue"))::float as avg_ev
       FROM "Pull" p
       LEFT JOIN "Card" c ON p."cardId" = c.id
       INNER JOIN "User" u ON u.id = p."userId"
       WHERE p."timestamp" >= ${sinceSql}
         AND u."isBot" = false
       GROUP BY 1
       ORDER BY 1`,
      rangeDays,
    ),
    prisma.$queryRawUnsafe<Array<{ day: Date; battles: number; rounds: number }>>(
      `SELECT ${dayBerlin('b."finishedAt"')} as day,
              COUNT(*)::int as battles,
              COALESCE(SUM(b.rounds), 0)::int as rounds
       FROM "Battle" b
       WHERE b.status IN ('FINISHED_WIN', 'FINISHED_DRAW')
         AND b."finishedAt" IS NOT NULL
         AND b."finishedAt" >= ${sinceSql}
       GROUP BY 1
       ORDER BY 1`,
      rangeDays,
    ),
    prisma.$queryRawUnsafe<Array<{ day: Date; count: number }>>(
      `SELECT ${dayBerlin('p."timestamp"')} as day,
              ${packOpenCountSql} as count
       FROM "Pull" p
       INNER JOIN "Box" b ON b.id = p."boxId"
       INNER JOIN "User" u ON u.id = p."userId"
       WHERE p."timestamp" >= ${sinceSql}
         AND u."isBot" = false
       GROUP BY 1
       ORDER BY 1`,
      rangeDays,
    ),
    prisma.$queryRawUnsafe<Array<{ day: Date; coins: number }>>(
      `SELECT ${dayBerlin('p."timestamp"')} as day,
              ${packCoinSpendSql} as coins
       FROM "Pull" p
       INNER JOIN "Box" b ON b.id = p."boxId"
       INNER JOIN "User" u ON u.id = p."userId"
       WHERE p."timestamp" >= ${sinceSql}
         AND u."isBot" = false
       GROUP BY 1
       ORDER BY 1`,
      rangeDays,
    ),
  ]);

  const revenueByDay = new Map<string, number>();
  for (const r of revenueRows) {
    revenueByDay.set(dateKeyFromDb(r.day), Number(r.revenue));
  }

  const costByDay = new Map<string, number>();
  for (const r of saleCostRows) {
    const key = dateKeyFromDb(r.day);
    costByDay.set(key, (costByDay.get(key) ?? 0) + coinsToEur(Number(r.coins)));
  }
  for (const r of shippingCostRows) {
    const key = dateKeyFromDb(r.day);
    costByDay.set(key, (costByDay.get(key) ?? 0) + coinsToEur(Number(r.coins)));
  }
  for (const r of packCostRows) {
    const key = dateKeyFromDb(r.day);
    costByDay.set(key, (costByDay.get(key) ?? 0) + coinsToEur(Number(r.coins)));
  }

  const pnlByDay: DailyPnl[] = dayKeys.map((date) => {
    const revenueEur = Math.round((revenueByDay.get(date) ?? 0) * 100) / 100;
    const costEur = Math.round((costByDay.get(date) ?? 0) * 100) / 100;
    return {
      date,
      revenueEur,
      costEur,
      profitEur: Math.round((revenueEur - costEur) * 100) / 100,
    };
  });

  const packagesByDayMap = new Map<string, Record<string, number>>();
  for (const row of packageRows) {
    const key = dateKeyFromDb(row.day);
    if (!packagesByDayMap.has(key)) packagesByDayMap.set(key, emptyByPrice());
    const bucket = packagesByDayMap.get(key)!;
    const priceKey = String(Math.round(Number(row.amount)));
    if (bucket[priceKey] !== undefined) {
      bucket[priceKey] += Number(row.count);
    }
  }

  const coinPackagesByDay: DailyCoinPackages[] = dayKeys.map((date) => ({
    date,
    byPrice: { ...emptyByPrice(), ...(packagesByDayMap.get(date) ?? {}) },
  }));

  const coinPackagesRangeTotal = emptyByPrice();
  for (const row of coinPackagesByDay) {
    for (const tier of COIN_PACKAGE_EUR_TIERS) {
      const k = String(tier);
      coinPackagesRangeTotal[k] += row.byPrice[k] ?? 0;
    }
  }

  const hpHitsByDay = fillCounts(dayKeys, hpHitRows);
  const complaintsOpenedByDay = fillCounts(dayKeys, complaintOpenedRows);
  const cardsSoldByDay = fillCounts(dayKeys, cardsSoldRows);
  const packsOpenedByDay = fillCounts(dayKeys, pullsByDayRows);

  const packCoinsMap = new Map(
    packCoinsByDayRows.map((r) => [dateKeyFromDb(r.day), Number(r.coins)]),
  );
  const packCoinsSpentByDay: DailyCount[] = dayKeys.map((date) => ({
    date,
    count: Math.round((packCoinsMap.get(date) ?? 0) * 100) / 100,
  }));

  const ordersMap = new Map(deliveryOrderRows.map((r) => [dateKeyFromDb(r.day), Number(r.count)]));
  const cardsMap = new Map(deliveryCardRows.map((r) => [dateKeyFromDb(r.day), Number(r.count)]));
  const deliveryByDay: DailyDelivery[] = dayKeys.map((date) => ({
    date,
    orders: ordersMap.get(date) ?? 0,
    cards: cardsMap.get(date) ?? 0,
  }));

  const evMap = new Map(evRows.map((r) => [dateKeyFromDb(r.day), Number(r.avg_ev)]));
  const evPerCardByDay: DailyEv[] = dayKeys.map((date) => ({
    date,
    avgEv: Math.round((evMap.get(date) ?? 0) * 100) / 100,
  }));

  const battleMap = new Map(
    battleRows.map((r) => [
      dateKeyFromDb(r.day),
      { battles: Number(r.battles), rounds: Number(r.rounds) },
    ]),
  );
  const battlesByDay: DailyBattles[] = dayKeys.map((date) => ({
    date,
    battles: battleMap.get(date)?.battles ?? 0,
    rounds: battleMap.get(date)?.rounds ?? 0,
  }));

  const todayPacks = packsOpenedByDay.find((d) => d.date === todayKey);
  const todayPackCoins = packCoinsSpentByDay.find((d) => d.date === todayKey);
  const todayHits = hpHitsByDay.find((d) => d.date === todayKey);
  const todaySold = cardsSoldByDay.find((d) => d.date === todayKey);
  const todayDelivery = deliveryByDay.find((d) => d.date === todayKey);
  const todayEv = evPerCardByDay.find((d) => d.date === todayKey);
  const todayBattles = battlesByDay.find((d) => d.date === todayKey);

  const summary: KpiSummary = {
    revenueEur: Math.round(pnlByDay.reduce((s, d) => s + d.revenueEur, 0) * 100) / 100,
    costEur: Math.round(pnlByDay.reduce((s, d) => s + d.costEur, 0) * 100) / 100,
    profitEur: Math.round(pnlByDay.reduce((s, d) => s + d.profitEur, 0) * 100) / 100,
    hpHitsToday: todayHits?.count ?? 0,
    openComplaints: openComplaintsCount,
    avgEvPerCardToday: todayEv?.avgEv ?? 0,
    cardsSoldToday: todaySold?.count ?? 0,
    deliveryOrdersToday: todayDelivery?.orders ?? 0,
    deliveryCardsToday: todayDelivery?.cards ?? 0,
    battlesToday: todayBattles?.battles ?? 0,
    roundsToday: todayBattles?.rounds ?? 0,
    packsOpenedToday: todayPacks?.count ?? 0,
    packCoinsSpentToday: todayPackCoins?.count ?? 0,
  };

  return {
    rangeDays,
    mock: false,
    timezone: KPI_TIMEZONE,
    summary,
    pnlByDay,
    coinPackagesByDay,
    hpHitsByDay,
    complaintsOpenedByDay,
    cardsSoldByDay,
    deliveryByDay,
    evPerCardByDay,
    battlesByDay,
    packsOpenedByDay,
    packCoinsSpentByDay,
    coinPackagesRangeTotal,
  };
}