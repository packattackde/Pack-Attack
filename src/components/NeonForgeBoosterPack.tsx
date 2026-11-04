'use client';

import type { ReactNode } from 'react';
import Image from 'next/image';
import {
  BoosterPackPattern,
  BoosterPackTheme,
  PACK_BG_1,
  PACK_BG_2,
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
  overlay?: ReactNode;
};

/** Foil seam — below top crimp decoration */
export const PACK_TEAR_SEAM_TOP = '8.5%';

function TopCrimp({ accent }: { accent: string }) {
  return (
    <svg
      className="pointer-events-none absolute inset-x-0 top-0 z-30 h-[6%] min-h-[18px] w-full"
      viewBox="0 0 180 18"
      preserveAspectRatio="none"
      aria-hidden
    >
      <path
        d="M0,18 L0,10 L6,14 L12,8 L18,14 L24,8 L30,14 L36,8 L42,14 L48,8 L54,14 L60,8 L66,14 L72,8 L78,14 L84,8 L90,14 L96,8 L102,14 L108,8 L114,14 L120,8 L126,14 L132,8 L138,14 L144,8 L150,14 L156,8 L162,14 L168,8 L174,14 L180,8 L180,18 Z"
        fill={accent}
        opacity="0.95"
      />
      <path
        d="M0,18 L0,10 L6,14 L12,8 L18,14 L24,8 L30,14 L36,8 L42,14 L48,8 L54,14 L60,8 L66,14 L72,8 L78,14 L84,8 L90,14 L96,8 L102,14 L108,8 L114,14 L120,8 L126,14 L132,8 L138,14 L144,8 L150,14 L156,8 L162,14 L168,8 L174,14 L180,8 L180,18 Z"
        fill="none"
        stroke="rgba(0,0,0,0.35)"
        strokeWidth="0.5"
      />
    </svg>
  );
}

function BottomCrimp({ accent }: { accent: string }) {
  return (
    <svg
      className="pointer-events-none absolute inset-x-0 bottom-0 z-30 h-[5%] min-h-[14px] w-full"
      viewBox="0 0 180 14"
      preserveAspectRatio="none"
      aria-hidden
    >
      <path
        d="M0,0 L6,6 L12,0 L18,6 L24,0 L30,6 L36,0 L42,6 L48,0 L54,6 L60,0 L66,6 L72,0 L78,6 L84,0 L90,6 L96,0 L102,6 L108,0 L114,6 L120,0 L126,6 L132,0 L138,6 L144,0 L150,6 L156,0 L162,6 L168,0 L174,6 L180,0 L180,14 L0,14 Z"
        fill={accent}
        opacity="0.85"
      />
    </svg>
  );
}

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
  const widthClass = isOpening ? 'w-full max-w-[min(280px,88vw)]' : 'w-[160px] sm:w-[180px]';

  return (
    <div
      className={`relative aspect-[5/8] select-none ${widthClass} ${className}`}
      style={{
        filter: revealGlow ? `drop-shadow(0 0 24px ${accent})` : undefined,
      }}
    >
      <div
        className="absolute inset-0 overflow-hidden rounded-[14px] ring-1 ring-white/20"
        style={{
          boxShadow: '0 22px 44px -14px rgba(0,0,0,0.9), inset 0 0 0 1px rgba(139,92,246,0.25)',
          background: `linear-gradient(170deg, ${PACK_BG_1} 0%, ${PACK_BG_2} 68%, #050213 100%)`,
        }}
      >
        <PackPattern pattern={pattern} accent={accent} suffix={idSuffix} />

        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[50%]"
          style={{ background: `radial-gradient(ellipse at 50% 0%, ${accent}28, transparent 65%)` }}
        />

        <TopCrimp accent={accentSoft} />
        <BottomCrimp accent={accent} />

        {/* Rip foil tab */}
        <div
          className="absolute inset-x-[8%] top-[5.5%] z-20 h-[3.5%] min-h-[10px] rounded-[1px]"
          style={{
            background: `linear-gradient(180deg, ${accentSoft}, ${accent})`,
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.35)',
          }}
        />

        {(isOpening || tearLineActive) && (
          <div
            className="tear-rip-guide absolute left-[6%] right-[6%] z-[25] rounded-full"
            style={{
              top: PACK_TEAR_SEAM_TOP,
              height: 4,
              background:
                tearProgress > 0
                  ? `linear-gradient(90deg, #23e6ff ${Math.max(0, tearProgress - 10)}%, #fff ${tearProgress}%, transparent ${tearProgress}%)`
                  : 'repeating-linear-gradient(90deg, #23e6ff 0 12px, #ffffff 12px 16px, transparent 16px 24px)',
            }}
          />
        )}

        <div className="absolute left-0 right-0 top-[8%] z-20 text-center text-[6px] font-black uppercase tracking-[3px] text-white/55">
          Pull · Forge
        </div>

        <div className="absolute inset-x-0 top-[11%] z-20 flex flex-col items-center px-2 text-center">
          <div
            className={`w-full truncate font-black leading-none ${isOpening ? 'text-[14px]' : 'text-[13px]'}`}
            style={{
              background: `linear-gradient(180deg, ${accentSoft} 0%, ${accent} 70%)`,
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {wordmark}
          </div>
          <div className="mt-0.5 text-[7px] font-bold uppercase tracking-[2px]" style={{ color: `${accent}cc` }}>
            {tagline}
          </div>
        </div>

        <div
          className={`absolute z-10 overflow-hidden rounded-md ${
            isOpening ? 'left-[10%] right-[10%] top-[22%] bottom-[26%]' : 'left-[12%] right-[12%] top-[24%] bottom-[28%]'
          }`}
          style={{
            background: '#07050f',
            boxShadow: `0 0 0 2px ${accent}cc, 0 0 0 3px rgba(0,0,0,0.5), inset 0 0 16px rgba(0,0,0,0.4)`,
          }}
        >
          <div className="absolute inset-[3px] overflow-hidden rounded-[5px] bg-[#0a0820]">
            {heroImageUrl ? (
              <Image
                src={heroImageUrl}
                alt=""
                fill
                className={isOpening ? 'object-contain p-0.5' : 'object-cover'}
                sizes={isOpening ? '220px' : '160px'}
                unoptimized
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Icon className="h-9 w-9 text-white/35" />
              </div>
            )}
          </div>
          {isOpening && heroImageUrl && (
            <span className="absolute left-1 top-1 z-10 rounded bg-[#ff2ea6] px-1 py-px text-[6px] font-black uppercase text-[#14041f]">
              Chase
            </span>
          )}
          <div
            className="pointer-events-none absolute inset-0 rounded-md"
            style={{
              background: 'linear-gradient(155deg, rgba(255,255,255,0.15) 0%, transparent 42%, rgba(0,0,0,0.2) 100%)',
            }}
          />
        </div>

        <div className="absolute inset-x-0 bottom-[9%] z-20 px-2 pb-1 pt-2">
          <div className="line-clamp-2 text-center text-[9px] font-black uppercase leading-tight tracking-wide text-white sm:text-[10px]">
            {boxName}
          </div>
          <div className="mt-1 flex items-center gap-1.5">
            <div
              className="flex h-5 w-5 shrink-0 items-center justify-center sm:h-6 sm:w-6"
              style={{
                background: `linear-gradient(145deg, ${accentSoft}, ${accent})`,
                clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
              }}
            >
              <Icon className="h-2.5 w-2.5 text-[#0a0420] sm:h-3 sm:w-3" />
            </div>
            <div className="flex-1 rounded-sm py-0.5 text-center text-[7px] font-black uppercase tracking-wider text-[#14041f] sm:text-[8px]" style={{ background: accent }}>
              {cardsPerPack} cards
            </div>
          </div>
        </div>

        {revealGlow && (
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(255,46,166,0.12),transparent_60%)]" />
        )}

        {overlay}

        {!isOpening && (
          <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <div
              className="pack-shine absolute top-0 h-full w-[40%]"
              style={{ background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.45) 50%, transparent 70%)' }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
