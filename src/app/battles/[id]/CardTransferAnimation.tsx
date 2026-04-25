'use client';

import { useEffect, useState } from 'react';
import { Crown, Trophy, ArrowRight, Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';

function getRarityGlow(rarity: string | null): string {
  if (!rarity) return 'rgba(255,255,255,0.15)';
  const r = rarity.toLowerCase();
  if (r.includes('legend') || r.includes('mythic') || r.includes('secret') || r.includes('hyper'))
    return 'rgba(251,191,36,0.6)';
  if (r.includes('epic') || r.includes('ultra')) return 'rgba(168,85,247,0.5)';
  if (r.includes('rare') || r.includes('holo')) return 'rgba(59,130,246,0.45)';
  if (r.includes('uncommon')) return 'rgba(200,79,255,0.4)';
  return 'rgba(255,255,255,0.15)';
}

type Participant = {
  id: string;
  userId: string;
  totalValue: number;
  user: { id: string; name: string | null; email: string; isBot?: boolean };
};

type TransferredPull = {
  id: string;
  roundNumber: number;
  coinValue: number;
  itemName: string | null;
  itemImage: string | null;
  itemRarity: string | null;
  transferredToUserId: string | null;
  participantId: string;
  participant: { id: string; userId: string };
};

interface Props {
  transferredPulls: TransferredPull[];
  participants: Participant[];
  winnerId: string;
  currentUserId: string | null;
  /**
   * When true, the component renders without its own card border / background,
   * so it can be embedded inside another surface (like the winner banner).
   */
  embedded?: boolean;
}

/**
 * Visual representation of cards being transferred from loser(s) to winner.
 *
 * Animation sequence on mount:
 *   0ms    — cards appear at loser side, slight tilt
 *   250ms  — cards begin flying, one per ~180ms stagger
 *   ~2s    — all cards settle into winner's pile
 *   after  — idle glow pulse on winner pile
 */
export function CardTransferAnimation({
  transferredPulls,
  participants,
  winnerId,
  currentUserId,
  embedded = false,
}: Props) {
  const t = useTranslations('battles.detail');
  const [flown, setFlown] = useState(false);

  useEffect(() => {
    // Respect reduced motion: skip straight to landed state
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      setFlown(true);
      return;
    }
    // Small delay so the initial "at loser" state is painted before transitioning
    const id = window.setTimeout(() => setFlown(true), 280);
    return () => window.clearTimeout(id);
  }, []);

  if (!transferredPulls?.length) return null;

  const winner = participants.find((p) => p.userId === winnerId);
  const losers = participants.filter((p) => p.userId !== winnerId);
  const isCurrentWinner = winnerId === currentUserId;

  // Total coin value transferred — for the big summary number
  const totalValue = transferredPulls.reduce((sum, p) => sum + p.coinValue, 0);

  // Embedded variant: still has its own distinct bg + glowing purple border
  // so it clearly stands out inside the winner banner (not a blending blob).
  const outerClass = embedded
    ? 'relative overflow-hidden rounded-xl border-2 border-[#C84FFF]/40 bg-gradient-to-b from-[#1a0e3a] to-[#0a0520] shadow-[0_8px_32px_rgba(200,79,255,0.25),0_0_0_1px_rgba(200,79,255,0.15)_inset] mb-4 mt-2'
    : 'relative overflow-hidden rounded-2xl border border-[rgba(255,255,255,0.08)] bg-gradient-to-b from-[#12123a] to-[#0e0e2a] mb-6';

  return (
    <div className={outerClass} aria-label={t('transferAnimationAriaLabel')}>
      {/* Ambient glow layers (lighter when embedded, parent already has gradient) */}
      <div
        className={`absolute inset-0 pointer-events-none ${embedded ? 'opacity-40' : 'opacity-60'}`}
        style={{
          background:
            'radial-gradient(ellipse at 85% 50%, rgba(200,79,255,0.18), transparent 55%), radial-gradient(ellipse at 15% 50%, rgba(239,68,68,0.08), transparent 55%)',
        }}
      />

      {/* Header */}
      <div className={`relative ${embedded ? 'px-3 pt-3 pb-2' : 'px-5 pt-5 pb-3'} flex items-center justify-between gap-3 flex-wrap`}>
        <div>
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#C84FFF]" />
            {isCurrentWinner ? t('lootCapturedByYou') : t('lootCaptured')}
          </h2>
          <p className="text-xs text-[#8888aa] mt-0.5">
            {t('cardsMovedCount', {
              count: transferredPulls.length,
              value: totalValue.toFixed(2),
            })}
          </p>
        </div>
        {/* Running counter badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-400/10 border border-amber-400/30">
          <Trophy className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-sm font-bold text-amber-400 tabular-nums">
            +{totalValue.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Animation canvas */}
      <div className={`relative ${embedded ? 'h-[180px] sm:h-[200px]' : 'h-[240px] sm:h-[260px]'} px-4`}>
        {/* Left column: losers */}
        <div className="absolute left-4 top-0 bottom-0 w-[26%] flex flex-col justify-center gap-3 z-10">
          {losers.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#1a1a4a]/70 border border-red-500/20 backdrop-blur-sm"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-red-500/60 to-red-700/60 flex items-center justify-center text-white text-xs font-bold shrink-0">
                {p.user.name?.[0]?.toUpperCase() || '?'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-white truncate">
                  {p.user.name || p.user.email}
                </div>
                <div className="text-[10px] text-red-400/80 uppercase tracking-wider font-medium">
                  {t('loserShort')}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Middle arrow / path */}
        <div className="absolute left-[32%] right-[32%] top-1/2 -translate-y-1/2 flex items-center pointer-events-none z-0">
          <div className="flex-1 h-px bg-gradient-to-r from-red-500/40 via-[#C84FFF]/50 to-amber-400/60" />
          <ArrowRight className="w-5 h-5 text-[#C84FFF] mx-1 drop-shadow-[0_0_8px_rgba(200,79,255,0.6)]" />
          <div className="flex-1 h-px bg-gradient-to-r from-[#C84FFF]/50 via-amber-400/60 to-amber-400/80" />
        </div>

        {/* Right column: winner */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 w-[30%] z-10">
          <div
            className={`relative rounded-xl p-3 border bg-gradient-to-br from-[#C84FFF]/20 to-[#9333EA]/10 border-[#C84FFF]/40 ${
              flown ? 'winner-landing-pulse' : ''
            }`}
          >
            {/* Crown + avatar */}
            <div className="flex items-center gap-2 mb-1">
              <div className="relative shrink-0">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-500 flex items-center justify-center shadow-[0_0_18px_rgba(251,191,36,0.4)]">
                  <Trophy className="w-4 h-4 text-black" />
                </div>
                <Crown className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 text-[#C84FFF] drop-shadow-[0_0_6px_rgba(200,79,255,0.8)]" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-white truncate">
                  {winner?.user.name || winner?.user.email || '—'}
                </div>
                <div className="text-[10px] text-[#C84FFF] uppercase tracking-wider font-medium">
                  {t('winnerShort')}
                </div>
              </div>
            </div>
            {/* Landing pile placeholder (cards land here visually) */}
            <div className={`${embedded ? 'h-[90px]' : 'h-[120px]'} relative rounded-md bg-black/20 border border-dashed border-[#C84FFF]/20`} />
          </div>
        </div>

        {/* The flying cards — absolutely positioned on top of everything */}
        {transferredPulls.map((pull, i) => {
          // Stagger + slight vertical spread so cards don't overlap in-flight
          const stackOffsetX = i * 4; // px — card pile stagger when landed
          const stackOffsetY = i * 3;
          const initialRotate = -6 + (i % 3) * 2;
          const landedRotate = 4 + (i % 3) * 2;
          const glow = getRarityGlow(pull.itemRarity);

          return (
            <div
              key={pull.id}
              className="transfer-card absolute"
              style={{
                // Left column: cards start at loser side (left: ~10%)
                // Right column: cards end at winner side (right: ~14%)
                left: flown ? 'auto' : '10%',
                right: flown ? `calc(14% + ${stackOffsetX}px)` : 'auto',
                top: `calc(50% - 44px + ${flown ? stackOffsetY : 0}px)`,
                width: 56,
                height: 80,
                transform: `rotate(${flown ? landedRotate : initialRotate}deg) scale(${flown ? 0.85 : 1})`,
                transition:
                  'left 800ms cubic-bezier(0.25, 0.8, 0.3, 1), right 800ms cubic-bezier(0.25, 0.8, 0.3, 1), transform 800ms cubic-bezier(0.25, 0.8, 0.3, 1), filter 800ms ease-out',
                transitionDelay: `${i * 180}ms`,
                zIndex: 20 + i,
                filter: flown
                  ? `drop-shadow(0 6px 12px rgba(0,0,0,0.5)) drop-shadow(0 0 8px ${glow})`
                  : `drop-shadow(0 3px 6px rgba(0,0,0,0.35))`,
              }}
              aria-hidden
            >
              <div
                className="relative w-full h-full rounded-md overflow-hidden border"
                style={{
                  borderColor: glow,
                  boxShadow: flown ? `0 0 0 1px ${glow}, 0 0 14px ${glow}` : undefined,
                  background: '#1a1a4a',
                }}
              >
                {pull.itemImage ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={pull.itemImage}
                    alt={pull.itemName || ''}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#333355] text-lg">
                    ?
                  </div>
                )}
                {/* Value chip bottom-right */}
                <div className="absolute bottom-0.5 right-0.5 px-1 rounded bg-black/80 border border-amber-400/40 text-[8px] font-bold text-amber-400 tabular-nums leading-tight py-[1px]">
                  {pull.coinValue.toFixed(2)}
                </div>
                {/* Motion trail while flying */}
                {!flown && (
                  <div
                    className="absolute inset-0 pointer-events-none opacity-60 motion-trail"
                    style={{
                      background: `linear-gradient(115deg, transparent 40%, ${glow} 55%, transparent 70%)`,
                    }}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Caption showing what arrived at winner — list of card names */}
      <div className={`relative ${embedded ? 'px-3 pb-3 pt-1' : 'px-5 pb-5 pt-2'}`}>
        <div className="flex flex-wrap gap-1.5 justify-center">
          {transferredPulls.map((pull, i) => (
            <span
              key={pull.id}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#0e0e2a] border border-[rgba(255,255,255,0.06)] text-[10px] text-[#c8c8d8] transfer-badge-fade`}
              style={{ animationDelay: `${i * 180 + 700}ms` }}
              title={pull.itemName || ''}
            >
              <span
                className="inline-block w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: getRarityGlow(pull.itemRarity) }}
              />
              <span className="truncate max-w-[150px]">{pull.itemName || '?'}</span>
              <span className="text-amber-400 font-bold tabular-nums">
                {pull.coinValue.toFixed(2)}
              </span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
