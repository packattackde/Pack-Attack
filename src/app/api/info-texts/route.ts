import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getCurrentSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const infoTexts = await prisma.infoText.findMany({
      include: { editor: { select: { name: true, email: true } } },
      orderBy: { key: 'asc' },
    });

    return NextResponse.json({ success: true, infoTexts });
  } catch (error) {
    console.error('Error fetching info texts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
