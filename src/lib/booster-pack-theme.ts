import {
  Crown,
  Flame,
  Ship,
  Sparkles,
  Swords,
  Trophy,
  Wand2,
  Zap,
  type LucideIcon,
} from 'lucide-react';

export const PACK_BG_1 = '#2A1458';
export const PACK_BG_2 = '#0A0A2A';

/** Classic sealed booster — crimped top & bottom (viewBox 0 0 210 370) */
export const BOOSTER_VIEWBOX = { w: 210, h: 370 } as const;

export const BOOSTER_PATH = `
  M 6,24 L 10,18 L 16,24 L 22,18 L 28,24 L 34,18 L 40,24 L 46,18 L 52,24 L 58,18
  L 64,24 L 70,18 L 76,24 L 82,18 L 88,24 L 94,18 L 100,24 L 106,18 L 112,24 L 118,18
  L 124,24 L 130,18 L 136,24 L 142,18 L 148,24 L 154,18 L 160,24 L 166,18 L 172,24
  L 178,18 L 184,24 L 190,18 L 196,24 L 202,18 L 206,24
  L 206,346
  L 202,352 L 196,346 L 190,352 L 184,346 L 178,352 L 172,346 L 166,352 L 160,346
  L 154,352 L 148,346 L 142,352 L 136,346 L 130,352 L 124,346 L 118,352 L 112,346
  L 106,352 L 100,346 L 94,352 L 88,346 L 82,352 L 76,346 L 70,352 L 64,346
  L 58,352 L 52,346 L 46,352 L 40,346 L 34,352 L 28,346 L 22,352 L 16,346
  L 10,352 L 6,346 L 4,346 Z
`.trim();

/** Top flap path (for tear-off animation) */
export const BOOSTER_TOP_FLAP_PATH = `
  M 6,24 L 10,18 L 16,24 L 22,18 L 28,24 L 34,18 L 40,24 L 46,18 L 52,24 L 58,18
  L 64,24 L 70,18 L 76,24 L 82,18 L 88,24 L 94,18 L 100,24 L 106,18 L 112,24 L 118,18
  L 124,24 L 130,18 L 136,24 L 142,18 L 148,24 L 154,18 L 160,24 L 166,18 L 172,24
  L 178,18 L 184,24 L 190,18 L 196,24 L 202,18 L 206,24
  L 206,88 L 4,88 Z
`.trim();

export function boosterClipId(suffix: string) {
  return `booster-clip-${suffix}`;
}

export type BoosterPackPattern = 'diamond' | 'wave' | 'star' | 'chevron' | 'burst' | 'grid';

export type BoosterPackTheme = {
  accent: string;
  accentSoft: string;
  glow: string;
  wordmark: string;
  tagline: string;
  Icon: LucideIcon;
  pattern: BoosterPackPattern;
};

export function getBoosterPackTheme(game: string | undefined): BoosterPackTheme {
  const key = (game || '').toUpperCase().replace(/-/g, '_');
  const themes: Record<string, BoosterPackTheme> = {
    POKEMON: {
      accent: '#FFD600',
      accentSoft: '#FFE94D',
      glow: 'rgba(255,214,0,0.45)',
      wordmark: 'POKÉMON',
      tagline: 'Trading Card Game',
      Icon: Zap,
      pattern: 'burst',
    },
    MAGIC_THE_GATHERING: {
      accent: '#E0B84C',
      accentSoft: '#FFD77A',
      glow: 'rgba(224,184,76,0.45)',
      wordmark: 'MAGIC',
      tagline: 'The Gathering',
      Icon: Wand2,
      pattern: 'diamond',
    },
    MAGIC: {
      accent: '#E0B84C',
      accentSoft: '#FFD77A',
      glow: 'rgba(224,184,76,0.45)',
      wordmark: 'MAGIC',
      tagline: 'The Gathering',
      Icon: Wand2,
      pattern: 'diamond',
    },
    YUGIOH: {
      accent: '#F5A524',
      accentSoft: '#FFC66A',
      glow: 'rgba(245,165,36,0.45)',
      wordmark: 'YU-GI-OH!',
      tagline: 'Trading Card Game',
      Icon: Crown,
      pattern: 'star',
    },
    ONE_PIECE: {
      accent: '#FF5A5F',
      accentSoft: '#FF8A8F',
      glow: 'rgba(255,90,95,0.45)',
      wordmark: 'ONE PIECE',
      tagline: 'Card Game',
      Icon: Ship,
      pattern: 'wave',
    },
    ONEPIECE: {
      accent: '#FF5A5F',
      accentSoft: '#FF8A8F',
      glow: 'rgba(255,90,95,0.45)',
      wordmark: 'ONE PIECE',
      tagline: 'Card Game',
      Icon: Ship,
      pattern: 'wave',
    },
    LORCANA: {
      accent: '#A78BFA',
      accentSoft: '#C4B5FD',
      glow: 'rgba(167,139,250,0.45)',
      wordmark: 'LORCANA',
      tagline: 'Disney TCG',
      Icon: Sparkles,
      pattern: 'diamond',
    },
    DIGIMON: {
      accent: '#22D3EE',
      accentSoft: '#67E8F9',
      glow: 'rgba(34,211,238,0.45)',
      wordmark: 'DIGIMON',
      tagline: 'Card Game',
      Icon: Flame,
      pattern: 'chevron',
    },
    SPORTS: {
      accent: '#E879F9',
      accentSoft: '#F0ABFC',
      glow: 'rgba(232,121,249,0.5)',
      wordmark: 'SPORTS',
      tagline: 'Premium Cards',
      Icon: Trophy,
      pattern: 'chevron',
    },
    FLESH_AND_BLOOD: {
      accent: '#FB7185',
      accentSoft: '#FDA4AF',
      glow: 'rgba(251,113,133,0.45)',
      wordmark: 'FLESH & BLOOD',
      tagline: 'TCG',
      Icon: Swords,
      pattern: 'star',
    },
  };

  return (
    themes[key] ?? {
      accent: '#ff2ea6',
      accentSoft: '#ff6ec4',
      glow: 'rgba(255,46,166,0.5)',
      wordmark: 'PULLFORGE',
      tagline: 'Neon District',
      Icon: Sparkles,
      pattern: 'grid',
    }
  );
}
