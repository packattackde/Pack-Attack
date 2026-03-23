import { redirect } from 'next/navigation';
import { getCurrentSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Store, ArrowLeft, ShieldCheck } from 'lucide-react';
import { ShopsClient } from './ShopsClient';

export default async function AdminShopsPage() {
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
    <div className="min-h-screen font-display">
      <div className="fixed inset-0 bg-grid opacity-30" />
      <div className="fixed inset-0 radial-gradient" />

      <div className="relative container py-8 md:py-12">
        <div className="mb-8">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-[#8888aa] hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Admin
          </Link>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass text-sm mb-3">
            <ShieldCheck className="w-4 h-4 text-orange-400" />
            <span className="text-[#f0f0f5]">Admin Panel</span>
          </div>

          <div className="flex items-center gap-3 mb-2">
            <Store className="w-8 h-8 text-orange-400" />
            <h1 className="text-3xl md:text-4xl font-bold font-heading">
              <span className="text-white">Shop </span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-400">Management</span>
            </h1>
          </div>
          <p className="text-[#8888aa]">Oversee all card supplier shops, their stock, and orders.</p>
        </div>

        <ShopsClient />
      </div>
    </div>
  );
}
