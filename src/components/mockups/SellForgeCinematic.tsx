'use client';

/**
 * MOCKUP: Neon forge smashes card → gold coins (PullForge / Neon District).
 * Not pack opening. Wire only after approval.
 */

import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useState } from 'react';

type Card = { name: string; rarity: string; image: string | null; coinValue: number };

type Phase = 'idle' | 'charge' | 'smash' | 'burst' | 'mint' | 'settle';

const PHASE_MS: Record<Phase, number> = {
  idle: 900,
  charge: 1100,
  smash: 380,
  burst: 520,
  mint: 1200,
  settle: 1400,
};

const ORDER: Phase[] = ['idle', 'charge', 'smash', 'burst', 'mint', 'settle'];

function rarityStyle(rarity: string) {
  const r = rarity.toLowerCase();
  if (r.includes('secret') || r.includes('legendary') || r.includes('mythic'))
    return { accent: '#ff9e2c', glow: 'rgba(255,158,44,0.65)', border: 'border-amber-400/80' };
  if (r.includes('rare') || r.includes('holo') || r.includes('epic'))
    return { accent: '#e8b34b', glow: 'rgba(232,179,75,0.55)', border: 'border-amber-500/70' };
  return { accent: '#23e6ff', glow: 'rgba(35,230,255,0.55)', border: 'border-cyan-400/70' };
}

const SPARK_COUNT = 56;
const COIN_COUNT = 22;

export function SellForgeCinematic({ card }: { card: Card }) {
  const reduce = useReducedMotion();
  const [phase, setPhase] = useState<Phase>('idle');
  const [runId, setRunId] = useState(0);
  const [playing, setPlaying] = useState(!reduce);
  const style = useMemo(() => rarityStyle(card.rarity), [card.rarity]);

  const replay = useCallback(() => {
    setRunId((n) => n + 1);
    setPhase('idle');
    setPlaying(true);
  }, []);

  useEffect(() => {
    if (!playing || reduce) return;
    let idx = 0;
    let timer: ReturnType<typeof setTimeout>;
    const step = () => {
      setPhase(ORDER[idx]);
      timer = setTimeout(() => {
        idx += 1;
        if (idx >= ORDER.length) {
          idx = 0;
          setRunId((n) => n + 1);
        }
        step();
      }, PHASE_MS[ORDER[idx]]);
    };
    step();
    return () => clearTimeout(timer);
  }, [playing, reduce, runId]);

  const charging = phase === 'charge';
  const smashing = phase === 'smash';
  const bursting = phase === 'burst';
  const minting = phase === 'mint' || phase === 'settle';
  const showCard = phase !== 'burst' && phase !== 'mint' && phase !== 'settle';
  const jawMeet = smashing || bursting || minting;

  const sparks = useMemo(
    () =>
      Array.from({ length: SPARK_COUNT }, (_, i) => ({
        id: i,
        a: (i / SPARK_COUNT) * Math.PI * 2,
        dist: 55 + (i % 9) * 14,
        size: 2 + (i % 4),
        hue: i % 3,
      })),
    [runId],
  );

  return (
    <div className="relative w-full max-w-4xl mx-auto">
      <div
        className="relative overflow-hidden rounded-2xl border border-[rgba(139,92,246,0.45)]"
        style={{
          background:
            'radial-gradient(ellipse 90% 70% at 50% 30%, rgba(255,46,166,0.16), transparent 60%), radial-gradient(ellipse 50% 40% at 80% 100%, rgba(35,230,255,0.1), transparent), linear-gradient(180deg, #0f0d22 0%, #06061a 100%)',
          clipPath: 'polygon(0 16px, 16px 0, 100% 0, 100% calc(100% - 16px), calc(100% - 16px) 100%, 0 100%)',
        }}
      >
        {/* Corner brackets */}
        {['top-2 left-2 border-r-0 border-b-0', 'top-2 right-2 border-l-0 border-b-0', 'bottom-2 left-2 border-r-0 border-t-0', 'bottom-2 right-2 border-l-0 border-t-0'].map((c, i) => (
          <i key={i} className={`absolute w-5 h-5 border-2 border-[#23e6ff] z-20 opacity-70 pointer-events-none ${c}`} />
        ))}

        {/* Perspective floor */}
        <div
          className="absolute inset-x-0 bottom-0 h-[42%] pointer-events-none opacity-35"
          style={{
            backgroundImage:
              'linear-gradient(90deg, rgba(35,230,255,0.14) 1px, transparent 1px), linear-gradient(0deg, rgba(255,46,166,0.16) 1px, transparent 1px)',
            backgroundSize: '32px 22px',
            transform: 'perspective(480px) rotateX(62deg)',
            transformOrigin: '50% 100%',
            maskImage: 'linear-gradient(180deg, transparent, black 40%)',
          }}
        />

        <div className="relative z-10 px-4 pt-8 pb-10 sm:px-8 sm:pt-10 sm:pb-12 min-h-[420px] sm:min-h-[480px] flex flex-col items-center">
          <p className="font-jp text-[#ff2ea6] text-[10px] sm:text-xs tracking-[0.35em] mb-1">ネオン鍛冶 · MOCKUP</p>
          <h2 className="font-orbitron text-lg sm:text-xl tracking-[0.2em] text-[#eeecf7] drop-shadow-[0_0_20px_rgba(255,46,166,0.45)]">
            FORGE → GOLD
          </h2>
          <p className="text-[#8888aa] text-xs mt-2 mb-6 tracking-wide">{phaseLabel(phase)}</p>

          <motion.div
            className="relative w-full max-w-[340px] flex-1 flex items-center justify-center"
            animate={smashing ? { x: [0, -6, 5, -3, 0] } : { x: 0 }}
            transition={{ duration: 0.35 }}
          >
            {/* Forge chamber */}
            <div className="relative w-[min(100%,300px)] h-[360px] sm:h-[380px]">
              {/* Fire glow */}
              <motion.div
                className="absolute left-1/2 bottom-[18%] -translate-x-1/2 w-[90%] h-24 rounded-full pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(255,46,166,0.55), rgba(139,92,246,0.2) 55%, transparent 72%)', filter: 'blur(18px)' }}
                animate={{ opacity: charging ? 0.85 : jawMeet ? 1 : 0.35, scale: charging ? [1, 1.12, 1] : 1 }}
                transition={{ duration: charging ? 1.1 : 0.3, repeat: charging ? Infinity : 0 }}
              />

              {/* Chamber frame */}
              <div
                className="absolute inset-x-3 top-8 bottom-6 rounded-xl border-2 border-[rgba(255,46,166,0.35)]"
                style={{
                  background: 'linear-gradient(180deg, rgba(22,18,44,0.95), rgba(6,6,26,0.98))',
                  boxShadow: 'inset 0 0 40px rgba(255,46,166,0.12), 0 0 50px rgba(139,92,246,0.15)',
                }}
              >
                <div className="absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-[#23e6ff] to-transparent opacity-60" />
                <div className="absolute inset-x-4 bottom-0 h-px bg-gradient-to-r from-transparent via-[#ff2ea6] to-transparent opacity-60" />
              </div>

              {/* Top forge jaw */}
              <motion.div
                className="absolute left-0 right-0 z-30 px-3"
                style={{ top: 32 }}
                animate={{
                  y: jawMeet ? 118 : 0,
                }}
                transition={smashing ? { type: 'spring', stiffness: 1400, damping: 24 } : { type: 'spring', stiffness: 200, damping: 20 }}
              >
                <div
                  className="h-14 rounded-lg border border-[#ff2ea6]/60 flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(180deg, #4a2068, #ff2ea6 70%, #8b1048)',
                    boxShadow: '0 8px 32px rgba(255,46,166,0.55), inset 0 2px 0 rgba(255,255,255,0.2)',
                  }}
                >
                  <span className="font-orbitron text-[10px] font-black tracking-[0.35em] text-[#14041f]">FORGE JAW</span>
                </div>
                <div className="h-2 mx-6 bg-gradient-to-r from-[#8b5cf6] via-[#ff2ea6] to-[#23e6ff] opacity-80" />
              </motion.div>

              {/* Bottom forge jaw */}
              <motion.div
                className="absolute left-0 right-0 z-30 px-3"
                style={{ bottom: 24 }}
                animate={{
                  y: jawMeet ? -118 : 0,
                }}
                transition={smashing ? { type: 'spring', stiffness: 1400, damping: 24 } : { type: 'spring', stiffness: 200, damping: 20 }}
              >
                <div className="h-2 mx-6 bg-gradient-to-r from-[#23e6ff] via-[#8b5cf6] to-[#ff2ea6] opacity-80" />
                <div
                  className="h-14 rounded-lg border border-[#23e6ff]/50 flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(0deg, #1a2848, #0e1628 50%, #23e6ff33)',
                    boxShadow: '0 -6px 28px rgba(35,230,255,0.35), inset 0 -2px 0 rgba(255,255,255,0.1)',
                  }}
                >
                  <span className="font-orbitron text-[9px] font-bold tracking-[0.3em] text-[#23e6ff]">MINT OUT</span>
                </div>
              </motion.div>

              {/* Card */}
              <AnimatePresence mode="wait">
                {showCard && (
                  <motion.div
                    key={`card-${runId}`}
                    className="absolute left-1/2 top-1/2 z-20 w-[130px] sm:w-[148px] aspect-[63/88] -translate-x-1/2 -translate-y-1/2"
                    initial={{ y: -40, opacity: 0, scale: 0.85 }}
                    animate={
                      smashing
                        ? { scale: 0.72, opacity: 0.15, filter: 'brightness(2.2) saturate(1.5)' }
                        : { y: 0, opacity: 1, scale: charging ? 1.03 : 1, filter: 'brightness(1) saturate(1)' }
                    }
                    exit={{ scale: 0.2, opacity: 0, filter: 'blur(8px)' }}
                    transition={{ duration: smashing ? 0.18 : 0.4 }}
                  >
                    <HoloTradeCard card={card} accent={style.accent} glow={style.glow} border={style.border} />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Impact burst */}
              <AnimatePresence>
                {(bursting || minting) && (
                  <motion.div key={`burst-${runId}`} className="absolute inset-0 z-40 pointer-events-none flex items-center justify-center">
                    {sparks.map((s) => {
                      const col = s.hue === 0 ? '#ff2ea6' : s.hue === 1 ? '#23e6ff' : '#fbbf24';
                      return (
                        <motion.span
                          key={s.id}
                          className="absolute rounded-full"
                          style={{ width: s.size, height: s.size, background: col, boxShadow: `0 0 12px ${col}` }}
                          initial={{ x: 0, y: 0, opacity: 1 }}
                          animate={{ x: Math.cos(s.a) * s.dist, y: Math.sin(s.a) * s.dist * 0.85, opacity: 0 }}
                          transition={{ duration: 0.55, ease: 'easeOut' }}
                        />
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Screen flash */}
              <AnimatePresence>
                {smashing && (
                  <motion.div
                    className="absolute inset-0 z-50 pointer-events-none rounded-xl"
                    style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.35), rgba(255,46,166,0.25) 40%, transparent 70%)' }}
                    initial={{ opacity: 1 }}
                    animate={{ opacity: 0 }}
                    transition={{ duration: 0.45 }}
                  />
                )}
              </AnimatePresence>

              {/* Gold coins */}
              <AnimatePresence>
                {minting && (
                  <div className="absolute left-1/2 bottom-[22%] z-50 -translate-x-1/2 flex flex-wrap justify-center gap-1 w-[220px]">
                    {Array.from({ length: COIN_COUNT }).map((_, i) => (
                      <motion.div
                        key={`${runId}-coin-${i}`}
                        className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-amber-800 flex items-center justify-center font-orbitron text-[9px] font-black text-amber-950"
                        style={{
                          background: 'linear-gradient(145deg, #fde68a, #fbbf24 55%, #d97706)',
                          boxShadow: '0 0 16px rgba(251,191,36,0.55)',
                        }}
                        initial={{ y: -120 - i * 3, opacity: 0, rotate: i % 2 ? 180 : -180 }}
                        animate={{ y: 0, opacity: 1, rotate: 0 }}
                        transition={{ delay: i * 0.03, type: 'spring', stiffness: 380, damping: 14 }}
                      >
                        ₵
                      </motion.div>
                    ))}
                  </div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Credit line */}
          <motion.div
            className="mt-4 font-orbitron text-2xl sm:text-3xl font-black text-amber-400 drop-shadow-[0_0_20px_rgba(251,191,36,0.55)]"
            animate={phase === 'settle' ? { scale: [1, 1.05, 1] } : { opacity: minting ? 1 : 0.4 }}
          >
            +{card.coinValue.toLocaleString()} COINS
          </motion.div>

          <button
            type="button"
            onClick={replay}
            className="mt-6 font-orbitron text-xs tracking-[0.25em] uppercase text-[#23e6ff] border border-[#23e6ff]/50 px-5 py-2.5 hover:bg-[#23e6ff]/10 transition-colors"
          >
            Replay forge
          </button>
        </div>
      </div>
      <p className="text-center text-[#666] text-xs mt-3 font-mono">{card.name}</p>
    </div>
  );
}

function HoloTradeCard({
  card,
  accent,
  glow,
  border,
}: {
  card: Card;
  accent: string;
  glow: string;
  border: string;
}) {
  return (
    <div
      className={`relative w-full h-full rounded-xl p-[3px] ${border}`}
      style={{
        background: 'linear-gradient(160deg, #17132c, #0b0919)',
        boxShadow: `0 0 28px ${glow}`,
      }}
    >
      <div
        className="absolute inset-0 rounded-xl pointer-events-none"
        style={{
          background: 'linear-gradient(115deg, transparent 32%, rgba(255,255,255,0.2) 48%, transparent 60%)',
          backgroundSize: '260% 100%',
          animation: 'landingSheen 4.5s linear infinite',
        }}
      />
      <div className="relative w-full h-full rounded-[9px] overflow-hidden bg-[#0e0b20] border border-white/[0.08]">
        {card.image ? (
          <img src={card.image} alt="" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-3xl font-black" style={{ color: accent }}>
            {card.rarity[0]?.toUpperCase()}
          </div>
        )}
      </div>
    </div>
  );
}

function phaseLabel(phase: Phase) {
  switch (phase) {
    case 'idle':
      return 'Card enters forge';
    case 'charge':
      return 'Neon furnace charging';
    case 'smash':
      return 'Jaws smash';
    case 'burst':
      return 'Card shatters';
    case 'mint':
      return 'Gold coins minted';
    case 'settle':
      return 'Balance credited';
  }
}