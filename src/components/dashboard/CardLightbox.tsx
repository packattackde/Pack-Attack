'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCoins } from '@/lib/format';

interface CardLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  card: {
    name: string;
    image: string | null;
    rarity: string;
    coinValue: number;
    boxId?: string;
    boxName?: string;
  };
}

const rarityGlowColors: Record<string, string> = {
  rare: '#60a5fa',
  epic: '#a78bfa',
  legendary: '#fbbf24',
};

function getRarityColor(rarity: string): string {
  return rarityGlowColors[rarity.toLowerCase()] ?? '#60a5fa';
}

export default function CardLightbox({ isOpen, onClose, card }: CardLightboxProps) {
  const glowColor = getRarityColor(card.rarity);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="relative bg-[#1a1a4a] border border-[rgba(255,255,255,0.1)] rounded-2xl p-6 max-w-sm w-full"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.2)] flex items-center justify-center text-[#8888aa] hover:text-white transition"
            >
              ✕
            </button>

            {/* Card image */}
            <div className="flex justify-center mb-5">
              <div
                className="relative w-[200px] sm:w-[260px] aspect-[63/88] rounded-xl overflow-hidden"
                style={{
                  boxShadow: `0 0 20px ${glowColor}, 0 0 40px ${glowColor}40, 0 0 60px ${glowColor}20`,
                  border: `3px solid ${glowColor}`,
                }}
              >
                {card.image ? (
                  <Image
                    src={card.image}
                    alt={card.name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-[rgba(255,255,255,0.05)] text-5xl">
                    🃏
                  </div>
                )}
              </div>
            </div>

            {/* Card info */}
            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold text-[#f0f0f5]">{card.name}</h3>

              <span
                className="inline-block text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full"
                style={{
                  color: glowColor,
                  backgroundColor: `${glowColor}20`,
                  border: `1px solid ${glowColor}50`,
                }}
              >
                {card.rarity}
              </span>

              <p className="text-[#BFFF00] font-extrabold text-3xl">
                🪙 {formatCoins(card.coinValue)}
              </p>
            </div>

            {/* CTA buttons */}
            <div className="mt-5 space-y-2.5">
              {card.boxId && (
                <Link
                  href={`/open/${card.boxId}`}
                  className="block w-full text-center px-4 py-3 font-bold rounded-xl text-sm text-black bg-[#BFFF00] hover:brightness-110 transition shadow-[0_0_12px_rgba(191,255,0,0.3)]"
                >
                  📦 Open this Box →
                </Link>
              )}
              <Link
                href="/collection"
                className="block w-full text-center px-4 py-3 font-semibold rounded-xl text-sm text-[#f0f0f5] bg-[rgba(255,255,255,0.08)] hover:bg-[rgba(255,255,255,0.12)] border border-[rgba(255,255,255,0.1)] transition"
              >
                🎴 View Collection
              </Link>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
