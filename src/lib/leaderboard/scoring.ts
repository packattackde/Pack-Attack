import { LEADERBOARD_CONFIG, type BattleOutcome, type CardRarityBonusKey } from './config';

export type CardPlayed = {
  rarity: string | null;
  /** Market / coin value in EUR (same unit as thresholds) */
  marketValue: number | null;
};

export type BattlePointsBreakdown = {
  baseParticipation: number;
  outcome: BattleOutcome;
  outcomeBasePoints: number;
  streakMultiplier: number;
  /** Extra points from streak: outcomeBase * (streakMultiplier - 1) for wins */
  streakBonusPoints: number;
  /** outcomeBasePoints + streakBonusPoints */
  outcomeTotalPoints: number;
  cardRarityBonusPoints: number;
  amazingHitBonusPoints: number;
  subtotalBeforeVolume: number;
  volumeMultiplier: number;
  battlesThisWeekUsed: number;
  totalPoints: number;
};

export function getStreakMultiplier(consecutiveWins: number): number {
  if (consecutiveWins < 1) return LEADERBOARD_CONFIG.defaultStreakMultiplier;
  for (const tier of LEADERBOARD_CONFIG.streakTiers) {
    if (consecutiveWins >= tier.minConsecutiveWins) return tier.multiplier;
  }
  return LEADERBOARD_CONFIG.defaultStreakMultiplier;
}

export function getWeeklyVolumeMultiplier(battlesThisWeek: number): number {
  for (const tier of LEADERBOARD_CONFIG.weeklyVolumeTiers) {
    if (battlesThisWeek >= tier.minBattlesThisWeek) return tier.multiplier;
  }
  return LEADERBOARD_CONFIG.defaultVolumeMultiplier;
}

/** Map MTG / Pokémon-style rarity strings to bonus tier */
export function mapRarityToBonusKey(rarity: string | null): CardRarityBonusKey {
  const r = (rarity ?? '').toLowerCase();
  if (r.includes('mythic') || r.includes('secret') || r.includes('hyper')) return 'MYTHIC_RARE';
  if (r.includes('rare') && !r.includes('uncommon')) return 'RARE';
  if (r.includes('uncommon')) return 'UNCOMMON';
  return 'COMMON';
}

function amazingHitPointsForCard(marketValue: number | null): number {
  if (marketValue === null || Number.isNaN(marketValue)) return 0;
  const sorted = [...LEADERBOARD_CONFIG.amazingHitThresholds].sort((a, b) => b.minValue - a.minValue);
  const hit = sorted.find(t => marketValue >= t.minValue);
  return hit?.points ?? 0;
}

export function calculateBattlePoints(params: {
  outcome: BattleOutcome;
  /** Consecutive wins including this battle if outcome is WIN */
  consecutiveWinsForMultiplier: number;
  cardsPlayed: CardPlayed[];
  /** Battles in current week including this one */
  battlesThisWeek: number;
}): BattlePointsBreakdown {
  const { outcome, consecutiveWinsForMultiplier, cardsPlayed, battlesThisWeek } = params;
  const base = LEADERBOARD_CONFIG.baseParticipation;
  const outcomeBase = LEADERBOARD_CONFIG.battleOutcome[outcome];

  const streakMultiplier =
    outcome === 'WIN'
      ? getStreakMultiplier(consecutiveWinsForMultiplier)
      : LEADERBOARD_CONFIG.defaultStreakMultiplier;

  const outcomeTotalPoints = Math.round(outcomeBase * streakMultiplier);
  const streakBonusPoints =
    outcome === 'WIN' ? outcomeTotalPoints - outcomeBase : 0;

  let cardRarityBonusPoints = 0;
  let amazingHitBonusPoints = 0;
  for (const card of cardsPlayed) {
    const key = mapRarityToBonusKey(card.rarity);
    cardRarityBonusPoints += LEADERBOARD_CONFIG.cardHitBonus[key] ?? 0;
    amazingHitBonusPoints += amazingHitPointsForCard(card.marketValue);
  }

  const subtotalBeforeVolume =
    base + outcomeTotalPoints + cardRarityBonusPoints + amazingHitBonusPoints;

  const volumeMultiplier = getWeeklyVolumeMultiplier(battlesThisWeek);
  const totalPoints = Math.round(subtotalBeforeVolume * volumeMultiplier);

  return {
    baseParticipation: base,
    outcome,
    outcomeBasePoints: outcomeBase,
    streakMultiplier,
    streakBonusPoints,
    outcomeTotalPoints,
    cardRarityBonusPoints,
    amazingHitBonusPoints,
    subtotalBeforeVolume,
    volumeMultiplier,
    battlesThisWeekUsed: battlesThisWeek,
    totalPoints,
  };
}
