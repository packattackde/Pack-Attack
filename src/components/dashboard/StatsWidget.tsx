'use client'

import { useTranslations } from 'next-intl'
import { useCountUp } from '@/hooks/useCountUp'
import { GiChart } from 'react-icons/gi'
import { InfoTooltip } from '@/components/InfoTooltip'

interface StatsWidgetProps {
  packsOpened: number
  battlesWon: number
  winRate: number
  collectionValue: number
  className?: string
}

import { formatCoins } from '@/lib/format'

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
    <div className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-xl p-2 sm:p-3 text-center">
      <p className={`text-lg sm:text-xl font-extrabold ${colorClass}`}>{value}</p>
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
  const t = useTranslations('widgets')
  const animatedPacks = useCountUp(packsOpened)
  const animatedBattles = useCountUp(battlesWon)
  const animatedWinRate = useCountUp(winRate)
  const animatedValue = useCountUp(collectionValue)

  return (
    <div
      className={`bg-[#1a1a4a] border border-[rgba(255,255,255,0.1)] rounded-2xl h-full p-4 sm:p-6 ${className}`}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wider text-[#7777a0] mb-3 flex items-center gap-1.5">
        <GiChart className="w-3.5 h-3.5 text-[#C84FFF] shrink-0" /> {t('stats.myStats')}
        <InfoTooltip infoKey="dashboard.stats" />
      </p>

      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <StatCard
          value={animatedPacks.toLocaleString()}
          label={t('stats.packsOpened')}
          colorClass="text-[#C84FFF]"
        />
        <StatCard
          value={animatedBattles.toLocaleString()}
          label={t('stats.battlesWon')}
          colorClass="text-[#fbbf24]"
        />
        <StatCard
          value={`${animatedWinRate}%`}
          label={t('stats.winRate')}
          colorClass="text-[#60a5fa]"
        />
        <StatCard
          value={formatCoins(animatedValue)}
          label={t('stats.collectionValue')}
          colorClass="text-[#a78bfa]"
        />
      </div>
    </div>
  )
}
