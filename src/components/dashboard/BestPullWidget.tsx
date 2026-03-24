'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import CardLightbox from './CardLightbox'
import { GiTrophyCup, GiCardPickup, GiCardboardBox, GiTwoCoins, GiCardPlay } from 'react-icons/gi'
import { formatCoins } from '@/lib/format'

interface BestPullWidgetProps {
  cardName?: string
  cardImage?: string | null
  rarity?: string
  coinValue?: number
  pullerName?: string
  boxId?: string
  boxName?: string
  isEmpty?: boolean
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
  isEmpty,
  className = '',
}: BestPullWidgetProps) {
  const glowColor = getRarityColor(rarity || 'rare')
  const [lightboxOpen, setLightboxOpen] = useState(false)

  // Empty state — no pulls today
  if (isEmpty || !cardName) {
    return (
      <div className={`bg-[#1a1a4a] border border-[rgba(255,255,255,0.1)] rounded-2xl h-full p-4 sm:p-6 ${className}`}>
        <div className="text-[10px] font-semibold uppercase tracking-wider text-[#7777a0] mb-4 flex items-center gap-1.5">
<GiTrophyCup className="w-3.5 h-3.5 text-[#BFFF00]" /> Today&apos;s Best Pull
        </div>
        <div className="flex flex-col items-center text-center py-4">
          <GiCardPickup className="w-10 h-10 text-[#7777a0] mb-3" />
          <h4 className="text-lg font-bold text-[#f0f0f5] mb-1">No hits yet today</h4>
          <p className="text-[12px] text-[#8888aa] mb-5">Be the first to pull something amazing!</p>
          <Link
            href="/boxes"
            className="min-h-[44px] inline-flex items-center gap-2 px-6 py-3 bg-[#BFFF00] text-black text-sm font-bold rounded-xl shadow-[0_0_15px_rgba(191,255,0,0.2)] hover:shadow-[0_0_25px_rgba(191,255,0,0.35)] hover:scale-105 transition-all"
          >
            <GiCardboardBox className="w-4 h-4" /> Open a Box →
          </Link>
        </div>
      </div>
    )
  }

  return (
    <>
      <div
        className={`bg-[#1a1a4a] border border-[rgba(255,255,255,0.1)] rounded-2xl h-full p-4 sm:p-6 relative overflow-hidden ${className}`}
        style={{
          background: `linear-gradient(135deg, #1a1a4a 0%, ${glowColor}08 50%, #1a1a4a 100%)`,
        }}
      >
        <p className="text-[10px] font-semibold uppercase tracking-wider text-[#7777a0] mb-3">
<GiTrophyCup className="w-3.5 h-3.5 text-[#BFFF00]" /> TODAY&apos;S BEST PULL
        </p>

        <div className="flex flex-row gap-4 items-start">
          {/* Card image with rarity glow */}
          <div
            className="relative w-[100px] h-[140px] flex-shrink-0 rounded-lg overflow-hidden cursor-pointer transition-transform hover:scale-105"
            style={{
              boxShadow: `0 0 16px ${glowColor}, 0 0 32px ${glowColor}50, 0 0 48px ${glowColor}20`,
              border: `2px solid ${glowColor}`,
            }}
            onClick={() => setLightboxOpen(true)}
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
              <div className="w-full h-full flex items-center justify-center bg-[rgba(255,255,255,0.05)] text-3xl">
<GiCardPlay className="w-8 h-8 text-[#7777a0]" />
              </div>
            )}
          </div>

          {/* Info column */}
          <div className="flex-1 min-w-0">
            <p className="font-bold text-[#f0f0f5] truncate text-base">{cardName}</p>
            <span
              className="inline-block text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full mt-1.5"
              style={{
                color: glowColor,
                backgroundColor: `${glowColor}20`,
                border: `1px solid ${glowColor}50`,
              }}
            >
              {rarity}
            </span>
            <p className="text-[#BFFF00] font-extrabold mt-2 text-xl sm:text-2xl">
            <span className="inline-flex items-center gap-1.5"><GiTwoCoins className="w-5 h-5 text-[#BFFF00]" /> {formatCoins(coinValue ?? 0)}</span>
            </p>
            <div className="flex items-center gap-2 mt-2 px-2.5 py-1.5 rounded-lg bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] w-fit">
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#BFFF00] to-[#7fff00] flex items-center justify-center text-[9px] font-bold text-black">
                {(pullerName ?? '?')[0]?.toUpperCase()}
              </div>
              <span className="text-xs font-semibold text-[#f0f0f5]">{pullerName}</span>
            </div>
          </div>
        </div>

        <Link
          href={`/open/${boxId}`}
          className="min-h-[44px] mt-4 flex items-center justify-center gap-2 w-full px-4 py-3 font-bold rounded-xl text-sm text-black bg-[#BFFF00] hover:brightness-110 transition shadow-[0_0_12px_rgba(191,255,0,0.3)]"
        >
          <GiCardboardBox className="w-4 h-4" /> Open this Box →
        </Link>
      </div>

      <CardLightbox
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        card={{
          name: cardName || '',
          image: cardImage ?? null,
          rarity: rarity || 'common',
          coinValue: coinValue ?? 0,
          boxId,
          boxName,
        }}
      />
    </>
  )
}
