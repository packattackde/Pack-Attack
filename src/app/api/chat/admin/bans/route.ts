import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET: List all active bans/timeouts
export async function GET(request: Request) {
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
    const includeExpired = searchParams.get('includeExpired') === 'true';

    const now = new Date();
    const where = includeExpired
      ? {} // Show all bans
      : {
          active: true,
          OR: [
            { type: 'BAN' as const },
            { type: 'TIMEOUT' as const, expiresAt: { gt: now } },
          ],
        };

    const bans = await prisma.chatBan.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, name: true, twitchUsername: true, discordUsername: true, image: true },
        },
        createdBy: {
          select: { id: true, name: true, twitchUsername: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      bans: bans.map((ban) => ({
        id: ban.id,
        userId: ban.userId,
        userName: ban.user.twitchUsername || ban.user.discordUsername || ban.user.name || 'Unknown',
        userImage: ban.user.image,
        type: ban.type,
        reason: ban.reason,
        active: ban.active,
        expiresAt: ban.expiresAt?.toISOString() || null,
        isExpired: ban.type === 'TIMEOUT' && ban.expiresAt ? ban.expiresAt < now : false,
        createdBy: ban.createdBy.twitchUsername || ban.createdBy.name || 'Unknown',
        createdAt: ban.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('Bans list error:', error);
    return NextResponse.json({ error: 'Failed to load bans' }, { status: 500 });
  }
}

// DELETE: Remove a specific ban by ID
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
    const banId = searchParams.get('banId');

    if (!banId) {
      return NextResponse.json({ error: 'banId is required' }, { status: 400 });
    }

    const ban = await prisma.chatBan.findUnique({
      where: { id: banId },
    });

    if (!ban) {
      return NextResponse.json({ error: 'Ban not found' }, { status: 404 });
    }

    await prisma.chatBan.update({
      where: { id: banId },
      data: { active: false },
    });

    return NextResponse.json({
      success: true,
      deactivatedBanId: banId,
    });
  } catch (error) {
    console.error('Remove ban error:', error);
    return NextResponse.json({ error: 'Failed to remove ban' }, { status: 500 });
  }
}
