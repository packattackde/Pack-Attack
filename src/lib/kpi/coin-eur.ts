/** 25 coins = 5 EUR → 0.20 EUR per coin (PullForge standard packages). */
export const COIN_EUR_RATE = 0.2;

export function coinsToEur(coins: number): number {
  return coins * COIN_EUR_RATE;
}