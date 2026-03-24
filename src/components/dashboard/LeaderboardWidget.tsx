'use client';

import Link from 'next/link';

interface LeaderboardEntry {
  rank: number;
  name: string;
  points: number;
}

interface LeaderboardWidgetProps {
  entries: LeaderboardEntry[];
  userRank: number;
  userPoints: number;
  month: string;
  className?: string;
}

function getRankStyle(rank: number): string {
  switch (rank) {
    case 1:
      return 'bg-[rgba(251,191,36,0.12)] text-[#fbbf24]';
    case 2:
      return 'bg-[rgba(192,192,192,0.12)] text-[#c0c0c0]';
    case 3:
      return 'bg-[rgba(205,127,50,0.12)] text-[#cd7f32]';
    default:
      return 'bg-[rgba(255,255,255,0.06)] text-[#8888aa]';
  }
}

export default function LeaderboardWidget({
  entries,
  userRank,
  userPoints,
  month,
  className = '',
}: LeaderboardWidgetProps) {
  const topEntries = entries.slice(0, 3);

  return (
    <div className={`bg-[#1a1a4a] border border-[rgba(255,255,255,0.1)] rounded-2xl p-5 sm:p-6 ${className}`}>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-[#7777a0] mb-3 flex items-center gap-1.5">
        🥇 Leaderboard
      </div>

      <p className="text-[10px] text-[#7777a0] mb-3">{month}</p>

      {topEntries.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-sm text-[#8888aa]">No rankings yet this month</p>
          <p className="text-[11px] text-[#7777a0] mt-1">Start opening packs to climb the leaderboard!</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {topEntries.map((entry) => (
            <div
              key={entry.rank}
              className="flex items-center gap-2.5 py-1.5"
            >
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${getRankStyle(
                  entry.rank
                )}`}
              >
                {entry.rank}
              </span>
              <span className="text-sm text-[#f0f0f5] font-medium flex-1 truncate">
                {entry.name}
              </span>
              <span className="text-[11px] text-[#8888aa] font-semibold flex-shrink-0">
                {entry.points.toLocaleString()} pts
              </span>
            </div>
          ))}
        </div>
      )}

      {/* User's own rank */}
      <div className="mt-3 flex items-center gap-2.5 py-2 px-2.5 rounded-lg border border-[rgba(191,255,0,0.12)] bg-[rgba(191,255,0,0.03)]">
        <span className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 bg-[rgba(191,255,0,0.12)] text-[#BFFF00]">
          {userRank}
        </span>
        <span className="text-sm text-[#BFFF00] font-semibold flex-1">
          You
        </span>
        <span className="text-[11px] text-[#BFFF00] font-semibold flex-shrink-0">
          {userPoints.toLocaleString()} pts
        </span>
      </div>

      <Link
        href="/leaderboard"
        className="text-[#BFFF00] text-[11px] font-semibold mt-4 inline-block hover:underline"
      >
        Full leaderboard →
      </Link>
    </div>
  );
}
