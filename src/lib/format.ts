/**
 * Format a coin value for display.
 * - No decimals
 * - 1000+ → "1.2k", 1000000+ → "1.2M"
 * - Below 1000: plain integer
 */
export function formatCoins(value: number): string {
  const v = Number.isFinite(value) ? value : 0;
  const n = Math.round(v);
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}k`;
  return n.toLocaleString();
}
