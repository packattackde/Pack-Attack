'use client';

import Link from 'next/link';
import Image from 'next/image';

interface Hit {
  cardName: string;
  cardImage: string | null;
  rarity: string;
  coinValue: number;
  timestamp: string;
}

interface Pull {
  cardName: string;
  cardImage: string | null;
  rarity: string;
  timestamp: string;
}

interface RecentPullsWidgetProps {
  hits: Hit[];
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

export default function RecentPullsWidget({ hits, pulls, className = '' }: RecentPullsWidgetProps) {
  return (
    <div className={`bg-[#1a1a4a] border border-[rgba(255,255,255,0.1)] rounded-2xl p-5 sm:p-6 ${className}`}>

      {/* Row 1: Last Hits (high value) */}
      {hits.length > 0 && (
        <div className="mb-5">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-[#fbbf24] mb-3 flex items-center gap-1.5">
            🔥 My Last Hits
          </div>
          <div className="flex gap-3">
            {hits.map((hit, idx) => (
              <div key={idx} className="flex-shrink-0 flex flex-col items-center">
                <div
                  className={`w-[75px] h-[105px] rounded-lg overflow-hidden ${getRarityBorderClass(hit.rarity)} transition-transform hover:scale-105 cursor-pointer`}
                >
                  {hit.cardImage ? (
                    <Image
                      src={hit.cardImage}
                      alt={hit.cardName}
                      width={75}
                      height={105}
                      className="w-full h-full object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full bg-[#252560] flex items-center justify-center">
                      <span className="text-lg">🎴</span>
                    </div>
                  )}
                </div>
                <p className="text-[9px] text-[#f0f0f5] font-semibold truncate mt-1.5 text-center w-[75px]">
                  {hit.cardName}
                </p>
                <p className="text-[8px] text-[#BFFF00] font-bold">
                  🪙 {hit.coinValue.toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Row 2: Last Pulls (any rarity) */}
      <div>
        <div className="text-[10px] font-semibold uppercase tracking-wider text-[#7777a0] mb-3 flex items-center gap-1.5">
          🎴 My Last Pulls
        </div>
        <div className="flex gap-2">
          {pulls.map((pull, idx) => (
            <div key={idx} className="flex-shrink-0 flex flex-col items-center">
              <div
                className={`w-[56px] h-[78px] rounded-md overflow-hidden ${getRarityBorderClass(pull.rarity)} transition-transform hover:scale-105 cursor-pointer`}
              >
                {pull.cardImage ? (
                  <Image
                    src={pull.cardImage}
                    alt={pull.cardName}
                    width={56}
                    height={78}
                    className="w-full h-full object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full bg-[#252560] flex items-center justify-center">
                    <span className="text-sm">🎴</span>
                  </div>
                )}
              </div>
              <p className="text-[8px] text-[#8888aa] truncate mt-1 text-center w-[56px]">
                {pull.cardName}
              </p>
            </div>
          ))}
        </div>
      </div>

      <Link
        href="/collection"
        className="text-[#BFFF00] text-[11px] font-semibold mt-4 inline-block hover:underline"
      >
        View collection →
      </Link>
    </div>
  );
}
