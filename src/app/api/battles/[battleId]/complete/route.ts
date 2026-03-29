import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { awardBattleLeaderboardForFinishedBattle } from '@/lib/leaderboard/award';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ battleId: string }> }
) {
  try {
    const session = await getCurrentSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    const { battleId } = await params;
    const battle = await prisma.battle.findUnique({
      where: { id: battleId },
      include: {
        participants: { include: { user: { select: { email: true } } } },
      },
    });

    if (!battle) {
      return NextResponse.json({ error: 'Battle nicht gefunden' }, { status: 404 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    });
    if (!user) {
      return NextResponse.json({ error: 'Benutzer nicht gefunden' }, { status: 404 });
    }

    const isParticipant = battle.participants.some(p => p.userId === user.id);
    const isAdmin = user.role === 'ADMIN';
    if (!isParticipant && !isAdmin) {
      return NextResponse.json({ error: 'Nicht erlaubt' }, { status: 403 });
    }

    if (battle.status !== 'FINISHED_WIN' && battle.status !== 'FINISHED_DRAW') {
      return NextResponse.json({ error: 'Battle nicht abgeschlossen' }, { status: 400 });
    }

    const result = await awardBattleLeaderboardForFinishedBattle(prisma, battleId);
    const mine = result.results.find(r => r.userId === user.id);

    return NextResponse.json({
      success: true,
      awarded: result.awarded,
      breakdown: mine?.breakdown ?? null,
    });
  } catch (e) {
    console.error('[battles/complete]', e);
    return NextResponse.json({ error: 'Fehler' }, { status: 500 });
  }
}
