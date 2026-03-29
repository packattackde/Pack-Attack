/**
 * Run: npx tsx tests/leaderboard/leaderboard.test.ts
 */
import assert from 'node:assert/strict';
import { calculateBattlePoints } from '../../src/lib/leaderboard/scoring';
import { calculateDecay, calculateIncrementalDecay } from '../../src/lib/leaderboard/decay';
import { LEADERBOARD_CONFIG } from '../../src/lib/leaderboard/config';

function testWinNoStreak() {
  const r = calculateBattlePoints({
    outcome: 'WIN',
    consecutiveWinsForMultiplier: 1,
    cardsPlayed: [],
    battlesThisWeek: 1,
  });
  const base = LEADERBOARD_CONFIG.baseParticipation + LEADERBOARD_CONFIG.battleOutcome.WIN;
  assert.equal(r.subtotalBeforeVolume, base);
  assert.equal(r.totalPoints, base);
}

function testStreakTiers() {
  const m3 = calculateBattlePoints({
    outcome: 'WIN',
    consecutiveWinsForMultiplier: 3,
    cardsPlayed: [],
    battlesThisWeek: 1,
  });
  assert.equal(m3.streakMultiplier, 1.25);
  const m10 = calculateBattlePoints({
    outcome: 'WIN',
    consecutiveWinsForMultiplier: 10,
    cardsPlayed: [],
    battlesThisWeek: 1,
  });
  assert.equal(m10.streakMultiplier, 2.0);
}

function testCardBonusesStack() {
  const r = calculateBattlePoints({
    outcome: 'LOSS',
    consecutiveWinsForMultiplier: 1,
    cardsPlayed: [
      { rarity: 'mythic', marketValue: 5 },
      { rarity: 'rare', marketValue: 2 },
    ],
    battlesThisWeek: 1,
  });
  const expectedRarity =
    LEADERBOARD_CONFIG.cardHitBonus.MYTHIC_RARE + LEADERBOARD_CONFIG.cardHitBonus.RARE;
  assert.equal(r.cardRarityBonusPoints, expectedRarity);
}

function testVolumeMultiplier() {
  const r = calculateBattlePoints({
    outcome: 'DRAW',
    consecutiveWinsForMultiplier: 1,
    cardsPlayed: [],
    battlesThisWeek: 10,
  });
  assert.equal(r.volumeMultiplier, 1.15);
  const sub = r.subtotalBeforeVolume;
  assert.equal(r.totalPoints, Math.round(sub * 1.15));
}

function testDecayGrace() {
  const now = new Date('2026-03-20T12:00:00Z');
  const last = new Date('2026-03-18T12:00:00Z');
  const d = calculateDecay({ currentPoints: 1000, lastBattleAt: last, now });
  assert.equal(d.daysDecayed, 0);
  assert.equal(d.newPoints, 1000);
}

function testDecayAfterGrace() {
  const now = new Date('2026-03-30T12:00:00Z');
  const last = new Date('2026-03-10T12:00:00Z');
  const d = calculateDecay({ currentPoints: 1000, lastBattleAt: last, now });
  assert.ok(d.daysDecayed > 0);
  assert.ok(d.newPoints < 1000);
}

function testDecayFloor() {
  const now = new Date('2030-01-01T12:00:00Z');
  const last = new Date('2020-01-01T12:00:00Z');
  const d = calculateDecay({ currentPoints: 1, lastBattleAt: last, now });
  assert.equal(d.newPoints, 0);
}

function testIncrementalDecay() {
  const lastBattle = new Date('2026-01-01T12:00:00Z');
  const graceEnd = new Date(lastBattle.getTime() + 7 * 86400000);
  const now = new Date(graceEnd.getTime() + 3 * 86400000);
  const d = calculateIncrementalDecay({
    totalPoints: 1000,
    lastBattleAt: lastBattle,
    lastDecayAt: null,
    now,
  });
  assert.ok(d.daysApplied >= 3);
  assert.ok(d.newPoints < 1000);
}

try {
  testWinNoStreak();
  testStreakTiers();
  testCardBonusesStack();
  testVolumeMultiplier();
  testDecayGrace();
  testDecayAfterGrace();
  testDecayFloor();
  testIncrementalDecay();
  console.log('leaderboard tests: OK');
} catch (e) {
  console.error(e);
  process.exit(1);
}
