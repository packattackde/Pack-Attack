import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// DELETE: Admin soft-delete a chat message
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check admin role
  const admin = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (admin?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;

  try {
    // Find the message
    const message = await prisma.chatMessage.findUnique({
      where: { id },
      include: { user: { select: { name: true, twitchUsername: true, discordUsername: true, role: true } } },
    });

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    if (message.deletedAt) {
      return NextResponse.json({ error: 'Message already deleted' }, { status: 400 });
    }

    // Soft-delete the message
    await prisma.chatMessage.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedById: session.user.id,
      },
    });

    // Update the ChatLog entry with deletion info
    await prisma.chatLog.updateMany({
      where: { originalId: id },
      data: {
        deletedAt: new Date(),
        deletedById: session.user.id,
        deleteReason: 'Admin deleted',
      },
    }).catch(() => {}); // non-critical

    return NextResponse.json({
      success: true,
      deletedMessageId: id,
    });
  } catch (error) {
    console.error('Chat delete error:', error);
    return NextResponse.json({ error: 'Failed to delete message' }, { status: 500 });
  }
}
