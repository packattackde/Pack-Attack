'use client'

import Image from 'next/image'
import Link from 'next/link'

interface BestPullWidgetProps {
  cardName: string
  cardImage: string | null
  rarity: string
  coinValue: number
  pullerName: string
  boxId: string
  boxName: string
  className?: string
}

const rarityGlowColors: Record<string, string> = {
  rare: '#60a5fa',
  epic: '#a78bfa',
  legendary: '#fbbf24',
}

function getRarityColor(rarity: string): string {
  return rarityGlowColors[rarity.toLowerCase()] ?? '#60a5fa'
}

export default function BestPullWidget({
  cardName,
  cardImage,
  rarity,
  coinValue,
  pullerName,
  boxId,
  boxName,
  className = '',
}: BestPullWidgetProps) {
  const glowColor = getRarityColor(rarity)

  return (
    <div
      className={`bg-[#1a1a4a] border border-[rgba(255,255,255,0.1)] rounded-2xl p-5 sm:p-6 ${className}`}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wider text-[#7777a0] mb-3">
        🏆 TODAY&apos;S BEST PULL
      </p>

      <div className="flex flex-row gap-4 items-start">
        {/* Card image with rarity glow */}
        <div
          className="relative w-[60px] h-[84px] flex-shrink-0 rounded-lg overflow-hidden animate-pulse"
          style={{
            boxShadow: `0 0 12px ${glowColor}, 0 0 24px ${glowColor}40`,
            border: `2px solid ${glowColor}`,
          }}
        >
          {cardImage ? (
            <Image
              src={cardImage}
              alt={cardName}
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-[rgba(255,255,255,0.05)] text-2xl">
              🃏
            </div>
          )}
        </div>

        {/* Info column */}
        <div className="flex-1 min-w-0">
          <p className="font-bold text-[#f0f0f5] truncate">{cardName}</p>
          <span
            className="inline-block text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full mt-1"
            style={{
              color: glowColor,
              backgroundColor: `${glowColor}15`,
              border: `1px solid ${glowColor}40`,
            }}
          >
            {rarity}
          </span>
          <p className="text-[#BFFF00] font-extrabold mt-1">
            🪙 {coinValue.toFixed(2)}
          </p>
          <p className="text-xs text-[#7777a0] mt-0.5">by {pullerName}</p>
        </div>
      </div>

      <Link
        href={`/open/${boxId}`}
        className="mt-4 block w-full text-center px-4 py-2.5 font-semibold rounded-xl text-sm text-black bg-[#BFFF00] hover:brightness-110 transition"
      >
        📦 Open this Box →
      </Link>
    </div>
  )
}
