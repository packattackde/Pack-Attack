import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST: Permanently ban a user from chat
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
    const { userId, reason } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    // Validate target user
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, name: true, twitchUsername: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (targetUser.role === 'ADMIN') {
      return NextResponse.json({ error: 'Cannot ban an admin' }, { status: 400 });
    }

    // Deactivate any existing active bans/timeouts
    await prisma.chatBan.updateMany({
      where: { userId, active: true },
      data: { active: false },
    });

    // Create permanent ban
    const ban = await prisma.chatBan.create({
      data: {
        userId,
        type: 'BAN',
        reason: reason || null,
        expiresAt: null, // permanent
        createdById: session.user.id,
        active: true,
      },
    });

    return NextResponse.json({
      success: true,
      ban: {
        id: ban.id,
        userId: ban.userId,
        userName: targetUser.twitchUsername || targetUser.name,
        type: ban.type,
        reason: ban.reason,
        createdAt: ban.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Ban error:', error);
    return NextResponse.json({ error: 'Failed to ban user' }, { status: 500 });
  }
}

// DELETE: Unban a user (remove active ban)
export async function DELETE(request: Request) {
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
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    // Deactivate all active bans/timeouts for this user
    const result = await prisma.chatBan.updateMany({
      where: { userId, active: true },
      data: { active: false },
    });

    if (result.count === 0) {
      return NextResponse.json({ error: 'No active ban found for this user' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      unbannedUserId: userId,
      deactivatedCount: result.count,
    });
  } catch (error) {
    console.error('Unban error:', error);
    return NextResponse.json({ error: 'Failed to unban user' }, { status: 500 });
  }
}
