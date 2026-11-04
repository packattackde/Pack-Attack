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
  /** Highlight the foil rip seam (opening flow) */
  tearLineActive?: boolean;
  /** 0–100 rip progress while dragging */
  tearProgress?: number;
  idSuffix?: string;
  className?: string;
};

/** Rip seam position — keep in sync with PackOpeningFlow tear zone */
export const PACK_TEAR_SEAM_TOP = '9.5%';

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
  tearProgress = 0,
  idSuffix = 'default',
  className = '',
}: NeonForgeBoosterPackProps) {
  const theme = themeProp ?? getBoosterPackTheme(game);
  const { accent, accentSoft, Icon, wordmark, tagline, pattern } = theme;
  const isOpening = variant === 'opening';

  const widthClass = isOpening ? 'w-full max-w-[min(290px,88vw)]' : 'w-[160px] sm:w-[180px]';

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

        {/* Foil tear strip + rip seam */}
        <div
          className="absolute top-0 inset-x-0 z-10 h-[7.5%] min-h-[18px]"
          style={{
            background: `linear-gradient(180deg, ${accentSoft} 0%, ${accent} 50%, rgba(0,0,0,0.55) 100%)`,
          }}
        >
          <div className="absolute left-[5%] right-[5%] bottom-[22%] flex items-center justify-between">
            {Array.from({ length: 20 }).map((_, i) => (
              <span key={i} className="h-[2px] w-[2px] rounded-full bg-black/50" />
            ))}
          </div>
        </div>

        {/* High-contrast rip band */}
        <div
          className="absolute inset-x-0 z-[15] h-[3.5%] min-h-[10px]"
          style={{
            top: '7.5%',
            background: 'linear-gradient(180deg, rgba(0,0,0,0.85), rgba(10,8,22,0.95))',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.12)',
          }}
        />

        {(tearLineActive || isOpening) && (
          <div
            className="absolute left-[3%] right-[3%] z-[25] tear-rip-guide rounded-full"
            style={{
              top: PACK_TEAR_SEAM_TOP,
              height: tearLineActive ? 4 : 3,
              background:
                tearProgress > 0
                  ? `linear-gradient(90deg, #23e6ff ${Math.max(0, tearProgress - 8)}%, #ffffff ${tearProgress}%, rgba(255,255,255,0.2) ${tearProgress}%)`
                  : 'repeating-linear-gradient(90deg, #23e6ff 0 10px, #ffffff 10px 14px, transparent 14px 22px)',
            }}
          />
        )}

        {!isOpening && (
          <div className="absolute left-0 right-0 top-[7%] z-20 text-center text-[6px] font-black uppercase tracking-[3px] text-white/55 sm:text-[6.5px]">
            Pull · Forge
          </div>
        )}

        <div
          className={`absolute inset-x-0 z-20 flex flex-col items-center px-2 text-center ${isOpening ? 'top-[12%]' : 'top-[9.5%]'}`}
        >
          <div
            className={`w-full truncate font-black leading-none tracking-wide ${isOpening ? 'text-[13px] sm:text-[15px]' : 'text-[13px] sm:text-[14px]'}`}
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

        {/* Hero / chase card window */}
        <div
          className={`absolute z-10 overflow-hidden rounded-lg ${
            isOpening ? 'left-[6%] right-[6%] top-[21%] bottom-[24%]' : 'left-[11%] right-[11%] top-[24%] bottom-[31%]'
          }`}
          style={{
            background: '#06040f',
            boxShadow: `
              0 0 0 2px ${accent},
              0 0 0 3px rgba(0,0,0,0.7),
              0 0 0 4px ${accentSoft}55,
              0 0 20px ${accent}44,
              0 10px 24px rgba(0,0,0,0.7),
              inset 0 0 30px rgba(0,0,0,0.5)
            `,
          }}
        >
          <div
            className="absolute inset-[5px] overflow-hidden rounded-[6px]"
            style={{
              background: `radial-gradient(circle at 50% 30%, ${PACK_BG_1}, ${PACK_BG_2})`,
            }}
          >
            {heroImageUrl ? (
              <Image
                src={heroImageUrl}
                alt=""
                fill
                className={isOpening ? 'object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.85)]' : 'object-cover'}
                sizes={isOpening ? '240px' : '200px'}
                unoptimized
              />
            ) : (
              <div
                className="flex h-full w-full items-center justify-center"
                style={{ background: `radial-gradient(circle at 30% 30%, ${accent}44, ${PACK_BG_2})` }}
              >
                <Icon className="h-10 w-10 text-white/40" />
              </div>
            )}
          </div>
          {isOpening && heroImageUrl && (
            <span className="absolute left-2 top-2 z-10 rounded px-1.5 py-0.5 text-[7px] font-black uppercase tracking-wider text-[#14041f] bg-gradient-to-r from-[#ff2ea6] to-[#ff6ec4] shadow-[0_0_8px_rgba(255,46,166,0.6)]">
              Chase
            </span>
          )}
          <div
            className="pointer-events-none absolute inset-0 rounded-lg"
            style={{
              background: isOpening
                ? 'linear-gradient(165deg, rgba(255,255,255,0.12) 0%, transparent 35%, transparent 75%, rgba(0,0,0,0.15) 100%)'
                : 'linear-gradient(160deg, rgba(255,255,255,0.28) 0%, transparent 38%, transparent 68%, rgba(0,0,0,0.28) 100%)',
            }}
          />
          {!isOpening && (
            <div className="pack-shine pointer-events-none absolute inset-0 overflow-hidden opacity-60">
              <div
                className="absolute top-0 h-full w-[45%]"
                style={{
                  background: 'linear-gradient(105deg, transparent 28%, rgba(255,255,255,0.45) 50%, transparent 72%)',
                }}
              />
            </div>
          )}
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
