import { LEADERBOARD_CONFIG } from './config';

const MS_PER_DAY = 1000 * 60 * 60 * 24;

/**
 * Spec-style decay: days after grace get compound factor (1 - rate)^daysDecayed on current points.
 * Used for tests and for one-shot "what would points be" previews.
 */
export function calculateDecay(params: {
  currentPoints: number;
  lastBattleAt: Date;
  now: Date;
}): { newPoints: number; decayApplied: number; daysDecayed: number } {
  const { currentPoints, lastBattleAt, now } = params;
  const { gracePeriodDays, dailyDecayRate, minPointsFloor } = LEADERBOARD_CONFIG.decay;

  const daysSinceLastBattle = Math.floor(
    (now.getTime() - lastBattleAt.getTime()) / MS_PER_DAY
  );

  if (daysSinceLastBattle <= gracePeriodDays) {
    return { newPoints: currentPoints, decayApplied: 0, daysDecayed: 0 };
  }

  const daysDecayed = daysSinceLastBattle - gracePeriodDays;
  const decayMultiplier = Math.pow(1 - dailyDecayRate, daysDecayed);
  const newPoints = Math.max(
    minPointsFloor,
    Math.round(currentPoints * decayMultiplier)
  );

  return {
    newPoints,
    decayApplied: currentPoints - newPoints,
    daysDecayed,
  };
}

/**
 * Production decay: apply compound decay for full UTC days since `decayBaseline` (last decay run or grace end).
 */
export function calculateIncrementalDecay(params: {
  totalPoints: number;
  lastBattleAt: Date;
  lastDecayAt: Date | null;
  now: Date;
}): { newPoints: number; decayApplied: number; daysApplied: number } {
  const { totalPoints, lastBattleAt, lastDecayAt, now } = params;
  const { gracePeriodDays, dailyDecayRate, minPointsFloor } = LEADERBOARD_CONFIG.decay;

  const daysSinceLastBattle = Math.floor(
    (now.getTime() - lastBattleAt.getTime()) / MS_PER_DAY
  );
  if (daysSinceLastBattle <= gracePeriodDays) {
    return { newPoints: totalPoints, decayApplied: 0, daysApplied: 0 };
  }

  const graceEnd = new Date(lastBattleAt.getTime() + gracePeriodDays * MS_PER_DAY);
  const baseline = lastDecayAt && lastDecayAt > graceEnd ? lastDecayAt : graceEnd;
  const daysApplied = Math.max(0, Math.floor((now.getTime() - baseline.getTime()) / MS_PER_DAY));
  if (daysApplied === 0) {
    return { newPoints: totalPoints, decayApplied: 0, daysApplied: 0 };
  }

  const decayMultiplier = Math.pow(1 - dailyDecayRate, daysApplied);
  const newPoints = Math.max(minPointsFloor, Math.round(totalPoints * decayMultiplier));

  return {
    newPoints,
    decayApplied: totalPoints - newPoints,
    daysApplied,
  };
}
