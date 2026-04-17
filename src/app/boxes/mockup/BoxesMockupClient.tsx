'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Coins, Package, Sparkles, Flame, Star } from 'lucide-react';

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

interface Props {
  boxes: Box[];
  availableGames: string[];
}

// Theme per game — background gradient the pack floats on
function getGameTheme(game: string | undefined): {
  bg: string;
  glow: string;
  accent: string;
  label: string;
} {
  const key = (game || '').toUpperCase().replace(/-/g, '_');
  const themes: Record<string, { bg: string; glow: string; accent: string; label: string }> = {
    POKEMON: {
      bg: 'from-yellow-500/25 via-amber-600/10 to-transparent',
      glow: 'rgba(250,204,21,0.35)',
      accent: '#FACC15',
      label: 'Pokémon',
    },
    MAGIC_THE_GATHERING: {
      bg: 'from-purple-600/30 via-indigo-700/15 to-transparent',
      glow: 'rgba(147,51,234,0.35)',
      accent: '#9333EA',
      label: 'Magic',
    },
    MAGIC: {
      bg: 'from-purple-600/30 via-indigo-700/15 to-transparent',
      glow: 'rgba(147,51,234,0.35)',
      accent: '#9333EA',
      label: 'Magic',
    },
    YUGIOH: {
      bg: 'from-orange-500/30 via-amber-700/15 to-transparent',
      glow: 'rgba(249,115,22,0.35)',
      accent: '#F97316',
      label: 'Yu-Gi-Oh!',
    },
    ONE_PIECE: {
      bg: 'from-red-600/30 via-rose-700/15 to-transparent',
      glow: 'rgba(220,38,38,0.4)',
      accent: '#DC2626',
      label: 'One Piece',
    },
    ONEPIECE: {
      bg: 'from-red-600/30 via-rose-700/15 to-transparent',
      glow: 'rgba(220,38,38,0.4)',
      accent: '#DC2626',
      label: 'One Piece',
    },
    LORCANA: {
      bg: 'from-indigo-500/30 via-blue-700/15 to-transparent',
      glow: 'rgba(99,102,241,0.35)',
      accent: '#6366F1',
      label: 'Lorcana',
    },
    DIGIMON: {
      bg: 'from-cyan-500/30 via-sky-700/15 to-transparent',
      glow: 'rgba(6,182,212,0.35)',
      accent: '#06B6D4',
      label: 'Digimon',
    },
    SPORTS: {
      bg: 'from-fuchsia-600/25 via-purple-700/15 to-transparent',
      glow: 'rgba(200,79,255,0.35)',
      accent: '#C84FFF',
      label: 'Sports',
    },
    FLESH_AND_BLOOD: {
      bg: 'from-rose-600/30 via-pink-700/15 to-transparent',
      glow: 'rgba(225,29,72,0.35)',
      accent: '#E11D48',
      label: 'Flesh & Blood',
    },
  };
  return (
    themes[key] || {
      bg: 'from-fuchsia-600/25 via-purple-700/15 to-transparent',
      glow: 'rgba(200,79,255,0.35)',
      accent: '#C84FFF',
      label: 'TCG',
    }
  );
}

export default function BoxesMockupClient({ boxes, availableGames }: Props) {
  const [selectedGame, setSelectedGame] = useState<string>('all');

  const filtered = useMemo(() => {
    if (selectedGame === 'all') return boxes;
    return boxes.filter((b) => b.games.includes(selectedGame));
  }, [boxes, selectedGame]);

  return (
    <>
      {/* Game filter chips (horizontal scroll, packs.com style) */}
      <div className="mb-10 -mx-4 px-4 overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          <FilterChip
            active={selectedGame === 'all'}
            onClick={() => setSelectedGame('all')}
            label="All Packs"
            count={boxes.length}
          />
          {availableGames.map((g) => {
            const theme = getGameTheme(g);
            const count = boxes.filter((b) => b.games.includes(g)).length;
            return (
              <FilterChip
                key={g}
                active={selectedGame === g}
                onClick={() => setSelectedGame(g)}
                label={theme.label}
                count={count}
                accent={theme.accent}
              />
            );
          })}
        </div>
      </div>

      {/* Packs grid */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl p-12 text-center bg-[#1e1e55] border border-[rgba(255,255,255,0.15)]">
          <Package className="w-10 h-10 text-[#C84FFF] mx-auto mb-4" />
          <p className="text-white font-semibold">No packs found for this game.</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:gap-8 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filtered.map((box) => (
            <PackCard key={box.id} box={box} />
          ))}
        </div>
      )}

      {/* Footer explainer */}
      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-4">
        <InfoTile
          icon={<Flame className="w-5 h-5" />}
          title="Instant rip"
          body="Open packs instantly with a full reveal animation."
        />
        <InfoTile
          icon={<Coins className="w-5 h-5" />}
          title="Sell back anytime"
          body="Trade your hits back for coins — or ship the originals."
        />
        <InfoTile
          icon={<Star className="w-5 h-5" />}
          title="Verified pulls"
          body="Every card is real, authenticated, and vaulted for you."
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

function PackCard({ box }: { box: Box }) {
  const theme = getGameTheme(box.games?.[0]);
  const hasImage = Boolean(box.imageUrl);

  return (
    <Link
      href={`/open/${box.id}`}
      className="group relative block rounded-3xl overflow-hidden transition-all duration-500 bg-[#15153d] border border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.25)] hover:-translate-y-2 hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.6)]"
      style={{ perspective: '1000px' }}
    >
      {/* Themed glow background */}
      <div
        className={`absolute inset-0 bg-gradient-to-b ${theme.bg} opacity-80 group-hover:opacity-100 transition-opacity duration-500`}
      />
      <div
        className="absolute inset-x-0 top-0 h-2/3 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: `radial-gradient(ellipse at 50% 30%, ${theme.glow}, transparent 70%)`,
        }}
      />

      {/* Top badges row */}
      <div className="absolute top-3 left-3 right-3 z-20 flex items-start justify-between gap-2">
        <div className="flex flex-col gap-1.5">
          {box.featured && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gradient-to-r from-amber-400 to-orange-500 text-[10px] font-bold text-black uppercase tracking-wider shadow-md">
              <Sparkles className="w-3 h-3" /> Featured
            </span>
          )}
          {box.createdByShop && (
            <span className="inline-flex px-2 py-0.5 rounded-md bg-[#0a0a2a]/70 backdrop-blur border border-white/10 text-[10px] font-bold text-white uppercase tracking-wider">
              Partner
            </span>
          )}
        </div>
        <span
          className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider backdrop-blur"
          style={{
            backgroundColor: `${theme.accent}22`,
            color: theme.accent,
            border: `1px solid ${theme.accent}55`,
          }}
        >
          {theme.label}
        </span>
      </div>

      {/* THE PACK — vertical booster wrapper */}
      <div className="relative h-[280px] sm:h-[320px] flex items-center justify-center pt-8 pb-4 px-4">
        {/* Floor shadow */}
        <div
          className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[55%] h-3 rounded-full blur-lg opacity-70 group-hover:opacity-100 group-hover:w-[65%] transition-all duration-500"
          style={{ backgroundColor: theme.glow }}
        />

        <div
          className="relative transition-all duration-500 ease-out group-hover:-translate-y-3 group-hover:rotate-[2deg]"
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* The pack itself */}
          <div
            className="relative w-[140px] sm:w-[160px] aspect-[2/3] rounded-xl overflow-hidden shadow-[0_20px_40px_-10px_rgba(0,0,0,0.7)] group-hover:shadow-[0_30px_60px_-10px_rgba(0,0,0,0.8)] transition-shadow duration-500"
            style={{
              background: `linear-gradient(145deg, #2a2a6a, #0f0f2e)`,
            }}
          >
            {hasImage ? (
              <Image
                src={box.imageUrl}
                alt={box.name}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 140px, 160px"
                unoptimized
              />
            ) : (
              // Fallback artwork: stylized pack with game accent
              <FallbackPackArt theme={theme} name={box.name} />
            )}

            {/* Holographic shine overlay on hover */}
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
              style={{
                background: `linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.25) 50%, transparent 70%)`,
                mixBlendMode: 'overlay',
              }}
            />

            {/* Edge highlight */}
            <div className="absolute inset-0 rounded-xl ring-1 ring-white/10 pointer-events-none" />
            <div
              className="absolute inset-x-0 top-0 h-[18%] pointer-events-none"
              style={{
                background:
                  'linear-gradient(to bottom, rgba(255,255,255,0.18), transparent)',
              }}
            />
          </div>

          {/* Tiny top "card peek" out of the pack on hover */}
          {box.topCard?.imageUrlGatherer && (
            <div
              className="absolute -top-6 left-1/2 -translate-x-1/2 w-[58%] aspect-[5/7] rounded-md overflow-hidden border border-white/20 shadow-xl opacity-0 group-hover:opacity-100 group-hover:-translate-y-5 transition-all duration-700 ease-out pointer-events-none"
              style={{ zIndex: -1 }}
            >
              <Image
                src={box.topCard.imageUrlGatherer}
                alt={box.topCard.name}
                fill
                className="object-cover"
                sizes="100px"
                unoptimized
              />
            </div>
          )}
        </div>
      </div>

      {/* Info strip */}
      <div className="relative z-10 px-4 pt-3 pb-4 bg-gradient-to-b from-transparent to-[#0a0a2a]/80">
        <h3 className="text-white font-bold text-sm sm:text-base line-clamp-1 mb-0.5">
          {box.name}
        </h3>
        <p className="text-[11px] text-[#8888aa] mb-3">
          {box.cardsPerPack} cards · pool of {box.totalCards}
        </p>

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#0a0a2a]/70 border border-white/10">
            <Coins className="w-3.5 h-3.5" style={{ color: theme.accent }} />
            <span
              className="text-sm font-extrabold"
              style={{ color: theme.accent }}
            >
              {box.price.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
          <span
            className="inline-flex items-center px-3 py-1.5 rounded-lg text-[11px] font-extrabold uppercase tracking-wider text-white transition-all group-hover:scale-105"
            style={{
              backgroundColor: theme.accent,
              boxShadow: `0 4px 20px -4px ${theme.glow}`,
            }}
          >
            Rip
          </span>
        </div>
      </div>
    </Link>
  );
}

function FallbackPackArt({
  theme,
  name,
}: {
  theme: { accent: string; glow: string; label: string };
  name: string;
}) {
  return (
    <div
      className="relative w-full h-full flex flex-col items-center justify-center text-center p-3"
      style={{
        background: `linear-gradient(160deg, ${theme.accent}, #0a0a2a 75%)`,
      }}
    >
      <div className="absolute inset-0 opacity-20 bg-grid" />
      <div
        className="absolute inset-x-0 top-0 h-1/3"
        style={{
          background: `radial-gradient(ellipse at center top, ${theme.glow}, transparent 70%)`,
        }}
      />
      <Package className="w-8 h-8 text-white/70 mb-2 relative" />
      <div className="relative">
        <div className="text-[9px] uppercase tracking-[2px] text-white/60 mb-1">
          Booster Pack
        </div>
        <div className="text-[11px] font-bold text-white line-clamp-3 leading-tight">
          {name}
        </div>
      </div>
      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-center">
        <span className="text-[9px] font-bold uppercase tracking-[3px] text-white/80">
          {theme.label}
        </span>
      </div>
    </div>
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
      <div className="w-10 h-10 rounded-xl bg-[rgba(200,79,255,0.15)] text-[#C84FFF] flex items-center justify-center mb-3">
        {icon}
      </div>
      <h4 className="text-white font-bold mb-1">{title}</h4>
      <p className="text-[#8888aa] text-sm">{body}</p>
    </div>
  );
}
