import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const { key } = await params;

    const infoText = await prisma.infoText.findUnique({
      where: { key },
    });

    if (!infoText) {
      return NextResponse.json({ contentDe: '', contentEn: '', updatedAt: null });
    }

    return NextResponse.json({
      contentDe: infoText.contentDe,
      contentEn: infoText.contentEn,
      updatedAt: infoText.updatedAt,
    });
  } catch (error) {
    console.error('Error fetching info text:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
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

    const { key } = await params;
    const body = await request.json();
    const { contentDe, contentEn } = body;

    if (typeof contentDe !== 'string' || typeof contentEn !== 'string') {
      return NextResponse.json({ error: 'contentDe and contentEn are required strings' }, { status: 400 });
    }

    const infoText = await prisma.infoText.upsert({
      where: { key },
      update: { contentDe, contentEn, updatedBy: user.id },
      create: { key, contentDe, contentEn, updatedBy: user.id },
    });

    return NextResponse.json({ success: true, infoText });
  } catch (error) {
    console.error('Error updating info text:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
