'use client';

import { useEffect, useState } from 'react';

export type BreakdownMeta = {
  baseParticipation: number;
  outcome: string;
  outcomeBasePoints: number;
  streakMultiplier: number;
  streakBonusPoints: number;
  outcomeTotalPoints: number;
  cardRarityBonusPoints: number;
  amazingHitBonusPoints: number;
  subtotalBeforeVolume: number;
  volumeMultiplier: number;
  battlesThisWeekUsed: number;
  totalPoints: number;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  outcomeLabel: 'win' | 'loss' | 'draw';
  breakdown: BreakdownMeta | null;
  rank: number | null;
};

function CountUp({ value, durationMs = 800 }: { value: number; durationMs?: number }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    const start = performance.now();
    let raf: number;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / durationMs);
      setN(Math.round(value * p));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, durationMs]);
  return <>{n}</>;
}

export function BattlePointsBreakdownDialog({
  open,
  onOpenChange,
  outcomeLabel,
  breakdown,
  rank,
}: Props) {
  if (!open || !breakdown) return null;

  const volExtra = breakdown.totalPoints - breakdown.subtotalBeforeVolume;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-md rounded-2xl bg-[#1a1a4a] border border-[rgba(255,255,255,0.12)] shadow-2xl p-6 text-white">
        <button
          type="button"
          className="absolute top-3 right-3 text-[#8888aa] hover:text-white text-sm"
          onClick={() => onOpenChange(false)}
        >
          Schließen
        </button>
        <h2 className="text-center text-xl font-bold mb-4">
          {outcomeLabel === 'win' && 'Battle abgeschlossen — Sieg!'}
          {outcomeLabel === 'loss' && 'Battle abgeschlossen'}
          {outcomeLabel === 'draw' && 'Battle abgeschlossen — Unentschieden'}
        </h2>
        <div className="space-y-2 text-sm font-mono">
          <div className="flex justify-between text-[#8888aa]">
            <span>Grundteilnahme</span>
            <span className="text-emerald-400">+{breakdown.baseParticipation}</span>
          </div>
          <div className="flex justify-between text-[#8888aa]">
            <span>Ergebnis ({breakdown.outcome})</span>
            <span className="text-emerald-400">+{breakdown.outcomeBasePoints}</span>
          </div>
          {breakdown.streakBonusPoints > 0 && (
            <div className="flex justify-between text-[#8888aa]">
              <span>Streak ×{breakdown.streakMultiplier}</span>
              <span className="text-amber-300">+{breakdown.streakBonusPoints}</span>
            </div>
          )}
          {breakdown.cardRarityBonusPoints > 0 && (
            <div className="flex justify-between text-[#8888aa]">
              <span>Karten-Bonus (Seltenheit)</span>
              <span className="text-emerald-400">+{breakdown.cardRarityBonusPoints}</span>
            </div>
          )}
          {breakdown.amazingHitBonusPoints > 0 && (
            <div className="flex justify-between text-[#8888aa]">
              <span>Amazing Hit (Wert)</span>
              <span className="text-emerald-400">+{breakdown.amazingHitBonusPoints}</span>
            </div>
          )}
          <div className="border-t border-[rgba(255,255,255,0.08)] pt-2 flex justify-between">
            <span>Zwischensumme</span>
            <span>{breakdown.subtotalBeforeVolume}</span>
          </div>
          {breakdown.volumeMultiplier > 1 && (
            <div className="flex justify-between text-[#8888aa]">
              <span>Wochen-Volumen (×{breakdown.volumeMultiplier})</span>
              <span className="text-violet-300">+{volExtra}</span>
            </div>
          )}
          <div className="border-t border-[rgba(255,255,255,0.12)] pt-3 flex justify-between text-lg font-bold">
            <span>Gesamt</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-orange-400">
              +<CountUp value={breakdown.totalPoints} />
            </span>
          </div>
          {rank != null && (
            <p className="text-center text-xs text-[#8888aa] pt-2">
              Neuer Rang: #{rank}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
