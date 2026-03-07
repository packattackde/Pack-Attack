import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Feedback analytics (admin only)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      categoryStats,
      statusDistribution,
      priorityDistribution,
      totalCount,
      openCount,
      volumeRaw,
      responseTimeRaw,
      topClaimers,
      topResolvers,
    ] = await Promise.all([
      // Average experience per category
      prisma.feedback.groupBy({
        by: ['category'],
        _avg: { experience: true },
        _count: { id: true },
        where: { experience: { not: null } },
      }),

      // Status distribution
      prisma.feedback.groupBy({
        by: ['status'],
        _count: { id: true },
      }),

      // Priority distribution
      prisma.feedback.groupBy({
        by: ['priority'],
        _count: { id: true },
      }),

      // Total feedback count
      prisma.feedback.count(),

      // Open feedback count
      prisma.feedback.count({ where: { status: { in: ['OPEN', 'CLAIMED', 'IN_PROGRESS'] } } }),

      // Volume over last 30 days
      prisma.$queryRaw`
        SELECT DATE("createdAt") as date, COUNT(*)::int as count
        FROM "Feedback"
        WHERE "createdAt" >= ${thirtyDaysAgo}
        GROUP BY DATE("createdAt")
        ORDER BY date ASC
      ` as Promise<Array<{ date: Date; count: number }>>,

      // Average response time per category (in seconds)
      prisma.$queryRaw`
        SELECT category,
               AVG(EXTRACT(EPOCH FROM ("firstResponseAt" - "createdAt")))::int as "avgResponseSeconds",
               COUNT(*)::int as count
        FROM "Feedback"
        WHERE "firstResponseAt" IS NOT NULL
        GROUP BY category
      ` as Promise<Array<{ category: string; avgResponseSeconds: number; count: number }>>,

      // Top admins by claims
      prisma.feedbackActivityLog.groupBy({
        by: ['userId'],
        where: { action: 'CLAIMED' },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),

      // Top admins by resolutions
      prisma.feedbackActivityLog.groupBy({
        by: ['userId'],
        where: { action: 'STATUS_CHANGED' },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),
    ]);

    // Get all category stats (including those with no experience ratings)
    const allCategoryStats = await prisma.feedback.groupBy({
      by: ['category'],
      _count: { id: true },
    });

    // Merge category counts with average experience
    const categoryStatsMap = new Map(categoryStats.map((s) => [s.category as string, s]));
    const allCategoryCounts = new Map(allCategoryStats.map((s) => [s.category as string, s._count.id]));

    const categories = ['BUG_REPORT', 'FEATURE_REQUEST', 'GENERAL', 'BATTLE_ISSUE', 'PACK_ISSUE', 'SHOP_ISSUE'];
    const categoryAnalytics = categories.map((cat) => ({
      category: cat,
      totalCount: allCategoryCounts.get(cat) || 0,
      ratedCount: categoryStatsMap.get(cat)?._count?.id || 0,
      avgExperience: categoryStatsMap.get(cat)?._avg?.experience || null,
    }));

    // Get status counts per category for the table
    const categoryStatusCounts = await prisma.feedback.groupBy({
      by: ['category', 'status'],
      _count: { id: true },
    });

    const categoryStatusMap: Record<string, Record<string, number>> = {};
    for (const row of categoryStatusCounts) {
      if (!categoryStatusMap[row.category]) categoryStatusMap[row.category] = {};
      categoryStatusMap[row.category][row.status] = row._count.id;
    }

    // Resolve admin user details
    const adminIds = [...new Set([...topClaimers.map((a) => a.userId), ...topResolvers.map((a) => a.userId)])];
    const adminUsers = adminIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: adminIds } },
          select: { id: true, name: true, email: true },
        })
      : [];
    const adminMap = new Map(adminUsers.map((u) => [u.id, u]));

    // Overall average experience
    const overallAvg = await prisma.feedback.aggregate({
      _avg: { experience: true },
      where: { experience: { not: null } },
    });

    // Average resolution time
    const resolutionTimeRaw = await prisma.$queryRaw`
      SELECT AVG(EXTRACT(EPOCH FROM ("resolvedAt" - "createdAt")))::int as "avgResolutionSeconds",
             COUNT(*)::int as count
      FROM "Feedback"
      WHERE "resolvedAt" IS NOT NULL
    ` as Array<{ avgResolutionSeconds: number; count: number }>;

    return NextResponse.json({
      success: true,
      analytics: {
        summary: {
          totalCount,
          openCount,
          avgExperience: overallAvg._avg.experience,
          avgResponseSeconds: responseTimeRaw.length > 0
            ? Math.round(responseTimeRaw.reduce((a, b) => a + (b.avgResponseSeconds || 0), 0) / responseTimeRaw.length)
            : null,
          avgResolutionSeconds: resolutionTimeRaw[0]?.avgResolutionSeconds || null,
        },
        categoryAnalytics,
        categoryStatusMap,
        statusDistribution: Object.fromEntries(statusDistribution.map((s) => [s.status, s._count.id])),
        priorityDistribution: Object.fromEntries(priorityDistribution.map((p) => [p.priority, p._count.id])),
        volumeOverTime: volumeRaw.map((v) => ({
          date: v.date,
          count: v.count,
        })),
        responseTimeByCategory: responseTimeRaw,
        topClaimers: topClaimers.map((a) => ({
          user: adminMap.get(a.userId),
          count: a._count.id,
        })),
        topResolvers: topResolvers.map((a) => ({
          user: adminMap.get(a.userId),
          count: a._count.id,
        })),
      },
    });
  } catch (error) {
    console.error('Failed to fetch analytics:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch analytics.' }, { status: 500 });
  }
}
