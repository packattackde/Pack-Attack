import { prisma } from '@/lib/prisma';
import { rateLimit } from '@/lib/rate-limit';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const rateLimitResult = await rateLimit(request as never, 'general');
    if (!rateLimitResult.success && rateLimitResult.response) {
      return rateLimitResult.response;
    }

    const { searchParams } = new URL(request.url);
    const minValue = Number(searchParams.get('minValue') || '100');
    const limit = Math.min(Number(searchParams.get('limit') || '15'), 30);

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const pulls = await prisma.pull.findMany({
      where: {
        cardId: { not: null },
        cardValue: { gte: minValue },
        timestamp: { gte: twentyFourHoursAgo },
      },
      include: {
        user: { select: { id: true, name: true } },
        card: { select: { id: true, name: true, imageUrlGatherer: true, rarity: true, coinValue: true } },
        box: { select: { id: true, name: true } },
      },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });

    const items = pulls
      .filter(p => p.card && p.box)
      .map(pull => ({
        pullId: pull.id,
        userId: pull.user.id,
        userName: pull.user.name || 'Anonymous',
        cardId: pull.card!.id,
        cardName: pull.card!.name,
        cardImage: pull.card!.imageUrlGatherer,
        rarity: pull.card!.rarity || 'rare',
        coinValue: Number(pull.card!.coinValue || 0),
        boxId: pull.box.id,
        boxName: pull.box.name,
        timestamp: pull.timestamp.toISOString(),
      }));

    return NextResponse.json(items);
  } catch (error) {
    console.error('[Recent Pulls] Error:', error);
    return NextResponse.json([], { status: 500 });
  }
}
