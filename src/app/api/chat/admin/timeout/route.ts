import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST: Timeout a user from chat
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (admin?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { userId, duration, reason } = body;

    if (!userId || !duration) {
      return NextResponse.json({ error: 'userId and duration are required' }, { status: 400 });
    }

    // Validate target user exists and is not an admin
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, name: true, twitchUsername: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (targetUser.role === 'ADMIN') {
      return NextResponse.json({ error: 'Cannot timeout an admin' }, { status: 400 });
    }

    // Calculate expiration
    const now = new Date();
    const durationMap: Record<string, number> = {
      '1h': 60 * 60 * 1000,
      '1d': 24 * 60 * 60 * 1000,
      '1w': 7 * 24 * 60 * 60 * 1000,
    };

    const ms = durationMap[duration];
    if (!ms) {
      return NextResponse.json({ error: 'Invalid duration. Use: 1h, 1d, 1w' }, { status: 400 });
    }

    const expiresAt = new Date(now.getTime() + ms);

    // Deactivate any existing active bans/timeouts for this user first
    await prisma.chatBan.updateMany({
      where: { userId, active: true },
      data: { active: false },
    });

    // Create the timeout
    const timeout = await prisma.chatBan.create({
      data: {
        userId,
        type: 'TIMEOUT',
        reason: reason || null,
        expiresAt,
        createdById: session.user.id,
        active: true,
      },
    });

    return NextResponse.json({
      success: true,
      timeout: {
        id: timeout.id,
        userId: timeout.userId,
        userName: targetUser.twitchUsername || targetUser.name,
        type: timeout.type,
        reason: timeout.reason,
        expiresAt: timeout.expiresAt?.toISOString(),
        createdAt: timeout.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Timeout error:', error);
    return NextResponse.json({ error: 'Failed to timeout user' }, { status: 500 });
  }
}
