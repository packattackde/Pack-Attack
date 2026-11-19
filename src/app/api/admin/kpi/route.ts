import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { aggregateKpi } from '@/lib/kpi/aggregate-kpi';
import { buildKpiMockData } from '@/lib/kpi/kpi-mock-data';
import type { KpiRangeDays } from '@/lib/kpi/types';

function parseRange(raw: string | null): KpiRangeDays {
  const n = Number(raw ?? '30');
  if (n === 7 || n === 90) return n;
  return 30;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const rangeDays = parseRange(searchParams.get('range'));
    const mock = searchParams.get('mock') === '1';

    const data = mock ? buildKpiMockData(rangeDays) : await aggregateKpi(rangeDays);

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('[admin/kpi]', error);
    return NextResponse.json({ success: false, error: 'Failed to load KPI data' }, { status: 500 });
  }
}