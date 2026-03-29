import { LEADERBOARD_CONFIG } from './config';

const MS_PER_DAY = 1000 * 60 * 60 * 24;

export type DecayUiState = {
  daysSinceBattle: number | null;
  showWarning: boolean;
  decayActive: boolean;
  /** Days remaining before decay starts (0 when decay is active) */
  daysUntilDecayStarts: number | null;
};

export function getDecayUiState(lastBattleAt: Date | null, now: Date): DecayUiState {
  if (!lastBattleAt) {
    return {
      daysSinceBattle: null,
      showWarning: false,
      decayActive: false,
      daysUntilDecayStarts: null,
    };
  }
  const daysSinceBattle = Math.floor(
    (now.getTime() - lastBattleAt.getTime()) / MS_PER_DAY
  );
  const { gracePeriodDays } = LEADERBOARD_CONFIG.decay;
  const decayActive = daysSinceBattle > gracePeriodDays;
  const showWarning = daysSinceBattle >= 5 && !decayActive;
  const daysUntilDecayStarts = decayActive
    ? 0
    : Math.max(0, gracePeriodDays - daysSinceBattle);

  return {
    daysSinceBattle,
    showWarning,
    decayActive,
    daysUntilDecayStarts,
  };
}
