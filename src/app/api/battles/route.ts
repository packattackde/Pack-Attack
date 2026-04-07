import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { prisma, withRetry } from '@/lib/prisma';
import { z } from 'zod';
import { rateLimit } from '@/lib/rate-limit';
import { sendBattleNotificationWebhook } from '@/lib/discord-webhook';

const battleSchema = z.object({
  boxIds: z.array(z.string()).min(1).max(10),
  battleMode: z.enum(['LOWEST_CARD', 'HIGHEST_CARD', 'ALL_CARDS']),
  winCondition: z.enum(['HIGHEST', 'LOWEST', 'SHARE_MODE', 'JACKPOT']),
  maxParticipants: z.number().int().min(2).max(4),
  privacy: z.enum(['PUBLIC', 'PRIVATE']).optional().default('PUBLIC'),
});

export async function GET() {
  try {
    const session = await getCurrentSession();
    const isAdmin = session?.user?.role === 'ADMIN';

    const battles = await withRetry(
      () => prisma.battle.findMany({
        where: isAdmin ? {} : { privacy: 'PUBLIC' },
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
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      'battles:list'
    );

    const serializedBattles = battles.map(battle => ({
      ...battle,
      entryFee: Number(battle.entryFee),
      box: battle.box ? {
        ...battle.box,
        price: Number(battle.box.price),
      } : null,
      roundBoxes: battle.roundBoxes.map(rb => ({
        ...rb,
        box: { ...rb.box, price: Number(rb.box.price) },
      })),
      participants: battle.participants.map(p => ({
        ...p,
        totalValue: Number(p.totalValue),
      })),
    }));

    return NextResponse.json({ success: true, battles: serializedBattles });
  } catch (error) {
    console.error('Error fetching battles:', error);
    return NextResponse.json({ error: 'Failed to fetch battles' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const rateLimitResult = await rateLimit(request, 'battleCreation');
    if (!rateLimitResult.success && rateLimitResult.response) {
      return rateLimitResult.response;
    }

    const session = await getCurrentSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'Benutzer nicht gefunden' }, { status: 404 });
    }

    const body = await request.json();
    const data = battleSchema.parse(body);

    const activeBattle = await prisma.battleParticipant.findFirst({
      where: {
        userId: user.id,
        battle: {
          status: { in: ['OPEN', 'FULL', 'READY', 'ACTIVE'] },
        },
      },
    });

    if (activeBattle) {
      return NextResponse.json({
        error: 'Du bist bereits in einem aktiven Battle. Beende es zuerst.',
      }, { status: 400 });
    }

    const uniqueBoxIds = [...new Set(data.boxIds)];
    const boxes = await prisma.box.findMany({
      where: { id: { in: uniqueBoxIds } },
    });

    if (boxes.length !== uniqueBoxIds.length) {
      return NextResponse.json({ error: 'Eine oder mehrere Boxen nicht gefunden' }, { status: 404 });
    }

    const boxMap = new Map(boxes.map(b => [b.id, b]));
    const rounds = data.boxIds.length;
    const entryFee = data.boxIds.reduce((sum, id) => sum + Number(boxMap.get(id)!.price), 0);
    const userCoins = Number(user.coins);

    if (userCoins < entryFee) {
      return NextResponse.json({
        error: `Nicht genug Coins. Du brauchst ${Math.round(entryFee)} Coins.`,
        required: entryFee,
        current: userCoins,
      }, { status: 400 });
    }

    const lobbyExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
    const firstBoxId = data.boxIds[0];

    const [, battle] = await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { coins: { decrement: entryFee } },
      }),
      prisma.battle.create({
        data: {
          creatorId: user.id,
          boxId: firstBoxId,
          entryFee: Math.round(entryFee),
          rounds,
          battleMode: data.battleMode,
          winCondition: data.winCondition,
          maxParticipants: data.maxParticipants,
          privacy: data.privacy,
          lobbyExpiresAt,
          participants: {
            create: { userId: user.id },
          },
          roundBoxes: {
            create: data.boxIds.map((boxId, i) => ({
              roundNumber: i + 1,
              boxId,
            })),
          },
        },
        include: {
          creator: { select: { id: true, name: true, email: true } },
          box: true,
          roundBoxes: {
            include: { box: true },
            orderBy: { roundNumber: 'asc' },
          },
          participants: {
            include: { user: { select: { id: true, name: true, email: true } } },
          },
        },
      }),
    ]);

    const firstBox = boxMap.get(firstBoxId)!;
    sendBattleNotificationWebhook({
      battleId: battle.id,
      boxName: uniqueBoxIds.length === 1 ? firstBox.name : `${uniqueBoxIds.length} Boxen Mix`,
      boxImageUrl: firstBox.imageUrl || undefined,
      players: data.maxParticipants,
      rounds,
      winCondition: data.winCondition,
      rewardMode: data.battleMode,
      privacy: data.privacy,
      entryCost: entryFee,
      creatorUsername: user.name || user.email || 'Anonym',
    }).catch((error) => {
      console.error('Failed to send Discord notification:', error);
    });

    const serializedBattle = {
      ...battle,
      entryFee: Number(battle.entryFee),
      box: battle.box ? {
        ...battle.box,
        price: Number(battle.box.price),
      } : null,
      roundBoxes: battle.roundBoxes.map(rb => ({
        ...rb,
        box: { ...rb.box, price: Number(rb.box.price) },
      })),
      participants: battle.participants.map(p => ({
        ...p,
        totalValue: Number(p.totalValue),
      })),
    };

    return NextResponse.json({ success: true, battle: serializedBattle });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Ungültige Eingabe', details: error.issues }, { status: 400 });
    }
    console.error('Battle creation error:', error);
    return NextResponse.json({ error: 'Battle konnte nicht erstellt werden' }, { status: 500 });
  }
}
