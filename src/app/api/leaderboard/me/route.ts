import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getDecayUiState } from '@/lib/leaderboard/decay-status';
import { getUserStandingRank } from '@/lib/leaderboard/standings';
import type { StandingsScope } from '@/lib/leaderboard/standings';
import { getWeeklyVolumeMultiplier } from '@/lib/leaderboard/scoring';

export async function GET() {
  try {
    const session = await getCurrentSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, name: true, avatar: true },
    });
    if (!user) {
      return NextResponse.json({ error: 'Benutzer nicht gefunden' }, { status: 404 });
    }

    const entry = await prisma.leaderboardEntry.findUnique({
      where: { userId: user.id },
    });

    const now = new Date();
    const decay = getDecayUiState(entry?.lastBattleAt ?? null, now);

    const scopeRank = async (scope: StandingsScope) =>
      getUserStandingRank(prisma, user.id, scope);

    const [weeklyRank, monthlyRank, allTimeRank] = await Promise.all([
      scopeRank('weekly'),
      scopeRank('monthly'),
      scopeRank('all-time'),
    ]);

    const volumeMultiplier = getWeeklyVolumeMultiplier(entry?.battlesThisWeek ?? 0);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        avatar: user.avatar,
      },
      entry: entry
        ? {
            totalPoints: entry.totalPoints,
            weeklyPoints: entry.weeklyPoints,
            monthlyPoints: entry.monthlyPoints,
            allTimePoints: entry.allTimePoints,
            currentStreak: entry.currentStreak,
            bestStreak: entry.bestStreak,
            battlesThisWeek: entry.battlesThisWeek,
            totalBattles: entry.totalBattles,
            totalWins: entry.totalWins,
            totalLosses: entry.totalLosses,
            lastBattleAt: entry.lastBattleAt?.toISOString() ?? null,
            rank: entry.rank,
          }
        : null,
      ranks: {
        weekly: weeklyRank,
        monthly: monthlyRank,
        allTime: allTimeRank,
      },
      decay,
      volumeMultiplier,
    });
  } catch (e) {
    console.error('[leaderboard/me]', e);
    return NextResponse.json({ error: 'Fehler' }, { status: 500 });
  }
}
