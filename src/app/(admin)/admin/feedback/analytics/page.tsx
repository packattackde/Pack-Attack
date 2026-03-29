'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  BarChart3,
  MessageSquare,
  Bug,
  Lightbulb,
  Swords,
  Package,
  Store,
  Clock,
  Star,
  AlertTriangle,
  TrendingUp,
  Users,
  CheckCircle2,
  Loader2,
} from 'lucide-react';

type CategoryAnalytic = {
  category: string;
  totalCount: number;
  ratedCount: number;
  avgExperience: number | null;
};

type VolumeEntry = {
  date: string;
  count: number;
};

type ResponseTimeEntry = {
  category: string;
  avgResponseSeconds: number;
  count: number;
};

type AdminStat = {
  user: { id: string; name: string | null; email: string } | null;
  count: number;
};

type Analytics = {
  summary: {
    totalCount: number;
    openCount: number;
    avgExperience: number | null;
    avgResponseSeconds: number | null;
    avgResolutionSeconds: number | null;
  };
  categoryAnalytics: CategoryAnalytic[];
  categoryStatusMap: Record<string, Record<string, number>>;
  statusDistribution: Record<string, number>;
  priorityDistribution: Record<string, number>;
  volumeOverTime: VolumeEntry[];
  responseTimeByCategory: ResponseTimeEntry[];
  topClaimers: AdminStat[];
  topResolvers: AdminStat[];
};

const categoryConfig: Record<string, { icon: typeof Bug; label: string; color: string }> = {
  BUG_REPORT: { icon: Bug, label: 'Bug Report', color: 'red' },
  FEATURE_REQUEST: { icon: Lightbulb, label: 'Feature Request', color: 'amber' },
  GENERAL: { icon: MessageSquare, label: 'General', color: 'blue' },
  BATTLE_ISSUE: { icon: Swords, label: 'Battle Issue', color: 'purple' },
  PACK_ISSUE: { icon: Package, label: 'Pack Issue', color: 'green' },
  SHOP_ISSUE: { icon: Store, label: 'Shop Issue', color: 'orange' },
};

const statusColors: Record<string, string> = {
  OPEN: 'bg-[#C84FFF]',
  CLAIMED: 'bg-indigo-500',
  IN_PROGRESS: 'bg-amber-500',
  RESOLVED: 'bg-[#C84FFF]',
  CLOSED: 'bg-gray-500',
};

const statusLabels: Record<string, string> = {
  OPEN: 'Open',
  CLAIMED: 'Claimed',
  IN_PROGRESS: 'In Progress',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
};

const priorityColors: Record<string, string> = {
  LOW: 'bg-gray-500',
  MEDIUM: 'bg-[#C84FFF]',
  HIGH: 'bg-amber-500',
  URGENT: 'bg-red-500',
};

function formatDuration(seconds: number | null): string {
  if (seconds === null || seconds === 0) return 'N/A';
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  if (seconds < 86400) {
    const h = Math.floor(seconds / 3600);
    const m = Math.round((seconds % 3600) / 60);
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
  const d = Math.floor(seconds / 86400);
  const h = Math.round((seconds % 86400) / 3600);
  return h > 0 ? `${d}d ${h}h` : `${d}d`;
}

function getRatingColor(avg: number | null): string {
  if (avg === null) return 'bg-gray-600';
  if (avg >= 4) return 'bg-[#C84FFF]';
  if (avg >= 3) return 'bg-amber-500';
  if (avg >= 2) return 'bg-orange-500';
  return 'bg-red-500';
}

function getRatingTextColor(avg: number | null): string {
  if (avg === null) return 'text-gray-500';
  if (avg >= 4) return 'text-[#E879F9]';
  if (avg >= 3) return 'text-amber-400';
  if (avg >= 2) return 'text-orange-400';
  return 'text-red-400';
}

export default function FeedbackAnalyticsPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/feedback/analytics')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setAnalytics(data.analytics);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen font-display flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-white/20 border-t-[#C84FFF] rounded-full animate-spin" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen font-display flex items-center justify-center">
        <p className="text-gray-500">Failed to load analytics.</p>
      </div>
    );
  }

  const { summary, categoryAnalytics, categoryStatusMap, statusDistribution, priorityDistribution, volumeOverTime, responseTimeByCategory, topClaimers, topResolvers } = analytics;

  const totalStatusCount = Object.values(statusDistribution).reduce((a, b) => a + b, 0);
  const maxVolume = volumeOverTime.length > 0 ? Math.max(...volumeOverTime.map((v) => v.count)) : 1;
  const problemCategories = categoryAnalytics.filter((c) => c.avgExperience !== null && c.avgExperience < 3);

  return (
    <div className="min-h-screen font-display">
      <div className="fixed inset-0 bg-grid opacity-30" />
      <div className="fixed inset-0 radial-gradient" />

      <div className="relative container py-8 sm:py-12">
        <Link
          href="/admin/feedback"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#f0f0f5] transition-colors font-medium mb-6 touch-target"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Feedback
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#C84FFF] to-[#E879F9]">Feedback</span> Analytics
          </h1>
          <p className="text-gray-500">Insights and trends across all feedback</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          <div className="rounded-xl border border-white/[0.06] bg-[#1e1e55] p-4">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="w-4 h-4 text-[#C84FFF]" />
              <span className="text-xs text-gray-500 font-medium">Total</span>
            </div>
            <p className="text-2xl font-bold text-white">{summary.totalCount}</p>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-[#1e1e55] p-4">
            <div className="flex items-center gap-2 mb-2">
              <Loader2 className="w-4 h-4 text-amber-400" />
              <span className="text-xs text-gray-500 font-medium">Active</span>
            </div>
            <p className="text-2xl font-bold text-white">{summary.openCount}</p>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-[#1e1e55] p-4">
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-4 h-4 text-amber-400" />
              <span className="text-xs text-gray-500 font-medium">Avg Rating</span>
            </div>
            <p className={`text-2xl font-bold ${getRatingTextColor(summary.avgExperience)}`}>
              {summary.avgExperience ? summary.avgExperience.toFixed(1) : 'N/A'}
            </p>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-[#1e1e55] p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-[#E879F9]" />
              <span className="text-xs text-gray-500 font-medium">Avg Response</span>
            </div>
            <p className="text-2xl font-bold text-white">{formatDuration(summary.avgResponseSeconds)}</p>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-[#1e1e55] p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-4 h-4 text-[#E879F9]" />
              <span className="text-xs text-gray-500 font-medium">Avg Resolution</span>
            </div>
            <p className="text-2xl font-bold text-white">{formatDuration(summary.avgResolutionSeconds)}</p>
          </div>
        </div>

        {/* Problem Areas Alert */}
        {problemCategories.length > 0 && (
          <div className="mb-8 rounded-xl border border-red-500/20 bg-red-500/[0.05] p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <h3 className="text-sm font-semibold text-red-400">Problem Areas (avg &lt; 3.0)</h3>
            </div>
            <div className="flex flex-wrap gap-3">
              {problemCategories.map((cat) => {
                const conf = categoryConfig[cat.category];
                const Icon = conf?.icon || MessageSquare;
                return (
                  <div key={cat.category} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/15">
                    <Icon className="w-3.5 h-3.5 text-red-400" />
                    <span className="text-xs font-medium text-red-300">{conf?.label || cat.category}</span>
                    <span className="text-xs font-bold text-red-400">{cat.avgExperience?.toFixed(1)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Category Health Table */}
          <div className="rounded-xl border border-white/[0.06] bg-[#1e1e55] p-5">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#E879F9]" />
              Category Health
            </h3>
            <div className="space-y-3">
              {categoryAnalytics.map((cat) => {
                const conf = categoryConfig[cat.category];
                const Icon = conf?.icon || MessageSquare;
                const statusCounts = categoryStatusMap[cat.category] || {};
                const openCount = (statusCounts.OPEN || 0) + (statusCounts.CLAIMED || 0) + (statusCounts.IN_PROGRESS || 0);

                return (
                  <div key={cat.category} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className={`w-3.5 h-3.5 text-${conf?.color || 'gray'}-400`} />
                        <span className="text-xs font-medium text-[#f0f0f5]">{conf?.label || cat.category}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-gray-500">{cat.totalCount} total</span>
                        {openCount > 0 && (
                          <span className="text-amber-400">{openCount} active</span>
                        )}
                        <span className={`font-semibold ${getRatingTextColor(cat.avgExperience)}`}>
                          {cat.avgExperience ? `${cat.avgExperience.toFixed(1)} / 5` : 'No ratings'}
                        </span>
                      </div>
                    </div>
                    {/* Rating bar */}
                    <div className="h-2 rounded-full bg-white/[0.04] overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${getRatingColor(cat.avgExperience)}`}
                        style={{ width: cat.avgExperience ? `${(cat.avgExperience / 5) * 100}%` : '0%' }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Status Distribution */}
          <div className="rounded-xl border border-white/[0.06] bg-[#1e1e55] p-5">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#E879F9]" />
              Status Distribution
            </h3>

            {/* Stacked bar */}
            {totalStatusCount > 0 && (
              <div className="h-6 rounded-full overflow-hidden flex mb-4">
                {Object.entries(statusDistribution).map(([status, count]) => (
                  <div
                    key={status}
                    className={`${statusColors[status] || 'bg-gray-500'} transition-all`}
                    style={{ width: `${(count / totalStatusCount) * 100}%` }}
                    title={`${statusLabels[status] || status}: ${count}`}
                  />
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Object.entries(statusDistribution).map(([status, count]) => (
                <div key={status} className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${statusColors[status] || 'bg-gray-500'}`} />
                  <span className="text-xs text-[#8888aa]">{statusLabels[status] || status}</span>
                  <span className="text-xs font-semibold text-white ml-auto">{count}</span>
                </div>
              ))}
            </div>

            {/* Priority distribution */}
            <h4 className="text-xs font-semibold text-[#8888aa] mt-6 mb-3">Priority Breakdown</h4>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(priorityDistribution).map(([priority, count]) => (
                <div key={priority} className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${priorityColors[priority] || 'bg-gray-500'}`} />
                  <span className="text-xs text-[#8888aa]">{priority}</span>
                  <span className="text-xs font-semibold text-white ml-auto">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Volume Chart + Response Times */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Daily Volume */}
          <div className="rounded-xl border border-white/[0.06] bg-[#1e1e55] p-5">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#E879F9]" />
              Daily Volume (30 days)
            </h3>
            {volumeOverTime.length > 0 ? (
              <div className="flex items-end gap-[2px] h-32">
                {volumeOverTime.map((entry, i) => {
                  const height = maxVolume > 0 ? (entry.count / maxVolume) * 100 : 0;
                  const dateStr = new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                  return (
                    <div
                      key={i}
                      className="flex-1 group relative"
                      title={`${dateStr}: ${entry.count}`}
                    >
                      <div
                        className="w-full rounded-t bg-[#C84FFF]/60 hover:bg-[#C84FFF]/80 transition-colors cursor-default"
                        style={{ height: `${Math.max(height, 2)}%` }}
                      />
                      <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 rounded bg-[#12123a] text-[10px] text-white whitespace-nowrap z-10 border border-white/10">
                        {dateStr}: {entry.count}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-gray-600 py-8 text-center">No data in the last 30 days</p>
            )}
          </div>

          {/* Response Time by Category */}
          <div className="rounded-xl border border-white/[0.06] bg-[#1e1e55] p-5">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#E879F9]" />
              Avg Response Time by Category
            </h3>
            {responseTimeByCategory.length > 0 ? (
              <div className="space-y-3">
                {responseTimeByCategory
                  .sort((a, b) => b.avgResponseSeconds - a.avgResponseSeconds)
                  .map((entry) => {
                    const conf = categoryConfig[entry.category];
                    const Icon = conf?.icon || MessageSquare;
                    const maxTime = Math.max(...responseTimeByCategory.map((e) => e.avgResponseSeconds));
                    const width = maxTime > 0 ? (entry.avgResponseSeconds / maxTime) * 100 : 0;
                    const isWarning = entry.avgResponseSeconds > 86400; // > 24h
                    return (
                      <div key={entry.category} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Icon className={`w-3.5 h-3.5 text-${conf?.color || 'gray'}-400`} />
                            <span className="text-xs text-[#f0f0f5]">{conf?.label || entry.category}</span>
                          </div>
                          <span className={`text-xs font-semibold ${isWarning ? 'text-red-400' : 'text-[#f0f0f5]'}`}>
                            {formatDuration(entry.avgResponseSeconds)}
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-white/[0.04] overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${isWarning ? 'bg-red-500' : 'bg-[#C84FFF]'}`}
                            style={{ width: `${width}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <p className="text-xs text-gray-600 py-8 text-center">No response data yet</p>
            )}
          </div>
        </div>

        {/* Admin Leaderboard */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Claimers */}
          <div className="rounded-xl border border-white/[0.06] bg-[#1e1e55] p-5">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-[#E879F9]" />
              Top Claimers
            </h3>
            {topClaimers.length > 0 ? (
              <div className="space-y-2">
                {topClaimers.map((entry, i) => (
                  <div key={entry.user?.id || i} className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#1e1e55]">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-gray-500 w-5">{i + 1}.</span>
                      <span className="text-sm text-[#f0f0f5]">{entry.user?.name || entry.user?.email || 'Unknown'}</span>
                    </div>
                    <span className="text-sm font-semibold text-[#E879F9]">{entry.count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-600 py-4 text-center">No claim data yet</p>
            )}
          </div>

          {/* Top Resolvers */}
          <div className="rounded-xl border border-white/[0.06] bg-[#1e1e55] p-5">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#E879F9]" />
              Most Active (Status Changes)
            </h3>
            {topResolvers.length > 0 ? (
              <div className="space-y-2">
                {topResolvers.map((entry, i) => (
                  <div key={entry.user?.id || i} className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#1e1e55]">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-gray-500 w-5">{i + 1}.</span>
                      <span className="text-sm text-[#f0f0f5]">{entry.user?.name || entry.user?.email || 'Unknown'}</span>
                    </div>
                    <span className="text-sm font-semibold text-[#E879F9]">{entry.count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-600 py-4 text-center">No resolution data yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
