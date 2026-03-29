import { redirect } from 'next/navigation';
import { getCurrentSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UsersClient } from './UsersClient';
import Link from 'next/link';
import { Users, ArrowLeft } from 'lucide-react';

export default async function AdminUsersPage() {
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

  // Get initial users for SSR
  const rawUsers = await prisma.user.findMany({
    where: { isBot: false },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      coins: true,
      emailVerified: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          pulls: true,
          battlesCreated: true,
          battleParticipants: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });
  
  // Convert Decimal to Number for client
  const initialUsers = rawUsers.map(u => ({
    ...u,
    coins: Number(u.coins),
  }));

  const totalUsers = await prisma.user.count({ where: { isBot: false } });

  return (
    <div className="min-h-screen font-display">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-grid opacity-30" />
      <div className="fixed inset-0 radial-gradient" />

      <div className="relative container py-12">
        {/* Back Link */}
        <Link href="/admin" className="inline-flex items-center gap-2 text-[#8888aa] hover:text-white transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to Admin
        </Link>

        {/* Header */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 rounded-full bg-[#1a1a4a] border border-[rgba(255,255,255,0.12)] shadow-md text-sm">
            <Users className="w-4 h-4 text-[#C84FFF]" />
            <span className="text-[#f0f0f5]">User Management</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-3">
            <span className="text-white">Manage </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#C84FFF] to-[#E879F9]">Users</span>
          </h1>
          <p className="text-[#8888aa] text-lg">View, edit, and manage user accounts</p>
        </div>

        <UsersClient 
          initialUsers={initialUsers} 
          totalUsers={totalUsers}
        />
      </div>
    </div>
  );
}
















