'use client'

import Link from 'next/link'

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
      className={`bg-[#1a1a4a] border border-[rgba(255,255,255,0.1)] rounded-2xl p-5 sm:p-6 ${className}`}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wider text-[#7777a0] mb-3">
        💰 MY BALANCE
      </p>

      <p className="text-3xl font-extrabold text-[#fbbf24]">
        🪙 {coins.toFixed(2)}
      </p>

      <p className="text-xs text-[#8888aa] mt-1">
        Monthly earnings: {monthlyEarnings} / {monthlyCap} cap
      </p>

      <Link
        href="/purchase-coins"
        className={`mt-4 block w-full text-center px-4 py-2.5 font-semibold rounded-xl text-sm text-black bg-gradient-to-r from-[#fbbf24] to-[#f59e0b] hover:brightness-110 transition ${
          isLow ? 'animate-pulse' : ''
        }`}
      >
        🪙 Coins aufladen
      </Link>

      {isLow && (
        <p className="text-xs text-[#fbbf24] mt-2 text-center">
          Running low! Recharge to keep pulling.
        </p>
      )}
    </div>
  )
}
