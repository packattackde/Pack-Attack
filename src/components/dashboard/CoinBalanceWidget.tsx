'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { GiTwoCoins } from 'react-icons/gi'
import { InfoTooltip } from '@/components/InfoTooltip'
import { formatCoins } from '@/lib/format'

interface CoinBalanceWidgetProps {
  coins: number
  cheapestBoxPrice: number
  monthlyEarnings: number
  monthlyCap: number
  className?: string
}

export default function CoinBalanceWidget({
  coins,
  cheapestBoxPrice,
  monthlyEarnings,
  monthlyCap,
  className = '',
}: CoinBalanceWidgetProps) {
  const t = useTranslations('widgets')
  const isLow = coins < cheapestBoxPrice

  return (
    <div
      className={`bg-[#1a1a4a] border border-[rgba(255,255,255,0.1)] rounded-2xl h-full p-4 sm:p-6 ${className}`}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wider text-[#7777a0] mb-3 flex items-center gap-1.5">
        <GiTwoCoins className="w-3.5 h-3.5 text-[#C84FFF] shrink-0" /> {t('coinBalance.myBalance')}
        <InfoTooltip infoKey="dashboard.coinBalance" />
      </p>

      <p className="text-2xl sm:text-3xl font-extrabold text-[#fbbf24]">
<span className="flex items-center gap-2"><GiTwoCoins className="w-7 h-7 text-[#fbbf24]" /> {formatCoins(coins)}</span>
      </p>

      <p className="text-xs text-[#8888aa] mt-1">
        {t('coinBalance.monthlyEarnings')}: {monthlyEarnings} / {monthlyCap} {t('coinBalance.cap')}
      </p>

      <Link
        href="/purchase-coins"
        className={`mt-4 flex items-center justify-center gap-2 w-full px-4 py-2.5 min-h-[44px] font-semibold rounded-xl text-sm text-black bg-gradient-to-r from-[#fbbf24] to-[#f59e0b] hover:brightness-110 transition ${
          isLow ? 'animate-pulse' : ''
        }`}
      >
        <GiTwoCoins className="w-4 h-4 text-black" />
        {t('coinBalance.topUp')}
      </Link>

      {isLow && (
        <p className="text-xs text-[#fbbf24] mt-2 text-center">
          {t('coinBalance.runningLow')}
        </p>
      )}
    </div>
  )
}
