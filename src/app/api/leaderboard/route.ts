import { NextRequest, NextResponse } from 'next/server';
import { getLeaderboard, PRIZE_CONFIG } from '@/lib/leaderboard';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const monthParam = searchParams.get('month');
    const yearParam = searchParams.get('year');
    const period = searchParams.get('period') || 'current';

    const now = new Date();
    let targetMonth: number;
    let targetYear: number;

    if (monthParam && yearParam) {
      targetMonth = parseInt(monthParam, 10);
      targetYear = parseInt(yearParam, 10);
      if (isNaN(targetMonth) || isNaN(targetYear) || targetMonth < 1 || targetMonth > 12 || targetYear < 2020 || targetYear > 2100) {
        return NextResponse.json({ error: 'Invalid month or year parameter' }, { status: 400 });
      }
    } else if (period === 'previous') {
      const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      targetMonth = prevDate.getMonth() + 1;
      targetYear = prevDate.getFullYear();
    } else {
      targetMonth = now.getMonth() + 1;
      targetYear = now.getFullYear();
    }

    const leaderboard = await getLeaderboard(targetMonth, targetYear);

    // Calculate time until reset
    const nextMonth = new Date(targetYear, targetMonth, 1);
    const timeUntilReset = nextMonth.getTime() - now.getTime();
    const daysUntilReset = Math.floor(timeUntilReset / (1000 * 60 * 60 * 24));
    const hoursUntilReset = Math.floor((timeUntilReset % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutesUntilReset = Math.floor((timeUntilReset % (1000 * 60 * 60)) / (1000 * 60));
    const secondsUntilReset = Math.floor((timeUntilReset % (1000 * 60)) / 1000);

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];

    const response = NextResponse.json({
      success: true,
      leaderboard: leaderboard.slice(0, 10),
      fullLeaderboard: leaderboard,
      month: targetMonth,
      year: targetYear,
      monthName: monthNames[targetMonth - 1],
      period,
      resetIn: {
        days: daysUntilReset,
        hours: hoursUntilReset,
        minutes: minutesUntilReset,
        seconds: secondsUntilReset,
      },
      prizes: PRIZE_CONFIG,
    });
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
    return response;
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
  }
}
