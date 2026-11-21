import type { NextRequest } from 'next/server';
import { isPullOldEnoughForSell, isSellBlockedByReferer } from '@/lib/pull-sell-eligibility';

export function getSellBlockedResponse(referer: string | null) {
  if (!isSellBlockedByReferer(referer)) return null;
  return {
    status: 403,
    error:
      'Cards cannot be sold from the pack opening screen. Go to your collection to sell them.',
  } as const;
}

export function getTooFreshPullsError(
  pulls: Array<{ id: string; timestamp: Date }>
): string | null {
  const blocked = pulls.filter((p) => !isPullOldEnoughForSell(p.timestamp));
  if (blocked.length === 0) return null;
  return 'Recently pulled cards cannot be sold yet. Open your collection in a moment to sell them.';
}

export function sellGuardFromRequest(request: NextRequest) {
  return getSellBlockedResponse(request.headers.get('referer'));
}