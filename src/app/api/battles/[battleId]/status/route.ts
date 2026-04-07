import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { prisma, withRetry } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ battleId: string }> }
) {
  try {
    const session = await getCurrentSession();
    const { battleId } = await params;
    const isAdmin = session?.user?.role === 'ADMIN';

    const battle = await withRetry(
      () => prisma.battle.findUnique({
        where: { id: battleId },
        include: {
          creator: { select: { id: true, name: true, email: true } },
          box: {
            include: {
              cards: {
                orderBy: { coinValue: 'desc' },
                take: 3,
                select: {
                  id: true,
                  name: true,
                  imageUrlGatherer: true,
                  imageUrlScryfall: true,
                  coinValue: true,
                },
              },
            },
          },
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
              participant: {
                include: { user: true },
              },
              pull: {
                include: { card: true },
              },
            },
            orderBy: [
              { roundNumber: 'asc' },
              { pulledAt: 'asc' },
            ],
          },
        },
      }),
      'battle-status:findBattle'
    );

    if (!battle) {
      return NextResponse.json({ error: 'Battle nicht gefunden' }, { status: 404 });
    }

    const allReady = battle.participants.length === battle.maxParticipants &&
                     battle.participants.every(p => p.isReady);

    const serializedBattle = {
      ...battle,
      entryFee: Number(battle.entryFee),
      box: battle.box ? {
        ...battle.box,
        price: Number(battle.box.price),
        cards: battle.box.cards?.map(card => ({
          ...card,
          coinValue: Number(card.coinValue),
        })),
      } : null,
      roundBoxes: (battle as any).roundBoxes?.map((rb: any) => ({
        ...rb,
        box: { ...rb.box, price: Number(rb.box.price) },
      })) || [],
      pulls: battle.pulls?.map(pull => ({
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
      participants: battle.participants.map(p => ({
        ...p,
        totalValue: Number(p.totalValue),
        user: {
          ...p.user,
          isBot: isAdmin ? p.user.isBot : false,
        },
      })),
    };

    return NextResponse.json({
      success: true,
      battle: serializedBattle,
      allReady,
      isFull: battle.participants.length >= battle.maxParticipants,
    });
  } catch (error) {
    console.error('Error getting battle status:', error);
    return NextResponse.json({ error: 'Battle-Status konnte nicht geladen werden' }, { status: 500 });
  }
}
