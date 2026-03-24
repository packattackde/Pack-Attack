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
  const r = rarity.toLowerCase().trim();
  if (r.includes('secret') || r.includes('legendary') || r.includes('mythic') || r.includes('alt art') || r.includes('gold') || r.includes('hyper') || r.includes('chase') || r.includes('manga'))
    return 'border-2 border-[#fbbf24] shadow-[0_0_12px_rgba(251,191,36,0.25)]';
  if (r.includes('ultra') || r.includes('super') || r.includes('epic') || r.includes('illustration') || r.includes('full art') || r.includes('vmax') || r.includes('vstar'))
    return 'border-2 border-[#a78bfa] shadow-[0_0_10px_rgba(167,139,250,0.2)]';
  if (r.includes('rare') || r.includes('holo') || r.includes('promo'))
    return 'border-2 border-[#60a5fa] shadow-[0_0_8px_rgba(96,165,250,0.15)]';
  if (r.includes('uncommon'))
    return 'border border-[#4ade80]';
  return 'border border-[rgba(255,255,255,0.1)]';
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
        <div className="flex gap-3">
          {pulls.map((pull, idx) => {
            const fresh = isFreshPull(pull.timestamp);
            const borderClass = getRarityBorderClass(pull.rarity);

            return (
              <div key={idx} className="flex-shrink-0 w-[100px]">
                <div
                  className={`w-[100px] h-[140px] rounded-lg overflow-hidden ${borderClass} ${
                    fresh ? 'pull-shimmer' : ''
                  } transition-transform hover:scale-105 cursor-pointer`}
                >
                  {pull.cardImage ? (
                    <Image
                      src={pull.cardImage}
                      alt={pull.cardName}
                      width={100}
                      height={140}
                      className="w-full h-full object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full bg-[#252560] flex items-center justify-center">
                      <span className="text-lg">🎴</span>
                    </div>
                  )}
                </div>
                <p className="text-[9px] text-[#8888aa] truncate mt-1.5 text-center w-[100px]">
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
