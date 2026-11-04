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

export const NEON_FORGE_CLIP =
  'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)';

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
