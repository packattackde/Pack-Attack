import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  buildCardmarketOrderExport,
  cardmarketExportFilename,
} from '@/lib/cardmarket-browser/export-order';

/** Download / copy payload for manual or MCP Cardmarket fulfillment (no status change). */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCurrentSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    if (!admin || admin.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { id } = await params;
    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const payload = buildCardmarketOrderExport(order);
    const { searchParams } = new URL(request.url);
    const asDownload = searchParams.get('download') === '1';

    if (asDownload) {
      const body = JSON.stringify(payload, null, 2);
      return new NextResponse(body, {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Disposition': `attachment; filename="${cardmarketExportFilename(order.id)}"`,
        },
      });
    }

    return NextResponse.json({ success: true, export: payload });
  } catch (error) {
    console.error('Cardmarket export error:', error);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}
