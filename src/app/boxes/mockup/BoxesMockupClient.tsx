'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Coins,
  Package,
  Sparkles,
  Flame,
  Star,
  Zap,
  Swords,
  Crown,
  Trophy,
  Ship,
  Wand2,
} from 'lucide-react';

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

type Theme = {
  // Pack primary colors (used for the wrapper itself)
  primary: string;
  secondary: string;
  accent: string; // foil accent (brighter)
  // Ambient glow behind the pack
  glow: string;
  bgGradient: string;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
};

// Each game's pack keeps the Pack-Attack purple DNA but shifts accent
function getGameTheme(game: string | undefined): Theme {
  const key = (game || '').toUpperCase().replace(/-/g, '_');
  const themes: Record<string, Theme> = {
    POKEMON: {
      primary: '#3a2a6a',
      secondary: '#1a1040',
      accent: '#FACC15',
      glow: 'rgba(250,204,21,0.35)',
      bgGradient: 'from-yellow-500/15 via-amber-700/5 to-transparent',
      label: 'Pokémon',
      Icon: Zap,
    },
    MAGIC_THE_GATHERING: {
      primary: '#4a2a7a',
      secondary: '#1a0e40',
      accent: '#C084FC',
      glow: 'rgba(147,51,234,0.4)',
      bgGradient: 'from-purple-700/20 via-indigo-800/10 to-transparent',
      label: 'Magic',
      Icon: Wand2,
    },
    MAGIC: {
      primary: '#4a2a7a',
      secondary: '#1a0e40',
      accent: '#C084FC',
      glow: 'rgba(147,51,234,0.4)',
      bgGradient: 'from-purple-700/20 via-indigo-800/10 to-transparent',
      label: 'Magic',
      Icon: Wand2,
    },
    YUGIOH: {
      primary: '#5a2a5a',
      secondary: '#2a0a2a',
      accent: '#FB923C',
      glow: 'rgba(249,115,22,0.4)',
      bgGradient: 'from-orange-500/15 via-amber-800/5 to-transparent',
      label: 'Yu-Gi-Oh!',
      Icon: Crown,
    },
    ONE_PIECE: {
      primary: '#6a1f3a',
      secondary: '#2a0a1a',
      accent: '#F87171',
      glow: 'rgba(220,38,38,0.45)',
      bgGradient: 'from-red-600/20 via-rose-800/10 to-transparent',
      label: 'One Piece',
      Icon: Ship,
    },
    ONEPIECE: {
      primary: '#6a1f3a',
      secondary: '#2a0a1a',
      accent: '#F87171',
      glow: 'rgba(220,38,38,0.45)',
      bgGradient: 'from-red-600/20 via-rose-800/10 to-transparent',
      label: 'One Piece',
      Icon: Ship,
    },
    LORCANA: {
      primary: '#2a3a7a',
      secondary: '#0a1440',
      accent: '#818CF8',
      glow: 'rgba(99,102,241,0.4)',
      bgGradient: 'from-indigo-500/15 via-blue-800/5 to-transparent',
      label: 'Lorcana',
      Icon: Sparkles,
    },
    DIGIMON: {
      primary: '#1f4a6a',
      secondary: '#061e35',
      accent: '#22D3EE',
      glow: 'rgba(6,182,212,0.4)',
      bgGradient: 'from-cyan-500/15 via-sky-800/5 to-transparent',
      label: 'Digimon',
      Icon: Flame,
    },
    SPORTS: {
      primary: '#5a2a7a',
      secondary: '#1f0a3a',
      accent: '#E879F9',
      glow: 'rgba(200,79,255,0.45)',
      bgGradient: 'from-fuchsia-600/20 via-purple-800/10 to-transparent',
      label: 'Sports',
      Icon: Trophy,
    },
    FLESH_AND_BLOOD: {
      primary: '#6a2a4a',
      secondary: '#2a0a1a',
      accent: '#FB7185',
      glow: 'rgba(225,29,72,0.4)',
      bgGradient: 'from-rose-600/15 via-pink-800/5 to-transparent',
      label: 'Flesh & Blood',
      Icon: Swords,
    },
  };
  return (
    themes[key] || {
      primary: '#5a2a7a',
      secondary: '#1f0a3a',
      accent: '#E879F9',
      glow: 'rgba(200,79,255,0.45)',
      bgGradient: 'from-fuchsia-600/20 via-purple-800/10 to-transparent',
      label: 'TCG',
      Icon: Sparkles,
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

      {filtered.length === 0 ? (
        <div className="rounded-2xl p-12 text-center bg-[#1e1e55] border border-[rgba(255,255,255,0.15)]">
          <Package className="w-10 h-10 text-[#C84FFF] mx-auto mb-4" />
          <p className="text-white font-semibold">No packs found for this game.</p>
        </div>
      ) : (
        <div className="grid gap-x-6 gap-y-10 sm:gap-x-8 sm:gap-y-14 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filtered.map((box) => (
            <PackCard key={box.id} box={box} />
          ))}
        </div>
      )}

      <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-4">
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

  return (
    <div className="group relative flex flex-col items-center" style={{ perspective: '1200px' }}>
      {/* Ambient glow behind the pack */}
      <div
        className="absolute inset-x-0 top-0 h-[85%] pointer-events-none opacity-60 group-hover:opacity-100 transition-opacity duration-500 blur-2xl"
        style={{
          background: `radial-gradient(ellipse at 50% 40%, ${theme.glow}, transparent 70%)`,
        }}
      />

      {/* Badges row — floats above pack */}
      <div className="absolute top-0 left-0 right-0 z-30 flex items-start justify-between gap-1 px-1">
        <div className="flex flex-col gap-1">
          {box.featured && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gradient-to-r from-amber-400 to-orange-500 text-[9px] font-black text-black uppercase tracking-wider shadow-md">
              <Sparkles className="w-3 h-3" /> Featured
            </span>
          )}
          {box.createdByShop && (
            <span className="inline-flex px-2 py-0.5 rounded-md bg-[#0a0a2a]/80 backdrop-blur border border-white/10 text-[9px] font-black text-white uppercase tracking-wider">
              Partner
            </span>
          )}
        </div>
      </div>

      {/* THE PACK LINK */}
      <Link
        href={`/open/${box.id}`}
        aria-label={`Open ${box.name}`}
        className="relative block transition-transform duration-500 ease-out group-hover:-translate-y-3 group-hover:rotate-[-3deg]"
      >
        <BoosterPack box={box} theme={theme} />

        {/* Floor shadow */}
        <div
          className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-[70%] h-4 rounded-full blur-xl opacity-60 group-hover:opacity-90 group-hover:w-[80%] transition-all duration-500 pointer-events-none"
          style={{ background: `radial-gradient(ellipse, ${theme.glow}, transparent 70%)` }}
        />
      </Link>

      {/* Info below the pack (like packs.com) */}
      <div className="mt-5 w-full text-center">
        <h3
          className="text-white font-extrabold text-sm sm:text-base leading-tight line-clamp-1 mb-1 group-hover:text-[#E879F9] transition-colors"
          title={box.name}
        >
          {box.name}
        </h3>
        <p className="text-[10px] text-[#8888aa] uppercase tracking-[1.5px] mb-3 font-semibold">
          {box.cardsPerPack} cards · {theme.label}
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
          Rip
        </Link>
      </div>
    </div>
  );
}

// ------------------------------------------------------------
// THE REAL BOOSTER PACK — packs.com style
// The pack IS the product image (full-bleed, no filters).
// Thin foil overlays only at top (tear strip) and bottom (label).
// Hover adds a subtle white shine sweep — NOT a rainbow filter.
// ------------------------------------------------------------
function BoosterPack({ box, theme }: { box: Box; theme: Theme }) {
  const { primary, accent, Icon } = theme;
  const hasImage = Boolean(box.imageUrl);

  return (
    <div
      className="relative w-[150px] sm:w-[170px] aspect-[5/8] rounded-[14px] overflow-hidden select-none bg-black"
      style={{
        boxShadow: `
          0 25px 50px -12px rgba(0,0,0,0.85),
          0 0 0 1px rgba(255,255,255,0.08) inset
        `,
      }}
    >
      {/* ── PACK BODY = the actual product image, full bleed ── */}
      {hasImage ? (
        <Image
          src={box.imageUrl}
          alt={box.name}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 150px, 170px"
          unoptimized
          priority={false}
        />
      ) : (
        <FallbackPackBody theme={theme} name={box.name} Icon={Icon} />
      )}

      {/* ── TOP TEAR STRIP: thin foil band, only occupies top ~9% ── */}
      <div
        className="absolute top-0 inset-x-0 h-[9%] z-10"
        style={{
          background: `linear-gradient(180deg,
            ${accent} 0%,
            ${accent} 82%,
            rgba(0,0,0,0.35) 92%,
            transparent 100%
          )`,
        }}
      >
        {/* Shine along tear strip */}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(180deg,
              rgba(255,255,255,0.45) 0%,
              rgba(255,255,255,0.15) 40%,
              transparent 75%
            )`,
          }}
        />
        {/* Perforation line */}
        <div className="absolute left-[4%] right-[4%] bottom-[12%] flex items-center justify-between">
          {Array.from({ length: 22 }).map((_, i) => (
            <div
              key={i}
              className="w-[1.5px] h-[1.5px] rounded-full bg-black/55"
            />
          ))}
        </div>
      </div>

      {/* ── PACK-ATTACK EMBLEM: floating game icon in top-right corner ── */}
      <div
        className="absolute top-[11%] right-2 z-20 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center"
        style={{
          background: `radial-gradient(circle at 30% 30%, ${accent}, ${primary})`,
          boxShadow: `
            0 0 10px ${accent}aa,
            0 0 0 2px rgba(0,0,0,0.5),
            0 0 0 3px ${accent}66,
            inset 0 -2px 3px rgba(0,0,0,0.4),
            inset 0 2px 3px rgba(255,255,255,0.5)
          `,
        }}
      >
        <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white drop-shadow-md" />
      </div>

      {/* ── BOTTOM FOIL LABEL: gradient fade with name + card count ── */}
      <div
        className="absolute inset-x-0 bottom-0 h-[38%] z-10 flex flex-col justify-end px-3 pb-3"
        style={{
          background: `linear-gradient(180deg,
            transparent 0%,
            rgba(0,0,0,0.0) 30%,
            rgba(0,0,0,0.65) 60%,
            rgba(0,0,0,0.9) 100%
          )`,
        }}
      >
        <div
          className="text-[8px] font-black uppercase tracking-[2.5px] mb-1"
          style={{ color: accent, textShadow: `0 0 8px ${accent}88, 0 1px 0 rgba(0,0,0,0.6)` }}
        >
          {theme.label} · Booster
        </div>
        <div
          className="text-[11px] sm:text-[12px] font-black uppercase tracking-wide text-white line-clamp-2 leading-tight mb-1"
          style={{ textShadow: '0 1px 2px rgba(0,0,0,0.95)' }}
        >
          {box.name}
        </div>
        <div className="flex items-center gap-1.5 text-[8px] font-black uppercase tracking-[1.5px] text-white/75">
          <span
            className="inline-flex items-center px-1.5 py-[1px] rounded-sm"
            style={{ background: `${accent}cc`, color: '#0a0520' }}
          >
            {box.cardsPerPack}× cards
          </span>
        </div>
      </div>

      {/* ── EDGE HIGHLIGHTS for realism (physical pack lighting) ── */}
      <div className="absolute inset-0 rounded-[14px] pointer-events-none ring-1 ring-white/15" />
      <div
        className="absolute inset-y-0 left-0 w-[2px] pointer-events-none"
        style={{
          background: 'linear-gradient(180deg, transparent, rgba(255,255,255,0.25), transparent)',
        }}
      />
      <div
        className="absolute inset-y-0 right-0 w-[2px] pointer-events-none"
        style={{
          background: 'linear-gradient(180deg, transparent, rgba(0,0,0,0.35), transparent)',
        }}
      />

      {/* ── HOVER SHINE: single white sweep, no rainbow ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-20" aria-hidden>
        <div
          className="pack-shine absolute top-0 h-full w-[40%] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            background:
              'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.45) 50%, transparent 70%)',
          }}
        />
      </div>
    </div>
  );
}

// Fallback pack body when box has no imageUrl — purple Pack-Attack gradient
function FallbackPackBody({
  theme,
  name,
  Icon,
}: {
  theme: Theme;
  name: string;
  Icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center px-3 text-center"
      style={{
        background: `
          radial-gradient(ellipse at 30% 25%, ${theme.primary} 0%, ${theme.secondary} 75%),
          linear-gradient(165deg, ${theme.primary} 0%, #0f0a2e 70%, #0a0520 100%)
        `,
      }}
    >
      <div
        className="w-14 h-14 rounded-full flex items-center justify-center mb-3 mt-[-10%]"
        style={{
          background: `radial-gradient(circle at 30% 30%, ${theme.accent}, ${theme.primary})`,
          boxShadow: `0 0 24px ${theme.glow}, 0 0 0 3px rgba(0,0,0,0.3), inset 0 -3px 5px rgba(0,0,0,0.4), inset 0 3px 5px rgba(255,255,255,0.3)`,
        }}
      >
        <Icon className="w-7 h-7 text-white drop-shadow-md" />
      </div>
      <div
        className="text-[10px] font-black uppercase tracking-[2.5px] mb-1"
        style={{ color: theme.accent, textShadow: `0 0 8px ${theme.glow}` }}
      >
        {theme.label}
      </div>
      <div
        className="text-[13px] font-black uppercase tracking-wider text-white line-clamp-3 leading-tight"
        style={{ textShadow: '0 1px 2px rgba(0,0,0,0.9)' }}
      >
        {name}
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
