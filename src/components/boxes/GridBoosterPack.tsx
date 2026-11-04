'use client';

import Image from 'next/image';
import {
  BoosterPackPattern,
  BoosterPackTheme,
  PACK_BG_1,
  PACK_BG_2,
} from '@/lib/booster-pack-theme';

type GridBoosterPackProps = {
  boxName: string;
  cardsPerPack: number;
  heroImageUrl: string | null;
  theme: BoosterPackTheme;
  idSuffix: string;
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
  const patterns: Record<BoosterPackPattern, React.ReactNode> = {
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

/** /boxes grid only — legacy product look (not used in pack opening). */
export function GridBoosterPack({
  boxName,
  cardsPerPack,
  heroImageUrl,
  theme,
  idSuffix,
}: GridBoosterPackProps) {
  const { accent, accentSoft, Icon, wordmark, tagline, pattern } = theme;

  return (
    <div
      className="relative aspect-[5/8] w-[160px] select-none overflow-hidden rounded-[14px] sm:w-[180px]"
      style={{
        boxShadow: `
          0 25px 50px -12px rgba(0,0,0,0.85),
          0 0 0 1px rgba(255,255,255,0.12) inset
        `,
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(170deg, ${PACK_BG_1} 0%, ${PACK_BG_2} 70%, #050213 100%)`,
        }}
      />

      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[55%]"
        style={{ background: `radial-gradient(ellipse at 50% 0%, ${accent}30, transparent 60%)` }}
      />

      <PackPattern pattern={pattern} accent={accent} suffix={idSuffix} />

      <div
        className="pointer-events-none absolute inset-0 opacity-35"
        style={{ background: 'radial-gradient(ellipse at 25% 15%, rgba(255,255,255,0.3), transparent 55%)' }}
      />

      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[40%]"
        style={{ background: 'linear-gradient(0deg, rgba(10,10,42,0.85) 0%, transparent 100%)' }}
      />

      <div
        className="absolute inset-x-0 top-0 z-10 h-[5%]"
        style={{
          background: `linear-gradient(180deg, ${accentSoft} 0%, ${accent} 60%, rgba(0,0,0,0.4) 100%)`,
        }}
      >
        <div className="absolute bottom-[15%] left-[5%] right-[5%] flex items-center justify-between">
          {Array.from({ length: 20 }).map((_, i) => (
            <span key={i} className="h-[1.5px] w-[1.5px] rounded-full bg-black/50" />
          ))}
        </div>
      </div>

      <div className="absolute left-0 right-0 top-[5.5%] z-20 text-center text-[6.5px] font-black uppercase tracking-[3px] text-white/55">
        Pull · Forge
      </div>

      <div className="absolute inset-x-0 top-[9%] z-20 flex flex-col items-center px-2 text-center">
        <div
          className="w-full truncate text-[13px] font-black leading-none tracking-[1px] sm:text-[14px]"
          style={{
            background: `linear-gradient(180deg, ${accentSoft} 0%, ${accent} 65%, ${accent}aa 100%)`,
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.6))',
          }}
        >
          {wordmark}
        </div>
        <div className="mt-0.5 text-[7.5px] font-bold uppercase tracking-[2px]" style={{ color: `${accent}cc` }}>
          {tagline}
        </div>
      </div>

      <div
        className="absolute z-10 flex items-center justify-center overflow-hidden rounded-md left-[12%] right-[12%] top-[23%] bottom-[28%] p-1"
        style={{
          background: `linear-gradient(135deg, #0a0818, ${PACK_BG_2})`,
          boxShadow: `
            0 0 0 1.5px ${accent}dd,
            0 0 0 2.5px rgba(0,0,0,0.5),
            0 0 0 3.5px ${accentSoft}55,
            0 6px 14px rgba(0,0,0,0.6),
            inset 0 0 20px ${accent}22
          `,
        }}
      >
        {heroImageUrl ? (
          <div className="relative h-full w-full">
            <Image
              src={heroImageUrl}
              alt=""
              fill
              className="object-contain object-center"
              sizes="150px"
              unoptimized
            />
          </div>
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
              'linear-gradient(160deg, rgba(255,255,255,0.3) 0%, transparent 35%, transparent 70%, rgba(0,0,0,0.25) 100%)',
          }}
        />
      </div>

      <div className="absolute inset-x-0 bottom-0 z-20 px-2.5 pb-2.5 pt-3">
        <div
          className="mb-1.5 line-clamp-2 text-center text-[10px] font-black uppercase leading-[1.15] tracking-wider text-white sm:text-[11px]"
          style={{ textShadow: '0 1px 3px rgba(0,0,0,1), 0 0 8px rgba(0,0,0,0.8)' }}
        >
          {boxName}
        </div>
        <div className="flex items-center justify-between gap-1.5">
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
            <span className="text-[9px] font-black uppercase tracking-[1.5px] text-[#0a0420]">{cardsPerPack} CARDS</span>
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-0 rounded-[14px] ring-1 ring-white/20" />
      <div
        className="pointer-events-none absolute inset-y-0 left-0 w-[2px]"
        style={{ background: 'linear-gradient(180deg, transparent, rgba(255,255,255,0.3), transparent)' }}
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 w-[2px]"
        style={{ background: 'linear-gradient(180deg, transparent, rgba(0,0,0,0.4), transparent)' }}
      />

      <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden" aria-hidden>
        <div
          className="pack-shine absolute top-0 h-full w-[40%] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.5) 50%, transparent 70%)',
          }}
        />
      </div>
    </div>
  );
}
