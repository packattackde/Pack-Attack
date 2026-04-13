'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import CardLightbox from './CardLightbox';
import { GiFireGem, GiCardPlay, GiTwoCoins } from 'react-icons/gi';
import { formatCoins } from '@/lib/format';

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
  coinValue: number;
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
  const t = useTranslations('widgets');
  const [lightboxCard, setLightboxCard] = useState<{ name: string; image: string | null; rarity: string; coinValue: number } | null>(null);

  return (
    <div className={`bg-[#1a1a4a] border border-[rgba(255,255,255,0.1)] rounded-2xl h-full p-4 sm:p-6 ${className}`}>
      <CardLightbox
        isOpen={!!lightboxCard}
        onClose={() => setLightboxCard(null)}
        card={lightboxCard ? { name: lightboxCard.name, image: lightboxCard.image, rarity: lightboxCard.rarity, coinValue: lightboxCard.coinValue } : { name: '', image: null, rarity: 'common', coinValue: 0 }}
      />

      {/* Row 1: Last Hits (high value) */}
      {hits.length > 0 && (
        <div className="mb-5">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-[#fbbf24] mb-3 flex items-center gap-1.5">
<GiFireGem className="w-3.5 h-3.5 text-[#C84FFF]" /> {t('recentPulls.myLastHits')}
          </div>
          <div className="flex gap-2 sm:gap-3 justify-center">
            {hits.map((hit, idx) => (
              <div key={idx} className="flex-1 min-w-0 flex flex-col items-center">
                <div
                  onClick={() => setLightboxCard({ name: hit.cardName, image: hit.cardImage, rarity: hit.rarity, coinValue: hit.coinValue })}
                  className={`w-full aspect-[63/88] max-w-[100px] sm:max-w-[120px] rounded-lg overflow-hidden relative ${getRarityBorderClass(hit.rarity)} transition-transform hover:scale-105 cursor-pointer`}
                >
                  {hit.cardImage ? (
                    <Image
                      src={hit.cardImage}
                      alt={hit.cardName}
                      fill
                      className="object-cover"
                      unoptimized
                      sizes="120px"
                    />
                  ) : (
                    <div className="w-full h-full bg-[#252560] flex items-center justify-center">
                      <GiCardPlay className="w-5 h-5 text-[#7777a0]" />
                    </div>
                  )}
                </div>
                <p className="text-[9px] text-[#f0f0f5] font-semibold truncate mt-1.5 text-center w-full max-w-[100px] sm:max-w-[120px]">
                  {hit.cardName}
                </p>
                <p className="text-[8px] text-[#C84FFF] font-bold flex items-center justify-center gap-1">
                  <GiTwoCoins className="w-3 h-3" /> {formatCoins(hit.coinValue)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Row 2: Last Pulls (any rarity) */}
      <div>
        <div className="text-[10px] font-semibold uppercase tracking-wider text-[#7777a0] mb-3 flex items-center gap-1.5">
<GiCardPlay className="w-3.5 h-3.5 text-[#C84FFF]" /> {t('recentPulls.myLastPulls')}
        </div>
        <div className="flex gap-2">
          {pulls.map((pull, idx) => (
            <div key={idx} className="flex-1 min-w-0 flex flex-col items-center">
              <div
                onClick={() => setLightboxCard({ name: pull.cardName, image: pull.cardImage, rarity: pull.rarity, coinValue: pull.coinValue })}
                className={`w-full aspect-[63/88] rounded-md overflow-hidden relative ${getRarityBorderClass(pull.rarity)} transition-transform hover:scale-105 cursor-pointer`}
              >
                {pull.cardImage ? (
                  <Image
                    src={pull.cardImage}
                    alt={pull.cardName}
                    fill
                    className="object-cover"
                    unoptimized
                    sizes="80px"
                  />
                ) : (
                  <div className="w-full h-full bg-[#252560] flex items-center justify-center">
                    <GiCardPlay className="w-4 h-4 text-[#7777a0]" />
                  </div>
                )}
              </div>
              <p className="text-[8px] text-[#8888aa] truncate mt-1 text-center w-full">
                {pull.cardName}
              </p>
            </div>
          ))}
        </div>
      </div>

      <Link
        href="/collection"
        className="text-[#C84FFF] text-[11px] font-semibold mt-4 inline-block hover:underline"
      >
        {t('recentPulls.viewCollection')}
      </Link>
    </div>
  );
}
