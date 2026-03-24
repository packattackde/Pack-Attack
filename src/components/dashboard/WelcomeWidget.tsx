'use client'

import Link from 'next/link'

interface WelcomeWidgetProps {
  userName: string
  level: number
  xpInCurrentLevel: number
  xpForNextLevel: number
  xpPercent: number
  title: string
  dynamicSubtitle: string
  className?: string
}

export default function WelcomeWidget({
  userName,
  level,
  xpInCurrentLevel,
  xpForNextLevel,
  xpPercent,
  title,
  dynamicSubtitle,
  className = '',
}: WelcomeWidgetProps) {
  return (
    <div
      className={`bg-[#1a1a4a] border border-[rgba(255,255,255,0.1)] rounded-2xl p-4 sm:p-6 ${className}`}
    >
      {/* Top row: greeting + CTA buttons */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#f0f0f5]">
            Welcome back, <span className="text-[#BFFF00]">{userName}</span>!
          </h2>
          <p className="text-sm text-[#8888aa] mt-1">{dynamicSubtitle}</p>
        </div>

        <div className="flex flex-col sm:flex-row flex-wrap gap-2 w-full sm:w-auto">
          <Link
            href="/boxes"
            className="min-h-[44px] flex items-center justify-center px-4 py-2 bg-[#BFFF00] text-black font-semibold rounded-xl text-sm whitespace-nowrap hover:brightness-110 transition"
          >
            📦 Open Box
          </Link>
          <Link
            href="/battles"
            className="min-h-[44px] flex items-center justify-center px-4 py-2 border border-[rgba(191,255,0,0.3)] text-[#BFFF00] font-semibold rounded-xl text-sm whitespace-nowrap hover:bg-[rgba(191,255,0,0.05)] transition"
          >
            ⚔️ Join Battle
          </Link>
        </div>
      </div>

      {/* Level section */}
      <div className="mt-5">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-base sm:text-lg font-extrabold text-[#BFFF00]">
            Level {level}
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[rgba(191,255,0,0.1)] text-[#BFFF00] border border-[rgba(191,255,0,0.2)]">
            {title}
          </span>
        </div>

        {/* XP progress bar */}
        <div className="w-full h-[8px] bg-[rgba(255,255,255,0.06)] rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#BFFF00] to-[#7fff00] rounded-full transition-all duration-500"
            style={{ width: `${Math.min(xpPercent, 100)}%` }}
          />
        </div>

        {/* XP numbers */}
        <div className="flex justify-between mt-1.5 text-xs text-[#8888aa]">
          <span>
            {xpInCurrentLevel.toLocaleString()} / {xpForNextLevel.toLocaleString()} XP
          </span>
          <span>
            {xpPercent}% to Lv.{level + 1}
          </span>
        </div>
      </div>
    </div>
  )
}
