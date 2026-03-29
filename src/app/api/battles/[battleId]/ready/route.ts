import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ battleId: string }> }
) {
  try {
    const rateLimitResult = await rateLimit(request, 'general');
    if (!rateLimitResult.success && rateLimitResult.response) {
      return rateLimitResult.response;
    }

    const session = await getCurrentSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    const { battleId } = await params;

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'Benutzer nicht gefunden' }, { status: 404 });
    }

    const battle = await prisma.battle.findUnique({
      where: { id: battleId },
      include: {
        participants: {
          include: { user: { select: { id: true, name: true, email: true, isBot: true } } },
        },
      },
    });

    if (!battle) {
      return NextResponse.json({ error: 'Battle nicht gefunden' }, { status: 404 });
    }

    if (battle.status !== 'FULL' && battle.status !== 'READY') {
      return NextResponse.json({ error: 'Battle ist nicht im Wartezustand' }, { status: 400 });
    }

    if (battle.participants.length < battle.maxParticipants) {
      return NextResponse.json({ error: 'Battle ist noch nicht voll' }, { status: 400 });
    }

    const participant = battle.participants.find(p => p.userId === user.id);
    if (!participant) {
      return NextResponse.json({ error: 'Du bist nicht in diesem Battle' }, { status: 400 });
    }

    await prisma.battleParticipant.update({
      where: { id: participant.id },
      data: { isReady: true },
    });

    // Check if all participants are now ready
    const updatedBattle = await prisma.battle.findUnique({
      where: { id: battleId },
      include: {
        participants: {
          include: { user: { select: { id: true, name: true, email: true, isBot: true } } },
        },
      },
    });

    const allReady = updatedBattle?.participants.every(p => p.isReady) ?? false;

    // If all ready, set status to READY
    if (allReady && updatedBattle?.status === 'FULL') {
      await prisma.battle.update({
        where: { id: battleId },
        data: { status: 'READY' },
      });
    }

    return NextResponse.json({
      success: true,
      isReady: true,
      allReady,
      participants: updatedBattle?.participants.map(p => ({
        id: p.id,
        userId: p.userId,
        name: p.user.name || p.user.email,
        isReady: p.isReady,
        isBot: p.user.isBot,
      })),
    });
  } catch (error) {
    console.error('Error marking ready:', error);
    return NextResponse.json({ error: 'Bereit-Markierung fehlgeschlagen' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ battleId: string }> }
) {
  try {
    const session = await getCurrentSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    const { battleId } = await params;

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'Benutzer nicht gefunden' }, { status: 404 });
    }

    const participant = await prisma.battleParticipant.findFirst({
      where: { battleId, userId: user.id },
    });

    if (!participant) {
      return NextResponse.json({ error: 'Du bist nicht in diesem Battle' }, { status: 400 });
    }

    await prisma.battleParticipant.update({
      where: { id: participant.id },
      data: { isReady: false },
    });

    // If battle was READY, revert to FULL
    const battle = await prisma.battle.findUnique({ where: { id: battleId } });
    if (battle?.status === 'READY') {
      await prisma.battle.update({
        where: { id: battleId },
        data: { status: 'FULL' },
      });
    }

    return NextResponse.json({ success: true, isReady: false });
  } catch (error) {
    console.error('Error unmarking ready:', error);
    return NextResponse.json({ error: 'Bereit-Markierung konnte nicht aufgehoben werden' }, { status: 500 });
  }
}
