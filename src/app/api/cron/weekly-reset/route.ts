import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { recalculateAllRanks } from '@/lib/leaderboard/ranks';

const CRON_SECRET = process.env.CRON_SECRET || 'your-secret-key';

/**
 * Weekly: reset weeklyPoints + battlesThisWeek (Monday 00:00 UTC).
 * Monthly: on day 1 UTC, reset monthlyPoints.
 */
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
  }

  const now = new Date();
  const utcDow = now.getUTCDay();
  const utcDate = now.getUTCDate();

  let weeklyReset = 0;
  let monthlyReset = 0;

  if (utcDow === 1) {
    const r = await prisma.leaderboardEntry.updateMany({
      data: { weeklyPoints: 0, battlesThisWeek: 0 },
    });
    weeklyReset = r.count;
  }

  if (utcDate === 1) {
    const r = await prisma.leaderboardEntry.updateMany({
      data: { monthlyPoints: 0 },
    });
    monthlyReset = r.count;
  }

  await recalculateAllRanks(prisma);

  return NextResponse.json({
    success: true,
    at: now.toISOString(),
    weeklyResetRows: weeklyReset,
    monthlyResetRows: monthlyReset,
  });
}
