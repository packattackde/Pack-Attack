'use client';

import type { ReactNode } from 'react';
import Image from 'next/image';
import {
  BoosterPackPattern,
  BoosterPackTheme,
  BOOSTER_PATH,
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

/** Catalog + opening tear seam (catalog uses legacy position) */
export const PACK_TEAR_SEAM_TOP = '8.5%';
const OPENING_TEAR_SEAM_TOP = '9.2%';

const FOIL_GOLD = '#d4af37';
const FOIL_SILVER_HI = '#eef4ff';
const FOIL_SILVER = '#b8c9de';
const NEON_PINK = '#ff2ea6';
const NEON_VIOLET = '#8b5cf6';
const NEON_CYAN = '#23e6ff';
const OPENING_PACK_ASPECT = '210 / 370';

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
      <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.12]" viewBox="0 0 100 160" preserveAspectRatio="none">
        <defs>
          <pattern id={`wave-${suffix}`} width="40" height="20" patternUnits="userSpaceOnUse">
            <path d="M 0 10 Q 10 0, 20 10 T 40 10" stroke={accent} strokeWidth="1" fill="none" />
          </pattern>
        </defs>
        <rect width="100" height="160" fill={`url(#wave-${suffix})`} />
      </svg>
    ),
    diamond: (
      <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.1]" viewBox="0 0 100 160" preserveAspectRatio="none">
        <defs>
          <pattern id={`dmd-${suffix}`} width="14" height="14" patternUnits="userSpaceOnUse">
            <path d="M 7 2 L 12 7 L 7 12 L 2 7 Z" fill={accent} />
          </pattern>
        </defs>
        <rect width="100" height="160" fill={`url(#dmd-${suffix})`} />
      </svg>
    ),
    star: (
      <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.12]" viewBox="0 0 100 160" preserveAspectRatio="none">
        <defs>
          <pattern id={`star-${suffix}`} width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 10 2 L 12 8 L 18 8 L 13 12 L 15 18 L 10 14 L 5 18 L 7 12 L 2 8 L 8 8 Z" fill={accent} />
          </pattern>
        </defs>
        <rect width="100" height="160" fill={`url(#star-${suffix})`} />
      </svg>
    ),
    chevron: (
      <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.1]" viewBox="0 0 100 160" preserveAspectRatio="none">
        <defs>
          <pattern id={`chv-${suffix}`} width="16" height="16" patternUnits="userSpaceOnUse">
            <path d="M 0 10 L 8 4 L 16 10" stroke={accent} strokeWidth="1.2" fill="none" />
          </pattern>
        </defs>
        <rect width="100" height="160" fill={`url(#chv-${suffix})`} />
      </svg>
    ),
    burst: (
      <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.14]" viewBox="0 0 100 160" preserveAspectRatio="none">
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
      <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.08]" viewBox="0 0 100 160" preserveAspectRatio="none">
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

/** Box grid (/boxes) — unchanged stable catalog art; do not use opening premium layout here */
function CatalogBoosterPack({
  boxName,
  cardsPerPack,
  heroImageUrl,
  theme,
  idSuffix,
  className,
}: NeonForgeBoosterPackProps & { theme: BoosterPackTheme }) {
  const { accent, accentSoft, Icon, wordmark, tagline, pattern } = theme;

  return (
    <div
      className={`relative aspect-[5/8] w-[160px] select-none sm:w-[180px] ${className ?? ''}`}
    >
      <div
        className="absolute inset-0 overflow-hidden rounded-[14px] ring-1 ring-white/20"
        style={{
          boxShadow: '0 22px 44px -14px rgba(0,0,0,0.9), inset 0 0 0 1px rgba(139,92,246,0.25)',
          background: `linear-gradient(170deg, ${PACK_BG_1} 0%, ${PACK_BG_2} 68%, #050213 100%)`,
        }}
      >
        <PackPattern pattern={pattern} accent={accent} suffix={idSuffix ?? 'catalog'} />

        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[50%]"
          style={{ background: `radial-gradient(ellipse at 50% 0%, ${accent}28, transparent 65%)` }}
        />

        <svg
          className="pointer-events-none absolute inset-x-0 top-0 z-30 h-[6%] min-h-[18px] w-full"
          viewBox="0 0 180 18"
          preserveAspectRatio="none"
          aria-hidden
        >
          <path
            d="M0,18 L0,10 L6,14 L12,8 L18,14 L24,8 L30,14 L36,8 L42,14 L48,8 L54,14 L60,8 L66,14 L72,8 L78,14 L84,8 L90,14 L96,8 L102,14 L108,8 L114,14 L120,8 L126,14 L132,8 L138,14 L144,8 L150,14 L156,8 L162,14 L168,8 L174,14 L180,8 L180,18 Z"
            fill={accentSoft}
            opacity="0.95"
          />
        </svg>
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

        <div
          className="absolute inset-x-[8%] top-[5.5%] z-20 h-[3.5%] min-h-[10px] rounded-[1px]"
          style={{
            background: `linear-gradient(180deg, ${accentSoft}, ${accent})`,
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.35)',
          }}
        />

        <div className="absolute left-0 right-0 top-[8%] z-20 text-center text-[6px] font-black uppercase tracking-[3px] text-white/55">
          Pull · Forge
        </div>

        <div className="absolute inset-x-0 top-[11%] z-20 flex flex-col items-center px-2 text-center">
          <div
            className="w-full truncate text-[13px] font-black leading-none"
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
          className="absolute z-10 overflow-hidden rounded-md left-[12%] right-[12%] top-[24%] bottom-[28%]"
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
                className="object-cover"
                sizes="160px"
                unoptimized
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Icon className="h-9 w-9 text-white/35" />
              </div>
            )}
          </div>
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
            <div
              className="flex-1 rounded-sm py-0.5 text-center text-[7px] font-black uppercase tracking-wider text-[#14041f] sm:text-[8px]"
              style={{ background: accent }}
            >
              {cardsPerPack} cards
            </div>
          </div>
        </div>

        <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <div
            className="pack-shine absolute top-0 h-full w-[40%]"
            style={{ background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.45) 50%, transparent 70%)' }}
          />
        </div>
      </div>
    </div>
  );
}

function BoosterSilhouetteRim({ suffix, glow }: { suffix: string; glow?: boolean }) {
  const gradId = `pack-rim-${suffix}`;
  return (
    <svg
      className="pointer-events-none absolute inset-0 z-[40] h-full w-full"
      viewBox="0 0 210 370"
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={NEON_PINK} />
          <stop offset="45%" stopColor={NEON_VIOLET} />
          <stop offset="100%" stopColor={NEON_CYAN} />
        </linearGradient>
      </defs>
      {glow && (
        <path d={BOOSTER_PATH} fill="none" stroke={NEON_PINK} strokeWidth="5" opacity="0.35" style={{ filter: 'blur(4px)' }} />
      )}
      <path d={BOOSTER_PATH} fill="none" stroke={`url(#${gradId})`} strokeWidth={glow ? 2.2 : 1.65} strokeLinejoin="round" />
    </svg>
  );
}

function OpeningChaseCardPreview({
  heroImageUrl,
  Icon,
}: {
  heroImageUrl: string | null | undefined;
  Icon: BoosterPackTheme['Icon'];
}) {
  return (
    <div className="absolute inset-[3px] overflow-hidden rounded-[4px] bg-gradient-to-b from-[#0c0a18] to-[#05040c]">
      <div className="relative h-full w-full">
        {heroImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={heroImageUrl}
            alt=""
            referrerPolicy="no-referrer"
            className="absolute left-1/2 top-1/2 max-h-[92%] max-w-[92%] -translate-x-1/2 -translate-y-1/2 object-contain drop-shadow-[0_6px_14px_rgba(0,0,0,0.65)]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Icon className="h-10 w-10 text-white/30" aria-hidden />
          </div>
        )}
      </div>
    </div>
  );
}

/** Pack opening flow only — premium retail mockup */
function OpeningBoosterPack({
  boxName,
  cardsPerPack,
  heroImageUrl,
  theme,
  revealGlow,
  tearLineActive,
  tearProgress,
  idSuffix,
  className,
  overlay,
}: NeonForgeBoosterPackProps & { theme: BoosterPackTheme }) {
  const { accent, accentSoft, Icon, wordmark, tagline, pattern } = theme;

  return (
    <div
      className={`relative w-full max-w-[min(280px,88vw)] select-none ${className ?? ''}`}
      style={{
        aspectRatio: OPENING_PACK_ASPECT,
        filter: revealGlow
          ? `drop-shadow(0 0 28px ${accent}) drop-shadow(0 12px 28px rgba(0,0,0,0.75))`
          : 'drop-shadow(0 14px 26px rgba(0,0,0,0.65))',
      }}
    >
      <div
        className="absolute inset-0 overflow-hidden"
        style={{
          background: `linear-gradient(168deg, ${PACK_BG_1} 0%, ${PACK_BG_2} 52%, #050213 100%)`,
        }}
      >
        <PackPattern pattern={pattern} accent={accent} suffix={idSuffix ?? 'catalog'} />

        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[45%]"
          style={{ background: `radial-gradient(ellipse at 50% 0%, ${accent}30, transparent 68%)` }}
        />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'linear-gradient(90deg, rgba(0,0,0,0.48) 0%, transparent 14%, transparent 86%, rgba(0,0,0,0.48) 100%)',
          }}
        />

        <svg
          className="pointer-events-none absolute inset-x-0 top-0 z-[32] h-[9.5%] min-h-[22px] w-full"
          viewBox="0 0 210 36"
          preserveAspectRatio="none"
          aria-hidden
        >
          <path
            d="M 6,24 L 10,18 L 16,24 L 22,18 L 28,24 L 34,18 L 40,24 L 46,18 L 52,24 L 58,18 L 64,24 L 70,18 L 76,24 L 82,18 L 88,24 L 94,18 L 100,24 L 106,18 L 112,24 L 118,18 L 124,24 L 130,18 L 136,24 L 142,18 L 148,24 L 154,18 L 160,24 L 166,18 L 172,24 L 178,18 L 184,24 L 190,18 L 196,24 L 202,18 L 206,24 L 206,36 L 4,36 Z"
            fill={NEON_PINK}
            opacity="0.94"
          />
        </svg>
        <svg
          className="pointer-events-none absolute inset-x-0 bottom-0 z-[32] h-[7%] min-h-[18px] w-full"
          viewBox="0 0 210 28"
          preserveAspectRatio="none"
          aria-hidden
        >
          <path
            d="M 6,0 L 10,6 L 16,0 L 22,6 L 28,0 L 34,6 L 40,0 L 46,6 L 52,0 L 58,6 L 64,0 L 70,6 L 76,0 L 82,6 L 88,0 L 94,6 L 100,0 L 106,6 L 112,0 L 118,6 L 124,0 L 130,6 L 136,0 L 142,6 L 148,0 L 154,6 L 160,0 L 166,6 L 172,0 L 178,6 L 184,0 L 190,6 L 196,0 L 202,6 L 206,0 L 206,28 L 4,28 Z"
            fill={NEON_VIOLET}
            opacity="0.9"
          />
        </svg>

        <div
          className={`absolute inset-x-[6%] top-[6.8%] z-[28] h-[3.2%] min-h-[10px] transition-transform duration-200 ${tearLineActive ? '-translate-y-0.5' : ''}`}
        >
          <div
            className="absolute inset-0 rounded-[2px]"
            style={{
              background: `linear-gradient(180deg, ${FOIL_SILVER_HI}, ${FOIL_SILVER} 55%, #7a8aa8)`,
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.5)',
            }}
          />
          <div
            className="absolute left-1/2 top-0 h-[150%] w-[12%] -translate-x-1/2 -translate-y-[40%]"
            style={{
              background: FOIL_SILVER_HI,
              clipPath: 'polygon(50% 0%, 100% 55%, 50% 100%, 0% 55%)',
            }}
          />
        </div>

        {tearLineActive && (
          <div
            className="tear-rip-guide absolute left-[5%] right-[5%] z-[30] rounded-full"
            style={{
              top: OPENING_TEAR_SEAM_TOP,
              height: 3,
              background:
                tearProgress && tearProgress > 0
                  ? `linear-gradient(90deg, ${NEON_CYAN} ${Math.max(0, tearProgress - 10)}%, #fff ${tearProgress}%, transparent ${tearProgress}%)`
                  : `repeating-linear-gradient(90deg, ${NEON_CYAN} 0 10px, #ffffff 10px 14px, transparent 14px 22px)`,
            }}
          />
        )}

        <div className="absolute left-0 right-0 top-[10.5%] z-[26] text-center text-[5px] font-black uppercase tracking-[0.32em] text-white/55">
          Pull · Forge · Sealed
        </div>

        <div className="absolute inset-x-0 top-[12.5%] z-[26] flex flex-col items-center px-2 text-center">
          <div
            className="w-full truncate text-[15px] font-black leading-none"
            style={{
              textShadow: '0 1px 0 rgba(0,0,0,0.65)',
              background: `linear-gradient(180deg, ${accentSoft} 0%, ${accent} 75%)`,
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {wordmark}
          </div>
          <div className="mt-0.5 text-[7px] font-bold uppercase tracking-[0.2em]" style={{ color: `${NEON_CYAN}dd` }}>
            {tagline}
          </div>
          <div
            className="mt-1 h-[2px] w-[68%] rounded-full opacity-80"
            style={{ background: `linear-gradient(90deg, ${NEON_PINK}, ${NEON_VIOLET}, ${NEON_CYAN})` }}
          />
        </div>

        <div
          className="absolute z-[20] overflow-hidden rounded-[5px]"
          style={{
            left: '8.5%',
            right: '8.5%',
            top: '19%',
            bottom: '20%',
            background: '#020106',
            boxShadow: `0 0 0 2px ${FOIL_GOLD}, 0 0 0 4px rgba(0,0,0,0.9), 0 0 0 5px ${accent}88`,
          }}
        >
          <OpeningChaseCardPreview heroImageUrl={heroImageUrl} Icon={Icon} />
          {heroImageUrl && (
            <span className="absolute left-0 top-0 z-30 rounded-br-md bg-[#ff2ea6] px-1.5 py-0.5 text-[6px] font-black uppercase text-[#14041f]">
              Chase
            </span>
          )}
          {cardsPerPack > 0 && (
            <span
              className="absolute right-0 top-0 z-30 flex h-[18px] w-[18px] items-center justify-center rounded-bl-md text-[7px] font-black text-white ring-1 ring-[#f5e6a8]"
              style={{ background: accent }}
            >
              {cardsPerPack}
            </span>
          )}
        </div>

        <div className="absolute inset-x-0 bottom-[13.5%] z-[26] px-2 text-center">
          <div className="line-clamp-2 text-[9px] font-black uppercase leading-tight tracking-wide text-white sm:text-[10px]">
            {boxName}
          </div>
        </div>

        <div className="absolute inset-x-[8%] bottom-[8.8%] z-[26]">
          <div className="flex items-center gap-1.5">
            <div
              className="flex h-5 w-5 shrink-0 items-center justify-center sm:h-6 sm:w-6"
              style={{
                background: `linear-gradient(145deg, ${accentSoft}, ${accent})`,
                clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
              }}
            >
              <Icon className="h-2.5 w-2.5 text-[#0a0420] sm:h-3 sm:w-3" />
            </div>
            <div
              className="flex-1 rounded-sm py-0.5 text-center text-[7px] font-black uppercase tracking-wider text-[#14041f] sm:text-[8px]"
              style={{ background: accent }}
            >
              {cardsPerPack} cards
            </div>
          </div>
        </div>

        {revealGlow && (
          <div className="pointer-events-none absolute inset-0 z-[15] bg-[radial-gradient(circle_at_50%_38%,rgba(255,46,166,0.14),transparent_62%)]" />
        )}

        {overlay}
      </div>

      <BoosterSilhouetteRim suffix={idSuffix ?? 'opening'} glow={revealGlow} />
    </div>
  );
}

export function NeonForgeBoosterPack(props: NeonForgeBoosterPackProps) {
  const theme = props.theme ?? getBoosterPackTheme(props.game);

  if (props.variant === 'opening') {
    return <OpeningBoosterPack {...props} theme={theme} />;
  }

  return <CatalogBoosterPack {...props} theme={theme} />;
}

/** Pick best image for pack chase window (opening flow) */
export function resolveBoosterHeroImage(
  topCard: { imageUrlGatherer: string | null } | null | undefined,
  boxImageUrl: string | null | undefined
): string | null {
  const chase = topCard?.imageUrlGatherer?.trim();
  if (chase) return chase;
  const box = boxImageUrl?.trim();
  return box || null;
}
