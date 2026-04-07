import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { prisma, withRetry } from '@/lib/prisma';
import { awardXp } from '@/lib/level';

type CardData = {
  id: string;
  name: string;
  coinValue: number;
  pullRate: number;
  imageUrlGatherer: string | null;
  imageUrlScryfall: string | null;
  rarity: string | null;
  boxId: string;
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
          box: { include: { cards: true } },
          roundBoxes: {
            include: { box: { include: { cards: true } } },
            orderBy: { roundNumber: 'asc' },
          },
        },
      }),
      'battle-start:findBattle'
    );

    if (!battle) {
      return NextResponse.json({ error: 'Battle nicht gefunden' }, { status: 404 });
    }

    const isAdmin = currentUser.role === 'ADMIN';
    if (battle.creatorId !== currentUser.id && !isAdmin) {
      return NextResponse.json({ error: 'Nur der Ersteller oder ein Admin kann das Battle starten' }, { status: 403 });
    }

    if (battle.status !== 'FULL' && battle.status !== 'READY') {
      return NextResponse.json({ error: 'Battle kann nicht gestartet werden (falscher Status)' }, { status: 400 });
    }

    if (battle.participants.length < battle.maxParticipants) {
      return NextResponse.json({ error: 'Nicht genug Spieler im Battle' }, { status: 400 });
    }

    const botParticipants = battle.participants.filter(p => p.user.isBot && !p.isReady);
    if (botParticipants.length > 0) {
      await prisma.battleParticipant.updateMany({
        where: { id: { in: botParticipants.map(p => p.id) } },
        data: { isReady: true },
      });
    }

    const humanNotReady = battle.participants.filter(p => !p.user.isBot && !p.isReady);
    if (humanNotReady.length > 0) {
      return NextResponse.json({
        error: 'Nicht alle Spieler sind bereit',
        notReady: humanNotReady.map(p => p.user.name || p.user.email),
      }, { status: 400 });
    }

    const roundCardMap: Map<number, CardData[]> = new Map();

    if (battle.roundBoxes.length > 0) {
      for (const rb of battle.roundBoxes) {
        const cards = rb.box.cards.map(c => ({
          id: c.id,
          name: c.name,
          coinValue: Number(c.coinValue),
          pullRate: Number(c.pullRate),
          imageUrlGatherer: c.imageUrlGatherer,
          imageUrlScryfall: c.imageUrlScryfall,
          rarity: c.rarity,
          boxId: rb.boxId,
        }));
        if (cards.length === 0) {
          return NextResponse.json({ error: `Box "${rb.box.name}" (Runde ${rb.roundNumber}) hat keine Karten` }, { status: 400 });
        }
        roundCardMap.set(rb.roundNumber, cards);
      }
    } else if (battle.box) {
      const cards = battle.box.cards.map(c => ({
        id: c.id,
        name: c.name,
        coinValue: Number(c.coinValue),
        pullRate: Number(c.pullRate),
        imageUrlGatherer: c.imageUrlGatherer,
        imageUrlScryfall: c.imageUrlScryfall,
        rarity: c.rarity,
        boxId: battle.boxId!,
      }));
      if (cards.length === 0) {
        return NextResponse.json({ error: 'Die Box hat keine Karten' }, { status: 400 });
      }
      for (let r = 1; r <= battle.rounds; r++) {
        roundCardMap.set(r, cards);
      }
    } else {
      return NextResponse.json({ error: 'Keine Boxen für dieses Battle konfiguriert' }, { status: 400 });
    }

    await prisma.battle.update({
      where: { id: battleId },
      data: { status: 'ACTIVE', startedAt: new Date() },
    });

    // Pre-compute all draws (no DB needed)
    type DrawOp = {
      pullData: { boxId: string; userId: string; cardId: string; cardValue: number };
      participantId: string;
      round: number;
      card: CardData;
      coinValue: number;
    };

    const drawOps: DrawOp[] = [];
    const participantTotals: Record<string, number> = {};

    for (const participant of battle.participants) {
      participantTotals[participant.id] = 0;
    }

    for (let round = 1; round <= battle.rounds; round++) {
      const roundCards = roundCardMap.get(round);
      if (!roundCards || roundCards.length === 0) continue;

      for (const participant of battle.participants) {
        const card = drawRandomCard(roundCards);
        const coinValue = card.coinValue;
        participantTotals[participant.id] += coinValue;

        drawOps.push({
          pullData: {
            boxId: card.boxId,
            userId: participant.userId,
            cardId: card.id,
            cardValue: coinValue,
          },
          participantId: participant.id,
          round,
          card,
          coinValue,
        });
      }
    }

    // Create all pulls outside of an interactive transaction to avoid timeout.
    // Use individual creates (Pull needs the ID back for BattlePull linkage).
    let createdPulls: Array<{ pullId: string; participantId: string; round: number; coinValue: number; card: CardData }> = [];

    try {
      for (const op of drawOps) {
        const pull = await prisma.pull.create({ data: op.pullData });

        await prisma.battlePull.create({
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

        createdPulls.push({
          pullId: pull.id,
          participantId: op.participantId,
          round: op.round,
          coinValue: op.coinValue,
          card: op.card,
        });
      }

      // Update participant totals
      for (const participant of battle.participants) {
        await prisma.battleParticipant.update({
          where: { id: participant.id },
          data: {
            totalValue: Math.round(participantTotals[participant.id]),
            roundsPulled: battle.rounds,
          },
        });
      }
    } catch (pullError) {
      // If pull creation fails, reset battle so it's not stuck in ACTIVE
      console.error('Error creating pulls, resetting battle to FULL:', pullError);
      await prisma.battle.update({
        where: { id: battleId },
        data: { status: 'FULL', startedAt: null },
      });
      // Clean up any partial pulls
      await prisma.battlePull.deleteMany({ where: { battleId } });
      for (const p of createdPulls) {
        await prisma.pull.delete({ where: { id: p.pullId } }).catch(() => {});
      }
      return NextResponse.json({ error: 'Battle konnte nicht gestartet werden. Bitte erneut versuchen.' }, { status: 500 });
    }

    // Determine winner and transfer cards
    let winnerId: string | null = null;
    let transferredPullIds: string[] = [];
    let isDraw = false;

    if (battle.winCondition === 'SHARE_MODE') {
      const allPulls = [...createdPulls].sort((a, b) => a.coinValue - b.coinValue);
      const participantIds = battle.participants.map(p => p.userId);

      for (let i = 0; i < allPulls.length; i++) {
        const targetUserId = participantIds[i % participantIds.length];
        const pull = allPulls[i];
        await prisma.pull.update({ where: { id: pull.pullId }, data: { userId: targetUserId } });
        await prisma.battlePull.updateMany({ where: { pullId: pull.pullId }, data: { transferredToUserId: targetUserId } });
        transferredPullIds.push(pull.pullId);
      }

      isDraw = true;
      await prisma.battle.update({
        where: { id: battleId },
        data: { status: 'FINISHED_DRAW', finishedAt: new Date() },
      });

    } else if (battle.winCondition === 'JACKPOT') {
      const withTotals = battle.participants.map(p => ({ ...p, total: participantTotals[p.id] }));
      const totalSum = withTotals.reduce((s, p) => s + p.total, 0);
      let roll = Math.random() * (totalSum || 1);
      let jackpotWinner = withTotals[0];
      for (const p of withTotals) {
        roll -= p.total;
        if (roll <= 0) { jackpotWinner = p; break; }
      }

      winnerId = jackpotWinner.userId;
      const losers = withTotals.filter(p => p.userId !== winnerId);

      for (const loser of losers) {
        const loserPulls = createdPulls.filter(p => p.participantId === loser.id);
        for (const pull of loserPulls) {
          await prisma.pull.update({ where: { id: pull.pullId }, data: { userId: winnerId! } });
          await prisma.battlePull.updateMany({ where: { pullId: pull.pullId }, data: { transferredToUserId: winnerId } });
          transferredPullIds.push(pull.pullId);
        }
      }

      await prisma.battle.update({
        where: { id: battleId },
        data: { status: 'FINISHED_WIN', winnerId, finishedAt: new Date() },
      });

    } else {
      const useLowest = battle.winCondition === 'LOWEST';
      const sortedParticipants = battle.participants
        .map(p => ({ ...p, total: participantTotals[p.id] }))
        .sort((a, b) => useLowest ? a.total - b.total : b.total - a.total);

      const bestTotal = sortedParticipants[0].total;
      const winners = sortedParticipants.filter(p => p.total === bestTotal);
      isDraw = winners.length > 1;

      if (isDraw) {
        await prisma.battle.update({
          where: { id: battleId },
          data: { status: 'FINISHED_DRAW', finishedAt: new Date() },
        });
      } else {
        const winner = sortedParticipants[0];
        winnerId = winner.userId;
        const losers = sortedParticipants.filter(p => p.userId !== winnerId);
        const transferOps: Array<{ pullId: string }> = [];

        for (const loser of losers) {
          const loserPulls = createdPulls
            .filter(p => p.participantId === loser.id)
            .sort((a, b) => a.coinValue !== b.coinValue ? a.coinValue - b.coinValue : a.round - b.round);

          if (battle.battleMode === 'LOWEST_CARD') {
            if (loserPulls.length > 0) transferOps.push({ pullId: loserPulls[0].pullId });
          } else if (battle.battleMode === 'HIGHEST_CARD') {
            if (loserPulls.length > 0) transferOps.push({ pullId: loserPulls[loserPulls.length - 1].pullId });
          } else if (battle.battleMode === 'ALL_CARDS') {
            for (const pull of loserPulls) transferOps.push({ pullId: pull.pullId });
          }
        }

        for (const op of transferOps) {
          await prisma.pull.update({ where: { id: op.pullId }, data: { userId: winnerId! } });
          await prisma.battlePull.updateMany({ where: { pullId: op.pullId }, data: { transferredToUserId: winnerId } });
          transferredPullIds.push(op.pullId);
        }

        await prisma.battle.update({
          where: { id: battleId },
          data: { status: 'FINISHED_WIN', winnerId, finishedAt: new Date() },
        });
      }
    }

    for (const participant of battle.participants) {
      try {
        const xpAmount = participant.userId === winnerId ? 50 : 20;
        await awardXp(participant.userId, xpAmount, prisma as any);
      } catch (err) {
        console.error(`Failed to award XP to ${participant.userId}:`, err);
      }
    }

    const finalBattle = await prisma.battle.findUnique({
      where: { id: battleId },
      include: {
        creator: { select: { id: true, name: true, email: true } },
        box: true,
        roundBoxes: {
          include: { box: true },
          orderBy: { roundNumber: 'asc' },
        },
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
      roundBoxes: finalBattle.roundBoxes.map(rb => ({
        ...rb,
        box: { ...rb.box, price: Number(rb.box.price) },
      })),
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
