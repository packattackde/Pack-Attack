'use client';

import Link from 'next/link';
import Image from 'next/image';
import ScrollableRow from './ScrollableRow';

interface Pull {
  cardName: string;
  cardImage: string | null;
  rarity: string;
  timestamp: string;
}

interface RecentPullsWidgetProps {
  pulls: Pull[];
  className?: string;
}

function getRarityBorderClass(rarity: string): string {
  switch (rarity.toLowerCase()) {
    case 'legendary':
      return 'border-2 border-[#fbbf24]';
    case 'epic':
      return 'border-2 border-[#a78bfa]';
    case 'rare':
      return 'border-2 border-[#60a5fa]';
    default:
      return 'border border-[rgba(255,255,255,0.1)]';
  }
}

function isFreshPull(timestamp: string): boolean {
  const pullTime = new Date(timestamp).getTime();
  const now = Date.now();
  return now - pullTime < 5 * 60 * 1000; // 5 minutes
}

export default function RecentPullsWidget({ pulls, className = '' }: RecentPullsWidgetProps) {
  return (
    <div className={`bg-[#1a1a4a] border border-[rgba(255,255,255,0.1)] rounded-2xl p-5 sm:p-6 ${className}`}>
      <style>{`
        @keyframes shimmer-glow {
          0%, 100% { box-shadow: 0 0 4px rgba(191, 255, 0, 0.3); }
          50% { box-shadow: 0 0 12px rgba(191, 255, 0, 0.6); }
        }
        .pull-shimmer { animation: shimmer-glow 2s ease-in-out infinite; }
      `}</style>

      <div className="text-[10px] font-semibold uppercase tracking-wider text-[#7777a0] mb-3 flex items-center gap-1.5">
        🎴 My Recent Pulls
      </div>

      <ScrollableRow>
        <div className="flex gap-2.5">
          {pulls.map((pull, idx) => {
            const fresh = isFreshPull(pull.timestamp);
            const borderClass = getRarityBorderClass(pull.rarity);

            return (
              <div key={idx} className="flex-shrink-0 w-[60px]">
                <div
                  className={`w-[60px] h-[84px] rounded-lg overflow-hidden ${borderClass} ${
                    fresh ? 'pull-shimmer' : ''
                  }`}
                >
                  {pull.cardImage ? (
                    <Image
                      src={pull.cardImage}
                      alt={pull.cardName}
                      width={60}
                      height={84}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-[#252560] flex items-center justify-center">
                      <span className="text-lg">🎴</span>
                    </div>
                  )}
                </div>
                <p className="text-[8px] text-[#8888aa] truncate mt-1 text-center">
                  {pull.cardName}
                </p>
              </div>
            );
          })}
        </div>
      </ScrollableRow>

      <Link
        href="/collection"
        className="text-[#BFFF00] text-[11px] font-semibold mt-4 inline-block hover:underline"
      >
        View collection →
      </Link>
    </div>
  );
}
