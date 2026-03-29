import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { calculateIncrementalDecay } from '@/lib/leaderboard/decay';
import { recalculateAllRanks } from '@/lib/leaderboard/ranks';

const CRON_SECRET = process.env.CRON_SECRET || 'your-secret-key';

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
  }

  const now = new Date();
  let processed = 0;

  const entries = await prisma.leaderboardEntry.findMany({
    where: { lastBattleAt: { not: null } },
  });

  for (const entry of entries) {
    if (!entry.lastBattleAt) continue;

    const { newPoints, decayApplied, daysApplied } = calculateIncrementalDecay({
      totalPoints: entry.totalPoints,
      lastBattleAt: entry.lastBattleAt,
      lastDecayAt: entry.lastDecayAt,
      now,
    });

    if (daysApplied === 0 || decayApplied <= 0) continue;

    await prisma.$transaction(async tx => {
      await tx.leaderboardEntry.update({
        where: { id: entry.id },
        data: {
          totalPoints: newPoints,
          lastDecayAt: now,
        },
      });
      await tx.pointTransaction.create({
        data: {
          leaderboardEntryId: entry.id,
          type: 'DECAY',
          points: -decayApplied,
          description: `Inaktivitäts-Verfall (${daysApplied} Tag(e))`,
          metadata: {
            previousPoints: entry.totalPoints,
            newPoints,
            daysApplied,
          } as Prisma.InputJsonValue,
        },
      });
    });
    processed++;
  }

  await recalculateAllRanks(prisma);

  return NextResponse.json({ success: true, processed, at: now.toISOString() });
}
