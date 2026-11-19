import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { getCurrentSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import KpiDashboardClient from './KpiDashboardClient';

export default async function AdminKpiPage() {
  const session = await getCurrentSession();
  if (!session?.user?.email) {
    redirect('/login');
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user || user.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  return (
    <Suspense
      fallback={
        <div className="min-h-screen font-display flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-white/20 border-t-[#ff2ea6] rounded-full animate-spin" />
        </div>
      }
    >
      <KpiDashboardClient />
    </Suspense>
  );
}