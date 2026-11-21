/** Minimum time after a pull before it can be sold (prevents instant liquidation right after ripping). */
export const PULL_SELL_MIN_AGE_MS = 30 * 1000;

export function getPullTimestampMs(timestamp: Date | string): number {
  return typeof timestamp === 'string' ? new Date(timestamp).getTime() : timestamp.getTime();
}

export function isPullOldEnoughForSell(timestamp: Date | string, nowMs = Date.now()): boolean {
  return nowMs - getPullTimestampMs(timestamp) >= PULL_SELL_MIN_AGE_MS;
}

export function msUntilPullSellable(timestamp: Date | string, nowMs = Date.now()): number {
  const wait = PULL_SELL_MIN_AGE_MS - (nowMs - getPullTimestampMs(timestamp));
  return Math.max(0, wait);
}

/** Block sell API calls that still originate from the pack-open page (e.g. cached client bundles). */
export function isSellBlockedByReferer(referer: string | null): boolean {
  if (!referer) return false;
  try {
    const path = new URL(referer).pathname;
    return path.startsWith('/open/');
  } catch {
    return /\/open\//.test(referer);
  }
}