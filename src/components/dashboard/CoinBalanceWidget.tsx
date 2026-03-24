'use client'

import Link from 'next/link'
import { GiTwoCoins } from 'react-icons/gi'
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
  const isLow = coins < cheapestBoxPrice

  return (
    <div
      className={`bg-[#1a1a4a] border border-[rgba(255,255,255,0.1)] rounded-2xl h-full p-4 sm:p-6 ${className}`}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wider text-[#7777a0] mb-3">
<GiTwoCoins className="w-3.5 h-3.5 text-[#BFFF00] inline" /> MY BALANCE
      </p>

      <p className="text-2xl sm:text-3xl font-extrabold text-[#fbbf24]">
<span className="flex items-center gap-2"><GiTwoCoins className="w-7 h-7 text-[#fbbf24]" /> {formatCoins(coins)}</span>
      </p>

      <p className="text-xs text-[#8888aa] mt-1">
        Monthly earnings: {monthlyEarnings} / {monthlyCap} cap
      </p>

      <Link
        href="/purchase-coins"
        className={`mt-4 flex items-center justify-center gap-2 w-full px-4 py-2.5 min-h-[44px] font-semibold rounded-xl text-sm text-black bg-gradient-to-r from-[#fbbf24] to-[#f59e0b] hover:brightness-110 transition ${
          isLow ? 'animate-pulse' : ''
        }`}
      >
        <GiTwoCoins className="w-4 h-4 text-black" />
        Top Up Coins
      </Link>

      {isLow && (
        <p className="text-xs text-[#fbbf24] mt-2 text-center">
          Running low! Recharge to keep pulling.
        </p>
      )}
    </div>
  )
}
