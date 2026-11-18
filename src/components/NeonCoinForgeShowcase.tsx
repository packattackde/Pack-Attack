'use client';

import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';

export type ForgeShowcaseCard = {
  name: string;
  rarity: string;
  image: string | null;
  coinValue: number;
};

type Phase = 'float' | 'charge' | 'forge' | 'burst' | 'mint' | 'hold';

const PHASE_MS: Record<Phase, number> = {
  float: 1400,
  charge: 1200,
  forge: 420,
  burst: 650,
  mint: 1100,
  hold: 1600,
};

const ORDER: Phase[] = ['float', 'charge', 'forge', 'burst', 'mint', 'hold'];

function rarityAccent(rarity: string) {
  const r = rarity.toLowerCase();
  if (r.includes('mythic') || r.includes('legendary') || r.includes('secret') || r.includes('ultra')) {
    return { accent: '#ff9e2c', glow: 'rgba(255,158,44,0.55)' };
  }
  if (r.includes('rare') || r.includes('foil') || r.includes('holo') || r.includes('epic')) {
    return { accent: '#e8b34b', glow: 'rgba(232,179,75,0.5)' };
  }
  return { accent: '#23e6ff', glow: 'rgba(35,230,255,0.5)' };
}

const BURST = Array.from({ length: 36 }, (_, i) => ({
  id: i,
  angle: (i / 36) * Math.PI * 2,
  dist: 95 + (i % 6) * 22,
  size: 4 + (i % 4) * 2,
  hue: i % 3,
}));

const COINS = Array.from({ length: 14 }, (_, i) => ({
  id: i,
  ox: (i - 7) * 14,
  delay: i * 0.04,
  spin: i % 2 === 0 ? 1 : -1,
}));

export function NeonCoinForgeShowcase({ card }: { card: ForgeShowcaseCard }) {
  const reduce = useReducedMotion();
  const [phase, setPhase] = useState<Phase>('float');
  const [tick, setTick] = useState(0);
  const { accent, glow } = useMemo(() => rarityAccent(card.rarity), [card.rarity]);

  useEffect(() => {
    if (reduce) return;
    let idx = 0;
    let timeout: ReturnType<typeof setTimeout>;
    const advance = () => {
      const p = ORDER[idx];
      setPhase(p);
      idx = (idx + 1) % ORDER.length;
      timeout = setTimeout(advance, PHASE_MS[p]);
    };
    advance();
    return () => clearTimeout(timeout);
  }, [reduce, tick]);

  const showCard = phase !== 'burst' && phase !== 'mint' && phase !== 'hold';
  const forging = phase === 'forge';
  const bursting = phase === 'burst';
  const minting = phase === 'mint' || phase === 'hold';
  const ringSpeed = phase === 'charge' || phase === 'forge' ? 2.8 : phase === 'burst' ? 4 : 1.2;

  return (
  <>
    <style
      dangerouslySetInnerHTML={{
        __html: `
          @keyframes forgeRingSpin { to { transform: rotate(360deg); } }
          @keyframes forgeRingSpinRev { to { transform: rotate(-360deg); } }
          @keyframes forgePulseCore { 0%,100%{opacity:.35;transform:scale(1)} 50%{opacity:.7;transform:scale(1.08)} }
          @keyframes forgeSheen { to { background-position: -260% 0; } }
        `,
      }}
    />
    <div
      className="relative max-w-[1100px] mx-auto overflow-hidden border border-[rgba(139,92,246,0.4)]"
      style={{
        background:
          'radial-gradient(ellipse 80% 70% at 50% 30%, rgba(255,46,166,0.14), transparent 55%), radial-gradient(ellipse 50% 50% at 20% 80%, rgba(35,230,255,0.1), transparent), linear-gradient(165deg, #16122c, #100d22 55%, #0b0919)',
        clipPath: 'polygon(0 18px, 18px 0, 100% 0, 100% calc(100% - 18px), calc(100% - 18px) 100%, 0 100%)',
      }}
    >
      {['top-2 left-2 border-r-0 border-b-0', 'top-2 right-2 border-l-0 border-b-0', 'bottom-2 left-2 border-r-0 border-t-0', 'bottom-2 right-2 border-l-0 border-t-0'].map(
        (pos, i) => (
          <i key={i} className={`absolute w-5 h-5 border-2 border-[#23e6ff] opacity-60 pointer-events-none ${pos}`} />
        ),
      )}

      <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-0 items-stretch">
        {/* Stage */}
        <div className="relative flex items-center justify-center min-h-[340px] sm:min-h-[400px] p-6 sm:p-10 overflow-hidden">
          <div
            className="absolute inset-0 pointer-events-none opacity-40"
            style={{
              background:
                'linear-gradient(90deg, rgba(35,230,255,0.06) 1px, transparent 1px), linear-gradient(0deg, rgba(255,46,166,0.08) 1px, transparent 1px)',
              backgroundSize: '28px 24px',
            }}
          />

          <div className="relative w-[min(100%,320px)] aspect-square flex items-center justify-center">
            {/* Core bloom */}
            <div
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{
                background: `radial-gradient(circle, ${glow}, transparent 68%)`,
                animation: reduce ? undefined : 'forgePulseCore 2.4s ease-in-out infinite',
                opacity: phase === 'charge' || forging ? 1 : 0.55,
              }}
            />

            {/* Hex reactor rings */}
            {[0, 1, 2].map((ring) => (
              <svg
                key={ring}
                className="absolute inset-0 w-full h-full"
                viewBox="0 0 200 200"
                aria-hidden
                style={{
                  animation: reduce
                    ? undefined
                    : `${ring % 2 ? 'forgeRingSpinRev' : 'forgeRingSpin'} ${(14 - ring * 3) / ringSpeed}s linear infinite`,
                }}
              >
                <polygon
                  points="100,12 168,50 168,118 100,156 32,118 32,50"
                  fill="none"
                  stroke={ring === 0 ? '#ff2ea6' : ring === 1 ? '#8b5cf6' : '#23e6ff'}
                  strokeWidth={ring === 1 ? 1.2 : 1.6}
                  strokeDasharray={ring === 2 ? '4 10' : '12 8'}
                  opacity={0.35 + ring * 0.12}
                />
              </svg>
            ))}

            {/* Vertical forge beams */}
            <div
              className="absolute top-[8%] bottom-[8%] w-px bg-gradient-to-b from-transparent via-[#ff2ea6] to-transparent opacity-70"
              style={{ left: '22%' }}
            />
            <div
              className="absolute top-[8%] bottom-[8%] w-px bg-gradient-to-b from-transparent via-[#23e6ff] to-transparent opacity-70"
              style={{ right: '22%' }}
            />

            {/* Compressor slab */}
            <motion.div
              className="absolute top-0 left-1/2 -translate-x-1/2 w-[72%] h-10 rounded-sm border border-[rgba(255,46,166,0.5)]"
              style={{
                background: 'linear-gradient(180deg, #2a1a4a, #ff2ea6)',
                boxShadow: '0 0 24px rgba(255,46,166,0.45)',
              }}
              animate={
                reduce
                  ? { y: -88 }
                  : forging
                    ? { y: 52, transition: { type: 'spring', stiffness: 900, damping: 22 } }
                    : { y: -88, transition: { type: 'spring', stiffness: 280, damping: 18 } }
              }
            >
              <div className="absolute inset-x-3 top-2 h-1 rounded-full bg-white/25" />
            </motion.div>

            <AnimatePresence mode="popLayout">
              {showCard && (
                <motion.div
                  key="card"
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={
                    reduce
                      ? { opacity: 1, scale: 1, y: 0 }
                      : forging
                        ? { scale: 0.72, y: 8, filter: 'brightness(1.8) saturate(1.4)', opacity: 0.2 }
                        : phase === 'charge'
                          ? { scale: 1.04, y: -4 }
                          : { scale: 1, y: 0, filter: 'brightness(1) saturate(1)', opacity: 1 }
                  }
                  exit={{ opacity: 0, scale: 0.4, filter: 'blur(6px)' }}
                  transition={{ duration: forging ? 0.22 : 0.35 }}
                  className="relative w-[120px] sm:w-[140px] aspect-[63/88] rounded-xl p-[3px] z-10"
                  style={{
                    border: `2px solid ${accent}`,
                    background: 'linear-gradient(160deg, #17132c, #0b0919)',
                    boxShadow: `0 0 32px ${glow}`,
                  }}
                >
                  <div
                    className="absolute inset-0 rounded-xl pointer-events-none"
                    style={{
                      background:
                        'linear-gradient(115deg, transparent 32%, rgba(255,255,255,0.18) 48%, transparent 60%)',
                      backgroundSize: '260% 100%',
                      animation: 'forgeSheen 4.5s linear infinite',
                    }}
                  />
                  <div className="relative w-full h-full rounded-[9px] overflow-hidden bg-[#0e0b20] border border-white/[0.08]">
                    {card.image ? (
                      <img src={card.image} alt="" className="absolute inset-0 w-full h-full object-cover" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center font-black text-3xl text-[#ff2ea6]">
                        {card.rarity[0]?.toUpperCase()}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Burst particles */}
            {(bursting || minting) && !reduce && (
              <motion.div className="absolute inset-0 pointer-events-none" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {BURST.map((p) => {
                  const col = p.hue === 0 ? '#ff2ea6' : p.hue === 1 ? '#23e6ff' : '#fbbf24';
                  return (
                    <motion.span
                      key={p.id}
                      className="absolute left-1/2 top-1/2 rounded-full"
                      style={{ width: p.size, height: p.size, background: col, boxShadow: `0 0 10px ${col}` }}
                      initial={{ x: 0, y: 0, opacity: 1 }}
                      animate={{
                        x: Math.cos(p.angle) * p.dist,
                        y: Math.sin(p.angle) * p.dist,
                        opacity: 0,
                      }}
                      transition={{ duration: 0.55, ease: 'easeOut' }}
                    />
                  );
                })}
              </motion.div>
            )}

            {/* Coin stack */}
            <AnimatePresence>
              {minting && (
                <motion.div
                  className="absolute bottom-[18%] left-1/2 -translate-x-1/2 flex items-end gap-1 z-20"
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  {COINS.map((c) => (
                    <motion.div
                      key={c.id}
                      className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-amber-700/80 flex items-center justify-center font-orbitron text-[10px] font-black text-amber-950"
                      style={{
                        background: 'linear-gradient(145deg, #fde68a, #fbbf24 55%, #d97706)',
                        boxShadow: '0 0 14px rgba(251,191,36,0.55)',
                      }}
                      initial={{ y: -80 - c.id * 4, opacity: 0, rotate: c.spin * 90 }}
                      animate={{ y: 0, opacity: 1, rotate: 0 }}
                      transition={{ delay: c.delay, type: 'spring', stiffness: 420, damping: 16 }}
                    >
                      ₵
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Copy */}
        <div className="flex flex-col justify-center px-8 sm:px-10 py-10 border-t lg:border-t-0 lg:border-l border-[rgba(139,92,246,0.35)]">
          <div className="font-jp text-[#ff2ea6] tracking-[6px] text-xs drop-shadow-[0_0_12px_rgba(255,46,166,0.6)]">
            引き換え · INSTANT SELL-BACK
          </div>
          <h2 className="font-orbitron text-2xl sm:text-[1.75rem] tracking-wider mt-3 text-[#eeecf7] drop-shadow-[0_0_22px_rgba(35,230,255,0.35)]">
            NEON COIN FORGE
          </h2>
          <p className="mt-4 text-[#9a94b8] text-base leading-relaxed">
            Don&apos;t need the pull? Feed it into the PullForge mint — your card compresses under neon pressure and
            credits <b className="text-[#eeecf7]">instant coins</b>. Same vault, zero friction.
          </p>

          <motion.div
            key={phase === 'hold' ? `credit-${card.coinValue}` : 'credit'}
            className="mt-8 inline-flex flex-col gap-1 self-start px-5 py-4 rounded-lg border border-[rgba(255,46,166,0.35)] bg-[#0c0a1c]"
            animate={phase === 'hold' ? { boxShadow: '0 0 28px rgba(251,191,36,0.35)' } : {}}
          >
            <span className="font-orbitron text-[0.65rem] tracking-[3px] text-[#8888aa]">EXAMPLE PULL</span>
            <span className="text-sm text-[#eeecf7] font-semibold truncate max-w-[240px]">{card.name}</span>
            <motion.span
              className="font-orbitron text-2xl font-black text-[#fbbf24] drop-shadow-[0_0_16px_rgba(251,191,36,0.5)]"
              animate={phase === 'hold' ? { scale: [1, 1.06, 1] } : {}}
              transition={{ duration: 0.5 }}
            >
              +{card.coinValue.toLocaleString()} COINS
            </motion.span>
          </motion.div>

          <button
            type="button"
            onClick={() => setTick((t) => t + 1)}
            className="mt-6 self-start font-orbitron text-[0.7rem] tracking-widest uppercase text-[#23e6ff] border border-[#23e6ff]/40 px-4 py-2 hover:bg-[#23e6ff]/10 transition-colors"
          >
            Replay forge
          </button>
        </div>
      </div>
    </div>
  </>
  );
}