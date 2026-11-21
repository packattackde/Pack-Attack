import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  PULL_SELL_MIN_AGE_MS,
  isPullOldEnoughForSell,
  isSellBlockedByReferer,
  msUntilPullSellable,
} from '../src/lib/pull-sell-eligibility';

describe('pull-sell-eligibility', () => {
  it('blocks sells from pack-open referer paths', () => {
    assert.equal(isSellBlockedByReferer('https://pack-attack.de/open/abc'), true);
    assert.equal(isSellBlockedByReferer('https://pack-attack.de/collection'), false);
    assert.equal(isSellBlockedByReferer(null), false);
  });

  it('requires pulls to age before sell', () => {
    const now = 1_000_000;
    const ts = new Date(now - PULL_SELL_MIN_AGE_MS + 1).toISOString();
    assert.equal(isPullOldEnoughForSell(ts, now), false);
    assert.ok(msUntilPullSellable(ts, now) > 0);

    const old = new Date(now - PULL_SELL_MIN_AGE_MS).toISOString();
    assert.equal(isPullOldEnoughForSell(old, now), true);
    assert.equal(msUntilPullSellable(old, now), 0);
  });
});