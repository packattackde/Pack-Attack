import { NextResponse } from 'next/server';
import { prisma, withRetry } from '@/lib/prisma';
import { awardXp } from '@/lib/level';

/**
 * Client-callable auto-start for a specific battle.
 * Any authenticated viewer can trigger this once the 5-minute countdown expires.
 * The endpoint verifies the battle is eligible before starting.
 */
export async function POST(
  _request: Request,
  context: { params: Promise<{ battleId: string }> }
) {
  try {
    const { battleId } = await context.params;

    if (!battleId) {
      return NextResponse.json({ error: 'Battle ID required' }, { status: 400 });
    }

    const battle = await withRetry(
      () => prisma.battle.findUnique({
        where: { id: battleId },
        include: {
          participants: { include: { user: true } },
          box: { include: { cards: true } },
        },
      }),
      'client-auto-start:findBattle'
    );

    if (!battle) {
      return NextResponse.json({ error: 'Battle not found' }, { status: 404 });
    }

    if (battle.status !== 'WAITING') {
      return NextResponse.json({ error: 'Battle already started or finished' }, { status: 400 });
    }

    if (battle.participants.length < battle.maxParticipants) {
      return NextResponse.json({ error: 'Battle is not full' }, { status: 400 });
    }

    // Verify the 5-minute countdown has actually expired
    const timeToCheck = battle.fullAt || battle.createdAt;
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    if (timeToCheck > fiveMinutesAgo) {
      const msRemaining = timeToCheck.getTime() + 5 * 60 * 1000 - Date.now();
      return NextResponse.json({
        error: 'Countdown has not expired yet',
        remainingMs: msRemaining,
      }, { status: 400 });
    }

    // Mark all participants as ready
    await prisma.battleParticipant.updateMany({
      where: { battleId: battle.id, isReady: false },
      data: { isReady: true },
    });

    // Start the battle
    await startBattle(battle);

    console.log(`[CLIENT-AUTO-START] Battle ${battle.id} auto-started by client trigger`);

    return NextResponse.json({
      success: true,
      battleId: battle.id,
      message: 'Battle auto-started',
    });
  } catch (error) {
    console.error('[CLIENT-AUTO-START] Error:', error);
    return NextResponse.json(
      { error: 'Failed to auto-start battle' },
      { status: 500 }
    );
  }
}

async function startBattle(battle: any) {
  await prisma.battle.update({
    where: { id: battle.id },
    data: { status: 'IN_PROGRESS', startedAt: new Date() },
  });

  const boxCards = battle.box.cards;
  if (boxCards.length === 0) throw new Error('No cards in box');

  const totalPullRate = boxCards.reduce((sum: number, card: any) => sum + Number(card.pullRate), 0);

  const drawRandomCard = () => {
    const random = Math.random() * totalPullRate;
    let accumulator = 0;
    for (const card of boxCards) {
      accumulator += Number(card.pullRate);
      if (random <= accumulator) return card;
    }
    return boxCards[boxCards.length - 1];
  };

  interface PullData {
    participantId: string;
    participantUserId: string;
    cardId: string;
    cardValue: number;
    cardName: string;
    cardImage: string | null;
    cardRarity: string | null;
    round: number;
  }
  const allPullsData: PullData[] = [];
  const allPullIds: string[] = [];
  const participantTotals = new Map<string, number>();

  for (const participant of battle.participants) {
    let participantTotal = 0;
    for (let round = 1; round <= battle.rounds; round++) {
      for (let cardIndex = 0; cardIndex < battle.box.cardsPerPack; cardIndex++) {
        const card = drawRandomCard();
        const cardCoinValue = Number(card.coinValue);
        allPullsData.push({
          participantId: participant.id,
          participantUserId: participant.userId,
          cardId: card.id,
          cardValue: cardCoinValue,
          cardName: card.name,
          cardImage: card.imageUrlGatherer,
          cardRarity: card.rarity,
          round,
        });
        participantTotal += cardCoinValue;
      }
    }
    participantTotals.set(participant.id, participantTotal);
  }

  await prisma.$transaction(async (tx) => {
    for (const pullData of allPullsData) {
      const pull = await tx.pull.create({
        data: {
          userId: pullData.participantUserId,
          boxId: battle.box.id,
          cardId: pullData.cardId,
          cardValue: pullData.cardValue,
        },
      });
      await tx.battlePull.create({
        data: {
          battleId: battle.id,
          participantId: pullData.participantId,
          pullId: pull.id,
          roundNumber: pullData.round,
          coinValue: pullData.cardValue,
          itemName: pullData.cardName,
          itemImage: pullData.cardImage,
          itemRarity: pullData.cardRarity,
        },
      });
      allPullIds.push(pull.id);
    }

    for (const participant of battle.participants) {
      await tx.battleParticipant.update({
        where: { id: participant.id },
        data: {
          totalValue: participantTotals.get(participant.id) || 0,
          roundsPulled: battle.rounds,
        },
      });
    }
  });

  let winnerId: string | null = null;
  let isDraw = false;

  if (battle.shareMode) {
    winnerId = battle.participants[Math.floor(Math.random() * battle.participants.length)].userId;
  } else if (battle.battleMode === 'JACKPOT') {
    winnerId = battle.participants[Math.floor(Math.random() * battle.participants.length)].userId;
  } else {
    const values = Array.from(participantTotals.entries());
    const isUpsideDown = battle.battleMode === 'UPSIDE_DOWN';
    const targetValue = isUpsideDown
      ? Math.min(...values.map(([, v]) => v))
      : Math.max(...values.map(([, v]) => v));
    const tiedParticipants = values.filter(([, v]) => v === targetValue);

    if (tiedParticipants.length > 1) {
      const tiedIds = new Set(tiedParticipants.map(([id]) => id));
      const roundWins = new Map<string, number>();
      for (const id of tiedIds) roundWins.set(id, 0);

      for (let r = 1; r <= battle.rounds; r++) {
        const roundPulls = allPullsData.filter(p => p.round === r);
        const roundTotals = new Map<string, number>();
        for (const pull of roundPulls) {
          roundTotals.set(pull.participantId, (roundTotals.get(pull.participantId) || 0) + pull.cardValue);
        }
        let bestRoundVal = isUpsideDown ? Infinity : -Infinity;
        for (const [pid, val] of roundTotals) {
          if (!tiedIds.has(pid)) continue;
          if (isUpsideDown ? val < bestRoundVal : val > bestRoundVal) bestRoundVal = val;
        }
        for (const [pid, val] of roundTotals) {
          if (tiedIds.has(pid) && val === bestRoundVal) {
            roundWins.set(pid, (roundWins.get(pid) || 0) + 1);
          }
        }
      }

      const maxRoundWins = Math.max(...roundWins.values());
      const roundWinners = Array.from(roundWins.entries()).filter(([, w]) => w === maxRoundWins);

      if (roundWinners.length === 1) {
        const participant = battle.participants.find((p: any) => p.id === roundWinners[0][0]);
        winnerId = participant?.userId || null;
      } else {
        isDraw = true;
        winnerId = null;
      }
    } else {
      const [winnerParticipantId] = tiedParticipants[0];
      const participant = battle.participants.find((p: any) => p.id === winnerParticipantId);
      winnerId = participant?.userId || null;
    }
  }

  await prisma.$transaction(async (tx) => {
    if (battle.shareMode) {
      const shuffled = shuffleArray(allPullIds);
      const userIds = battle.participants.map((p: any) => p.userId);
      const userPullMap = new Map<string, string[]>();
      for (let i = 0; i < shuffled.length; i++) {
        const uid = userIds[i % userIds.length];
        const existing = userPullMap.get(uid) || [];
        existing.push(shuffled[i]);
        userPullMap.set(uid, existing);
      }
      for (const [userId, pullIds] of userPullMap) {
        await tx.pull.updateMany({ where: { id: { in: pullIds } }, data: { userId } });
      }
    } else if (!isDraw && winnerId) {
      await tx.pull.updateMany({ where: { id: { in: allPullIds } }, data: { userId: winnerId } });
    }
  });

  const totalPrize = battle.entryFee * battle.participants.length;

  await prisma.battle.update({
    where: { id: battle.id },
    data: {
      status: 'FINISHED',
      winnerId,
      totalPrize: isDraw ? 0 : totalPrize,
      finishedAt: new Date(),
    },
  });

  if (!battle.shareMode && !isDraw && winnerId && totalPrize > 0) {
    await prisma.user.update({
      where: { id: winnerId },
      data: { coins: { increment: totalPrize } },
    });
  }

  for (const participant of battle.participants) {
    await awardXp(participant.userId, 150, prisma);
  }
  if (!battle.shareMode && !isDraw && winnerId) {
    await awardXp(winnerId, 250, prisma);
  }
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
