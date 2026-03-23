'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, useMotionValue, useTransform, useSpring, AnimatePresence } from 'framer-motion';

interface BoosterPackAnimationProps {
  boxName: string;
  gameName?: string;
  onTearComplete: () => void;
  rarityHint?: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
}

const RARITY_COLORS = {
  common:    { particle: '#8b8ba0', glow: 'rgba(139,139,160,0.4)' },
  uncommon:  { particle: '#4ade80', glow: 'rgba(74,222,128,0.5)' },
  rare:      { particle: '#60a5fa', glow: 'rgba(96,165,250,0.6)' },
  epic:      { particle: '#a78bfa', glow: 'rgba(167,139,250,0.6)' },
  legendary: { particle: '#fbbf24', glow: 'rgba(251,191,36,0.7)' },
};

// SVG path for booster pack silhouette with crimped edges
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

export function BoosterPackAnimation({ boxName, gameName, onTearComplete, rarityHint = 'legendary' }: BoosterPackAnimationProps) {
  const [phase, setPhase] = useState<'tilt' | 'tearing' | 'torn' | 'glow' | 'done'>('tilt');
  const [tearProgress, setTearProgress] = useState(0);
  const [tearPoints, setTearPoints] = useState<{ x: number; y: number }[]>([]);
  const [particles, setParticles] = useState<{ id: number; x: number; color: string; size: number; dx: number; dy: number }[]>([]);

  const containerRef = useRef<HTMLDivElement>(null);
  const tearZoneRef = useRef<HTMLDivElement>(null);
  const isTearing = useRef(false);
  const particleId = useRef(0);
  const lastParticleTime = useRef(0);

  const colors = RARITY_COLORS[rarityHint];

  // 3D Tilt motion values
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [12, -12]), { stiffness: 150, damping: 20 });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-12, 12]), { stiffness: 150, damping: 20 });

  // Holographic angle based on mouse position
  const holoAngle = useTransform(mouseX, [-0.5, 0.5], [100, 260]);

  // Handle mouse/touch move for 3D tilt
  const handlePointerMove = useCallback((e: React.PointerEvent | PointerEvent) => {
    if (phase !== 'tilt' || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  }, [phase, mouseX, mouseY]);

  // Reset tilt when pointer leaves
  const handlePointerLeave = useCallback(() => {
    mouseX.set(0);
    mouseY.set(0);
  }, [mouseX, mouseY]);

  // Tear interaction
  const getX = (e: React.TouchEvent | React.MouseEvent | TouchEvent | MouseEvent) => {
    if ('touches' in e && e.touches.length > 0) return e.touches[0].clientX;
    if ('clientX' in e) return e.clientX;
    return 0;
  };

  const getY = (e: React.TouchEvent | React.MouseEvent | TouchEvent | MouseEvent) => {
    if ('touches' in e && e.touches.length > 0) return e.touches[0].clientY;
    if ('clientY' in e) return e.clientY;
    return 0;
  };

  const startTear = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (phase !== 'tilt') return;
    isTearing.current = true;
    setPhase('tearing');
    // Reset tilt to neutral
    mouseX.set(0);
    mouseY.set(0);
  }, [phase, mouseX, mouseY]);

  const moveTear = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (!isTearing.current || phase !== 'tearing' || !tearZoneRef.current) return;
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
      const newParticles = Array.from({ length: count }, () => ({
        id: particleId.current++,
        x,
        color: pct < 35 ? 'rgba(255,255,255,0.4)' : colors.particle,
        size: pct > 60 ? 4 + Math.random() * 3 : 2 + Math.random() * 2,
        dx: (Math.random() - 0.5) * 70,
        dy: -(50 + Math.random() * 70),
      }));
      setParticles(prev => [...prev, ...newParticles]);
      // Clean up old particles
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
      setPhase('torn');
      if ('vibrate' in navigator) navigator.vibrate([50, 30, 100]);
      // After torn animation, show glow
      setTimeout(() => setPhase('glow'), 800);
      // After glow, trigger callback
      setTimeout(() => {
        setPhase('done');
        onTearComplete();
      }, 2200);
    }
  }, [phase, tearProgress, colors.particle, onTearComplete]);

  const endTear = useCallback(() => {
    isTearing.current = false;
  }, []);

  // Build SVG tear line path
  const tearLinePath = tearPoints.length > 1
    ? `M ${tearPoints[0].x},${tearPoints[0].y}` + tearPoints.slice(1).map(p => ` L ${p.x},${p.y}`).join('')
    : '';

  // Tear line color based on progress
  const tearLineColor = tearProgress < 35 ? 'rgba(191,255,0,0.4)' : tearProgress < 60 ? 'rgba(191,255,0,0.7)' : '#BFFF00';

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#06061a]"
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      style={{ cursor: 'none' }}
    >
      <AnimatePresence>
        {/* Booster Pack */}
        {phase !== 'done' && (
          <motion.div
            className="relative"
            style={{
              perspective: 800,
              width: 210,
              height: 370,
            }}
            animate={phase === 'torn' || phase === 'glow' ? {
              scale: 0.85,
              y: 30,
            } : {}}
            transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          >
            {/* 3D Tilting Pack */}
            <motion.div
              className="w-full h-full relative"
              style={{
                transformStyle: 'preserve-3d',
                rotateX: phase === 'tilt' ? rotateX : 0,
                rotateY: phase === 'tilt' ? rotateY : 0,
                filter: 'drop-shadow(0 25px 35px rgba(0,0,0,0.5))',
              }}
            >
              {/* SVG Booster Shape */}
              <svg
                viewBox="0 0 210 370"
                className="absolute inset-0 w-full h-full"
                style={{ overflow: 'visible' }}
              >
                <defs>
                  <linearGradient id="boosterGrad" x1="0" y1="0" x2="1" y2="0.8">
                    <stop offset="0%" stopColor="#1a0e50" />
                    <stop offset="25%" stopColor="#2d1b6b" />
                    <stop offset="50%" stopColor="#3a2282" />
                    <stop offset="75%" stopColor="#2d1b6b" />
                    <stop offset="100%" stopColor="#180c45" />
                  </linearGradient>
                  <clipPath id="boosterClipFM">
                    <path d={BOOSTER_PATH} />
                  </clipPath>
                </defs>
                <path d={BOOSTER_PATH} fill="url(#boosterGrad)" />
              </svg>

              {/* Holographic foil overlay */}
              <motion.div
                className="absolute inset-0 pointer-events-none"
                style={{
                  clipPath: 'url(#boosterClipFM)',
                  background: useTransform(holoAngle, (a) =>
                    `linear-gradient(${a}deg, rgba(255,0,128,0.08), rgba(0,255,200,0.1), rgba(255,200,0,0.08), rgba(0,128,255,0.1), rgba(255,0,200,0.06))`
                  ),
                  mixBlendMode: 'color-dodge',
                }}
              />

              {/* 3D edge highlights */}
              <div className="absolute top-[7%] bottom-[7%] left-0 w-[6px] pointer-events-none"
                style={{ clipPath: 'url(#boosterClipFM)', background: 'linear-gradient(to right, rgba(255,255,255,0.12), transparent)' }} />
              <div className="absolute top-[7%] bottom-[7%] right-0 w-[8px] pointer-events-none"
                style={{ clipPath: 'url(#boosterClipFM)', background: 'linear-gradient(to left, rgba(0,0,0,0.4), transparent)' }} />

              {/* Pack content */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
                style={{ clipPath: 'url(#boosterClipFM)' }}>
                <span className="text-5xl mb-2" style={{ filter: 'drop-shadow(0 0 15px rgba(191,255,0,0.3))' }}>🏴‍☠️</span>
                <span className="text-[15px] font-extrabold text-[#BFFF00] uppercase tracking-[3px]"
                  style={{ textShadow: '0 0 10px rgba(191,255,0,0.4)' }}>
                  Pack Attack
                </span>
                <span className="text-[9px] text-white/40 uppercase tracking-[2px] mt-1">
                  {gameName || boxName}
                </span>
                <span className="absolute bottom-[18%] text-[9px] text-white/30 bg-black/30 px-3 py-0.5 rounded-full">
                  5 Cards
                </span>
              </div>

              {/* Seal */}
              <div className="absolute top-[15%] right-[12%] w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-black text-black z-10"
                style={{
                  background: 'radial-gradient(circle at 35% 35%, #e0ff60, #BFFF00, #80cc00)',
                  boxShadow: '0 2px 8px rgba(191,255,0,0.4)',
                }}>
                PA
              </div>

              {/* Tear Zone */}
              <div
                ref={tearZoneRef}
                className="absolute left-0 right-0 z-20"
                style={{
                  top: 'calc(22% - 35px)',
                  height: 70,
                  touchAction: 'none',
                  cursor: 'none',
                }}
                onMouseDown={startTear}
                onMouseMove={moveTear}
                onMouseUp={endTear}
                onTouchStart={startTear}
                onTouchMove={moveTear}
                onTouchEnd={endTear}
                onTouchCancel={endTear}
              >
                {/* Perforation line */}
                {phase === 'tilt' && (
                  <div className="absolute top-1/2 left-2 right-2 h-[2px] -translate-y-1/2"
                    style={{
                      background: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.3) 0px, rgba(255,255,255,0.3) 4px, transparent 4px, transparent 8px)',
                    }} />
                )}

                {/* SVG tear line */}
                <svg viewBox="0 0 210 70" className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
                  <defs>
                    <filter id="tearGlow">
                      <feGaussianBlur stdDeviation="1.5" result="b" />
                      <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
                    </filter>
                  </defs>
                  <path
                    d={tearLinePath}
                    fill="none"
                    stroke={tearLineColor}
                    strokeWidth={tearProgress > 60 ? 4 : 3}
                    filter="url(#tearGlow)"
                  />
                </svg>
              </div>

              {/* Particles from tear */}
              <div className="absolute left-0 right-0 pointer-events-none z-30" style={{ top: '22%', height: 0, overflow: 'visible' }}>
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
            </motion.div>

            {/* Torn top piece — flies away */}
            <AnimatePresence>
              {(phase === 'torn' || phase === 'glow') && (
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
                    <path fill="#2a1870" d={`
                      M 6,24 L 10,18 L 16,24 L 22,18 L 28,24 L 34,18 L 40,24 L 46,18 L 52,24 L 58,18
                      L 64,24 L 70,18 L 76,24 L 82,18 L 88,24 L 94,18 L 100,24 L 106,18 L 112,24 L 118,18
                      L 124,24 L 130,18 L 136,24 L 142,18 L 148,24 L 154,18 L 160,24 L 166,18 L 172,24
                      L 178,18 L 184,24 L 190,18 L 196,24 L 202,18 L 206,24
                      L 206,85 L 4,85 Z
                    `} />
                  </svg>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Inner glow after tear */}
            <AnimatePresence>
              {(phase === 'glow') && (
                <motion.div
                  className="absolute left-[10%] right-[10%] z-5 rounded-full pointer-events-none"
                  style={{
                    top: '18%',
                    height: '25%',
                    background: `radial-gradient(ellipse, ${colors.glow}, transparent)`,
                    filter: 'blur(12px)',
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 0.8, 0.5, 1, 0.6] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                />
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Screen flash on glow phase */}
      <AnimatePresence>
        {phase === 'glow' && (
          <motion.div
            className="fixed inset-0 pointer-events-none z-40"
            style={{ background: `radial-gradient(circle, ${colors.glow}, transparent 70%)` }}
            initial={{ opacity: 0.8 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
          />
        )}
      </AnimatePresence>

      {/* Hint text */}
      {phase === 'tilt' && (
        <motion.p
          className="absolute bottom-16 text-sm text-[#BFFF00] font-semibold"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          Entlang der Risskante ziehen →
        </motion.p>
      )}
    </div>
  );
}
