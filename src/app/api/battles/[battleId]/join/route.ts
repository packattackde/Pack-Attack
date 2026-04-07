import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ battleId: string }> }
) {
  try {
    const rateLimitResult = await rateLimit(request, 'battleJoin');
    if (!rateLimitResult.success && rateLimitResult.response) {
      return rateLimitResult.response;
    }

    const session = await getCurrentSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Du musst eingeloggt sein, um einem Battle beizutreten' }, { status: 401 });
    }

    const { battleId } = await params;

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'Benutzer nicht gefunden' }, { status: 404 });
    }

    // Check user is not already in an active battle
    const existingActive = await prisma.battleParticipant.findFirst({
      where: {
        userId: user.id,
        battle: {
          status: { in: ['OPEN', 'FULL', 'READY', 'ACTIVE'] },
          id: { not: battleId },
        },
      },
    });

    if (existingActive) {
      return NextResponse.json({
        error: 'Du bist bereits in einem anderen aktiven Battle',
      }, { status: 400 });
    }

    const battle = await prisma.battle.findUnique({
      where: { id: battleId },
      include: {
        box: true,
        participants: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
      },
    });

    if (!battle) {
      return NextResponse.json({ error: 'Battle nicht gefunden' }, { status: 404 });
    }

    if (battle.status !== 'OPEN') {
      return NextResponse.json({ error: 'Dieses Battle nimmt keine Teilnehmer mehr an' }, { status: 400 });
    }

    if (battle.participants.length >= battle.maxParticipants) {
      return NextResponse.json({ error: 'Dieses Battle ist voll' }, { status: 400 });
    }

    // Block self-join
    if (battle.creatorId === user.id) {
      return NextResponse.json({ error: 'Du kannst deinem eigenen Battle nicht beitreten' }, { status: 400 });
    }

    const alreadyJoined = battle.participants.some(p => p.userId === user.id);
    if (alreadyJoined) {
      return NextResponse.json({ error: 'Du bist bereits in diesem Battle' }, { status: 400 });
    }

    // Check lobby expiry
    if (battle.lobbyExpiresAt && new Date() > battle.lobbyExpiresAt) {
      return NextResponse.json({ error: 'Die Lobby-Zeit ist abgelaufen' }, { status: 400 });
    }

    const userCoins = Number(user.coins);
    const entryFee = Number(battle.entryFee);

    if (userCoins < entryFee) {
      return NextResponse.json({
        error: `Nicht genug Coins. Du brauchst ${Math.round(entryFee)} Coins.`,
        required: entryFee,
        current: userCoins,
      }, { status: 400 });
    }

    // Deduct coins and add participant atomically
    const [updatedUser, participant] = await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { coins: { decrement: entryFee } },
      }),
      prisma.battleParticipant.create({
        data: {
          battleId: battle.id,
          userId: user.id,
        },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      }),
    ]);

    // Check if battle is now full -> set FULL + autoStartAt
    const newCount = battle.participants.length + 1;
    if (newCount >= battle.maxParticipants) {
      await prisma.battle.update({
        where: { id: battleId },
        data: {
          status: 'FULL',
          autoStartAt: new Date(Date.now() + 3 * 60 * 1000),
        },
      });
    }

    const updatedBattle = await prisma.battle.findUnique({
      where: { id: battleId },
      include: {
        creator: { select: { id: true, name: true, email: true } },
        box: true,
        participants: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
      },
    });

    const serializedBattle = updatedBattle ? {
      ...updatedBattle,
      entryFee: Number(updatedBattle.entryFee),
      box: updatedBattle.box ? {
        ...updatedBattle.box,
        price: Number(updatedBattle.box.price),
      } : null,
      participants: updatedBattle.participants.map(p => ({
        ...p,
        totalValue: Number(p.totalValue),
      })),
    } : null;

    return NextResponse.json({
      success: true,
      message: 'Erfolgreich dem Battle beigetreten!',
      battle: serializedBattle,
      coinsDeducted: entryFee,
      newBalance: Number(updatedUser.coins),
    });
  } catch (error) {
    console.error('Error joining battle:', error);
    return NextResponse.json({ error: 'Beitritt zum Battle fehlgeschlagen' }, { status: 500 });
  }
}
