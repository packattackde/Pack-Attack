import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST - Add a message to a feedback thread
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { content } = body;

    if (!content || !content.trim()) {
      return NextResponse.json(
        { success: false, error: 'Message content is required.' },
        { status: 400 }
      );
    }

    if (content.length > 2000) {
      return NextResponse.json(
        { success: false, error: 'Message must be 2000 characters or less.' },
        { status: 400 }
      );
    }

    const feedback = await prisma.feedback.findUnique({ where: { id } });
    if (!feedback) {
      return NextResponse.json({ success: false, error: 'Feedback not found.' }, { status: 404 });
    }

    const isAdmin = session.user.role === 'ADMIN';
    const isAuthor = feedback.userId === session.user.id;

    if (!isAdmin && !isAuthor) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    // Track first admin response time
    const feedbackUpdate: Record<string, unknown> = {};
    if (isAdmin && !feedback.firstResponseAt) {
      feedbackUpdate.firstResponseAt = new Date();
    }

    const [message] = await prisma.$transaction([
      prisma.feedbackMessage.create({
        data: {
          feedbackId: id,
          userId: session.user.id,
          content: content.trim(),
          isAdmin,
        },
        include: {
          user: { select: { id: true, name: true, email: true, role: true } },
        },
      }),
      ...(Object.keys(feedbackUpdate).length > 0
        ? [prisma.feedback.update({ where: { id }, data: feedbackUpdate })]
        : []),
      prisma.feedbackActivityLog.create({
        data: {
          feedbackId: id,
          userId: session.user.id,
          action: 'MESSAGE_SENT',
        },
      }),
    ]);

    return NextResponse.json({ success: true, message });
  } catch (error) {
    console.error('Failed to add message:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add message.' },
      { status: 500 }
    );
  }
}
