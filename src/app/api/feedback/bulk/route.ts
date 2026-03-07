import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST - Bulk actions on feedback items (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, ids, value } = body;

    if (!action || !ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Action and ids are required.' },
        { status: 400 }
      );
    }

    if (ids.length > 50) {
      return NextResponse.json(
        { success: false, error: 'Maximum 50 items per bulk action.' },
        { status: 400 }
      );
    }

    // Verify all IDs exist
    const existing = await prisma.feedback.findMany({
      where: { id: { in: ids } },
      select: { id: true, status: true, category: true, priority: true },
    });

    if (existing.length !== ids.length) {
      return NextResponse.json(
        { success: false, error: 'Some feedback items not found.' },
        { status: 404 }
      );
    }

    if (action === 'update_status') {
      const validStatuses = ['OPEN', 'CLAIMED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
      if (!value || !validStatuses.includes(value)) {
        return NextResponse.json({ success: false, error: 'Invalid status.' }, { status: 400 });
      }

      const updateData: Record<string, unknown> = { status: value };
      if (value === 'RESOLVED') updateData.resolvedAt = new Date();

      await prisma.$transaction([
        prisma.feedback.updateMany({
          where: { id: { in: ids } },
          data: updateData,
        }),
        ...existing.map((fb) =>
          prisma.feedbackActivityLog.create({
            data: {
              feedbackId: fb.id,
              userId: session.user.id,
              action: 'STATUS_CHANGED',
              details: { from: fb.status, to: value },
            },
          })
        ),
      ]);

      return NextResponse.json({ success: true, updated: ids.length });
    }

    if (action === 'reassign_category') {
      const validCategories = ['BUG_REPORT', 'FEATURE_REQUEST', 'GENERAL', 'BATTLE_ISSUE', 'PACK_ISSUE', 'SHOP_ISSUE'];
      if (!value || !validCategories.includes(value)) {
        return NextResponse.json({ success: false, error: 'Invalid category.' }, { status: 400 });
      }

      await prisma.$transaction([
        prisma.feedback.updateMany({
          where: { id: { in: ids } },
          data: { category: value },
        }),
        ...existing.map((fb) =>
          prisma.feedbackActivityLog.create({
            data: {
              feedbackId: fb.id,
              userId: session.user.id,
              action: 'CATEGORY_CHANGED',
              details: { from: fb.category, to: value },
            },
          })
        ),
      ]);

      return NextResponse.json({ success: true, updated: ids.length });
    }

    if (action === 'assign') {
      if (value) {
        const targetUser = await prisma.user.findUnique({ where: { id: value } });
        if (!targetUser || targetUser.role !== 'ADMIN') {
          return NextResponse.json({ success: false, error: 'Target user is not an admin.' }, { status: 400 });
        }
      }

      await prisma.$transaction([
        prisma.feedback.updateMany({
          where: { id: { in: ids } },
          data: {
            assignedToId: value || null,
            assignedAt: value ? new Date() : null,
          },
        }),
        ...existing.map((fb) =>
          prisma.feedbackActivityLog.create({
            data: {
              feedbackId: fb.id,
              userId: session.user.id,
              action: 'ASSIGNED',
              details: { newAssigneeId: value || null },
            },
          })
        ),
      ]);

      return NextResponse.json({ success: true, updated: ids.length });
    }

    if (action === 'update_priority') {
      const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
      if (!value || !validPriorities.includes(value)) {
        return NextResponse.json({ success: false, error: 'Invalid priority.' }, { status: 400 });
      }

      await prisma.$transaction([
        prisma.feedback.updateMany({
          where: { id: { in: ids } },
          data: { priority: value },
        }),
        ...existing.map((fb) =>
          prisma.feedbackActivityLog.create({
            data: {
              feedbackId: fb.id,
              userId: session.user.id,
              action: 'PRIORITY_CHANGED',
              details: { from: fb.priority, to: value },
            },
          })
        ),
      ]);

      return NextResponse.json({ success: true, updated: ids.length });
    }

    return NextResponse.json({ success: false, error: 'Invalid action.' }, { status: 400 });
  } catch (error) {
    console.error('Bulk action failed:', error);
    return NextResponse.json({ success: false, error: 'Bulk action failed.' }, { status: 500 });
  }
}
