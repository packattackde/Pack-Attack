'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Coins,
  Package,
  Sparkles,
  Flame,
  Zap,
  Swords,
  Crown,
  Trophy,
  Ship,
  Wand2,
} from 'lucide-react';
import { useTranslations } from 'next-intl';

interface TopCard {
  id: string;
  name: string;
  imageUrlGatherer: string | null;
  coinValue: number;
}

interface Box {
  id: string;
  name: string;
  imageUrl: string;
  price: number;
  cardsPerPack: number;
  featured: boolean;
  games: string[];
  topCard: TopCard | null;
  totalCards: number;
  createdByShop?: { id: string; name: string } | null;
}

interface BoxesClientProps {
  boxes: Box[];
  availableGames: string[];
}

type Theme = {
  bg1: string;
  bg2: string;
  accent: string;
  accentSoft: string;
  glow: string;
  wordmark: string;
  tagline: string;
  Icon: React.ComponentType<{ className?: string }>;
  pattern: 'diamond' | 'wave' | 'star' | 'chevron' | 'burst' | 'grid';
};

function getGameTheme(game: string | undefined): Theme {
  const key = (game || '').toUpperCase().replace(/-/g, '_');
  const themes: Record<string, Theme> = {
    POKEMON: {
      bg1: '#2B4DE8',
      bg2: '#0a1140',
      accent: '#FFD600',
      accentSoft: '#FFE94D',
      glow: 'rgba(255,214,0,0.4)',
      wordmark: 'POKÉMON',
      tagline: 'Trading Card Game',
      Icon: Zap,
      pattern: 'burst',
    },
    MAGIC_THE_GATHERING: {
      bg1: '#2A1458',
      bg2: '#0a0420',
      accent: '#E0B84C',
      accentSoft: '#FFD77A',
      glow: 'rgba(224,184,76,0.4)',
      wordmark: 'MAGIC',
      tagline: 'The Gathering',
      Icon: Wand2,
      pattern: 'diamond',
    },
    MAGIC: {
      bg1: '#2A1458',
      bg2: '#0a0420',
      accent: '#E0B84C',
      accentSoft: '#FFD77A',
      glow: 'rgba(224,184,76,0.4)',
      wordmark: 'MAGIC',
      tagline: 'The Gathering',
      Icon: Wand2,
      pattern: 'diamond',
    },
    YUGIOH: {
      bg1: '#6B1414',
      bg2: '#1a0404',
      accent: '#F5A524',
      accentSoft: '#FFC66A',
      glow: 'rgba(245,165,36,0.4)',
      wordmark: 'YU-GI-OH!',
      tagline: 'Trading Card Game',
      Icon: Crown,
      pattern: 'star',
    },
    ONE_PIECE: {
      bg1: '#C41E3A',
      bg2: '#400a12',
      accent: '#FFD700',
      accentSoft: '#FFEA70',
      glow: 'rgba(255,215,0,0.45)',
      wordmark: 'ONE PIECE',
      tagline: 'Card Game',
      Icon: Ship,
      pattern: 'wave',
    },
    ONEPIECE: {
      bg1: '#C41E3A',
      bg2: '#400a12',
      accent: '#FFD700',
      accentSoft: '#FFEA70',
      glow: 'rgba(255,215,0,0.45)',
      wordmark: 'ONE PIECE',
      tagline: 'Card Game',
      Icon: Ship,
      pattern: 'wave',
    },
    LORCANA: {
      bg1: '#1E3A8A',
      bg2: '#061032',
      accent: '#A78BFA',
      accentSoft: '#C4B5FD',
      glow: 'rgba(167,139,250,0.4)',
      wordmark: 'LORCANA',
      tagline: 'Disney TCG',
      Icon: Sparkles,
      pattern: 'diamond',
    },
    DIGIMON: {
      bg1: '#0E4A7A',
      bg2: '#041526',
      accent: '#22D3EE',
      accentSoft: '#67E8F9',
      glow: 'rgba(34,211,238,0.4)',
      wordmark: 'DIGIMON',
      tagline: 'Card Game',
      Icon: Flame,
      pattern: 'chevron',
    },
    SPORTS: {
      bg1: '#581C87',
      bg2: '#1a0633',
      accent: '#E879F9',
      accentSoft: '#F0ABFC',
      glow: 'rgba(232,121,249,0.45)',
      wordmark: 'SPORTS',
      tagline: 'Premium Cards',
      Icon: Trophy,
      pattern: 'chevron',
    },
    FLESH_AND_BLOOD: {
      bg1: '#881337',
      bg2: '#2a050f',
      accent: '#FB7185',
      accentSoft: '#FDA4AF',
      glow: 'rgba(251,113,133,0.4)',
      wordmark: 'FLESH & BLOOD',
      tagline: 'TCG',
      Icon: Swords,
      pattern: 'star',
    },
  };
  return (
    themes[key] || {
      bg1: '#4a1d7a',
      bg2: '#140533',
      accent: '#E879F9',
      accentSoft: '#F0ABFC',
      glow: 'rgba(232,121,249,0.45)',
      wordmark: 'TCG',
      tagline: 'Trading Cards',
      Icon: Sparkles,
      pattern: 'grid',
    }
  );
}

export default function BoxesClient({ boxes, availableGames }: BoxesClientProps) {
  const t = useTranslations('boxes');
  const [selectedGame, setSelectedGame] = useState<string>('all');

  const filteredBoxes = useMemo(() => {
    if (selectedGame === 'all') return boxes;
    return boxes.filter((box) => box.games.includes(selectedGame));
  }, [boxes, selectedGame]);

  const getGameDisplayName = (game: string) => {
    const normalized = game.toUpperCase().replace(/-/g, '_');
    const gameKeys: Record<string, string> = {
      POKEMON: 'POKEMON',
      MAGIC: 'MAGIC_THE_GATHERING',
      MAGIC_THE_GATHERING: 'MAGIC_THE_GATHERING',
      YUGIOH: 'YUGIOH',
      ONEPIECE: 'ONE_PIECE',
      ONE_PIECE: 'ONE_PIECE',
      LORCANA: 'LORCANA',
      DIGIMON: 'DIGIMON',
      SPORTS: 'SPORTS',
      FLESH_AND_BLOOD: 'FLESH_AND_BLOOD',
      FLESHBLOOD: 'FLESH_AND_BLOOD',
    };
    const key = gameKeys[normalized];
    if (key) {
      try {
        return t(`games.${key}`);
      } catch {
        /* fallback */
      }
    }
    return game
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  };

  return (
    <>
      {/* Filter chips */}
      <div className="mb-8 -mx-4 px-4 overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          <FilterChip
            active={selectedGame === 'all'}
            onClick={() => setSelectedGame('all')}
            label={t('allGames')}
            count={boxes.length}
          />
          {availableGames.map((game) => {
            const theme = getGameTheme(game);
            const count = boxes.filter((b) => b.games.includes(game)).length;
            return (
              <FilterChip
                key={game}
                active={selectedGame === game}
                onClick={() => setSelectedGame(game)}
                label={getGameDisplayName(game)}
                count={count}
                accent={theme.accent}
              />
            );
          })}
        </div>
      </div>

      {/* Results count */}
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <span className="text-[#8888aa] text-sm">
          {t('showing', { count: filteredBoxes.length, total: boxes.length })}
        </span>
        {selectedGame !== 'all' && (
          <button
            onClick={() => setSelectedGame('all')}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[rgba(200,79,255,0.1)] text-[#C84FFF] text-xs font-semibold hover:bg-[rgba(200,79,255,0.2)] transition-colors"
          >
            <span>{getGameDisplayName(selectedGame)}</span>
            <span aria-hidden>✕</span>
            <span className="sr-only">{t('clearFilter')}</span>
          </button>
        )}
      </div>

      {/* Packs grid */}
      {filteredBoxes.length === 0 ? (
        <div className="rounded-2xl p-8 sm:p-12 text-center bg-[#1e1e55] border border-[rgba(255,255,255,0.15)] shadow-lg">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 mb-4 sm:mb-6 rounded-2xl bg-gradient-to-br from-[rgba(200,79,255,0.15)] to-[rgba(200,79,255,0.1)]">
            <Package className="w-8 h-8 sm:w-10 sm:h-10 text-[#C84FFF]" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 sm:mb-3">
            {t('noBoxes')}
          </h2>
          <p className="text-[#8888aa] mb-6 text-sm sm:text-base">
            {t('noBoxesFor', { game: getGameDisplayName(selectedGame) })}
          </p>
          <button
            onClick={() => setSelectedGame('all')}
            className="inline-flex items-center gap-2 px-6 py-4 bg-gradient-to-r from-[#C84FFF] to-[#E879F9] text-white font-semibold rounded-xl transition-all active:scale-95 touch-target min-h-[52px]"
          >
            <Sparkles className="w-5 h-5" />
            {t('showAllBoxes')}
          </button>
        </div>
      ) : (
        <div className="grid gap-x-6 gap-y-12 sm:gap-x-8 sm:gap-y-16 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filteredBoxes.map((box) => (
            <PackCard key={box.id} box={box} t={t} getGameDisplayName={getGameDisplayName} />
          ))}
        </div>
      )}

      {/* Info tiles */}
      <div className="mt-20 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
        <InfoTile
          icon={<Flame className="w-5 h-5" />}
          title={t('infoInstantRipTitle')}
          body={t('infoInstantRipDesc')}
        />
        <InfoTile
          icon={<Coins className="w-5 h-5" />}
          title={t('infoSellBackTitle')}
          body={t('infoSellBackDesc')}
        />
      </div>
    </>
  );
}

function FilterChip({
  active,
  onClick,
  label,
  count,
  accent,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
  accent?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all border ${
        active
          ? 'bg-white text-[#0a0a2a] border-white shadow-[0_4px_20px_rgba(255,255,255,0.2)]'
          : 'bg-[#1a1a4a] text-[#f0f0f5] border-[rgba(255,255,255,0.12)] hover:border-[rgba(255,255,255,0.3)]'
      }`}
    >
      {accent && !active && (
        <span
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: accent, boxShadow: `0 0 8px ${accent}` }}
        />
      )}
      {label}
      <span
        className={`text-[11px] px-1.5 py-0.5 rounded-full ${
          active ? 'bg-[#0a0a2a]/10 text-[#0a0a2a]' : 'bg-[#0a0a2a]/60 text-[#8888aa]'
        }`}
      >
        {count}
      </span>
    </button>
  );
}

function PackCard({
  box,
  t,
  getGameDisplayName,
}: {
  box: Box;
  t: ReturnType<typeof useTranslations<'boxes'>>;
  getGameDisplayName: (game: string) => string;
}) {
  const theme = getGameTheme(box.games?.[0]);
  const gameLabel = box.games?.[0] ? getGameDisplayName(box.games[0]) : '';

  return (
    <div className="group relative flex flex-col items-center" style={{ perspective: '1200px' }}>
      {/* Ambient glow */}
      <div
        className="absolute inset-x-0 top-0 h-[85%] pointer-events-none opacity-60 group-hover:opacity-100 transition-opacity duration-500 blur-2xl"
        style={{
          background: `radial-gradient(ellipse at 50% 40%, ${theme.glow}, transparent 70%)`,
        }}
      />

      {/* Badges */}
      <div className="absolute top-0 left-0 right-0 z-30 flex items-start justify-between gap-1 px-1">
        <div className="flex flex-col gap-1">
          {box.featured && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gradient-to-r from-amber-400 to-orange-500 text-[9px] font-black text-black uppercase tracking-wider shadow-md">
              <Sparkles className="w-3 h-3" /> {t('featured').replace(/^[⭐\s]+/, '')}
            </span>
          )}
          {box.createdByShop && (
            <span
              className="inline-flex px-2 py-0.5 rounded-md bg-[#0a0a2a]/80 backdrop-blur border border-white/10 text-[9px] font-black text-white uppercase tracking-wider"
              title={t('partnerBy', { name: box.createdByShop.name })}
            >
              {t('partnerShop').replace(/^[🏪\s]+/, '')}
            </span>
          )}
        </div>
      </div>

      <Link
        href={`/open/${box.id}`}
        aria-label={`${t('open')} ${box.name}`}
        className="relative block transition-transform duration-500 ease-out group-hover:-translate-y-3 group-hover:rotate-[-3deg]"
      >
        <BoosterPack box={box} theme={theme} />

        <div
          className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-[70%] h-4 rounded-full blur-xl opacity-60 group-hover:opacity-90 group-hover:w-[80%] transition-all duration-500 pointer-events-none"
          style={{ background: `radial-gradient(ellipse, ${theme.glow}, transparent 70%)` }}
        />
      </Link>

      {/* Info below */}
      <div className="mt-5 w-full text-center">
        <h3
          className="text-white font-extrabold text-sm sm:text-base leading-tight line-clamp-1 mb-1 group-hover:text-[#E879F9] transition-colors"
          title={box.name}
        >
          {box.name}
        </h3>
        <p className="text-[10px] text-[#8888aa] uppercase tracking-[1.5px] mb-3 font-semibold">
          {box.cardsPerPack} / {box.totalCards} · {gameLabel}
        </p>

        <Link
          href={`/open/${box.id}`}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-br from-[#C84FFF] to-[#9333EA] text-white text-xs font-black uppercase tracking-wider shadow-[0_4px_16px_rgba(200,79,255,0.3)] group-hover:shadow-[0_6px_22px_rgba(200,79,255,0.5)] group-hover:scale-105 transition-all"
        >
          <Coins className="w-3.5 h-3.5" />
          {box.price.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
          <span className="mx-1 opacity-50">·</span>
          {t('open')}
        </Link>
      </div>
    </div>
  );
}

// ============================================================
// BOOSTER PACK — real product look with game wordmark,
// foil-framed hero card window, set symbol, card count band.
// ============================================================
function BoosterPack({ box, theme }: { box: Box; theme: Theme }) {
  const { bg1, bg2, accent, accentSoft, Icon, wordmark, tagline, pattern } = theme;
  const heroImage = box.topCard?.imageUrlGatherer || box.imageUrl || null;

  return (
    <div
      className="relative w-[160px] sm:w-[180px] aspect-[5/8] rounded-[14px] overflow-hidden select-none"
      style={{
        boxShadow: `
          0 25px 50px -12px rgba(0,0,0,0.85),
          0 0 0 1px rgba(255,255,255,0.12) inset
        `,
      }}
    >
      {/* Base gradient */}
      <div
        className="absolute inset-0"
        style={{ background: `linear-gradient(170deg, ${bg1} 0%, ${bg2} 75%, #050318 100%)` }}
      />

      {/* Game-specific pattern */}
      <PackPattern pattern={pattern} accent={accent} />

      {/* Top-left radial highlight */}
      <div
        className="absolute inset-0 opacity-40 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at 25% 15%, rgba(255,255,255,0.35), transparent 55%)`,
        }}
      />

      {/* Bottom darken for legibility */}
      <div
        className="absolute inset-x-0 bottom-0 h-[40%] pointer-events-none"
        style={{ background: 'linear-gradient(0deg, rgba(0,0,0,0.7) 0%, transparent 100%)' }}
      />

      {/* Foil tear strip */}
      <div
        className="absolute top-0 inset-x-0 h-[5%] z-10"
        style={{
          background: `linear-gradient(180deg, ${accentSoft} 0%, ${accent} 60%, rgba(0,0,0,0.4) 100%)`,
        }}
      >
        <div className="absolute left-[5%] right-[5%] bottom-[15%] flex items-center justify-between">
          {Array.from({ length: 20 }).map((_, i) => (
            <span key={i} className="w-[1.5px] h-[1.5px] rounded-full bg-black/50" />
          ))}
        </div>
      </div>

      {/* Wordmark */}
      <div className="absolute inset-x-0 top-[8%] z-20 flex flex-col items-center text-center px-2">
        <div
          className="w-full text-[13px] sm:text-[14px] leading-none font-black tracking-[1px] truncate"
          style={{
            background: `linear-gradient(180deg, ${accentSoft} 0%, ${accent} 65%, ${accent}aa 100%)`,
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: `0 0 12px ${accent}55`,
            filter: `drop-shadow(0 1px 1px rgba(0,0,0,0.5))`,
          }}
        >
          {wordmark}
        </div>
        <div
          className="text-[7.5px] font-bold uppercase tracking-[2px] mt-0.5"
          style={{ color: `${accent}cc` }}
        >
          {tagline}
        </div>
      </div>

      {/* Hero card window */}
      <div
        className="absolute left-[12%] right-[12%] top-[23%] bottom-[30%] rounded-md overflow-hidden z-10"
        style={{
          background: `linear-gradient(135deg, ${bg1}, ${bg2})`,
          boxShadow: `
            0 0 0 1.5px ${accent}dd,
            0 0 0 2.5px rgba(0,0,0,0.5),
            0 0 0 3.5px ${accentSoft}66,
            0 6px 14px rgba(0,0,0,0.6),
            inset 0 0 20px ${accent}22
          `,
        }}
      >
        {heroImage ? (
          <Image
            src={heroImage}
            alt=""
            fill
            className="object-cover"
            sizes="150px"
            unoptimized
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ background: `radial-gradient(circle at 30% 30%, ${accent}44, ${bg2})` }}
          >
            <Icon className="w-10 h-10 text-white/40" />
          </div>
        )}

        {/* Glass reflection */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(160deg, rgba(255,255,255,0.3) 0%, transparent 35%, transparent 70%, rgba(0,0,0,0.25) 100%)',
          }}
        />
      </div>

      {/* Bottom band: expansion name + set symbol + card count */}
      <div className="absolute inset-x-0 bottom-0 z-20 px-2.5 pb-2.5 pt-3">
        <div
          className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-white text-center line-clamp-2 leading-[1.15] mb-1.5"
          style={{ textShadow: '0 1px 3px rgba(0,0,0,1), 0 0 8px rgba(0,0,0,0.8)' }}
        >
          {box.name}
        </div>

        <div className="flex items-center justify-between gap-1.5">
          <div
            className="relative w-6 h-6 flex items-center justify-center shrink-0"
            style={{
              background: `linear-gradient(145deg, ${accentSoft}, ${accent})`,
              clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
              boxShadow: `0 0 0 1px rgba(0,0,0,0.4), 0 2px 4px rgba(0,0,0,0.5)`,
            }}
          >
            <Icon className="w-3 h-3 text-[#0a0420] drop-shadow-sm" />
          </div>

          <div
            className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1 rounded-sm"
            style={{
              background: `${accent}`,
              boxShadow: `0 1px 0 ${accentSoft} inset, 0 -1px 0 rgba(0,0,0,0.2) inset`,
            }}
          >
            <span className="text-[9px] font-black uppercase tracking-[1.5px] text-[#0a0420]">
              {box.cardsPerPack} CARDS
            </span>
          </div>
        </div>
      </div>

      {/* Edge highlights */}
      <div className="absolute inset-0 rounded-[14px] pointer-events-none ring-1 ring-white/20" />
      <div
        className="absolute inset-y-0 left-0 w-[2px] pointer-events-none"
        style={{ background: 'linear-gradient(180deg, transparent, rgba(255,255,255,0.3), transparent)' }}
      />
      <div
        className="absolute inset-y-0 right-0 w-[2px] pointer-events-none"
        style={{ background: 'linear-gradient(180deg, transparent, rgba(0,0,0,0.4), transparent)' }}
      />

      {/* Hover shine */}
      <div
        className="absolute inset-0 pointer-events-none overflow-hidden z-30"
        aria-hidden
      >
        <div
          className="pack-shine absolute top-0 h-full w-[40%] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            background:
              'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.5) 50%, transparent 70%)',
          }}
        />
      </div>
    </div>
  );
}

function PackPattern({
  pattern,
  accent,
}: {
  pattern: Theme['pattern'];
  accent: string;
}) {
  const patterns: Record<Theme['pattern'], React.ReactNode> = {
    wave: (
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.12] pointer-events-none"
        viewBox="0 0 100 160"
        preserveAspectRatio="none"
      >
        <defs>
          <pattern id="wave-p" x="0" y="0" width="40" height="20" patternUnits="userSpaceOnUse">
            <path d="M 0 10 Q 10 0, 20 10 T 40 10" stroke={accent} strokeWidth="1" fill="none" />
          </pattern>
        </defs>
        <rect width="100" height="160" fill="url(#wave-p)" />
      </svg>
    ),
    diamond: (
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.1] pointer-events-none"
        viewBox="0 0 100 160"
        preserveAspectRatio="none"
      >
        <defs>
          <pattern id="dmd-p" x="0" y="0" width="14" height="14" patternUnits="userSpaceOnUse">
            <path d="M 7 2 L 12 7 L 7 12 L 2 7 Z" fill={accent} />
          </pattern>
        </defs>
        <rect width="100" height="160" fill="url(#dmd-p)" />
      </svg>
    ),
    star: (
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.12] pointer-events-none"
        viewBox="0 0 100 160"
        preserveAspectRatio="none"
      >
        <defs>
          <pattern id="star-p" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <path
              d="M 10 2 L 12 8 L 18 8 L 13 12 L 15 18 L 10 14 L 5 18 L 7 12 L 2 8 L 8 8 Z"
              fill={accent}
            />
          </pattern>
        </defs>
        <rect width="100" height="160" fill="url(#star-p)" />
      </svg>
    ),
    chevron: (
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.1] pointer-events-none"
        viewBox="0 0 100 160"
        preserveAspectRatio="none"
      >
        <defs>
          <pattern id="chv-p" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
            <path d="M 0 10 L 8 4 L 16 10" stroke={accent} strokeWidth="1.2" fill="none" />
          </pattern>
        </defs>
        <rect width="100" height="160" fill="url(#chv-p)" />
      </svg>
    ),
    burst: (
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.14] pointer-events-none"
        viewBox="0 0 100 160"
        preserveAspectRatio="none"
      >
        <defs>
          <radialGradient id="burst-p" cx="50%" cy="50%">
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
              fill="url(#burst-p)"
              transform={`rotate(${angle} 50 80)`}
            />
          );
        })}
      </svg>
    ),
    grid: (
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.08] pointer-events-none"
        viewBox="0 0 100 160"
        preserveAspectRatio="none"
      >
        <defs>
          <pattern id="grid-p" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M 10 0 L 0 0 0 10" stroke={accent} strokeWidth="0.5" fill="none" />
          </pattern>
        </defs>
        <rect width="100" height="160" fill="url(#grid-p)" />
      </svg>
    ),
  };
  return <>{patterns[pattern]}</>;
}

function InfoTile({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="p-5 rounded-2xl bg-[#15153d] border border-[rgba(255,255,255,0.08)]">
      <div className="w-10 h-10 rounded-xl bg-[rgba(200,79,255,0.15)] text-[#C84FFF] flex items-center justify-center mb-3">
        {icon}
      </div>
      <h4 className="text-white font-bold mb-1">{title}</h4>
      <p className="text-[#8888aa] text-sm">{body}</p>
    </div>
  );
}
