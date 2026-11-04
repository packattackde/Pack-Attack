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
import { NeonForgeBoosterPack } from '@/components/NeonForgeBoosterPack';
import { getBoosterPackTheme, type BoosterPackTheme } from '@/lib/booster-pack-theme';

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
            const theme = getBoosterPackTheme(game);
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
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[rgba(255,46,166,0.1)] text-[#ff2ea6] text-xs font-semibold hover:bg-[rgba(255,46,166,0.2)] transition-colors"
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
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 mb-4 sm:mb-6 rounded-2xl bg-gradient-to-br from-[rgba(255,46,166,0.15)] to-[rgba(255,46,166,0.1)]">
            <Package className="w-8 h-8 sm:w-10 sm:h-10 text-[#ff2ea6]" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 sm:mb-3">
            {t('noBoxes')}
          </h2>
          <p className="text-[#8888aa] mb-6 text-sm sm:text-base">
            {t('noBoxesFor', { game: getGameDisplayName(selectedGame) })}
          </p>
          <button
            onClick={() => setSelectedGame('all')}
            className="inline-flex items-center gap-2 px-6 py-4 bg-gradient-to-r from-[#ff2ea6] to-[#E879F9] text-white font-semibold rounded-xl transition-all active:scale-95 touch-target min-h-[52px]"
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
          ? 'bg-white text-[#05040c] border-white shadow-[0_4px_20px_rgba(255,255,255,0.2)]'
          : 'bg-[#100d22] text-[#f0f0f5] border-[rgba(255,255,255,0.12)] hover:border-[rgba(255,255,255,0.3)]'
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
          active ? 'bg-[#05040c]/10 text-[#05040c]' : 'bg-[#05040c]/60 text-[#8888aa]'
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
  const theme = getBoosterPackTheme(box.games?.[0]);
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
              className="inline-flex px-2 py-0.5 rounded-md bg-[#05040c]/80 backdrop-blur border border-white/10 text-[9px] font-black text-white uppercase tracking-wider"
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
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-br from-[#ff2ea6] to-[#8b5cf6] text-white text-xs font-black uppercase tracking-wider shadow-[0_4px_16px_rgba(255,46,166,0.3)] group-hover:shadow-[0_6px_22px_rgba(255,46,166,0.5)] group-hover:scale-105 transition-all"
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

function BoosterPack({ box, theme }: { box: Box; theme: BoosterPackTheme }) {
  const heroImage = box.topCard?.imageUrlGatherer || box.imageUrl || null;
  return (
    <NeonForgeBoosterPack
      boxName={box.name}
      cardsPerPack={box.cardsPerPack}
      heroImageUrl={heroImage}
      theme={theme}
      variant="catalog"
      idSuffix={box.id}
    />
  );
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
      <div className="w-10 h-10 rounded-xl bg-[rgba(255,46,166,0.15)] text-[#ff2ea6] flex items-center justify-center mb-3">
        {icon}
      </div>
      <h4 className="text-white font-bold mb-1">{title}</h4>
      <p className="text-[#8888aa] text-sm">{body}</p>
    </div>
  );
}
