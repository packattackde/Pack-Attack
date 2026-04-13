'use client';

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { motion, useMotionValue, useTransform, useSpring, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Coins } from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────

interface PackOpeningFlowProps {
  pulls: Array<{
    id: string;
    card: {
      id: string;
      name: string;
      imageUrlGatherer: string;
      coinValue: number;
      rarity: string;
    };
  }>;
  boxName: string;
  cardBackUrl?: string | null;
  bestPullId: string | null;
  onComplete: () => void;
  onSkip: () => void;
}

type Phase = 'booster' | 'emerging' | 'revealing' | 'bestPull';
type BoosterSubPhase = 'tilt' | 'tearing' | 'torn' | 'glow';
type RarityTier = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

// ─── Rarity helpers ─────────────────────────────────────────────────

function getRarityTier(rarity: string): RarityTier {
  const r = rarity.toLowerCase().trim();
  if (r.includes('secret') || r.includes('legendary') || r.includes('mythic') || r.includes('alt art') || r.includes('gold') || r.includes('hyper')) return 'legendary';
  if (r.includes('ultra') || r.includes('super') || r.includes('epic') || r.includes('illustration') || r.includes('full art') || r.includes('vmax') || r.includes('vstar')) return 'epic';
  if (r.includes('rare') || r.includes('holo') || r.includes('promo')) return 'rare';
  if (r.includes('uncommon')) return 'uncommon';
  return 'common';
}

const RARITY_COLORS: Record<RarityTier, { particle: string; glow: string; border: string; text: string; labelKey: string }> = {
  common:    { particle: '#8b8ba0', glow: 'rgba(139,139,160,0.4)',  border: '#6b7280', text: 'text-gray-300',   labelKey: 'common' as const },
  uncommon:  { particle: '#4ade80', glow: 'rgba(74,222,128,0.5)',   border: '#4ade80', text: 'text-[#E879F9]',  labelKey: 'uncommon' as const },
  rare:      { particle: '#60a5fa', glow: 'rgba(96,165,250,0.6)',   border: '#60a5fa', text: 'text-blue-400',   labelKey: 'rare' as const },
  epic:      { particle: '#a78bfa', glow: 'rgba(167,139,250,0.6)',  border: '#a78bfa', text: 'text-purple-400', labelKey: 'epic' as const },
  legendary: { particle: '#fbbf24', glow: 'rgba(251,191,36,0.7)',   border: '#fbbf24', text: 'text-amber-400',  labelKey: 'legendary' as const },
};

const RARITY_BUILDUP_MS: Record<RarityTier, number> = {
  common: 100,
  uncommon: 300,
  rare: 600,
  epic: 900,
  legendary: 1500,
};

// ─── SVG booster silhouette with crimped edges ──────────────────────

const BOOSTER_PATH = `
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
`;

// ─── Component ──────────────────────────────────────────────────────

export function PackOpeningFlow({
  pulls,
  boxName,
  cardBackUrl,
  bestPullId,
  onComplete,
  onSkip,
}: PackOpeningFlowProps) {
  const t = useTranslations('packFlow')
  // ── Main phase ──
  const [phase, setPhase] = useState<Phase>('booster');

  // ── Booster sub-phase ──
  const [boosterPhase, setBoosterPhase] = useState<BoosterSubPhase>('tilt');
  const [tearProgress, setTearProgress] = useState(0);
  const [tearPoints, setTearPoints] = useState<{ x: number; y: number }[]>([]);
  const [particles, setParticles] = useState<{ id: number; x: number; color: string; size: number; dx: number; dy: number }[]>([]);

  // ── Revealing phase ──
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [cardFlipped, setCardFlipped] = useState(false);
  const [buildupActive, setBuildupActive] = useState(false);
  const [buildupDone, setBuildupDone] = useState(false);
  const [infoVisible, setInfoVisible] = useState(false);

  // ── Refs ──
  const containerRef = useRef<HTMLDivElement>(null);
  const tearZoneRef = useRef<HTMLDivElement>(null);
  const isTearing = useRef(false);
  const particleId = useRef(0);
  const lastParticleTime = useRef(0);
  const tearTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // ── Custom cursor ──
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  const [cursorPressed, setCursorPressed] = useState(false);

  // ── 3D tilt motion values ──
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [12, -12]), { stiffness: 150, damping: 20 });
  const tiltRotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-12, 12]), { stiffness: 150, damping: 20 });
  const holoAngle = useTransform(mouseX, [-0.5, 0.5], [100, 260]);
  const holoBackground = useTransform(holoAngle, (a: number) =>
    `linear-gradient(${a}deg, rgba(255,0,128,0.15), rgba(0,255,200,0.18), rgba(255,200,0,0.15), rgba(0,128,255,0.18), rgba(255,0,200,0.12))`
  );

  // ── Derived values ──
  const bestPullTier = bestPullId ? getRarityTier(pulls.find(p => p.id === bestPullId)?.card.rarity ?? '') : 'common';
  const showBestPull = bestPullId && bestPullTier !== 'common';

  // ─── Pointer handlers for tilt + cursor ───────────────────────────

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    cursorX.set(e.clientX);
    cursorY.set(e.clientY);

    if (phase !== 'booster' || boosterPhase !== 'tilt' || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  }, [phase, boosterPhase, mouseX, mouseY, cursorX, cursorY]);

  const handlePointerLeave = useCallback(() => {
    mouseX.set(0);
    mouseY.set(0);
  }, [mouseX, mouseY]);

  // ─── Tear interaction ─────────────────────────────────────────────

  const getX = (e: React.TouchEvent | React.MouseEvent) => {
    if ('touches' in e && e.touches.length > 0) return e.touches[0].clientX;
    if ('clientX' in e) return e.clientX;
    return 0;
  };

  const getY = (e: React.TouchEvent | React.MouseEvent) => {
    if ('touches' in e && e.touches.length > 0) return e.touches[0].clientY;
    if ('clientY' in e) return e.clientY;
    return 0;
  };

  const startTear = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (phase !== 'booster' || boosterPhase !== 'tilt') return;
    isTearing.current = true;
    setBoosterPhase('tearing');
    setCursorPressed(true);
    mouseX.set(0);
    mouseY.set(0);
  }, [phase, boosterPhase, mouseX, mouseY]);

  const moveTear = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (!isTearing.current || boosterPhase !== 'tearing' || !tearZoneRef.current) return;
    if ('preventDefault' in e) e.preventDefault();

    const rect = tearZoneRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(getX(e) - rect.left, rect.width));
    const y = getY(e) - rect.top;
    const pct = (x / rect.width) * 100;

    if (pct <= tearProgress + 0.3) return;
    setTearProgress(pct);

    // Build jagged tear line
    const svgX = (x / rect.width) * 210;
    const centerY = 35;
    const jitter = (Math.random() - 0.5) * 14;
    const cursorOffset = ((y - rect.height / 2) / (rect.height / 2)) * 8;
    const svgY = centerY + cursorOffset + jitter;

    setTearPoints(prev => {
      if (prev.length === 0 || svgX - prev[prev.length - 1].x > 2) {
        return [...prev, { x: svgX, y: svgY }];
      }
      return prev;
    });

    // Spawn particles
    const now = Date.now();
    if (now - lastParticleTime.current > 30) {
      lastParticleTime.current = now;
      const count = pct > 70 ? 5 : pct > 40 ? 3 : 1;
      const rarityColors = RARITY_COLORS[bestPullTier];
      const newParticles = Array.from({ length: count }, () => ({
        id: particleId.current++,
        x,
        color: pct < 35 ? 'rgba(255,255,255,0.4)' : rarityColors.particle,
        size: pct > 60 ? 4 + Math.random() * 3 : 2 + Math.random() * 2,
        dx: (Math.random() - 0.5) * 70,
        dy: -(50 + Math.random() * 70),
      }));
      setParticles(prev => [...prev, ...newParticles]);
      setTimeout(() => {
        setParticles(prev => prev.filter(p => !newParticles.find(np => np.id === p.id)));
      }, 1000);
    }

    // Haptic feedback
    if ('vibrate' in navigator) {
      if (Math.abs(pct - 30) < 1.5) navigator.vibrate(15);
      if (Math.abs(pct - 60) < 1.5) navigator.vibrate(25);
      if (Math.abs(pct - 85) < 1.5) navigator.vibrate([20, 15, 40]);
    }

    // Complete tear
    if (pct >= 95) {
      isTearing.current = false;
      setBoosterPhase('torn');
      if ('vibrate' in navigator) navigator.vibrate([50, 30, 100]);
      const t1 = setTimeout(() => setBoosterPhase('glow'), 800);
      const t2 = setTimeout(() => {
        setPhase('emerging');
      }, 1200);
      tearTimeoutsRef.current.push(t1, t2);
    }
  }, [boosterPhase, tearProgress, bestPullTier]);

  const endTear = useCallback(() => {
    isTearing.current = false;
    setCursorPressed(false);
  }, []);

  // ─── Emerging → revealing transition ──────────────────────────────

  useEffect(() => {
    if (phase !== 'emerging') return;
    const totalDelay = pulls.length * 120 + 600;
    const timer = setTimeout(() => {
      setPhase('revealing');
    }, totalDelay);
    return () => clearTimeout(timer);
  }, [phase, pulls.length]);

  // ─── Rarity buildup + auto-flip on reveal ─────────────────────────

  useEffect(() => {
    if (phase !== 'revealing') return;

    // Reset state for new card
    setCardFlipped(false);
    setBuildupActive(false);
    setBuildupDone(false);
    setInfoVisible(false);

    const currentPull = pulls[currentCardIndex];
    if (!currentPull) return;

    const tier = getRarityTier(currentPull.card.rarity);
    const buildupMs = RARITY_BUILDUP_MS[tier];

    // Start buildup
    const buildupStart = setTimeout(() => {
      setBuildupActive(true);
    }, 50);

    // End buildup, trigger flip
    const flipTimer = setTimeout(() => {
      setBuildupDone(true);
      setCardFlipped(true);
    }, buildupMs + 50);

    // Show info after flip settles
    const infoTimer = setTimeout(() => {
      setInfoVisible(true);
    }, buildupMs + 600);

    return () => {
      clearTimeout(buildupStart);
      clearTimeout(flipTimer);
      clearTimeout(infoTimer);
    };
  }, [phase, currentCardIndex, pulls]);

  // ─── Advance to next card / bestPull / complete ───────────────────

  const advanceCard = useCallback(() => {
    if (phase !== 'revealing' || !infoVisible) return;

    if (currentCardIndex < pulls.length - 1) {
      setCurrentCardIndex(prev => prev + 1);
    } else if (showBestPull) {
      setPhase('bestPull');
    } else {
      onComplete();
    }
  }, [phase, infoVisible, currentCardIndex, pulls.length, showBestPull, onComplete]);

  // ── Best pull ready guard (Bug #4) ──
  const [bestPullReady, setBestPullReady] = useState(false);

  // Reset bestPullReady when phase changes
  useEffect(() => {
    setBestPullReady(false);
  }, [phase]);

  // ─── Best pull auto-advance ───────────────────────────────────────

  useEffect(() => {
    if (phase !== 'bestPull') return;
    const readyTimer = setTimeout(() => setBestPullReady(true), 1500);
    const timer = setTimeout(() => {
      onComplete();
    }, 3000);
    return () => {
      clearTimeout(readyTimer);
      clearTimeout(timer);
    };
  }, [phase, onComplete]);

  // ─── Cleanup tear timeouts on unmount ──────────────────────────────

  useEffect(() => {
    return () => {
      tearTimeoutsRef.current.forEach(t => clearTimeout(t));
      tearTimeoutsRef.current = [];
    };
  }, []);

  // ─── Build SVG tear line ──────────────────────────────────────────

  const tearLinePath = tearPoints.length > 1
    ? `M ${tearPoints[0].x},${tearPoints[0].y}` + tearPoints.slice(1).map(p => ` L ${p.x},${p.y}`).join('')
    : '';

  const tearLineColor = tearProgress < 35 ? 'rgba(200,79,255,0.4)' : tearProgress < 60 ? 'rgba(200,79,255,0.7)' : '#C84FFF';

  // ─── Card fan angles ──────────────────────────────────────────────

  const getFanAngle = (index: number, total: number) => {
    if (total <= 1) return 0;
    const spread = Math.min(total * 4, 20);
    return -spread / 2 + (spread / (total - 1)) * index;
  };

  // ─── Current card data ────────────────────────────────────────────

  const currentPull = pulls[currentCardIndex];
  const currentTier = currentPull ? getRarityTier(currentPull.card.rarity) : 'common';
  const currentColors = RARITY_COLORS[currentTier];

  const bestPull = bestPullId ? pulls.find(p => p.id === bestPullId) : null;
  const bestColors = bestPull ? RARITY_COLORS[getRarityTier(bestPull.card.rarity)] : RARITY_COLORS.common;

  // ── Pre-computed random particle data (Bug #2) ──
  const buildupParticleData = useMemo(() =>
    Array.from({ length: 12 }, () => ({
      width: 4 + Math.random() * 4,
      height: 4 + Math.random() * 4,
      initialX: (Math.random() - 0.5) * 300,
      initialY: (Math.random() - 0.5) * 400,
      animateX: (Math.random() - 0.5) * 40,
      animateY: (Math.random() - 0.5) * 40,
    }))
  , [currentCardIndex]);

  const orbitParticleData = useMemo(() =>
    Array.from({ length: 16 }, (_, i) => ({
      width: 4 + Math.random() * 4,
      height: 4 + Math.random() * 4,
      radius: 180 + Math.random() * 40,
      duration: 3 + Math.random() * 2,
    }))
  , [bestPullId]);

  // ─── Render ───────────────────────────────────────────────────────

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#06061a] overflow-hidden select-none [&_*]:select-none"
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onClick={phase === 'revealing' ? advanceCard : phase === 'bestPull' ? (bestPullReady ? onComplete : undefined) : undefined}
      style={{ cursor: 'none' }}
    >
      {/* ═══ BOOSTER PACK ═══ */}
      <AnimatePresence>
        {(phase === 'booster' || phase === 'emerging' || phase === 'revealing' || phase === 'bestPull') && (
          <motion.div
            className="absolute w-[min(210px,80vw)]"
            style={{ aspectRatio: '210/370' }}
            animate={
              phase === 'booster' && (boosterPhase === 'torn' || boosterPhase === 'glow')
                ? { scale: 0.85, y: 30 }
                : phase === 'emerging'
                ? { scale: 0.9, y: 80 }
                : phase === 'revealing' || phase === 'bestPull'
                ? { scale: 0.4, y: 200, opacity: 0.15 }
                : { scale: 1, y: 0 }
            }
            transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          >
            {/* Tilting pack wrapper — flat (no preserve-3d, no translateZ) */}
            <motion.div
              className="w-full h-full relative"
              style={{
                rotateX: phase === 'booster' && boosterPhase === 'tilt' ? rotateX : 0,
                rotateY: phase === 'booster' && boosterPhase === 'tilt' ? tiltRotateY : 0,
              }}
            >
              {/* Front face — flat */}
              <div className="absolute inset-0">
                {/* SVG Booster Shape */}
                <svg viewBox="0 0 210 370" className="absolute inset-0 w-full h-full" style={{ overflow: 'visible' }}>
                  <defs>
                    <linearGradient id="boosterGradPOF" x1="0" y1="0" x2="0.8" y2="1">
                      <stop offset="0%" stopColor="#2a1878" />
                      <stop offset="25%" stopColor="#3d2590" />
                      <stop offset="50%" stopColor="#4a30a8" />
                      <stop offset="75%" stopColor="#3d2590" />
                      <stop offset="100%" stopColor="#221268" />
                    </linearGradient>
                    <clipPath id="boosterClipPOF">
                      <path d={BOOSTER_PATH} />
                    </clipPath>
                  </defs>
                  <path d={BOOSTER_PATH} fill="url(#boosterGradPOF)" />
                </svg>

                {/* Holographic foil */}
                <motion.div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    clipPath: 'url(#boosterClipPOF)',
                    background: holoBackground,
                    mixBlendMode: 'color-dodge',
                  }}
                />

                {/* Specular highlight */}
                <motion.div
                  className="absolute pointer-events-none"
                  style={{
                    clipPath: 'url(#boosterClipPOF)',
                    width: 180,
                    height: 180,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(255,255,255,0.2), transparent 60%)',
                    left: useTransform(mouseX, [-0.5, 0.5], ['20%', '60%']),
                    top: useTransform(mouseY, [-0.5, 0.5], ['15%', '50%']),
                    mixBlendMode: 'overlay' as const,
                  }}
                />

                {/* Pack content */}
                <div
                  className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
                  style={{ clipPath: 'url(#boosterClipPOF)' }}
                >
                  <span className="text-5xl mb-2" style={{ filter: 'drop-shadow(0 0 15px rgba(200,79,255,0.3))' }}>
                    🏴‍☠️
                  </span>
                  <span
                    className="text-[15px] font-extrabold text-[#C84FFF] uppercase tracking-[3px]"
                    style={{ textShadow: '0 0 10px rgba(200,79,255,0.4)' }}
                  >
                    {t('pullforge')}
                  </span>
                  <span className="text-[9px] text-white/40 uppercase tracking-[2px] mt-1">
                    {boxName}
                  </span>
                  <span className="absolute bottom-[18%] text-[9px] text-white/30 bg-black/30 px-3 py-0.5 rounded-full">
                    {pulls.length} {t('cards')}
                  </span>
                </div>

                {/* Seal */}
                <div
                  className="absolute top-[15%] right-[12%] w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-black text-black z-10"
                  style={{
                    background: 'radial-gradient(circle at 35% 35%, #e0ff60, #C84FFF, #80cc00)',
                    boxShadow: '0 2px 8px rgba(200,79,255,0.4)',
                  }}
                >
                  PA
                </div>
              </div>
            </motion.div>

            {/* Tear Zone overlay */}
            {phase === 'booster' && (boosterPhase === 'tilt' || boosterPhase === 'tearing') && (
              <div
                ref={tearZoneRef}
                className="absolute left-0 right-0"
                style={{ top: 'calc(22% - 35px)', height: 70, touchAction: 'none', cursor: 'none', zIndex: 50 }}
                onMouseDown={startTear}
                onMouseMove={moveTear}
                onMouseUp={endTear}
                onTouchStart={startTear}
                onTouchMove={moveTear}
                onTouchEnd={endTear}
                onTouchCancel={endTear}
              >
                {boosterPhase === 'tilt' && (
                  <div
                    className="absolute top-1/2 left-2 right-2 h-[2px] -translate-y-1/2"
                    style={{
                      background:
                        'repeating-linear-gradient(90deg, rgba(255,255,255,0.4) 0px, rgba(255,255,255,0.4) 4px, transparent 4px, transparent 8px)',
                    }}
                  />
                )}
                <svg
                  viewBox="0 0 210 70"
                  className="absolute inset-0 w-full h-full pointer-events-none"
                  preserveAspectRatio="none"
                >
                  <defs>
                    <filter id="tearGlowPOF">
                      <feGaussianBlur stdDeviation="1.5" result="b" />
                      <feMerge>
                        <feMergeNode in="b" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>
                  <path
                    d={tearLinePath}
                    fill="none"
                    stroke={tearLineColor}
                    strokeWidth={tearProgress > 60 ? 4 : 3}
                    filter="url(#tearGlowPOF)"
                  />
                </svg>
              </div>
            )}

            {/* Particles overlay */}
            {phase === 'booster' && (
              <div
                className="absolute left-0 right-0 pointer-events-none"
                style={{ top: '22%', height: 0, overflow: 'visible', zIndex: 60 }}
              >
                {particles.map(p => (
                  <motion.div
                    key={p.id}
                    className="absolute rounded-full"
                    style={{
                      left: p.x,
                      width: p.size,
                      height: p.size,
                      background: p.color,
                      boxShadow: tearProgress > 60 ? `0 0 ${p.size}px ${p.color}` : 'none',
                    }}
                    initial={{ y: 0, opacity: 1, scale: 1 }}
                    animate={{ y: p.dy, x: p.dx, opacity: 0, scale: 0 }}
                    transition={{ duration: 0.7, ease: 'easeOut' }}
                  />
                ))}
              </div>
            )}

            {/* Torn top piece */}
            <AnimatePresence>
              {phase === 'booster' && (boosterPhase === 'torn' || boosterPhase === 'glow') && (
                <motion.div
                  className="absolute top-0 left-0 right-0 z-30"
                  style={{ height: '24%', transformOrigin: '30% bottom' }}
                  initial={{ rotateX: 0, rotateZ: 0, x: 0, y: 0, opacity: 1 }}
                  animate={{
                    rotateX: [0, 40, 90, 120],
                    rotateZ: [0, -5, -15, -28],
                    x: [0, -10, -40, -90],
                    y: [0, -15, -60, -140],
                    opacity: [1, 1, 0.6, 0],
                  }}
                  transition={{
                    duration: 1.3,
                    ease: [0.23, 1, 0.32, 1],
                    times: [0, 0.25, 0.6, 1],
                  }}
                >
                  <svg viewBox="0 0 210 85" className="w-full h-full">
                    <path
                      fill="#2a1870"
                      d={`
                        M 6,24 L 10,18 L 16,24 L 22,18 L 28,24 L 34,18 L 40,24 L 46,18 L 52,24 L 58,18
                        L 64,24 L 70,18 L 76,24 L 82,18 L 88,24 L 94,18 L 100,24 L 106,18 L 112,24 L 118,18
                        L 124,24 L 130,18 L 136,24 L 142,18 L 148,24 L 154,18 L 160,24 L 166,18 L 172,24
                        L 178,18 L 184,24 L 190,18 L 196,24 L 202,18 L 206,24
                        L 206,85 L 4,85 Z
                      `}
                    />
                  </svg>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Inner glow after tear */}
            <AnimatePresence>
              {phase === 'booster' && boosterPhase === 'glow' && (
                <motion.div
                  className="absolute left-[10%] right-[10%] rounded-full pointer-events-none"
                  style={{
                    top: '18%',
                    height: '25%',
                    zIndex: 5,
                    background: `radial-gradient(ellipse, ${RARITY_COLORS[bestPullTier].glow}, transparent)`,
                    filter: 'blur(12px)',
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 0.8, 0.5, 1, 0.6] }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                />
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Screen flash on glow phase */}
      <AnimatePresence>
        {phase === 'booster' && boosterPhase === 'glow' && (
          <motion.div
            className="fixed inset-0 pointer-events-none z-40"
            style={{ background: `radial-gradient(circle, ${RARITY_COLORS[bestPullTier].glow}, transparent 70%)` }}
            initial={{ opacity: 0.8 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
          />
        )}
      </AnimatePresence>

      {/* Hint text */}
      {phase === 'booster' && boosterPhase === 'tilt' && (
        <motion.p
          className="absolute bottom-16 text-sm text-[#C84FFF] font-semibold"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {t('swipeTearLine')} &rarr;
        </motion.p>
      )}

      {/* ═══ EMERGING CARDS (face-down, fanned) ═══ */}
      <AnimatePresence>
        {(phase === 'emerging' || phase === 'revealing' || phase === 'bestPull') && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {pulls.map((pull, index) => {
              const fanAngle = getFanAngle(index, pulls.length);
              const isCurrentRevealing = phase === 'revealing' && index === currentCardIndex;
              const isRevealed = phase === 'revealing' && index < currentCardIndex;
              const isBestPull = phase === 'bestPull' && pull.id === bestPullId;
              const isHidden =
                (phase === 'revealing' && index > currentCardIndex) ||
                (phase === 'revealing' && isRevealed) ||
                (phase === 'bestPull' && !isBestPull);

              if (isHidden) return null;
              if (isCurrentRevealing) return null; // Rendered separately below
              if (isBestPull) return null; // Rendered separately below

              // Emerging state: stacked, face-down
              return (
                <motion.div
                  key={pull.id}
                  className="absolute"
                  style={{
                    width: 180,
                    height: 252,
                    zIndex: index,
                  }}
                  initial={{ y: -300, opacity: 0, rotate: 0, scale: 0.8 }}
                  animate={{
                    y: phase === 'emerging' ? -20 : 0,
                    opacity: phase === 'emerging' ? 1 : 0,
                    rotate: fanAngle,
                    scale: 1,
                  }}
                  transition={{
                    type: 'spring',
                    stiffness: 200,
                    damping: 25,
                    delay: phase === 'emerging' ? index * 0.12 : 0,
                  }}
                >
                  {/* Card back */}
                  <div
                    className="w-full h-full rounded-xl overflow-hidden border-2 border-white/20"
                    style={{
                      background: 'linear-gradient(145deg, #1a1a3e, #0d0d2b)',
                    }}
                  >
                    {cardBackUrl ? (
                      <div className="relative w-full h-full">
                        <Image
                          src={cardBackUrl}
                          alt={t('cardBack')}
                          fill
                          unoptimized
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="w-16 h-16 rounded-full border-2 border-white/10 flex items-center justify-center">
                          <span className="text-white/20 text-2xl font-bold">PA</span>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </AnimatePresence>

      {/* ═══ REVEALING — Current card in center ═══ */}
      <AnimatePresence mode="wait">
        {phase === 'revealing' && currentPull && (
          <motion.div
            key={`reveal-${currentCardIndex}`}
            className="absolute flex flex-col items-center"
            style={{ zIndex: 100 }}
            initial={{ scale: 0.7, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.5, opacity: 0, y: -30 }}
            transition={{ type: 'spring', stiffness: 200, damping: 25 }}
          >
            {/* Rarity buildup glow behind card */}
            {buildupActive && !buildupDone && currentTier !== 'common' && (
              <motion.div
                className="absolute rounded-full pointer-events-none"
                style={{
                  width: 300,
                  height: 400,
                  background: `radial-gradient(ellipse, ${currentColors.glow}, transparent 70%)`,
                  filter: 'blur(30px)',
                  zIndex: -1,
                }}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: [0, 0.6, 0.8, 1], scale: [0.5, 0.8, 1, 1.1] }}
                transition={{ duration: RARITY_BUILDUP_MS[currentTier] / 1000, ease: 'easeOut' }}
              />
            )}

            {/* Legendary screen dim */}
            {buildupActive && !buildupDone && currentTier === 'legendary' && (
              <motion.div
                className="fixed inset-0 pointer-events-none"
                style={{ background: 'rgba(0,0,0,0.6)', zIndex: -2 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1 }}
              />
            )}

            {/* Epic / Legendary buildup particles */}
            {buildupActive && !buildupDone && (currentTier === 'epic' || currentTier === 'legendary') && (
              <>
                {buildupParticleData.map((pd, i) => (
                  <motion.div
                    key={`bp-${i}`}
                    className="absolute rounded-full pointer-events-none"
                    style={{
                      width: pd.width,
                      height: pd.height,
                      background: currentColors.particle,
                      boxShadow: `0 0 6px ${currentColors.particle}`,
                      zIndex: -1,
                    }}
                    initial={{
                      x: pd.initialX,
                      y: pd.initialY,
                      opacity: 0,
                      scale: 0,
                    }}
                    animate={{
                      x: pd.animateX,
                      y: pd.animateY,
                      opacity: [0, 1, 1, 0.5],
                      scale: [0, 1.5, 1, 0.5],
                    }}
                    transition={{
                      duration: RARITY_BUILDUP_MS[currentTier] / 1000,
                      delay: i * 0.05,
                      ease: 'easeInOut',
                    }}
                  />
                ))}
              </>
            )}

            {/* Flipping card */}
            <div className="w-[min(240px,85vw)]" style={{ perspective: 1000, aspectRatio: '240/336' }}>
              <motion.div
                className="relative w-full h-full"
                style={{ transformStyle: 'preserve-3d' }}
                animate={{ rotateY: cardFlipped ? 180 : 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 25 }}
              >
                {/* Card FRONT (back of card — visible when not flipped) */}
                <div
                  className="absolute inset-0 rounded-xl overflow-hidden border-2 border-white/20"
                  style={{
                    backfaceVisibility: 'hidden',
                    background: 'linear-gradient(145deg, #1a1a3e, #0d0d2b)',
                  }}
                >
                  {cardBackUrl ? (
                    <div className="relative w-full h-full">
                      <Image
                      src={cardBackUrl}
                      alt={t('cardBack')}
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-20 h-20 rounded-full border-2 border-white/10 flex items-center justify-center">
                        <span className="text-white/20 text-3xl font-bold">PA</span>
                      </div>
                    </div>
                  )}

                  {/* Buildup glow on card edge */}
                  {buildupActive && currentTier !== 'common' && (
                    <motion.div
                      className="absolute inset-0 rounded-xl pointer-events-none"
                      style={{
                        boxShadow: `inset 0 0 30px ${currentColors.glow}, 0 0 20px ${currentColors.glow}`,
                      }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: RARITY_BUILDUP_MS[currentTier] / 1000 }}
                    />
                  )}
                </div>

                {/* Card BACK (card image — visible when flipped) */}
                <div
                  className="absolute inset-0 rounded-xl overflow-hidden"
                  style={{
                    backfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)',
                  }}
                >
                  <div className="relative w-full h-full">
                    <Image
                      src={currentPull.card.imageUrlGatherer}
                      alt={currentPull.card.name}
                      fill
                      unoptimized
                      className="object-contain bg-black rounded-xl"
                    />
                  </div>
                  {/* Rarity glow border */}
                  <div
                    className="absolute inset-0 rounded-xl pointer-events-none"
                    style={{
                      boxShadow: `0 0 20px ${currentColors.glow}, 0 0 40px ${currentColors.glow}`,
                      border: `2px solid ${currentColors.border}`,
                    }}
                  />
                </div>
              </motion.div>
            </div>

            {/* Card info — slides in after flip */}
            <AnimatePresence>
              {infoVisible && (
                <motion.div
                  className="mt-4 flex flex-col items-center gap-1"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 25 }}
                >
                  <span className="text-white font-bold text-lg text-center max-w-[260px] truncate">
                    {currentPull.card.name}
                  </span>
                  <span
                    className={`text-xs font-semibold uppercase tracking-wider ${currentColors.text}`}
                  >
                    {currentPull.card.rarity}
                  </span>
                  <span className="flex items-center gap-1 text-amber-400 text-sm font-medium mt-1">
                    <Coins className="w-4 h-4" />
                    {currentPull.card.coinValue.toFixed(2)}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Counter */}
            <div className="absolute -top-12 text-white/50 text-sm font-medium">
              {t('cardOf', { current: currentCardIndex + 1, total: pulls.length })}
            </div>

            {/* Tap hint */}
            {infoVisible && (
              <motion.p
                className="absolute -bottom-10 text-xs text-white/30"
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {t('tapToContinue')}
              </motion.p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ BEST PULL SHOWCASE ═══ */}
      <AnimatePresence>
        {phase === 'bestPull' && bestPull && (
          <motion.div
            className="absolute flex flex-col items-center"
            style={{ zIndex: 100 }}
            initial={{ scale: 0.3, opacity: 0 }}
            animate={{ scale: 1.2, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 150, damping: 20 }}
          >
            {/* Max rarity glow */}
            <motion.div
              className="absolute rounded-full pointer-events-none"
              style={{
                width: 400,
                height: 500,
                background: `radial-gradient(ellipse, ${bestColors.glow}, transparent 60%)`,
                filter: 'blur(40px)',
                zIndex: -1,
              }}
              animate={{ opacity: [0.5, 1, 0.7, 1], scale: [0.9, 1.1, 0.95, 1.05] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />

            {/* Orbiting particles */}
            {orbitParticleData.map((pd, i) => {
              const angle = (i / 16) * Math.PI * 2;
              return (
                <motion.div
                  key={`best-p-${i}`}
                  className="absolute rounded-full pointer-events-none"
                  style={{
                    width: pd.width,
                    height: pd.height,
                    background: bestColors.particle,
                    boxShadow: `0 0 8px ${bestColors.particle}`,
                    zIndex: -1,
                  }}
                  animate={{
                    x: [
                      Math.cos(angle) * pd.radius,
                      Math.cos(angle + Math.PI) * pd.radius,
                      Math.cos(angle + Math.PI * 2) * pd.radius,
                    ],
                    y: [
                      Math.sin(angle) * pd.radius,
                      Math.sin(angle + Math.PI) * pd.radius,
                      Math.sin(angle + Math.PI * 2) * pd.radius,
                    ],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: pd.duration,
                    repeat: Infinity,
                    ease: 'linear',
                    delay: i * 0.1,
                  }}
                />
              );
            })}

            {/* Label */}
            <motion.div
              className="mb-4"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <span
                className={`text-2xl font-black uppercase tracking-widest ${bestColors.text}`}
                style={{ textShadow: `0 0 20px ${bestColors.glow}` }}
              >
                {t('yourBestPull')}
              </span>
            </motion.div>

            {/* Card */}
            <div
              className="rounded-xl overflow-hidden"
              style={{
                width: 240,
                height: 336,
                boxShadow: `0 0 30px ${bestColors.glow}, 0 0 60px ${bestColors.glow}`,
                border: `3px solid ${bestColors.border}`,
              }}
            >
              <div className="relative w-full h-full">
                <Image
                  src={bestPull.card.imageUrlGatherer}
                  alt={bestPull.card.name}
                  fill
                  unoptimized
                  className="object-contain bg-black"
                />
              </div>
            </div>

            {/* Info */}
            <motion.div
              className="mt-4 flex flex-col items-center gap-1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <span className="text-white font-bold text-xl">
                {bestPull.card.name}
              </span>
              <span className={`text-sm font-semibold uppercase tracking-wider ${bestColors.text}`}>
                {bestPull.card.rarity}
              </span>
              <span className="flex items-center gap-1 text-amber-400 text-base font-medium mt-1">
                <Coins className="w-5 h-5" />
                {bestPull.card.coinValue.toFixed(2)}
              </span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ SKIP BUTTON ═══ */}
      <motion.button
        className="absolute bottom-6 right-6 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white/40 text-sm hover:bg-white/10 hover:text-white/60 transition-colors z-[100]"
        style={{ cursor: 'none' }}
        onClick={(e) => {
          e.stopPropagation();
          onSkip();
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        {t('skip')}
      </motion.button>

      {/* ═══ CUSTOM NEON CURSOR ═══ */}
      <motion.div
        className="pointer-events-none"
        style={{
          position: 'fixed',
          left: cursorX,
          top: cursorY,
          zIndex: 10000,
          transform: 'translate(-50%, -50%)',
        }}
      >
        <motion.div
          className="rounded-full border-2"
          animate={{
            width: cursorPressed ? 32 : 22,
            height: cursorPressed ? 32 : 22,
            borderColor: cursorPressed ? '#C84FFF' : 'rgba(200,79,255,0.5)',
            backgroundColor: cursorPressed ? 'rgba(200,79,255,0.15)' : 'rgba(200,79,255,0)',
            boxShadow: cursorPressed
              ? '0 0 15px rgba(200,79,255,0.4), 0 0 30px rgba(200,79,255,0.2)'
              : '0 0 8px rgba(200,79,255,0.2)',
          }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        />
      </motion.div>
    </div>
  );
}
