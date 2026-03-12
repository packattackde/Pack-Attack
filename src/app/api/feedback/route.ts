import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();

    const { category, experience, subject, message, email } = body;

    // Validation
    if (!category || !subject || !message) {
      return NextResponse.json(
        { success: false, error: 'Category, subject, and message are required.' },
        { status: 400 }
      );
    }

    const validCategories = [
      'BUG_REPORT',
      'FEATURE_REQUEST',
      'GENERAL',
      'BATTLE_ISSUE',
      'PACK_ISSUE',
      'SHOP_ISSUE',
    ];

    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { success: false, error: 'Invalid category.' },
        { status: 400 }
      );
    }

    if (subject.length > 200) {
      return NextResponse.json(
        { success: false, error: 'Subject must be 200 characters or less.' },
        { status: 400 }
      );
    }

    if (message.length > 5000) {
      return NextResponse.json(
        { success: false, error: 'Message must be 5000 characters or less.' },
        { status: 400 }
      );
    }

    // Category-based experience rating (1-5, optional)
    if (experience !== undefined && experience !== null && (experience < 1 || experience > 5)) {
      return NextResponse.json(
        { success: false, error: 'Experience rating must be between 1 and 5.' },
        { status: 400 }
      );
    }

    const userAgent = request.headers.get('user-agent') || undefined;

    const feedback = await prisma.feedback.create({
      data: {
        userId: session?.user?.id || null,
        email: email || session?.user?.email || null,
        category,
        experience: experience || null,
        subject: subject.trim(),
        message: message.trim(),
        userAgent,
      },
    });

    return NextResponse.json({
      success: true,
      feedback: { id: feedback.id },
    });
  } catch (error) {
    console.error('Failed to submit feedback:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit feedback. Please try again.' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const priority = searchParams.get('priority');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const sort = searchParams.get('sort') || 'desc';

    // Return admin list if requested
    if (searchParams.get('admins') === 'true') {
      const admins = await prisma.user.findMany({
        where: { role: 'ADMIN' },
        select: { id: true, name: true, email: true },
        orderBy: { name: 'asc' },
      });
      return NextResponse.json({ success: true, admins });
    }

    const excludeStatus = searchParams.get('excludeStatus');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: Record<string, any> = {};
    if (status) where.status = status;
    else if (excludeStatus) where.status = { not: excludeStatus };
    if (category) where.category = category;
    if (priority) where.priority = priority;
    if (search) {
      where.OR = [
        { subject: { contains: search, mode: 'insensitive' } },
        { message: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [feedbacks, total] = await Promise.all([
      prisma.feedback.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
          claimedBy: {
            select: { id: true, name: true, email: true },
          },
          assignedTo: {
            select: { id: true, name: true, email: true },
          },
          _count: {
            select: { messages: true },
          },
        },
        orderBy: { createdAt: sort === 'asc' ? 'asc' : 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.feedback.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      feedbacks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Failed to fetch feedback:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch feedback.' },
      { status: 500 }
    );
  }
}
