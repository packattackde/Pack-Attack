import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { awardXp } from '@/lib/level';

const CRON_SECRET = process.env.CRON_SECRET || 'your-secret-key';

function drawRandomCard(cards: Array<{ id: string; name: string; coinValue: number; pullRate: number; imageUrlGatherer: string | null; imageUrlScryfall: string | null; rarity: string | null }>) {
  const totalWeight = cards.reduce((sum, c) => sum + c.pullRate, 0);
  let roll = Math.random() * totalWeight;
  for (const card of cards) {
    roll -= card.pullRate;
    if (roll <= 0) return card;
  }
  return cards[cards.length - 1];
}

async function startBattle(battleId: string): Promise<{ status: string; message: string }> {
  const battle = await prisma.battle.findUnique({
    where: { id: battleId },
    include: {
      participants: { include: { user: { select: { id: true, isBot: true } } } },
      box: { include: { cards: true } },
    },
  });

  if (!battle) return { status: 'error', message: 'Battle nicht gefunden' };

  await prisma.battleParticipant.updateMany({
    where: { battleId, isReady: false },
    data: { isReady: true },
  });

  await prisma.battle.update({
    where: { id: battleId },
    data: { status: 'ACTIVE', startedAt: new Date() },
  });

  const boxCards = battle.box.cards.map(c => ({
    id: c.id, name: c.name, coinValue: Number(c.coinValue), pullRate: Number(c.pullRate),
    imageUrlGatherer: c.imageUrlGatherer, imageUrlScryfall: c.imageUrlScryfall, rarity: c.rarity,
  }));

  if (boxCards.length === 0) {
    await prisma.battle.update({ where: { id: battleId }, data: { status: 'CANCELLED', finishedAt: new Date() } });
    return { status: 'cancelled', message: 'Box hat keine Karten' };
  }

  const participantTotals: Record<string, number> = {};
  for (const p of battle.participants) participantTotals[p.id] = 0;

  const pullOps: Array<{ pullData: any; participantId: string; round: number; card: any; coinValue: number }> = [];
  for (let round = 1; round <= battle.rounds; round++) {
    for (const p of battle.participants) {
      const card = drawRandomCard(boxCards);
      participantTotals[p.id] += card.coinValue;
      pullOps.push({
        pullData: { boxId: battle.boxId, userId: p.userId, cardId: card.id, cardValue: card.coinValue },
        participantId: p.id, round, card, coinValue: card.coinValue,
      });
    }
  }

  const createdPulls = await prisma.$transaction(async (tx) => {
    const results: Array<{ pullId: string; participantId: string; round: number; coinValue: number }> = [];
    for (const op of pullOps) {
      const pull = await tx.pull.create({ data: op.pullData });
      await tx.battlePull.create({
        data: {
          battleId, participantId: op.participantId, pullId: pull.id, roundNumber: op.round,
          coinValue: op.coinValue, itemName: op.card.name,
          itemImage: op.card.imageUrlGatherer || op.card.imageUrlScryfall, itemRarity: op.card.rarity,
        },
      });
      results.push({ pullId: pull.id, participantId: op.participantId, round: op.round, coinValue: op.coinValue });
    }
    for (const p of battle.participants) {
      await tx.battleParticipant.update({
        where: { id: p.id },
        data: { totalValue: Math.round(participantTotals[p.id]), roundsPulled: battle.rounds },
      });
    }
    return results;
  });

  const useLowest = battle.winCondition === 'LOWEST';
  const sorted = battle.participants.map(p => ({ ...p, total: participantTotals[p.id] })).sort((a, b) => useLowest ? a.total - b.total : b.total - a.total);
  const bestTotal = sorted[0].total;
  const isDraw = sorted.filter(p => p.total === bestTotal).length > 1;

  if (isDraw) {
    await prisma.battle.update({ where: { id: battleId }, data: { status: 'FINISHED_DRAW', finishedAt: new Date() } });
    return { status: 'draw', message: 'Unentschieden' };
  }

  const winnerId = sorted[0].userId;
  const losers = sorted.filter(p => p.userId !== winnerId);
  const transferOps: string[] = [];

  for (const loser of losers) {
    const loserPulls = createdPulls.filter(p => p.participantId === loser.id)
      .sort((a, b) => a.coinValue !== b.coinValue ? a.coinValue - b.coinValue : a.round - b.round);

    if (battle.battleMode === 'LOWEST_CARD' && loserPulls.length > 0) {
      transferOps.push(loserPulls[0].pullId);
    } else if (battle.battleMode === 'HIGHEST_CARD' && loserPulls.length > 0) {
      transferOps.push(loserPulls[loserPulls.length - 1].pullId);
    } else if (battle.battleMode === 'ALL_CARDS') {
      transferOps.push(...loserPulls.map(p => p.pullId));
    }
  }

  if (transferOps.length > 0) {
    await prisma.$transaction(async (tx) => {
      for (const pullId of transferOps) {
        await tx.pull.update({ where: { id: pullId }, data: { userId: winnerId } });
        await tx.battlePull.updateMany({ where: { pullId }, data: { transferredToUserId: winnerId } });
      }
    });
  }

  await prisma.battle.update({ where: { id: battleId }, data: { status: 'FINISHED_WIN', winnerId, finishedAt: new Date() } });

  for (const p of battle.participants) {
    try { await awardXp(p.userId, p.userId === winnerId ? 50 : 20, prisma as any); } catch {}
  }

  return { status: 'finished', message: `Gewinner: ${winnerId}` };
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    const now = new Date();

    // 1. Cancel expired lobbies (OPEN battles past lobbyExpiresAt)
    const expiredBattles = await prisma.battle.findMany({
      where: {
        status: 'OPEN',
        lobbyExpiresAt: { lte: now },
      },
      include: { participants: true },
    });

    for (const battle of expiredBattles) {
      // Refund entry fees to all participants
      for (const p of battle.participants) {
        const refund = Number(battle.entryFee);
        if (refund > 0) {
          await prisma.user.update({
            where: { id: p.userId },
            data: { coins: { increment: refund } },
          });
        }
      }
      await prisma.battle.update({
        where: { id: battle.id },
        data: { status: 'CANCELLED', finishedAt: now },
      });
    }

    // 2. Auto-start full battles past autoStartAt
    const readyBattles = await prisma.battle.findMany({
      where: {
        status: { in: ['FULL', 'READY'] },
        autoStartAt: { lte: now },
      },
    });

    const results: Array<{ battleId: string; status: string; message: string }> = [];

    for (const battle of readyBattles) {
      try {
        const result = await startBattle(battle.id);
        results.push({ battleId: battle.id, ...result });
      } catch (error: any) {
        results.push({ battleId: battle.id, status: 'error', message: error.message });
      }
    }

    return NextResponse.json({
      success: true,
      expired: expiredBattles.length,
      processed: readyBattles.length,
      results,
    });
  } catch (error) {
    console.error('Cron auto-start error:', error);
    return NextResponse.json({ error: 'Cron-Job fehlgeschlagen' }, { status: 500 });
  }
}
