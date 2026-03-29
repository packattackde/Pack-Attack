import { Prisma } from '@prisma/client';
import type { PrismaClient } from '@prisma/client';
import { calculateBattlePoints, type BattlePointsBreakdown, type CardPlayed } from './scoring';
import type { BattleOutcome } from './config';
import { recalculateAllRanks } from './ranks';

export type AwardUserResult = {
  userId: string;
  breakdown: BattlePointsBreakdown;
};

export async function awardBattleLeaderboardForFinishedBattle(
  prisma: PrismaClient,
  battleId: string
): Promise<{ awarded: boolean; results: AwardUserResult[] }> {
  const dup = await prisma.pointTransaction.findFirst({
    where: { battleId },
    select: { id: true },
  });
  if (dup) {
    return { awarded: false, results: [] };
  }

  const battle = await prisma.battle.findUnique({
    where: { id: battleId },
    include: {
      participants: {
        include: { user: { select: { id: true, isBot: true } } },
      },
      pulls: {
        include: {
          pull: { include: { card: true } },
        },
      },
    },
  });

  if (
    !battle ||
    (battle.status !== 'FINISHED_WIN' && battle.status !== 'FINISHED_DRAW')
  ) {
    return { awarded: false, results: [] };
  }

  const winnerId = battle.winnerId;
  const isDraw = battle.status === 'FINISHED_DRAW';
  const finishedAt = battle.finishedAt ?? new Date();

  const results = await prisma.$transaction(async tx => {
    const out: AwardUserResult[] = [];

    for (const p of battle.participants) {
      if (p.user.isBot) continue;

      let outcome: BattleOutcome;
      if (isDraw) outcome = 'DRAW';
      else if (winnerId === p.userId) outcome = 'WIN';
      else outcome = 'LOSS';

      const entry = await tx.leaderboardEntry.upsert({
        where: { userId: p.userId },
        create: { userId: p.userId },
        update: {},
      });

      const battlesThisWeek = entry.battlesThisWeek + 1;

      const consecutiveWinsForMultiplier =
        outcome === 'WIN' ? entry.currentStreak + 1 : 1;

      const cardsPlayed: CardPlayed[] = battle.pulls
        .filter(bp => bp.participantId === p.id)
        .map(bp => ({
          rarity: bp.itemRarity ?? bp.pull?.card?.rarity ?? null,
          marketValue:
            bp.pull?.card != null
              ? Number(bp.pull.card.coinValue)
              : Number(bp.coinValue),
        }));

      const breakdown = calculateBattlePoints({
        outcome,
        consecutiveWinsForMultiplier,
        cardsPlayed,
        battlesThisWeek,
      });

      let newStreak = entry.currentStreak;
      const bestStreak = entry.bestStreak;
      if (outcome === 'WIN') {
        newStreak = entry.currentStreak + 1;
      } else {
        newStreak = 0;
      }
      const nextBest = Math.max(bestStreak, newStreak);

      const txType =
        outcome === 'WIN'
          ? 'BATTLE_WIN'
          : outcome === 'LOSS'
            ? 'BATTLE_LOSS'
            : 'BATTLE_DRAW';

      await tx.leaderboardEntry.update({
        where: { id: entry.id },
        data: {
          totalPoints: { increment: breakdown.totalPoints },
          weeklyPoints: { increment: breakdown.totalPoints },
          monthlyPoints: { increment: breakdown.totalPoints },
          allTimePoints: { increment: breakdown.totalPoints },
          battlesThisWeek: { increment: 1 },
          totalBattles: { increment: 1 },
          currentStreak: newStreak,
          bestStreak: nextBest,
          lastBattleAt: finishedAt,
          ...(outcome === 'WIN' ? { totalWins: { increment: 1 } } : {}),
          ...(outcome === 'LOSS' ? { totalLosses: { increment: 1 } } : {}),
        },
      });

      await tx.pointTransaction.create({
        data: {
          leaderboardEntryId: entry.id,
          battleId,
          type: txType,
          points: breakdown.totalPoints,
          description: `Battle ${battleId}`,
          metadata: JSON.parse(JSON.stringify(breakdown)) as Prisma.InputJsonValue,
        },
      });

      out.push({ userId: p.userId, breakdown });
    }

    return out;
  });

  await recalculateAllRanks(prisma);
  return { awarded: true, results };
}
