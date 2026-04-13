'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Coins, Package, ChevronRight, ChevronDown, Filter, Sparkles, Layers } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface Card {
  id: string;
  name: string;
  imageUrlGatherer: string | null;
  coinValue: number;
}

interface Box {
  id: string;
  name: string;
  price: number;
  cardsPerPack: number;
  featured: boolean;
  games: string[];
  cards: Card[];
  _count: {
    cards: number;
  };
  createdByShop?: {
    id: string;
    name: string;
  } | null;
}

interface BoxesClientProps {
  boxes: Box[];
  availableGames: string[];
}

export default function BoxesClient({ boxes, availableGames }: BoxesClientProps) {
  const t = useTranslations('boxes');
  const [selectedGame, setSelectedGame] = useState<string>('all');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const filteredBoxes = useMemo(() => {
    if (selectedGame === 'all') return boxes;
    return boxes.filter(box => box.games.includes(selectedGame));
  }, [boxes, selectedGame]);

  const getGameDisplayName = (game: string) => {
    const normalized = game.toUpperCase().replace(/-/g, '_');
    const gameKeys: Record<string, string> = {
      'POKEMON': 'POKEMON',
      'MAGIC': 'MAGIC_THE_GATHERING',
      'MAGIC_THE_GATHERING': 'MAGIC_THE_GATHERING',
      'YUGIOH': 'YUGIOH',
      'ONEPIECE': 'ONE_PIECE',
      'ONE_PIECE': 'ONE_PIECE',
      'LORCANA': 'LORCANA',
      'DIGIMON': 'DIGIMON',
      'SPORTS': 'SPORTS',
      'FLESH_AND_BLOOD': 'FLESH_AND_BLOOD',
      'FLESHBLOOD': 'FLESH_AND_BLOOD',
    };
    const key = gameKeys[normalized];
    if (key) {
      try { return t(`games.${key}`); } catch { /* fallback */ }
    }
    return game.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
  };

  return (
    <>
      {/* Filter Bar */}
      <div className="mb-12 flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-4">
        <div className="relative w-full sm:w-auto">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-3 px-5 py-4 rounded-2xl text-white font-semibold transition-all w-full sm:min-w-[240px] bg-[#1a1a4a] border border-[rgba(255,255,255,0.12)] hover:border-[rgba(200,79,255,0.3)] shadow-lg touch-target min-h-[52px]"
            aria-label={t('filterByGame')}
            aria-expanded={isDropdownOpen}
            aria-controls="game-filter-dropdown"
          >
            <Filter className="w-4 h-4 sm:w-5 sm:h-5 text-[#C84FFF] shrink-0" />
            <span className="flex-1 text-left text-sm sm:text-base">
              {selectedGame === 'all' ? t('allGames') : getGameDisplayName(selectedGame)}
            </span>
            <ChevronDown className={`w-4 h-4 text-[#8888aa] transition-transform shrink-0 ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <>
              {/* Backdrop */}
              <div 
                className="fixed inset-0 z-40 bg-black/40" 
                onClick={() => setIsDropdownOpen(false)} 
                onTouchEnd={() => setIsDropdownOpen(false)}
              />
              
              {/* Dropdown with premium styling */}
              <div
                id="game-filter-dropdown"
                className="absolute top-full left-0 mt-3 w-full min-w-[280px] rounded-2xl overflow-hidden z-50 border border-[rgba(255,255,255,0.15)] shadow-2xl bg-[#1e1e55]"
                role="listbox"
                aria-label={t('gameFilterOptions')}
              >
                <div className="max-h-[420px] overflow-y-auto py-2 overscroll-contain"
                     style={{
                       scrollbarWidth: 'thin',
                       scrollbarColor: 'rgba(200, 79, 255, 0.3) rgba(0, 0, 0, 0.2)',
                       WebkitOverflowScrolling: 'touch',
                     }}
                >
                  {/* All Games option */}
                  <button
                    onClick={() => {
                      setSelectedGame('all');
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full px-4 py-4 text-left flex items-center gap-3 transition-all duration-200 border-l-4 touch-target min-h-[56px] ${
                      selectedGame === 'all'
                        ? 'bg-[rgba(200,79,255,0.1)] text-[#C84FFF] border-[#C84FFF]'
                        : 'text-[#f0f0f5] active:bg-[#12123a]/50 border-transparent active:border-[rgba(200,79,255,0.3)]'
                    }`}
                    role="option"
                    aria-selected={selectedGame === 'all'}
                  >
                    <Package className="w-4 h-4 shrink-0" />
                    <span className="font-semibold">{t('allGames')}</span>
                    <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-[#12123a] text-[#8888aa] font-medium shrink-0">{boxes.length}</span>
                  </button>

                  {/* Divider */}
                  <div className="my-2 mx-3 h-px bg-gradient-to-r from-transparent via-[rgba(255,255,255,0.06)] to-transparent" />

                  {/* Game options */}
                  {availableGames.map(game => {
                    const gameBoxCount = boxes.filter(b => b.games.includes(game)).length;
                    return (
                      <button
                        key={game}
                        onClick={() => {
                          setSelectedGame(game);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full px-4 py-4 text-left flex items-center gap-3 transition-all duration-200 border-l-4 touch-target min-h-[56px] ${
                          selectedGame === game
                            ? 'bg-[rgba(200,79,255,0.1)] text-[#C84FFF] border-[#C84FFF]'
                            : 'text-[#f0f0f5] active:bg-[#12123a]/50 border-transparent active:border-[rgba(200,79,255,0.3)]'
                        }`}
                        role="option"
                        aria-selected={selectedGame === game}
                      >
                        <span 
                          className={`w-2.5 h-2.5 rounded-full ${getGameBadgeColor(game)} shrink-0`} 
                          style={{ boxShadow: `0 0 8px currentColor` }}
                        />
                        <span className="font-semibold">{getGameDisplayName(game)}</span>
                        <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-[#12123a] text-[#8888aa] font-medium shrink-0">{gameBoxCount}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Active filter pill */}
        {selectedGame !== 'all' && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-[rgba(200,79,255,0.1)] text-[#C84FFF] text-sm min-h-[40px] w-full sm:w-auto">
            <span className="flex-1 sm:flex-initial">{getGameDisplayName(selectedGame)}</span>
            <button 
              onClick={() => setSelectedGame('all')}
              className="ml-1 active:text-white transition-colors p-1 min-w-[32px] min-h-[32px] flex items-center justify-center"
              aria-label={t('clearFilter')}
            >
              ✕
            </button>
          </div>
        )}

        {/* Results count */}
        <span className="text-[#8888aa] text-sm sm:ml-auto order-first sm:order-none w-full sm:w-auto text-center sm:text-left py-2 sm:py-0">
          {t('showing', { count: filteredBoxes.length, total: boxes.length })}
        </span>
      </div>

      {/* Boxes Grid */}
      {filteredBoxes.length === 0 ? (
        <div className="rounded-2xl p-8 sm:p-12 text-center bg-[#1e1e55] border border-[rgba(255,255,255,0.15)] shadow-lg">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 mb-4 sm:mb-6 rounded-2xl bg-gradient-to-br from-[rgba(200,79,255,0.15)] to-[rgba(200,79,255,0.1)]">
            <Package className="w-8 h-8 sm:w-10 sm:h-10 text-[#C84FFF]" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 sm:mb-3">{t('noBoxes')}</h2>
          <p className="text-[#8888aa] mb-6 text-sm sm:text-base">{t('noBoxesFor', { game: getGameDisplayName(selectedGame) })}</p>
          <button 
            onClick={() => setSelectedGame('all')}
            className="inline-flex items-center gap-2 px-6 py-4 bg-gradient-to-r from-[#C84FFF] to-[#E879F9] text-white font-semibold rounded-xl transition-all active:scale-95 touch-target min-h-[52px]"
          >
            <Sparkles className="w-5 h-5" />
            {t('showAllBoxes')}
          </button>
        </div>
      ) : (
        <>
          {/* Section Label */}
          <div className="flex items-center gap-3 mb-6">
            <span className="text-[11px] font-semibold uppercase tracking-[1.5px] text-[#C84FFF] whitespace-nowrap">{t('availablePacks')}</span>
            <div className="flex-1 h-px bg-gradient-to-r from-[rgba(200,79,255,0.2)] to-transparent" />
          </div>

          <div className="grid gap-6 sm:gap-7 lg:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {filteredBoxes.map((box) => (
            <Link
              key={box.id}
              href={`/open/${box.id}`}
              className="group relative rounded-2xl overflow-hidden transition-all duration-300 active:scale-[0.97] sm:hover:-translate-y-2 sm:hover:shadow-[0_20px_50px_rgba(0,0,0,0.4),0_0_30px_rgba(200,79,255,0.08)] bg-[#1e1e55] border border-[rgba(255,255,255,0.15)] hover:border-[rgba(200,79,255,0.35)] shadow-[0_4px_24px_rgba(0,0,0,0.3)]"
            >
              {/* Card Preview Section */}
              <div className="relative h-[220px] bg-[#252560] flex items-end justify-center pb-4 overflow-hidden">
                {/* Background glow effect */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#1e1e55]/80 via-transparent to-transparent" />
                
                {/* Fanned Cards Display */}
                {box.cards && box.cards.length > 0 ? (
                  <div className="relative h-44 w-full flex items-center justify-center">
                    {box.cards.slice(0, 3).map((card, index) => {
                      // Fan-out positions: [left, center, right]
                      const fanDefault = [
                        'rotate(-12deg) translateX(-18px)',
                        'rotate(0deg) translateX(0px) translateY(-6px)',
                        'rotate(12deg) translateX(18px)',
                      ];
                      // Hover: cards fan out flat, side by side
                      const fanHover = [
                        'rotate(0deg) translateX(-75px) translateY(-8px) scale(1.05)',
                        'rotate(0deg) translateX(0px) translateY(-8px) scale(1.05)',
                        'rotate(0deg) translateX(75px) translateY(-8px) scale(1.05)',
                      ];
                      const zIndexes = [1, 3, 2];
                      return (
                        <div
                          key={card.id}
                          className="absolute transition-all duration-[600ms] ease-[cubic-bezier(0.23,1,0.32,1)] fan-card"
                          style={{
                            transform: fanDefault[index],
                            zIndex: zIndexes[index],
                            // @ts-ignore - CSS custom property for hover state
                            '--fan-hover': fanHover[index],
                          } as React.CSSProperties}
                        >
                          <div 
                            className="relative w-[95px] h-[132px] rounded-lg overflow-hidden border-2 border-[rgba(255,255,255,0.15)] shadow-2xl group-hover:border-[rgba(200,79,255,0.4)] transition-all duration-500 bg-[#1e1e55]"
                          >
                            {card.imageUrlGatherer ? (
                              <Image
                                src={card.imageUrlGatherer}
                                alt={card.name}
                                fill
                                className="object-cover"
                                sizes="95px"
                                unoptimized
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-[#12123a]">
                                <span className="text-[8px] text-gray-500">?</span>
                              </div>
                            )}
                            {/* Value badge on top card */}
                            {index === 1 && (
                              <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-md bg-black/85 border border-[rgba(200,79,255,0.3)] flex items-center gap-1">
                                <Coins className="w-2.5 h-2.5 text-[#C84FFF]" />
                                <span className="text-[9px] font-bold text-[#C84FFF]">{card.coinValue.toFixed(2)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full gap-2">
                    <Package className="w-12 h-12 text-[#7777a0]/50" />
                    <span className="text-xs text-[#7777a0]/50 font-medium">{t('noPreview')}</span>
                  </div>
                )}

                {/* Badges */}
                {box.featured && (
                  <div className="absolute top-3 left-3 px-3 py-1 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-[11px] font-bold text-white z-10 shadow-md">
                    {t('featured')}
                  </div>
                )}
                {box.createdByShop && (
                  <div className="absolute top-3 left-3 px-3 py-1 rounded-lg bg-gradient-to-r from-[#9333EA] to-[#7c3aed] text-[11px] font-bold text-white z-10 shadow-md" title={t('partnerBy', { name: box.createdByShop.name })}>
                    {t('partnerShop')}
                  </div>
                )}
                {box.games && box.games[0] && (
                  <div className={`absolute top-3 right-3 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider z-10 ${getGameBadgeStyle(box.games[0])}`}>
                    {getGameDisplayName(box.games[0])}
                  </div>
                )}
              </div>

              {/* Box Info */}
              <div className="px-6 pt-5 pb-6 bg-[#151540]">
                <h3 className="text-[17px] font-bold text-white mb-1.5 group-hover:text-[#C84FFF] transition-colors line-clamp-1">
                  {box.name}
                </h3>
                <p className="text-[13px] text-[#7777a0] mb-5">{t('cardsPerPack', { cards: box.cardsPerPack, total: box._count.cards })}</p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex items-center justify-center w-7 h-7 rounded-full bg-[rgba(200,79,255,0.15)] border border-[rgba(200,79,255,0.3)]">
                      <Coins className="w-4 h-4 text-[#C84FFF]" />
                    </div>
                    <span className="text-2xl font-extrabold text-[#C84FFF]">{box.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#C84FFF] text-white text-sm font-bold rounded-xl shadow-[0_2px_12px_rgba(200,79,255,0.2)] group-hover:shadow-[0_4px_24px_rgba(200,79,255,0.35)] group-hover:scale-105 transition-all">
                    {t('open')} <ChevronRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
        </>
      )}
    </>
  );
}

function getGameBadgeStyle(game: string): string {
  const normalized = game.toLowerCase().replace(/-/g, '_');
  const styles: Record<string, string> = {
    pokemon: 'bg-yellow-500 text-black',
    magic: 'bg-purple-600 text-white',
    magic_the_gathering: 'bg-purple-600 text-white',
    yugioh: 'bg-orange-500 text-black',
    onepiece: 'bg-red-600 text-white',
    one_piece: 'bg-red-600 text-white',
    lorcana: 'bg-indigo-500 text-white',
    digimon: 'bg-cyan-500 text-black',
    sports: 'bg-[#9333EA] text-white',
    flesh_and_blood: 'bg-rose-600 text-white',
    fleshblood: 'bg-rose-600 text-white',
  };
  return styles[normalized] || 'bg-gray-600 text-white';
}

function getGameBadgeColor(game: string): string {
  const normalized = game.toLowerCase().replace(/-/g, '_');
  const colors: Record<string, string> = {
    pokemon: 'bg-yellow-400',
    magic: 'bg-purple-500',
    magic_the_gathering: 'bg-purple-500',
    yugioh: 'bg-orange-500',
    onepiece: 'bg-red-500',
    one_piece: 'bg-red-500',
    lorcana: 'bg-blue-500',
    digimon: 'bg-cyan-400',
    sports: 'bg-[#C84FFF]',
    flesh_and_blood: 'bg-rose-500',
    fleshblood: 'bg-rose-500',
  };
  return colors[normalized] || 'bg-gray-400';
}

