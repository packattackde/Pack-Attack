/**
 * Central leaderboard scoring & decay configuration (battle-weighted points).
 */

export const LEADERBOARD_CONFIG = {
  baseParticipation: 10,
  battleOutcome: {
    WIN: 50,
    LOSS: 5,
    DRAW: 20,
  },
  streakTiers: [
    { minConsecutiveWins: 10, multiplier: 2.0 },
    { minConsecutiveWins: 7, multiplier: 1.75 },
    { minConsecutiveWins: 5, multiplier: 1.5 },
    { minConsecutiveWins: 3, multiplier: 1.25 },
  ] as const,
  defaultStreakMultiplier: 1.0,
  cardHitBonus: {
    MYTHIC_RARE: 25,
    RARE: 10,
    UNCOMMON: 3,
    COMMON: 0,
  } as const,
  /** Highest threshold first — first match wins */
  amazingHitThresholds: [
    { minValue: 100.0, points: 50 },
    { minValue: 50.0, points: 30 },
    { minValue: 20.0, points: 15 },
    { minValue: 10.0, points: 5 },
  ] as const,
  weeklyVolumeTiers: [
    { minBattlesThisWeek: 50, multiplier: 1.5 },
    { minBattlesThisWeek: 30, multiplier: 1.35 },
    { minBattlesThisWeek: 20, multiplier: 1.25 },
    { minBattlesThisWeek: 10, multiplier: 1.15 },
    { minBattlesThisWeek: 5, multiplier: 1.05 },
  ] as const,
  defaultVolumeMultiplier: 1.0,
  decay: {
    gracePeriodDays: 7,
    dailyDecayRate: 0.005,
    minPointsFloor: 0,
  },
  pagination: {
    defaultPageSize: 50,
    maxPageSize: 100,
  },
} as const;

export type BattleOutcome = 'WIN' | 'LOSS' | 'DRAW';

export type CardRarityBonusKey = keyof typeof LEADERBOARD_CONFIG.cardHitBonus;
