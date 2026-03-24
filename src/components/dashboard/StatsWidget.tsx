'use client'

import { useCountUp } from '@/hooks/useCountUp'

interface StatsWidgetProps {
  packsOpened: number
  battlesWon: number
  winRate: number
  collectionValue: number
  className?: string
}

function formatLargeNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return n.toString()
}

function StatCard({
  value,
  label,
  colorClass,
}: {
  value: string
  label: string
  colorClass: string
}) {
  return (
    <div className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-xl p-3 text-center">
      <p className={`text-2xl font-extrabold ${colorClass}`}>{value}</p>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-[#7777a0] mt-1">
        {label}
      </p>
    </div>
  )
}

export default function StatsWidget({
  packsOpened,
  battlesWon,
  winRate,
  collectionValue,
  className = '',
}: StatsWidgetProps) {
  const animatedPacks = useCountUp(packsOpened)
  const animatedBattles = useCountUp(battlesWon)
  const animatedWinRate = useCountUp(winRate)
  const animatedValue = useCountUp(collectionValue)

  return (
    <div
      className={`bg-[#1a1a4a] border border-[rgba(255,255,255,0.1)] rounded-2xl p-5 sm:p-6 ${className}`}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wider text-[#7777a0] mb-3">
        📊 MY STATS
      </p>

      <div className="grid grid-cols-2 gap-3">
        <StatCard
          value={animatedPacks.toLocaleString()}
          label="Packs Opened"
          colorClass="text-[#BFFF00]"
        />
        <StatCard
          value={animatedBattles.toLocaleString()}
          label="Battles Won"
          colorClass="text-[#fbbf24]"
        />
        <StatCard
          value={`${animatedWinRate}%`}
          label="Win Rate"
          colorClass="text-[#60a5fa]"
        />
        <StatCard
          value={formatLargeNumber(animatedValue)}
          label="Collection Value"
          colorClass="text-[#a78bfa]"
        />
      </div>
    </div>
  )
}
