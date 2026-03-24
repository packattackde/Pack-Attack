'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { GiCardPlay, GiSpeaker, GiSpeakerOff } from 'react-icons/gi'

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
  isNew?: boolean
  isMegaHit?: boolean // coinValue >= 1000
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
  const [soundEnabled, setSoundEnabled] = useState(true)
  const soundEnabledRef = useRef(true)
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
        const parsed = JSON.parse(event.data)
        const isMegaHit = parsed.coinValue >= 1000
        const data: TickerItem = { ...parsed, isNew: true, isMegaHit }
        const tier = getRarityTier(data.rarity)

        setItems((prev) => {
          const next = [data, ...prev]
          return next.slice(0, 20)
        })

        // Play sound for mega hits (>= 1000 coins) if sound is enabled
        if (isMegaHit && soundEnabledRef.current) {
          try {
            // Try mp3 file first, fall back to Web Audio API beep
            const audio = new Audio('/sounds/mega-hit.mp3')
            audio.volume = 0.4
            audio.play().catch(() => {
              // Fallback: Web Audio API chime
              try {
                const ctx = new AudioContext()
                const osc = ctx.createOscillator()
                const gain = ctx.createGain()
                osc.connect(gain)
                gain.connect(ctx.destination)
                osc.type = 'sine'
                osc.frequency.setValueAtTime(880, ctx.currentTime)
                osc.frequency.setValueAtTime(1320, ctx.currentTime + 0.1)
                osc.frequency.setValueAtTime(1760, ctx.currentTime + 0.2)
                gain.gain.setValueAtTime(0.15, ctx.currentTime)
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5)
                osc.start(ctx.currentTime)
                osc.stop(ctx.currentTime + 0.5)
              } catch {}
            })
          } catch {}
        }

        // Remove isNew/isMegaHit flags after animation completes
        setTimeout(() => {
          setItems((prev) => prev.map(item =>
            item.pullId === data.pullId ? { ...item, isNew: false, isMegaHit: false } : item
          ))
        }, isMegaHit ? 5000 : 3000)

        // Pause ticker for legendary pulls or mega hits
        if (tier === 'legendary' || isMegaHit) {
          setPaused(true)
          if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current)
          pauseTimeoutRef.current = setTimeout(() => setPaused(false), isMegaHit ? 3000 : 2000)
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

  // Keep ref in sync with state for use in EventSource callback
  useEffect(() => { soundEnabledRef.current = soundEnabled }, [soundEnabled])

  // Load initial history on mount so ticker isn't empty
  useEffect(() => {
    async function loadHistory() {
      try {
        const res = await fetch('/api/pulls/recent?minValue=100&limit=15');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setItems(data.slice(0, 15));
          }
        }
      } catch {
        // Silently fail — SSE will populate eventually
      }
    }
    loadHistory();
  }, []);

  useEffect(() => {
    connect()

    // Update timestamps every 30s + prune items older than 24h
    const interval = setInterval(() => {
      setTick((t) => t + 1)
      const cutoff = Date.now() - 24 * 60 * 60 * 1000;
      setItems((prev) => prev.filter(item => new Date(item.timestamp).getTime() > cutoff))
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
      className={`bg-[#0B0B2B] border border-[rgba(255,255,255,0.06)] rounded-xl h-12 sm:h-14 overflow-hidden relative ${className ?? ''}`}
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
        @keyframes ticker-new-item {
          0% { opacity: 0; transform: scale(0.7) translateX(-20px); filter: brightness(2.5); }
          20% { opacity: 1; transform: scale(1.1) translateX(0); filter: brightness(2); box-shadow: 0 0 25px rgba(191,255,0,0.5); }
          50% { transform: scale(1.02); filter: brightness(1.3); box-shadow: 0 0 15px rgba(191,255,0,0.3); }
          100% { transform: scale(1); filter: brightness(1); box-shadow: none; }
        }
        .ticker-item-new {
          animation: ticker-new-item 2s cubic-bezier(0.23,1,0.32,1);
        }
        @keyframes ticker-mega-hit {
          0% { opacity: 0; transform: scale(0.5); filter: brightness(4); }
          15% { opacity: 1; transform: scale(1.2); filter: brightness(2.5); box-shadow: 0 0 40px rgba(251,191,36,0.8), 0 0 80px rgba(251,191,36,0.3); }
          30% { transform: scale(1.05); box-shadow: 0 0 30px rgba(251,191,36,0.6), 0 0 60px rgba(251,191,36,0.2); }
          50% { filter: brightness(1.5); box-shadow: 0 0 25px rgba(251,191,36,0.5); }
          100% { transform: scale(1); filter: brightness(1); box-shadow: 0 0 15px rgba(251,191,36,0.2); }
        }
        @keyframes mega-sparkle {
          0% { opacity: 0; transform: translateY(0) scale(0); }
          30% { opacity: 1; transform: translateY(-8px) scale(1); }
          100% { opacity: 0; transform: translateY(-30px) scale(0.3); }
        }
        .ticker-item-mega {
          animation: ticker-mega-hit 3s cubic-bezier(0.23,1,0.32,1);
          border-color: rgba(251,191,36,0.5) !important;
          background: rgba(251,191,36,0.06) !important;
          position: relative;
        }
        .ticker-item-mega::before,
        .ticker-item-mega::after {
          content: '✦';
          position: absolute;
          font-size: 10px;
          color: #fbbf24;
          pointer-events: none;
          animation: mega-sparkle 1.5s ease-out forwards;
        }
        .ticker-item-mega::before { top: -4px; left: 20%; animation-delay: 0.1s; }
        .ticker-item-mega::after { top: -4px; right: 20%; animation-delay: 0.4s; }
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
          <button
            onClick={(e) => { e.stopPropagation(); setSoundEnabled(!soundEnabled); }}
            className="ml-1 text-[12px] opacity-50 hover:opacity-100 transition-opacity"
            title={soundEnabled ? 'Sound aus' : 'Sound an'}
          >
            {soundEnabled ? <GiSpeaker className="w-3.5 h-3.5" /> : <GiSpeakerOff className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Ticker track */}
        {items.length === 0 ? (
          <div className="flex items-center px-4">
            <span className="text-[11px] text-[#555570]">Waiting for pulls...</span>
          </div>
        ) : (
          <div
            className="flex-1 overflow-hidden"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
          >
            <div
              className="flex gap-3 w-max"
              style={{
                animationName: 'ticker-scroll',
                animationDuration: `${animationDuration}s`,
                animationTimingFunction: 'linear',
                animationIterationCount: 'infinite',
                animationPlayState: paused ? 'paused' : 'running',
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
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg shrink-0 transition-colors hover:bg-[rgba(255,255,255,0.04)] ${item.isMegaHit ? 'ticker-item-mega' : item.isNew ? 'ticker-item-new' : ''}`}
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
<GiCardPlay className="w-4 h-4 text-[#7777a0]" />
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
