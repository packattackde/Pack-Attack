import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { prisma, withRetry } from '@/lib/prisma';
import { awardXp } from '@/lib/level';

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

type CardData = {
  id: string;
  name: string;
  coinValue: number;
  pullRate: number;
  imageUrlGatherer: string | null;
  imageUrlScryfall: string | null;
  rarity: string | null;
};

function drawRandomCard(cards: CardData[]): CardData {
  const totalWeight = cards.reduce((sum, c) => sum + c.pullRate, 0);
  let roll = Math.random() * totalWeight;
  for (const card of cards) {
    roll -= card.pullRate;
    if (roll <= 0) return card;
  }
  return cards[cards.length - 1];
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ battleId: string }> }
) {
  try {
    const session = await getCurrentSession();
    const { battleId } = await params;

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'Benutzer nicht gefunden' }, { status: 404 });
    }

    const battle = await withRetry(
      () => prisma.battle.findUnique({
        where: { id: battleId },
        include: {
          participants: {
            include: { user: { select: { id: true, name: true, email: true, isBot: true } } },
          },
          box: {
            include: {
              cards: true,
            },
          },
        },
      }),
      'battle-start:findBattle'
    );

    if (!battle) {
      return NextResponse.json({ error: 'Battle nicht gefunden' }, { status: 404 });
    }

    // Only creator or admin can start
    const isAdmin = currentUser.role === 'ADMIN';
    if (battle.creatorId !== currentUser.id && !isAdmin) {
      return NextResponse.json({ error: 'Nur der Ersteller oder ein Admin kann das Battle starten' }, { status: 403 });
    }

    // Must be FULL or READY
    if (battle.status !== 'FULL' && battle.status !== 'READY') {
      return NextResponse.json({ error: 'Battle kann nicht gestartet werden (falscher Status)' }, { status: 400 });
    }

    // Must have correct number of participants
    if (battle.participants.length < battle.maxParticipants) {
      return NextResponse.json({ error: 'Nicht genug Spieler im Battle' }, { status: 400 });
    }

    // Auto-ready all bots
    const botParticipants = battle.participants.filter(p => p.user.isBot && !p.isReady);
    if (botParticipants.length > 0) {
      await prisma.battleParticipant.updateMany({
        where: { id: { in: botParticipants.map(p => p.id) } },
        data: { isReady: true },
      });
    }

    // Check all human players are ready
    const humanNotReady = battle.participants.filter(p => !p.user.isBot && !p.isReady);
    if (humanNotReady.length > 0) {
      return NextResponse.json({
        error: 'Nicht alle Spieler sind bereit',
        notReady: humanNotReady.map(p => p.user.name || p.user.email),
      }, { status: 400 });
    }

    const boxCards = battle.box.cards.map(c => ({
      id: c.id,
      name: c.name,
      coinValue: Number(c.coinValue),
      pullRate: Number(c.pullRate),
      imageUrlGatherer: c.imageUrlGatherer,
      imageUrlScryfall: c.imageUrlScryfall,
      rarity: c.rarity,
    }));

    if (boxCards.length === 0) {
      return NextResponse.json({ error: 'Die Box hat keine Karten' }, { status: 400 });
    }

    // Set battle to ACTIVE
    await prisma.battle.update({
      where: { id: battleId },
      data: { status: 'ACTIVE', startedAt: new Date() },
    });

    // Generate cards for all rounds and all participants
    const pullOperations: any[] = [];
    const battlePullOperations: any[] = [];
    const participantTotals: Record<string, number> = {};

    for (const participant of battle.participants) {
      participantTotals[participant.id] = 0;
    }

    for (let round = 1; round <= battle.rounds; round++) {
      for (const participant of battle.participants) {
        const card = drawRandomCard(boxCards);
        const coinValue = card.coinValue;
        participantTotals[participant.id] += coinValue;

        const pullData = {
          boxId: battle.boxId,
          userId: participant.userId,
          cardId: card.id,
          cardValue: coinValue,
        };

        pullOperations.push({ pullData, participantId: participant.id, round, card, coinValue });
      }
    }

    // Execute all in a transaction
    const createdPulls = await prisma.$transaction(async (tx) => {
      const results: Array<{ pullId: string; participantId: string; round: number; coinValue: number; card: CardData }> = [];

      for (const op of pullOperations) {
        const pull = await tx.pull.create({
          data: op.pullData,
        });

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

        results.push({
          pullId: pull.id,
          participantId: op.participantId,
          round: op.round,
          coinValue: op.coinValue,
          card: op.card,
        });
      }

      // Update participant totals
      for (const participant of battle.participants) {
        await tx.battleParticipant.update({
          where: { id: participant.id },
          data: {
            totalValue: Math.round(participantTotals[participant.id]),
            roundsPulled: battle.rounds,
          },
        });
      }

      return results;
    });

    // Determine winner: highest total value
    const sortedParticipants = battle.participants
      .map(p => ({ ...p, total: participantTotals[p.id] }))
      .sort((a, b) => b.total - a.total);

    const highestTotal = sortedParticipants[0].total;
    const winners = sortedParticipants.filter(p => p.total === highestTotal);
    const isDraw = winners.length > 1;

    let winnerId: string | null = null;
    let transferredPullIds: string[] = [];

    if (isDraw) {
      // DRAW: no winner, no transfer
      await prisma.battle.update({
        where: { id: battleId },
        data: {
          status: 'FINISHED_DRAW',
          finishedAt: new Date(),
        },
      });
    } else {
      // We have a winner
      const winner = sortedParticipants[0];
      winnerId = winner.userId;
      const losers = sortedParticipants.filter(p => p.userId !== winnerId);

      // Card transfer logic based on battleMode
      const transferOps: Array<{ pullId: string; battlePullId?: string }> = [];

      for (const loser of losers) {
        const loserPulls = createdPulls
          .filter(p => p.participantId === loser.id)
          .sort((a, b) => {
            if (a.coinValue !== b.coinValue) return a.coinValue - b.coinValue;
            return a.round - b.round; // tie-break: earliest round
          });

        if (battle.battleMode === 'LOWEST_CARD') {
          // Transfer loser's lowest value card to winner
          if (loserPulls.length > 0) {
            transferOps.push({ pullId: loserPulls[0].pullId });
          }
        } else if (battle.battleMode === 'HIGHEST_CARD') {
          // Transfer loser's highest value card to winner
          if (loserPulls.length > 0) {
            const highest = loserPulls[loserPulls.length - 1];
            transferOps.push({ pullId: highest.pullId });
          }
        } else if (battle.battleMode === 'ALL_CARDS') {
          // Transfer ALL of loser's cards to winner
          for (const pull of loserPulls) {
            transferOps.push({ pullId: pull.pullId });
          }
        }
      }

      // Execute transfers
      if (transferOps.length > 0) {
        await prisma.$transaction(async (tx) => {
          for (const op of transferOps) {
            // Transfer Pull ownership to winner
            await tx.pull.update({
              where: { id: op.pullId },
              data: { userId: winnerId! },
            });

            // Mark the BattlePull as transferred
            await tx.battlePull.updateMany({
              where: { pullId: op.pullId },
              data: { transferredToUserId: winnerId },
            });

            transferredPullIds.push(op.pullId);
          }
        });
      }

      await prisma.battle.update({
        where: { id: battleId },
        data: {
          status: 'FINISHED_WIN',
          winnerId,
          finishedAt: new Date(),
        },
      });
    }

    // Award XP to all participants
    for (const participant of battle.participants) {
      try {
        const xpAmount = participant.userId === winnerId ? 50 : 20;
        await awardXp(participant.userId, xpAmount, prisma as any);
      } catch (err) {
        console.error(`Failed to award XP to ${participant.userId}:`, err);
      }
    }

    // Fetch final battle state
    const finalBattle = await prisma.battle.findUnique({
      where: { id: battleId },
      include: {
        creator: { select: { id: true, name: true, email: true } },
        box: true,
        participants: {
          include: { user: { select: { id: true, name: true, email: true, isBot: true } } },
        },
        winner: { select: { id: true, name: true, email: true } },
        pulls: {
          include: {
            participant: { include: { user: true } },
            pull: { include: { card: true } },
          },
          orderBy: [{ roundNumber: 'asc' }, { pulledAt: 'asc' }],
        },
      },
    });

    const serializedBattle = finalBattle ? {
      ...finalBattle,
      entryFee: Number(finalBattle.entryFee),
      box: finalBattle.box ? {
        ...finalBattle.box,
        price: Number(finalBattle.box.price),
      } : null,
      pulls: finalBattle.pulls?.map(pull => ({
        ...pull,
        coinValue: Number(pull.coinValue),
        pull: pull.pull ? {
          ...pull.pull,
          cardValue: pull.pull.cardValue ? Number(pull.pull.cardValue) : null,
          card: pull.pull.card ? {
            ...pull.pull.card,
            pullRate: Number(pull.pull.card.pullRate),
            coinValue: Number(pull.pull.card.coinValue),
          } : null,
        } : null,
      })),
      participants: finalBattle.participants.map(p => ({
        ...p,
        totalValue: Number(p.totalValue),
      })),
    } : null;

    return NextResponse.json({
      success: true,
      battle: serializedBattle,
      transferredPullIds,
      message: isDraw
        ? 'Unentschieden! Keine Karten wurden übertragen.'
        : `Battle abgeschlossen! Gewinner ermittelt.`,
    });
  } catch (error) {
    console.error('Error starting battle:', error);
    return NextResponse.json({ error: 'Battle konnte nicht gestartet werden' }, { status: 500 });
  }
}
