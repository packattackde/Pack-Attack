'use client';

import type { ReactNode } from 'react';
import Image from 'next/image';
import {
  BoosterPackPattern,
  BoosterPackTheme,
  BOOSTER_PATH,
  BOOSTER_VIEWBOX,
  PACK_BG_1,
  PACK_BG_2,
  boosterClipId,
  getBoosterPackTheme,
} from '@/lib/booster-pack-theme';

type NeonForgeBoosterPackProps = {
  boxName: string;
  cardsPerPack: number;
  heroImageUrl?: string | null;
  game?: string;
  theme?: BoosterPackTheme;
  variant?: 'catalog' | 'opening';
  revealGlow?: boolean;
  tearLineActive?: boolean;
  tearProgress?: number;
  idSuffix?: string;
  className?: string;
  /** Holo / specular overlays (opening flow) — clipped to pack shape */
  overlay?: ReactNode;
};

/** Rip seam — just below top crimp + foil band */
export const PACK_TEAR_SEAM_TOP = '11.5%';

function PackPattern({
  pattern,
  accent,
  suffix,
}: {
  pattern: BoosterPackPattern;
  accent: string;
  suffix: string;
}) {
  const patterns: Record<BoosterPackPattern, ReactNode> = {
    wave: (
      <svg className="absolute inset-0 h-full w-full opacity-[0.12] pointer-events-none" viewBox="0 0 100 160" preserveAspectRatio="none">
        <defs>
          <pattern id={`wave-${suffix}`} width="40" height="20" patternUnits="userSpaceOnUse">
            <path d="M 0 10 Q 10 0, 20 10 T 40 10" stroke={accent} strokeWidth="1" fill="none" />
          </pattern>
        </defs>
        <rect width="100" height="160" fill={`url(#wave-${suffix})`} />
      </svg>
    ),
    diamond: (
      <svg className="absolute inset-0 h-full w-full opacity-[0.1] pointer-events-none" viewBox="0 0 100 160" preserveAspectRatio="none">
        <defs>
          <pattern id={`dmd-${suffix}`} width="14" height="14" patternUnits="userSpaceOnUse">
            <path d="M 7 2 L 12 7 L 7 12 L 2 7 Z" fill={accent} />
          </pattern>
        </defs>
        <rect width="100" height="160" fill={`url(#dmd-${suffix})`} />
      </svg>
    ),
    star: (
      <svg className="absolute inset-0 h-full w-full opacity-[0.12] pointer-events-none" viewBox="0 0 100 160" preserveAspectRatio="none">
        <defs>
          <pattern id={`star-${suffix}`} width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 10 2 L 12 8 L 18 8 L 13 12 L 15 18 L 10 14 L 5 18 L 7 12 L 2 8 L 8 8 Z" fill={accent} />
          </pattern>
        </defs>
        <rect width="100" height="160" fill={`url(#star-${suffix})`} />
      </svg>
    ),
    chevron: (
      <svg className="absolute inset-0 h-full w-full opacity-[0.1] pointer-events-none" viewBox="0 0 100 160" preserveAspectRatio="none">
        <defs>
          <pattern id={`chv-${suffix}`} width="16" height="16" patternUnits="userSpaceOnUse">
            <path d="M 0 10 L 8 4 L 16 10" stroke={accent} strokeWidth="1.2" fill="none" />
          </pattern>
        </defs>
        <rect width="100" height="160" fill={`url(#chv-${suffix})`} />
      </svg>
    ),
    burst: (
      <svg className="absolute inset-0 h-full w-full opacity-[0.14] pointer-events-none" viewBox="0 0 100 160" preserveAspectRatio="none">
        <defs>
          <radialGradient id={`burst-${suffix}`} cx="50%" cy="50%">
            <stop offset="0%" stopColor={accent} stopOpacity="0.8" />
            <stop offset="100%" stopColor={accent} stopOpacity="0" />
          </radialGradient>
        </defs>
        {Array.from({ length: 16 }).map((_, i) => {
          const angle = (i * 360) / 16;
          return (
            <rect key={i} x="49" y="0" width="2" height="80" fill={`url(#burst-${suffix})`} transform={`rotate(${angle} 50 80)`} />
          );
        })}
      </svg>
    ),
    grid: (
      <svg className="absolute inset-0 h-full w-full opacity-[0.08] pointer-events-none" viewBox="0 0 100 160" preserveAspectRatio="none">
        <defs>
          <pattern id={`grid-${suffix}`} width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M 10 0 L 0 0 0 10" stroke={accent} strokeWidth="0.5" fill="none" />
          </pattern>
        </defs>
        <rect width="100" height="160" fill={`url(#grid-${suffix})`} />
      </svg>
    ),
  };
  return <>{patterns[pattern]}</>;
}

export function NeonForgeBoosterPack({
  boxName,
  cardsPerPack,
  heroImageUrl,
  game,
  theme: themeProp,
  variant = 'catalog',
  revealGlow = false,
  tearLineActive = false,
  tearProgress = 0,
  idSuffix = 'default',
  className = '',
  overlay,
}: NeonForgeBoosterPackProps) {
  const theme = themeProp ?? getBoosterPackTheme(game);
  const { accent, accentSoft, Icon, wordmark, tagline, pattern } = theme;
  const isOpening = variant === 'opening';
  const clipId = boosterClipId(idSuffix);
  const widthClass = isOpening ? 'w-full max-w-[min(290px,88vw)]' : 'w-[160px] sm:w-[180px]';

  return (
    <div
      className={`relative select-none ${widthClass} ${className}`}
      style={{
        aspectRatio: `${BOOSTER_VIEWBOX.w}/${BOOSTER_VIEWBOX.h}`,
        filter: revealGlow ? `drop-shadow(0 0 28px ${accent}) drop-shadow(0 0 12px rgba(35,230,255,0.35))` : undefined,
      }}
    >
      <svg
        viewBox={`0 0 ${BOOSTER_VIEWBOX.w} ${BOOSTER_VIEWBOX.h}`}
        className="absolute inset-0 h-full w-full overflow-visible drop-shadow-[0_20px_40px_rgba(0,0,0,0.75)]"
        aria-hidden
      >
        <defs>
          <clipPath id={clipId} clipPathUnits="userSpaceOnUse">
            <path d={BOOSTER_PATH} />
          </clipPath>
          <linearGradient id={`pack-body-${idSuffix}`} x1="0" y1="0" x2="0.85" y2="1">
            <stop offset="0%" stopColor="#1a1238" />
            <stop offset="35%" stopColor={PACK_BG_1} />
            <stop offset="78%" stopColor="#0c0820" />
            <stop offset="100%" stopColor="#05040c" />
          </linearGradient>
          <linearGradient id={`pack-edge-${idSuffix}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#ff2ea6" stopOpacity="0.5" />
            <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#23e6ff" stopOpacity="0.5" />
          </linearGradient>
        </defs>
        <path d={BOOSTER_PATH} fill={`url(#pack-body-${idSuffix})`} stroke={`url(#pack-edge-${idSuffix})`} strokeWidth="1.2" />
        <path
          d={BOOSTER_PATH}
          fill="none"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth="0.6"
          transform="translate(0.3,0.3)"
        />
      </svg>

      <div
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `url(#${clipId})` }}
      >
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(165deg, #191233 0%, ${PACK_BG_1} 38%, #100d22 72%, #05040c 100%)`,
          }}
        />
        <PackPattern pattern={pattern} accent={accent} suffix={idSuffix} />

        <div
          className="pointer-events-none absolute inset-y-[8%] left-0 w-[4%]"
          style={{ background: 'linear-gradient(90deg, rgba(0,0,0,0.55), transparent)' }}
        />
        <div
          className="pointer-events-none absolute inset-y-[8%] right-0 w-[4%]"
          style={{ background: 'linear-gradient(270deg, rgba(0,0,0,0.55), transparent)' }}
        />

        <div
          className="absolute inset-x-0 top-[5%] h-[48%] pointer-events-none"
          style={{ background: `radial-gradient(ellipse at 50% 0%, ${accent}30, transparent 65%)` }}
        />

        {/* Flat foil strip below top crimp — classic rip tab area */}
        <div
          className="absolute inset-x-[3%] top-[6.2%] z-10 h-[4.5%] min-h-[12px] rounded-[1px]"
          style={{
            background: `linear-gradient(180deg, ${accentSoft} 0%, ${accent} 55%, rgba(0,0,0,0.5) 100%)`,
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.35), 0 1px 2px rgba(0,0,0,0.4)',
          }}
        >
          <div className="absolute bottom-[18%] left-[4%] right-[4%] flex justify-between">
            {Array.from({ length: 22 }).map((_, i) => (
              <span key={i} className="h-[1.5px] w-[1.5px] rounded-full bg-black/45" />
            ))}
          </div>
        </div>

        <div
          className="absolute inset-x-[2%] z-[15] h-[2.5%]"
          style={{
            top: '10.2%',
            background: 'linear-gradient(180deg, rgba(0,0,0,0.75), rgba(12,10,28,0.9))',
          }}
        />

        {(tearLineActive || isOpening) && (
          <div
            className="absolute left-[4%] right-[4%] z-[25] tear-rip-guide rounded-full"
            style={{
              top: PACK_TEAR_SEAM_TOP,
              height: tearLineActive ? 4 : 3,
              background:
                tearProgress > 0
                  ? `linear-gradient(90deg, #23e6ff ${Math.max(0, tearProgress - 8)}%, #ffffff ${tearProgress}%, rgba(255,255,255,0.15) ${tearProgress}%)`
                  : 'repeating-linear-gradient(90deg, #23e6ff 0 10px, #ffffff 10px 14px, transparent 14px 22px)',
            }}
          />
        )}

        {!isOpening && (
          <div className="absolute left-0 right-0 top-[12%] z-20 text-center text-[6px] font-black uppercase tracking-[3px] text-white/55">
            Pull · Forge
          </div>
        )}

        <div className={`absolute inset-x-0 z-20 flex flex-col items-center px-3 text-center ${isOpening ? 'top-[14%]' : 'top-[13.5%]'}`}>
          <div
            className={`w-full truncate font-black leading-none tracking-wide ${isOpening ? 'text-[13px] sm:text-[15px]' : 'text-[12px] sm:text-[13px]'}`}
            style={{
              background: 'linear-gradient(180deg, #ffffff 0%, #ff2ea6 55%, #ff9e2c 100%)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {wordmark}
          </div>
          <div className="mt-0.5 text-[7px] font-bold uppercase tracking-[2px]" style={{ color: `${accent}dd` }}>
            {tagline}
          </div>
        </div>

        <div
          className={`absolute z-10 overflow-hidden rounded-sm ${
            isOpening ? 'left-[10%] right-[10%] top-[22%] bottom-[22%]' : 'left-[12%] right-[12%] top-[24%] bottom-[24%]'
          }`}
          style={{
            background: '#06040f',
            boxShadow: `
              0 0 0 2px ${accent},
              0 0 0 3px rgba(0,0,0,0.65),
              inset 0 0 20px rgba(0,0,0,0.45)
            `,
          }}
        >
          <div
            className="absolute inset-[4px] overflow-hidden rounded-[3px]"
            style={{ background: `radial-gradient(circle at 50% 20%, ${PACK_BG_1}, ${PACK_BG_2})` }}
          >
            {heroImageUrl ? (
              <Image
                src={heroImageUrl}
                alt=""
                fill
                className={isOpening ? 'object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.85)]' : 'object-cover'}
                sizes={isOpening ? '240px' : '180px'}
                unoptimized
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Icon className="h-10 w-10 text-white/40" />
              </div>
            )}
          </div>
          {isOpening && heroImageUrl && (
            <span className="absolute left-1.5 top-1.5 z-10 rounded px-1.5 py-0.5 text-[7px] font-black uppercase tracking-wider text-[#14041f] bg-gradient-to-r from-[#ff2ea6] to-[#ff6ec4]">
              Chase
            </span>
          )}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background: 'linear-gradient(165deg, rgba(255,255,255,0.1) 0%, transparent 40%, transparent 70%, rgba(0,0,0,0.2) 100%)',
            }}
          />
          {!isOpening && (
            <div className="pack-shine pointer-events-none absolute inset-0 overflow-hidden opacity-50">
              <div
                className="absolute top-0 h-full w-[45%]"
                style={{ background: 'linear-gradient(105deg, transparent 28%, rgba(255,255,255,0.4) 50%, transparent 72%)' }}
              />
            </div>
          )}
        </div>

        <div className="absolute inset-x-0 bottom-[11%] z-20 px-3 pb-1 pt-2">
          <div
            className={`text-center font-black uppercase leading-[1.1] text-white ${isOpening ? 'text-[10px] sm:text-[11px]' : 'text-[9px] sm:text-[10px]'} tracking-wide line-clamp-2`}
            style={{ textShadow: '0 1px 3px rgba(0,0,0,1)' }}
          >
            {boxName}
          </div>
          <div className="mt-1 flex items-center justify-between gap-1">
            <div
              className="flex h-5 w-5 shrink-0 items-center justify-center sm:h-6 sm:w-6"
              style={{
                background: `linear-gradient(145deg, ${accentSoft}, ${accent})`,
                clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
              }}
            >
              <Icon className="h-2.5 w-2.5 text-[#0a0420] sm:h-3 sm:w-3" />
            </div>
            <div className="flex-1 rounded-sm px-2 py-0.5 text-center" style={{ background: accent }}>
              <span className="text-[7px] font-black uppercase tracking-[1.5px] text-[#14041f] sm:text-[8px]">
                {cardsPerPack} CARDS
              </span>
            </div>
          </div>
        </div>

        {revealGlow && (
          <div
            className="pointer-events-none absolute inset-0 z-[5]"
            style={{ background: 'radial-gradient(circle at 50% 38%, rgba(255,46,166,0.14), transparent 60%)' }}
          />
        )}

        {overlay}

        <div
          className="pointer-events-none absolute inset-x-[8%] bottom-[5%] h-[6%] opacity-40"
          style={{ background: 'linear-gradient(0deg, rgba(0,0,0,0.6), transparent)' }}
        />
      </div>
    </div>
  );
}
