import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ battleId: string }> }
) {
  try {
    const { battleId } = await params;

    const battle = await prisma.battle.findUnique({
      where: { id: battleId },
      include: {
        creator: { select: { id: true, name: true, email: true } },
        box: {
          include: {
            cards: {
              orderBy: { coinValue: 'desc' },
              take: 3,
            },
          },
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
    });

    if (!battle) {
      return NextResponse.json({ error: 'Battle nicht gefunden' }, { status: 404 });
    }

    const serializedBattle = {
      ...battle,
      entryFee: Number(battle.entryFee),
      box: battle.box ? {
        ...battle.box,
        price: Number(battle.box.price),
        cards: battle.box.cards?.map(card => ({
          ...card,
          coinValue: Number(card.coinValue),
          pullRate: Number(card.pullRate),
        })),
      } : null,
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
      })),
    };

    return NextResponse.json({ success: true, battle: serializedBattle });
  } catch (error) {
    console.error('Error fetching battle:', error);
    return NextResponse.json({ error: 'Battle konnte nicht geladen werden' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ battleId: string }> }
) {
  try {
    const session = await getCurrentSession();
    const { battleId } = await params;

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin-Zugang erforderlich' }, { status: 403 });
    }

    const battle = await prisma.battle.findUnique({
      where: { id: battleId },
    });

    if (!battle) {
      return NextResponse.json({ error: 'Battle nicht gefunden' }, { status: 404 });
    }

    if (!['FINISHED_WIN', 'FINISHED_DRAW', 'CANCELLED'].includes(battle.status)) {
      return NextResponse.json({
        error: 'Nur abgeschlossene oder stornierte Battles können gelöscht werden',
      }, { status: 400 });
    }

    await prisma.battle.delete({
      where: { id: battleId },
    });

    return NextResponse.json({
      success: true,
      message: 'Battle erfolgreich gelöscht',
    });
  } catch (error) {
    console.error('Error deleting battle:', error);
    return NextResponse.json({ error: 'Battle konnte nicht gelöscht werden' }, { status: 500 });
  }
}
