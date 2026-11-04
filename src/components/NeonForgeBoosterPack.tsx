'use client';

import type { ReactNode } from 'react';
import Image from 'next/image';
import {
  BoosterPackPattern,
  BoosterPackTheme,
  NEON_FORGE_CLIP,
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
  /** Catalog grid vs full-screen opening */
  variant?: 'catalog' | 'opening';
  revealGlow?: boolean;
  tearLineActive?: boolean;
  idSuffix?: string;
  className?: string;
};

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
            <rect
              key={i}
              x="49"
              y="0"
              width="2"
              height="80"
              fill={`url(#burst-${suffix})`}
              transform={`rotate(${angle} 50 80)`}
            />
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
  idSuffix = 'default',
  className = '',
}: NeonForgeBoosterPackProps) {
  const theme = themeProp ?? getBoosterPackTheme(game);
  const { accent, accentSoft, Icon, wordmark, tagline, pattern } = theme;
  const isOpening = variant === 'opening';

  const widthClass = isOpening ? 'w-full max-w-[min(260px,85vw)]' : 'w-[160px] sm:w-[180px]';

  return (
    <div
      className={`relative aspect-[208/320] select-none ${widthClass} ${className}`}
      style={{
        filter: revealGlow ? `drop-shadow(0 0 28px ${accent}) drop-shadow(0 0 12px rgba(35,230,255,0.35))` : undefined,
      }}
    >
      {/* Tri-color rim */}
      <div
        className="absolute -inset-[2px] opacity-90"
        style={{
          clipPath: NEON_FORGE_CLIP,
          background: 'linear-gradient(135deg, #ff2ea6, #8b5cf6, #23e6ff)',
        }}
      />

      <div
        className="absolute inset-0 overflow-hidden"
        style={{
          clipPath: NEON_FORGE_CLIP,
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.85), inset 0 0 0 1px rgba(255,255,255,0.1)',
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(165deg, #191233 0%, ${PACK_BG_1} 38%, #100d22 72%, #05040c 100%)`,
          }}
        />
        <div
          className="absolute inset-0 opacity-40 pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(rgba(35,230,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,46,166,0.05) 1px, transparent 1px)',
            backgroundSize: '14px 14px',
          }}
        />
        <PackPattern pattern={pattern} accent={accent} suffix={idSuffix} />

        <div
          className="absolute inset-x-0 top-0 h-[55%] pointer-events-none"
          style={{ background: `radial-gradient(ellipse at 50% 0%, ${accent}35, transparent 62%)` }}
        />

        {/* Foil tear strip */}
        <div
          className="absolute top-0 inset-x-0 z-10 h-[6.5%] min-h-[14px]"
          style={{
            background: `linear-gradient(180deg, ${accentSoft} 0%, ${accent} 55%, rgba(0,0,0,0.45) 100%)`,
          }}
        >
          <div className="absolute left-[5%] right-[5%] bottom-[20%] flex items-center justify-between">
            {Array.from({ length: 20 }).map((_, i) => (
              <span key={i} className="h-[1.5px] w-[1.5px] rounded-full bg-black/45" />
            ))}
          </div>
        </div>

        {tearLineActive && (
          <div
            className="absolute left-[4%] right-[4%] z-20 h-[2px]"
            style={{
              top: '6.5%',
              background: 'linear-gradient(90deg, transparent, #23e6ff, #ffffff, #23e6ff, transparent)',
              boxShadow: '0 0 10px rgba(35,230,255,0.8)',
            }}
          />
        )}

        <div className="absolute left-0 right-0 top-[7%] z-20 text-center text-[6px] font-black uppercase tracking-[3px] text-white/55 sm:text-[6.5px]">
          Pull · Forge
        </div>

        <div className="absolute inset-x-0 top-[9.5%] z-20 flex flex-col items-center px-2 text-center">
          <div
            className={`w-full truncate font-black leading-none tracking-wide ${isOpening ? 'text-[15px] sm:text-[17px]' : 'text-[13px] sm:text-[14px]'}`}
            style={{
              background: 'linear-gradient(180deg, #ffffff 0%, #ff2ea6 55%, #ff9e2c 100%)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 0 10px rgba(255,46,166,0.35))',
            }}
          >
            {wordmark}
          </div>
          <div className="mt-0.5 text-[7px] font-bold uppercase tracking-[2px] sm:text-[7.5px]" style={{ color: `${accent}dd` }}>
            {tagline}
          </div>
          <div
            className="mt-1.5 h-[1.5px] w-[55%] opacity-70"
            style={{ background: 'linear-gradient(90deg, transparent, #ff2ea6, #8b5cf6, #23e6ff, transparent)' }}
          />
        </div>

        {/* Hero window */}
        <div
          className="absolute left-[11%] right-[11%] top-[24%] bottom-[31%] z-10 overflow-hidden rounded-md"
          style={{
            background: `linear-gradient(135deg, ${PACK_BG_1}, ${PACK_BG_2})`,
            boxShadow: `
              0 0 0 1.5px ${accent}ee,
              0 0 0 2.5px rgba(0,0,0,0.55),
              0 0 0 3px ${accentSoft}44,
              0 8px 18px rgba(0,0,0,0.65),
              inset 0 0 24px ${accent}22
            `,
          }}
        >
          {heroImageUrl ? (
            <Image src={heroImageUrl} alt="" fill className="object-cover" sizes="200px" unoptimized />
          ) : (
            <div
              className="flex h-full w-full items-center justify-center"
              style={{ background: `radial-gradient(circle at 30% 30%, ${accent}44, ${PACK_BG_2})` }}
            >
              <Icon className="h-10 w-10 text-white/40" />
            </div>
          )}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'linear-gradient(160deg, rgba(255,255,255,0.28) 0%, transparent 38%, transparent 68%, rgba(0,0,0,0.28) 100%)',
            }}
          />
          <div className="pack-shine pointer-events-none absolute inset-0 overflow-hidden opacity-60">
            <div
              className="absolute top-0 h-full w-[45%]"
              style={{
                background: 'linear-gradient(105deg, transparent 28%, rgba(255,255,255,0.45) 50%, transparent 72%)',
              }}
            />
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 z-20 px-2.5 pb-2.5 pt-3">
          <div
            className={`text-center font-black uppercase leading-[1.15] text-white ${isOpening ? 'text-[11px] sm:text-xs' : 'text-[10px] sm:text-[11px]'} tracking-wider line-clamp-2`}
            style={{ textShadow: '0 1px 3px rgba(0,0,0,1), 0 0 8px rgba(0,0,0,0.8)' }}
          >
            {boxName}
          </div>

          <div className="mt-1.5 flex items-center justify-between gap-1.5">
            <div
              className="relative flex h-6 w-6 shrink-0 items-center justify-center"
              style={{
                background: `linear-gradient(145deg, ${accentSoft}, ${accent})`,
                clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                boxShadow: '0 0 0 1px rgba(0,0,0,0.4), 0 2px 4px rgba(0,0,0,0.5)',
              }}
            >
              <Icon className="h-3 w-3 text-[#0a0420] drop-shadow-sm" />
            </div>
            <div
              className="inline-flex flex-1 items-center justify-center gap-1 rounded-sm px-2 py-1"
              style={{
                background: accent,
                boxShadow: `0 1px 0 ${accentSoft} inset, 0 -1px 0 rgba(0,0,0,0.2) inset`,
              }}
            >
              <span className="text-[8px] font-black uppercase tracking-[1.5px] text-[#14041f] sm:text-[9px]">
                {cardsPerPack} CARDS
              </span>
            </div>
          </div>
        </div>

        {revealGlow && (
          <div
            className="pointer-events-none absolute inset-0 z-[5]"
            style={{ background: 'radial-gradient(circle at 50% 40%, rgba(255,46,166,0.15), transparent 65%)' }}
          />
        )}

        <div className="pointer-events-none absolute inset-0 ring-1 ring-white/15" />
      </div>

      {revealGlow && (
        <>
          <span className="absolute -left-1 top-[32%] h-1.5 w-1.5 rounded-full bg-[#ff2ea6] opacity-80 animate-pulse" />
          <span className="absolute -right-1 top-[45%] h-1.5 w-1.5 rounded-full bg-[#23e6ff] opacity-80 animate-pulse" />
        </>
      )}
    </div>
  );
}
