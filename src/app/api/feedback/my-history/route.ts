import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Get the current user's feedback history
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sort = searchParams.get('sort') || 'desc';

    const feedbacks = await prisma.feedback.findMany({
      where: { userId: session.user.id },
      include: {
        claimedBy: {
          select: { id: true, name: true },
        },
        _count: {
          select: { messages: true },
        },
      },
      orderBy: { createdAt: sort === 'asc' ? 'asc' : 'desc' },
    });

    return NextResponse.json({ success: true, feedbacks });
  } catch (error) {
    console.error('Failed to fetch feedback history:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch feedback history.' },
      { status: 500 }
    );
  }
}
