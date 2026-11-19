/** YYYY-MM-DD bucket keys (Europe/Berlin in aggregate-kpi). */
export type KpiRangeDays = 7 | 30 | 90;

export const COIN_PACKAGE_EUR_TIERS = [5, 10, 25, 50, 100, 250] as const;

export type CoinPackageTier = (typeof COIN_PACKAGE_EUR_TIERS)[number];

export type DailyCount = { date: string; count: number };

export type DailyPnl = {
  date: string;
  revenueEur: number;
  costEur: number;
  profitEur: number;
};

export type DailyCoinPackages = {
  date: string;
  byPrice: Record<string, number>;
};

export type DailyDelivery = {
  date: string;
  orders: number;
  cards: number;
};

export type DailyEv = { date: string; avgEv: number };

export type DailyBattles = {
  date: string;
  battles: number;
  rounds: number;
};

export type KpiSummary = {
  revenueEur: number;
  costEur: number;
  profitEur: number;
  hpHitsToday: number;
  openComplaints: number;
  avgEvPerCardToday: number;
  cardsSoldToday: number;
  deliveryOrdersToday: number;
  deliveryCardsToday: number;
  battlesToday: number;
  roundsToday: number;
};

export type KpiPayload = {
  rangeDays: KpiRangeDays;
  mock: boolean;
  timezone: string;
  summary: KpiSummary;
  pnlByDay: DailyPnl[];
  coinPackagesByDay: DailyCoinPackages[];
  hpHitsByDay: DailyCount[];
  complaintsOpenedByDay: DailyCount[];
  cardsSoldByDay: DailyCount[];
  deliveryByDay: DailyDelivery[];
  evPerCardByDay: DailyEv[];
  battlesByDay: DailyBattles[];
  coinPackagesRangeTotal: Record<string, number>;
};