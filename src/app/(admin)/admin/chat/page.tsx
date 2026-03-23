import { redirect } from 'next/navigation';
import { getCurrentSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ShieldCheck, MessageSquare } from 'lucide-react';
import ChatManagementClient from './ChatManagementClient';

export default async function AdminChatPage() {
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

  // Get stats
  const [totalMessages, activeBans, activeTimeouts] = await Promise.all([
    prisma.chatLog.count(),
    prisma.chatBan.count({ where: { type: 'BAN', active: true } }),
    prisma.chatBan.count({
      where: { type: 'TIMEOUT', active: true, expiresAt: { gt: new Date() } },
    }),
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#06061a] via-[#0B0B2B] to-[#06061a] font-display">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-grid opacity-30" />
      <div className="fixed inset-0 radial-gradient" />

      <div className="relative container py-12">
        {/* Header */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 rounded-full glass text-sm">
            <ShieldCheck className="w-4 h-4 text-purple-400" />
            <span className="text-[#f0f0f5]">Admin Panel</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-3">
            <span className="text-white">Chat </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              Moderation
            </span>
          </h1>
          <p className="text-[#8888aa] text-lg">
            View chat history, manage bans and timeouts
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="glass rounded-xl p-4 text-center">
            <MessageSquare className="w-6 h-6 text-purple-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{totalMessages}</div>
            <div className="text-xs text-[#8888aa]">Total Messages</div>
          </div>
          <div className="glass rounded-xl p-4 text-center">
            <div className="w-6 h-6 text-red-400 mx-auto mb-2 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
                <circle cx="12" cy="12" r="10" />
                <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
              </svg>
            </div>
            <div className="text-2xl font-bold text-white">{activeBans}</div>
            <div className="text-xs text-[#8888aa]">Active Bans</div>
          </div>
          <div className="glass rounded-xl p-4 text-center">
            <div className="w-6 h-6 text-yellow-400 mx-auto mb-2 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <div className="text-2xl font-bold text-white">{activeTimeouts}</div>
            <div className="text-xs text-[#8888aa]">Active Timeouts</div>
          </div>
        </div>

        {/* Client component */}
        <ChatManagementClient />
      </div>
    </div>
  );
}
