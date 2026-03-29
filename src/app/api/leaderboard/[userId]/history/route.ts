import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getCurrentSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    const { userId } = await params;
    const me = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    });
    if (!me) {
      return NextResponse.json({ error: 'Benutzer nicht gefunden' }, { status: 404 });
    }

    if (me.id !== userId && me.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Nicht erlaubt' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1);
    const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get('pageSize') ?? '20', 10) || 20));

    const entry = await prisma.leaderboardEntry.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!entry) {
      return NextResponse.json({ success: true, transactions: [], total: 0, page, pageSize });
    }

    const [total, transactions] = await prisma.$transaction([
      prisma.pointTransaction.count({ where: { leaderboardEntryId: entry.id } }),
      prisma.pointTransaction.findMany({
        where: { leaderboardEntryId: entry.id },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          battleId: true,
          type: true,
          points: true,
          description: true,
          metadata: true,
          createdAt: true,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      transactions: transactions.map(t => ({
        ...t,
        createdAt: t.createdAt.toISOString(),
      })),
      total,
      page,
      pageSize,
    });
  } catch (e) {
    console.error('[leaderboard/history]', e);
    return NextResponse.json({ error: 'Fehler' }, { status: 500 });
  }
}
