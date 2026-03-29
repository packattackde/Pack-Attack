import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const addBotsSchema = z.object({
  count: z.number().int().min(1).max(3).default(1),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ battleId?: string }> }
) {
  try {
    const { battleId } = await context.params;

    const session = await getCurrentSession();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    });

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin-Zugang erforderlich' }, { status: 403 });
    }

    if (!battleId) {
      return NextResponse.json({ error: 'Battle-ID fehlt' }, { status: 400 });
    }

    const payload = await request.json();
    const { count } = addBotsSchema.parse(payload);

    const battle = await prisma.battle.findUnique({
      where: { id: battleId },
      include: {
        participants: {
          select: { userId: true },
        },
      },
    });

    if (!battle) {
      return NextResponse.json({ error: 'Battle nicht gefunden' }, { status: 404 });
    }

    if (battle.status !== 'OPEN') {
      return NextResponse.json({ error: 'Bots können nur offenen Battles beitreten' }, { status: 400 });
    }

    const spotsLeft = battle.maxParticipants - battle.participants.length;

    if (spotsLeft <= 0) {
      return NextResponse.json({ error: 'Battle ist bereits voll' }, { status: 400 });
    }

    if (count > spotsLeft) {
      return NextResponse.json(
        { error: `Nur ${spotsLeft} Platz/Plätze verfügbar` },
        { status: 400 }
      );
    }

    const existingIds = battle.participants.map(p => p.userId);

    const availableBots = await prisma.user.findMany({
      where: {
        isBot: true,
        id: { notIn: existingIds },
      },
      orderBy: { createdAt: 'asc' },
      take: count,
    });

    if (availableBots.length === 0) {
      const totalBots = await prisma.user.count({ where: { isBot: true } });
      if (totalBots === 0) {
        return NextResponse.json(
          { error: 'Keine Bot-Benutzer vorhanden. Bitte create-bots Script ausführen.' },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: 'Alle verfügbaren Bots sind bereits in diesem Battle' },
        { status: 400 }
      );
    }

    if (availableBots.length < count) {
      return NextResponse.json(
        { error: `Nur ${availableBots.length} Bot(s) verfügbar` },
        { status: 400 }
      );
    }

    await prisma.$transaction(
      availableBots.map((bot) =>
        prisma.battleParticipant.create({
          data: {
            battleId,
            userId: bot.id,
            isReady: true,
          },
        })
      )
    );

    // Check if battle is now full
    const newCount = battle.participants.length + availableBots.length;
    if (newCount >= battle.maxParticipants) {
      await prisma.battle.update({
        where: { id: battleId },
        data: {
          status: 'FULL',
          autoStartAt: new Date(Date.now() + 3 * 60 * 1000),
        },
      });
    }

    revalidatePath(`/battles/${battleId}`);
    revalidatePath('/battles');

    return NextResponse.json({ success: true, added: availableBots.length });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Ungültige Eingabe', details: error.issues }, { status: 400 });
    }
    console.error('Add bots error:', error);
    return NextResponse.json({ error: 'Bots konnten nicht hinzugefügt werden' }, { status: 500 });
  }
}
