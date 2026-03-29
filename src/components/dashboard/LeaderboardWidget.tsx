'use client';

import Link from 'next/link';
import { GiLaurelCrown } from 'react-icons/gi';
import { formatCoins } from '@/lib/format';

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
      return 'bg-[rgba(251,191,36,0.15)] text-[#fbbf24] border border-[rgba(251,191,36,0.3)]';
    case 2:
      return 'bg-[rgba(192,192,192,0.12)] text-[#c0c0c0] border border-[rgba(192,192,192,0.2)]';
    case 3:
      return 'bg-[rgba(205,127,50,0.12)] text-[#cd7f32] border border-[rgba(205,127,50,0.2)]';
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
  const topEntries = entries.slice(0, 10);
  const userInTop10 = userRank > 0 && userRank <= 10 && topEntries.some(e => e.rank === userRank);

  return (
    <div className={`bg-[#1a1a4a] border border-[rgba(255,255,255,0.1)] rounded-2xl h-full p-4 sm:p-6 ${className}`}>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-[#7777a0] mb-2 flex items-center gap-1.5">
        <GiLaurelCrown className="w-3.5 h-3.5 text-[#C84FFF]" /> Leaderboard
      </div>

      <p className="text-[10px] text-[#7777a0] mb-3">{month}</p>

      {topEntries.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-sm text-[#8888aa]">No rankings yet this month</p>
          <p className="text-[11px] text-[#7777a0] mt-1">Start opening packs to climb the leaderboard!</p>
        </div>
      ) : (
        <div className="space-y-1">
          {topEntries.map((entry) => (
            <div
              key={entry.rank}
              className="flex items-center gap-2 py-1.5"
            >
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0 ${getRankStyle(entry.rank)}`}
              >
                {entry.rank}
              </span>
              <span className="text-[12px] text-[#f0f0f5] font-medium flex-1 truncate">
                {entry.name}
              </span>
              <span className="text-[10px] text-[#8888aa] font-semibold flex-shrink-0">
                {formatCoins(entry.points)} pts
              </span>
            </div>
          ))}
        </div>
      )}

      {/* User's own rank — only show separately if not in top 10 */}
      {!userInTop10 && userRank > 0 && (
        <>
          <div className="my-2 border-t border-dashed border-[rgba(255,255,255,0.08)]" />
          <div className="flex items-center gap-2 py-1.5 px-2 rounded-lg border border-[rgba(200,79,255,0.15)] bg-[rgba(200,79,255,0.03)]">
            <span className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0 bg-[rgba(200,79,255,0.12)] text-[#C84FFF]">
              {userRank || '—'}
            </span>
            <span className="text-[12px] text-[#C84FFF] font-semibold flex-1">
              You
            </span>
            <span className="text-[10px] text-[#C84FFF] font-semibold flex-shrink-0">
              {formatCoins(userPoints)} pts
            </span>
          </div>
        </>
      )}

      <Link
        href="/leaderboard"
        className="text-[#C84FFF] text-[11px] font-semibold mt-3 inline-block hover:underline"
      >
        Full leaderboard →
      </Link>
    </div>
  );
}
