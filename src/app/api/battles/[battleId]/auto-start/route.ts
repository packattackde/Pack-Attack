import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { awardXp } from '@/lib/level';

function drawRandomCard(cards: Array<{ id: string; name: string; coinValue: number; pullRate: number; imageUrlGatherer: string | null; imageUrlScryfall: string | null; rarity: string | null }>) {
  const totalWeight = cards.reduce((sum, c) => sum + c.pullRate, 0);
  let roll = Math.random() * totalWeight;
  for (const card of cards) {
    roll -= card.pullRate;
    if (roll <= 0) return card;
  }
  return cards[cards.length - 1];
}

async function startBattleLogic(battleId: string) {
  const battle = await prisma.battle.findUnique({
    where: { id: battleId },
    include: {
      participants: {
        include: { user: { select: { id: true, name: true, isBot: true } } },
      },
      box: { include: { cards: true } },
    },
  });

  if (!battle) throw new Error('Battle nicht gefunden');
  if (battle.status !== 'FULL' && battle.status !== 'READY') {
    throw new Error('Battle kann nicht gestartet werden');
  }

  // Auto-ready all bots
  await prisma.battleParticipant.updateMany({
    where: {
      battleId,
      user: { isBot: true },
      isReady: false,
    },
    data: { isReady: true },
  });

  // Mark all participants ready for auto-start
  await prisma.battleParticipant.updateMany({
    where: { battleId, isReady: false },
    data: { isReady: true },
  });

  await prisma.battle.update({
    where: { id: battleId },
    data: { status: 'ACTIVE', startedAt: new Date() },
  });

  const boxCards = (battle.box?.cards ?? []).map(c => ({
    id: c.id,
    name: c.name,
    coinValue: Number(c.coinValue),
    pullRate: Number(c.pullRate),
    imageUrlGatherer: c.imageUrlGatherer,
    imageUrlScryfall: c.imageUrlScryfall,
    rarity: c.rarity,
  }));

  if (boxCards.length === 0) throw new Error('Box hat keine Karten');

  const participantTotals: Record<string, number> = {};
  for (const p of battle.participants) {
    participantTotals[p.id] = 0;
  }

  const pullOps: Array<{ pullData: any; participantId: string; round: number; card: any; coinValue: number }> = [];

  for (let round = 1; round <= battle.rounds; round++) {
    for (const participant of battle.participants) {
      const card = drawRandomCard(boxCards);
      participantTotals[participant.id] += card.coinValue;
      pullOps.push({
        pullData: { boxId: battle.boxId!, userId: participant.userId, cardId: card.id, cardValue: card.coinValue },
        participantId: participant.id,
        round,
        card,
        coinValue: card.coinValue,
      });
    }
  }

  const createdPulls = await prisma.$transaction(async (tx) => {
    const results: Array<{ pullId: string; participantId: string; round: number; coinValue: number }> = [];
    for (const op of pullOps) {
      const pull = await tx.pull.create({ data: op.pullData });
      await tx.battlePull.create({
        data: {
          battleId,
          participantId: op.participantId,
          pullId: pull.id,
          roundNumber: op.round,
          coinValue: op.coinValue,
          itemName: op.card.name,
          itemImage: op.card.imageUrlGatherer || op.card.imageUrlScryfall,
          itemRarity: op.card.rarity,
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
  const sorted = battle.participants
    .map(p => ({ ...p, total: participantTotals[p.id] }))
    .sort((a, b) => useLowest ? a.total - b.total : b.total - a.total);

  const bestTotal = sorted[0].total;
  const winners = sorted.filter(p => p.total === bestTotal);
  const isDraw = winners.length > 1;

  let winnerId: string | null = null;

  if (isDraw) {
    await prisma.battle.update({
      where: { id: battleId },
      data: { status: 'FINISHED_DRAW', finishedAt: new Date() },
    });
  } else {
    winnerId = sorted[0].userId;
    const losers = sorted.filter(p => p.userId !== winnerId);

    const transferOps: string[] = [];
    for (const loser of losers) {
      const loserPulls = createdPulls
        .filter(p => p.participantId === loser.id)
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
          await tx.pull.update({ where: { id: pullId }, data: { userId: winnerId! } });
          await tx.battlePull.updateMany({ where: { pullId }, data: { transferredToUserId: winnerId } });
        }
      });
    }

    await prisma.battle.update({
      where: { id: battleId },
      data: { status: 'FINISHED_WIN', winnerId, finishedAt: new Date() },
    });
  }

  for (const p of battle.participants) {
    try {
      await awardXp(p.userId, p.userId === winnerId ? 50 : 20, prisma as any);
    } catch {}
  }

  return { battleId, isDraw, winnerId };
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ battleId: string }> }
) {
  try {
    const { battleId } = await params;

    const battle = await prisma.battle.findUnique({
      where: { id: battleId },
      include: { participants: true },
    });

    if (!battle) {
      return NextResponse.json({ error: 'Battle nicht gefunden' }, { status: 404 });
    }

    if (battle.status !== 'FULL' && battle.status !== 'READY') {
      return NextResponse.json({ error: 'Battle kann nicht automatisch gestartet werden' }, { status: 400 });
    }

    if (battle.participants.length < battle.maxParticipants) {
      return NextResponse.json({ error: 'Battle ist nicht voll' }, { status: 400 });
    }

    // Check if autoStartAt has passed
    if (battle.autoStartAt && new Date() < battle.autoStartAt) {
      const remainingMs = battle.autoStartAt.getTime() - Date.now();
      return NextResponse.json({
        error: 'Auto-Start-Zeit noch nicht erreicht',
        remainingMs,
      }, { status: 400 });
    }

    const result = await startBattleLogic(battleId);

    return NextResponse.json({
      success: true,
      ...result,
      message: result.isDraw ? 'Unentschieden!' : 'Battle abgeschlossen!',
    });
  } catch (error) {
    console.error('Auto-start error:', error);
    return NextResponse.json({ error: 'Auto-Start fehlgeschlagen' }, { status: 500 });
  }
}
