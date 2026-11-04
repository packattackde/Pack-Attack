'use client';

import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
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

/** TCG portrait frame: 2.5 × 3.5 (5:7) */
const CARD_ASPECT = 5 / 7;

function fitCardFrameInBox(contentWidth: number, contentHeight: number) {
  if (contentWidth <= 0 || contentHeight <= 0) return { width: 0, height: 0 };
  let height = contentHeight;
  let width = height * CARD_ASPECT;
  if (width > contentWidth) {
    width = contentWidth;
    height = width / CARD_ASPECT;
  }
  return { width: Math.floor(width), height: Math.floor(height) };
}

function OpeningChaseCardPreview({
  heroImageUrl,
  Icon,
}: {
  heroImageUrl: string | null | undefined;
  Icon: BoosterPackTheme['Icon'];
}) {
  const slotRef = useRef<HTMLDivElement>(null);
  const [frameSize, setFrameSize] = useState({ width: 0, height: 0 });

  useLayoutEffect(() => {
    const el = slotRef.current;
    if (!el) return;

    const update = () => {
      const style = getComputedStyle(el);
      const padX = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
      const padY = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
      setFrameSize(fitCardFrameInBox(el.clientWidth - padX, el.clientHeight - padY));
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const frameReady = frameSize.width > 0 && frameSize.height > 0;

  return (
    <div
      ref={slotRef}
      className="absolute inset-0 flex items-center justify-center overflow-visible rounded-[4px] bg-gradient-to-b from-[#0c0a18] to-[#05040c] p-1.5 sm:p-2"
    >
      <div
        className="relative shrink-0 rounded-[4px] bg-[#080612]"
        style={{
          width: frameSize.width,
          height: frameSize.height,
          visibility: frameReady ? 'visible' : 'hidden',
          boxShadow: `
            0 0 0 1px ${FOIL_GOLD}99,
            0 0 0 2px rgba(0,0,0,0.85),
            0 8px 20px rgba(0,0,0,0.55)
          `,
        }}
      >
        <div className="absolute inset-[3px] flex items-center justify-center overflow-visible rounded-[3px] bg-[#0a0820]">
          {heroImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={heroImageUrl}
              alt=""
              referrerPolicy="no-referrer"
              draggable={false}
              className="max-h-full max-w-full object-contain object-center"
              style={{ width: 'auto', height: 'auto', display: 'block' }}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Icon className="h-10 w-10 text-white/30" aria-hidden />
            </div>
          )}
        </div>
        <div
          className="pointer-events-none absolute inset-0 rounded-[4px]"
          style={{
            background:
              'linear-gradient(145deg, rgba(255,255,255,0.12) 0%, transparent 40%, transparent 100%)',
          }}
        />
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
        <PackPattern pattern={pattern} accent={accent} suffix={idSuffix ?? 'opening'} />

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
          className="absolute z-[20] overflow-visible rounded-[5px]"
          style={{
            left: '7.5%',
            right: '7.5%',
            top: '18%',
            bottom: '18%',
            background: '#020106',
            boxShadow: `0 0 0 2px ${FOIL_GOLD}, 0 0 0 4px rgba(0,0,0,0.9), 0 0 0 5px ${accent}88`,
          }}
        >
          <OpeningChaseCardPreview heroImageUrl={heroImageUrl} Icon={Icon} />
          {heroImageUrl && (
            <span className="absolute -left-px -top-px z-30 rounded-br-md bg-[#ff2ea6] px-1.5 py-0.5 text-[6px] font-black uppercase text-[#14041f] shadow-sm">
              Chase
            </span>
          )}
          {cardsPerPack > 0 && (
            <span
              className="absolute -right-px -top-px z-30 flex h-[18px] w-[18px] items-center justify-center rounded-bl-md text-[7px] font-black text-white ring-1 ring-[#f5e6a8] shadow-sm"
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

/** Pack opening flow only — /boxes uses GridBoosterPack */
export function NeonForgeBoosterPack(props: NeonForgeBoosterPackProps) {
  const theme = props.theme ?? getBoosterPackTheme(props.game);
  return <OpeningBoosterPack {...props} theme={theme} />;
}

type ChaseCardImageSource = {
  imageUrlGatherer?: string | null;
  imageUrlScryfall?: string | null;
};

/** Prefer full-card Scryfall art when available; opening chase window uses object-contain */
export function pickChaseCardImageUrl(card: ChaseCardImageSource | null | undefined): string | null {
  if (!card) return null;
  const scry = card.imageUrlScryfall?.trim();
  if (scry) return scry;
  const gatherer = card.imageUrlGatherer?.trim();
  return gatherer || null;
}

/** Pick best image for pack chase window (opening flow) */
export function resolveBoosterHeroImage(
  topCard: ChaseCardImageSource | null | undefined,
  boxImageUrl: string | null | undefined
): string | null {
  const chase = pickChaseCardImageUrl(topCard);
  if (chase) return chase;
  const box = boxImageUrl?.trim();
  return box || null;
}
