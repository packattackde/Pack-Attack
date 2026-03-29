import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  _request: NextRequest,
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
      select: { id: true },
    });
    if (!user) {
      return NextResponse.json({ error: 'Benutzer nicht gefunden' }, { status: 404 });
    }

    const entry = await prisma.leaderboardEntry.findUnique({
      where: { userId: user.id },
      select: { id: true, rank: true },
    });

    const tx = entry
      ? await prisma.pointTransaction.findFirst({
          where: {
            battleId,
            leaderboardEntryId: entry.id,
          },
          select: { id: true, points: true, metadata: true, type: true },
        })
      : null;

    return NextResponse.json({
      success: true,
      breakdown: tx?.metadata ?? null,
      pointsEarned: tx?.points ?? null,
      type: tx?.type ?? null,
      rank: entry?.rank ?? null,
    });
  } catch (e) {
    console.error('[battles/leaderboard-result]', e);
    return NextResponse.json({ error: 'Fehler' }, { status: 500 });
  }
}
