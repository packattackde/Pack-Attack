'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'

interface TickerItem {
  pullId: string
  userId: string
  userName: string
  cardId: string
  cardName: string
  cardImage: string
  rarity: string
  coinValue: number
  boxId: string
  boxName: string
  timestamp: string
}

interface LiveTickerProps {
  className?: string
}

function getRarityTier(rarity: string): 'rare' | 'epic' | 'legendary' {
  const r = rarity.toLowerCase().trim()
  if (
    r.includes('secret') ||
    r.includes('legendary') ||
    r.includes('mythic') ||
    r.includes('alt art') ||
    r.includes('gold') ||
    r.includes('hyper') ||
    r.includes('chase') ||
    r.includes('manga')
  )
    return 'legendary'
  if (
    r.includes('ultra') ||
    r.includes('super') ||
    r.includes('epic') ||
    r.includes('illustration') ||
    r.includes('full art') ||
    r.includes('vmax') ||
    r.includes('vstar')
  )
    return 'epic'
  return 'rare'
}

function timeAgo(timestamp: string): string {
  const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000)
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
  return `${Math.floor(seconds / 3600)}h`
}

const rarityBadgeStyles: Record<string, string> = {
  rare: 'bg-[rgba(96,165,250,0.15)] text-[#60a5fa]',
  epic: 'bg-[rgba(167,139,250,0.15)] text-[#a78bfa]',
  legendary: 'bg-[rgba(251,191,36,0.15)] text-[#fbbf24]',
}

export default function LiveTicker({ className }: LiveTickerProps) {
  const [items, setItems] = useState<TickerItem[]>([])
  const [connected, setConnected] = useState(false)
  const [paused, setPaused] = useState(false)
  const [, setTick] = useState(0) // force re-render for timestamps
  const eventSourceRef = useRef<EventSource | null>(null)
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const retryDelayRef = useRef(3000)
  const pauseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    const es = new EventSource('/api/pulls/live')
    eventSourceRef.current = es

    es.onopen = () => {
      setConnected(true)
      retryDelayRef.current = 3000
    }

    es.onmessage = (event) => {
      try {
        const data: TickerItem = JSON.parse(event.data)
        const tier = getRarityTier(data.rarity)

        setItems((prev) => {
          const next = [data, ...prev]
          return next.slice(0, 20)
        })

        // Pause ticker briefly for legendary pulls
        if (tier === 'legendary') {
          setPaused(true)
          if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current)
          pauseTimeoutRef.current = setTimeout(() => setPaused(false), 2000)
        }
      } catch {
        // ignore malformed messages
      }
    }

    es.onerror = () => {
      setConnected(false)
      es.close()
      eventSourceRef.current = null

      // Exponential backoff retry
      const delay = retryDelayRef.current
      retryTimeoutRef.current = setTimeout(() => {
        connect()
      }, delay)
      retryDelayRef.current = Math.min(delay * 2, 30000)
    }
  }, [])

  useEffect(() => {
    connect()

    // Update timestamps every 30s
    const interval = setInterval(() => {
      setTick((t) => t + 1)
    }, 30000)

    return () => {
      clearInterval(interval)
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
      }
      if (pauseTimeoutRef.current) {
        clearTimeout(pauseTimeoutRef.current)
      }
    }
  }, [connect])

  const animationDuration = items.length * 5

  return (
    <div
      className={`bg-[#0B0B2B] border border-[rgba(255,255,255,0.06)] rounded-xl h-14 sm:h-16 overflow-hidden relative ${className ?? ''}`}
    >
      {/* Pulse animation keyframes + ticker scroll */}
      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes legendary-glow {
          0%, 100% { box-shadow: 0 0 15px rgba(251,191,36,0.1); }
          50% { box-shadow: 0 0 20px rgba(251,191,36,0.25); }
        }
        @keyframes ticker-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>

      <div className="flex items-center h-full">
        {/* LIVE indicator */}
        <div className="flex items-center gap-2 px-3 sm:px-4 shrink-0 z-10 bg-[#0B0B2B]">
          <div
            className="w-[6px] h-[6px] bg-red-500 rounded-full"
            style={{
              animation: connected ? 'pulse-dot 1.5s ease-in-out infinite' : 'none',
              opacity: connected ? 1 : 0.3,
            }}
          />
          <span className="text-[10px] sm:text-[11px] font-bold text-white tracking-wider uppercase">
            Live
          </span>
        </div>

        {/* Ticker track */}
        {items.length === 0 ? (
          <div className="flex items-center px-4">
            <span className="text-[11px] text-[#555570]">Waiting for pulls...</span>
          </div>
        ) : (
          <div className="flex-1 overflow-hidden">
            <div
              className="flex gap-3 w-max"
              style={{
                animation: paused
                  ? 'none'
                  : `ticker-scroll ${animationDuration}s linear infinite`,
              }}
            >
              {/* Render items twice for seamless infinite loop */}
              {[...items, ...items].map((item, idx) => {
                const tier = getRarityTier(item.rarity)
                const isLegendary = tier === 'legendary'

                return (
                  <Link
                    key={`${item.pullId}-${idx}`}
                    href={`/open/${item.boxId}`}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg shrink-0 transition-colors hover:bg-[rgba(255,255,255,0.04)]"
                    style={
                      isLegendary
                        ? {
                            border: '1px solid rgba(251,191,36,0.3)',
                            animation: 'legendary-glow 2s ease-in-out infinite',
                          }
                        : { border: '1px solid transparent' }
                    }
                  >
                    {/* Card image */}
                    {item.cardImage ? (
                      <div className="w-[28px] h-[38px] rounded bg-[#1e1e55] overflow-hidden shrink-0">
                        <Image
                          src={item.cardImage}
                          alt={item.cardName}
                          width={28}
                          height={38}
                          className="w-full h-full object-cover"
                          unoptimized
                        />
                      </div>
                    ) : (
                      <div className="w-[28px] h-[38px] rounded bg-[#1e1e55] flex items-center justify-center shrink-0 text-[14px]">
                        🃏
                      </div>
                    )}

                    {/* Info column */}
                    <div className="flex flex-col min-w-0">
                      <span className="text-[11px] font-semibold text-white truncate max-w-[100px]">
                        {item.userName}
                      </span>
                      <span className="text-[10px] text-[#8888aa] truncate max-w-[100px]">
                        {item.cardName}
                      </span>
                      {/* Meta row */}
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span
                          className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded ${rarityBadgeStyles[tier]}`}
                        >
                          {item.rarity}
                        </span>
                        <span className="text-[9px] text-[#7777a0] truncate max-w-[60px]">
                          {item.boxName}
                        </span>
                        <span className="text-[9px] text-[#555570]">
                          {timeAgo(item.timestamp)}
                        </span>
                      </div>
                    </div>

                    {/* Open CTA */}
                    <span className="text-[8px] text-[#BFFF00] font-semibold shrink-0 ml-1">
                      Open →
                    </span>
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
