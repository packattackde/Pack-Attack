import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  getLeaderboardStandingsPage,
  type StandingsScope,
} from '@/lib/leaderboard/standings';
import { PRIZE_CONFIG } from '@/lib/leaderboard';

const SCOPES: StandingsScope[] = ['weekly', 'monthly', 'all-time'];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const scopeRaw = searchParams.get('scope') ?? 'weekly';
    const scope = (SCOPES.includes(scopeRaw as StandingsScope)
      ? scopeRaw
      : 'weekly') as StandingsScope;

    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1);
    const pageSize = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get('pageSize') ?? '50', 10) || 50)
    );
    const search = searchParams.get('search') ?? undefined;

    const { rows, total } = await getLeaderboardStandingsPage(prisma, {
      scope,
      page,
      pageSize,
      search,
    });

    const leaderboard = rows.map(r => ({
      rank: r.rank,
      points: r.points,
      userId: r.userId,
      userName: r.userName ?? 'Anonymous',
      userAvatar: r.userAvatar,
      battlesPlayed: r.totalBattles,
      battlesWon: r.totalWins,
      totalLosses: r.totalLosses,
      winRate:
        r.totalWins + r.totalLosses > 0
          ? Math.round((r.totalWins / (r.totalWins + r.totalLosses)) * 1000) / 10
          : 0,
      currentStreak: r.currentStreak,
      battlesThisWeek: r.battlesThisWeek,
      weeklyPoints: r.weeklyPoints,
      monthlyPoints: r.monthlyPoints,
      totalPoints: r.totalPoints,
    }));

    const res = NextResponse.json({
      success: true,
      scope,
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize) || 1,
      leaderboard,
      prizes: PRIZE_CONFIG,
    });
    res.headers.set('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60');
    return res;
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
  }
}
