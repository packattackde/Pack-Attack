import type { KpiPayload, KpiRangeDays } from './types';
import { COIN_PACKAGE_EUR_TIERS } from './types';

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function buildDays(range: KpiRangeDays): string[] {
  return Array.from({ length: range }, (_, i) => daysAgo(range - 1 - i));
}

function pseudo(seed: number, min: number, max: number): number {
  const x = Math.sin(seed * 9999) * 10000;
  const f = x - Math.floor(x);
  return min + f * (max - min);
}

export function buildKpiMockData(rangeDays: KpiRangeDays): KpiPayload {
  const days = buildDays(rangeDays);

  const pnlByDay = days.map((date, i) => {
    const revenueEur = Math.round(pseudo(i, 180, 920) * 100) / 100;
    const costEur = Math.round(pseudo(i + 1, 90, 520) * 100) / 100;
    return {
      date,
      revenueEur,
      costEur,
      profitEur: Math.round((revenueEur - costEur) * 100) / 100,
    };
  });

  const coinPackagesByDay = days.map((date, i) => {
    const byPrice: Record<string, number> = {};
    for (const tier of COIN_PACKAGE_EUR_TIERS) {
      byPrice[String(tier)] = Math.floor(pseudo(i + tier, 0, 8));
    }
    return { date, byPrice };
  });

  const coinPackagesRangeTotal: Record<string, number> = {};
  for (const tier of COIN_PACKAGE_EUR_TIERS) {
    coinPackagesRangeTotal[String(tier)] = coinPackagesByDay.reduce(
      (s, row) => s + (row.byPrice[String(tier)] ?? 0),
      0,
    );
  }

  return {
    rangeDays,
    mock: true,
    timezone: 'Europe/Berlin',
    summary: {
      revenueEur: pnlByDay.reduce((s, d) => s + d.revenueEur, 0),
      costEur: pnlByDay.reduce((s, d) => s + d.costEur, 0),
      profitEur: pnlByDay.reduce((s, d) => s + d.profitEur, 0),
      hpHitsToday: Math.floor(pseudo(42, 800, 2400)),
      openComplaints: 12,
      avgEvPerCardToday: 1.42,
      cardsSoldToday: 87,
      deliveryOrdersToday: 14,
      deliveryCardsToday: 52,
      battlesToday: 23,
      roundsToday: 156,
      packsOpenedToday: 412,
      packCoinsSpentToday: 1000,
    },
    pnlByDay,
    coinPackagesByDay,
    hpHitsByDay: days.map((date, i) => ({
      date,
      count: Math.floor(pseudo(i, 400, 2200)),
    })),
    complaintsOpenedByDay: days.map((date, i) => ({
      date,
      count: Math.floor(pseudo(i + 3, 0, 6)),
    })),
    cardsSoldByDay: days.map((date, i) => ({
      date,
      count: Math.floor(pseudo(i + 5, 20, 180)),
    })),
    deliveryByDay: days.map((date, i) => ({
      date,
      orders: Math.floor(pseudo(i + 7, 2, 22)),
      cards: Math.floor(pseudo(i + 8, 8, 95)),
    })),
    evPerCardByDay: days.map((date, i) => ({
      date,
      avgEv: Math.round(pseudo(i + 9, 0.9, 2.1) * 100) / 100,
    })),
    battlesByDay: days.map((date, i) => ({
      date,
      battles: Math.floor(pseudo(i + 11, 5, 40)),
      rounds: Math.floor(pseudo(i + 12, 30, 320)),
    })),
    packsOpenedByDay: days.map((date, i) => ({
      date,
      count: Math.floor(pseudo(i + 13, 50, 500)),
    })),
    packCoinsSpentByDay: days.map((date, i) => ({
      date,
      count: Math.round(pseudo(i + 14, 200, 3500) * 100) / 100,
    })),
    coinPackagesRangeTotal,
  };
}