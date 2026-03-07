import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Get activity log for a feedback ticket (admin only)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const feedback = await prisma.feedback.findUnique({ where: { id } });
    if (!feedback) {
      return NextResponse.json({ success: false, error: 'Feedback not found.' }, { status: 404 });
    }

    const activities = await prisma.feedbackActivityLog.findMany({
      where: { feedbackId: id },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ success: true, activities });
  } catch (error) {
    console.error('Failed to fetch activity log:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch activity log.' }, { status: 500 });
  }
}
