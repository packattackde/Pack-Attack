'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Swords, Coins, Users, Clock, Play, Check, Shield, Trophy, Sparkles, Crown, Star, Zap, Plus } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { AddBotsControl } from '../components/AddBotsControl';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';

type Participant = {
  id: string;
  userId: string;
  isReady: boolean;
  totalValue: number;
  user: { id: string; name: string | null; email: string; isBot?: boolean };
};

type BattlePull = {
  id: string;
  roundNumber: number;
  coinValue: number;
  itemName: string | null;
  itemImage: string | null;
  itemRarity: string | null;
  transferredToUserId: string | null;
  participantId: string;
  participant: { id: string; userId: string; user: any };
};

type RoundBox = {
  roundNumber: number;
  boxId: string;
  box: { id: string; name: string; imageUrl: string; price: number };
};

type Battle = {
  id: string;
  creatorId: string;
  status: string;
  rounds: number;
  battleMode: string;
  winCondition: string;
  maxParticipants: number;
  entryFee: number;
  lobbyExpiresAt: string | null;
  autoStartAt: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  winnerId: string | null;
  creator: { id: string; name: string | null; email: string };
  box: any;
  roundBoxes?: RoundBox[];
  participants: Participant[];
  winner: { id: string; name: string | null; email: string } | null;
  pulls: BattlePull[];
};

function getRarityColor(rarity: string | null): string {
  if (!rarity) return 'border-[rgba(255,255,255,0.08)]';
  const r = rarity.toLowerCase();
  if (r.includes('legend') || r.includes('mythic') || r.includes('secret') || r.includes('hyper'))
    return 'border-amber-400/60 shadow-[0_0_12px_rgba(251,191,36,0.25)]';
  if (r.includes('epic') || r.includes('ultra'))
    return 'border-purple-400/50 shadow-[0_0_8px_rgba(192,132,252,0.2)]';
  if (r.includes('rare') || r.includes('holo'))
    return 'border-blue-400/40';
  if (r.includes('uncommon'))
    return 'border-[#C84FFF]/30';
  return 'border-[rgba(255,255,255,0.08)]';
}

function formatTimer(ms: number): string {
  if (ms <= 0) return '0:00';
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function BattleDrawClient({ battle: initialBattle, currentUserId, isAdmin }: {
  battle: Battle;
  currentUserId: string | null;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const { addToast } = useToast();
  const t = useTranslations('battles');
  const [battle, setBattle] = useState<Battle>(initialBattle);
  const [joining, setJoining] = useState(false);
  const [readyLoading, setReadyLoading] = useState(false);
  const [starting, setStarting] = useState(false);
  const [lobbyMs, setLobbyMs] = useState(0);
  const [autoStartMs, setAutoStartMs] = useState(0);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentRevealRound, setCurrentRevealRound] = useState(0);
  const [revealedRounds, setRevealedRounds] = useState<Set<number>>(new Set());
  const [battleComplete, setBattleComplete] = useState(false);
  const [showWinnerReveal, setShowWinnerReveal] = useState(false);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const animationPlayedRef = useRef(false);

  const isCreator = currentUserId === battle.creatorId;
  const isParticipant = battle.participants.some(p => p.userId === currentUserId);
  const isFull = battle.participants.length >= battle.maxParticipants;
  const myParticipant = battle.participants.find(p => p.userId === currentUserId);
  const allReady = isFull && battle.participants.every(p => p.isReady);
  const readyCount = battle.participants.filter(p => p.isReady).length;

  const canJoin = battle.status === 'OPEN' && !isParticipant && !isFull && currentUserId && currentUserId !== battle.creatorId;
  const canReady = (battle.status === 'FULL' || battle.status === 'READY') && isParticipant && !myParticipant?.isReady;
  const canStart = (battle.status === 'FULL' || battle.status === 'READY') && (isCreator || isAdmin) && allReady;

  const isLobbyPhase = ['OPEN', 'FULL', 'READY'].includes(battle.status);

  // Polling
  useEffect(() => {
    if (['FINISHED_WIN', 'FINISHED_DRAW', 'CANCELLED'].includes(battle.status)) return;
    const poll = async () => {
      try {
        const res = await fetch(`/api/battles/${battle.id}/status`);
        const data = await res.json();
        if (data.success && data.battle) {
          setBattle(data.battle);
          if (['FINISHED_WIN', 'FINISHED_DRAW'].includes(data.battle.status) && !animationPlayedRef.current) {
            animationPlayedRef.current = true;
            runRevealAnimation(data.battle);
          }
          if (data.battle.status === 'CANCELLED') {
            addToast({ title: t('lobby.storniert'), description: t('lobby.storniertDesc') });
          }
        }
      } catch {}
    };
    pollingRef.current = setInterval(poll, 3000);
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [battle.id, battle.status]);

  // Lobby timer
  useEffect(() => {
    if (battle.status !== 'OPEN' || !battle.lobbyExpiresAt) return;
    const tick = () => setLobbyMs(Math.max(0, new Date(battle.lobbyExpiresAt!).getTime() - Date.now()));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [battle.status, battle.lobbyExpiresAt]);

  // Auto-start timer
  useEffect(() => {
    if (!['FULL', 'READY'].includes(battle.status) || !battle.autoStartAt) return;
    const tick = () => {
      const remaining = new Date(battle.autoStartAt!).getTime() - Date.now();
      setAutoStartMs(Math.max(0, remaining));
      if (remaining <= 0) {
        fetch(`/api/battles/${battle.id}/auto-start`, { method: 'POST' }).catch(() => {});
      }
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [battle.status, battle.autoStartAt, battle.id]);

  const runRevealAnimation = useCallback((b: Battle) => {
    if (!b.pulls || b.pulls.length === 0) {
      setBattleComplete(true);
      setShowWinnerReveal(true);
      return;
    }
    setIsDrawing(true);
    const maxRound = Math.max(...b.pulls.map(p => p.roundNumber));
    let round = 1;
    const revealNext = () => {
      setCurrentRevealRound(round);
      setRevealedRounds(prev => new Set([...prev, round]));
      round++;
      if (round <= maxRound) {
        setTimeout(revealNext, 2500);
      } else {
        setTimeout(() => {
          setIsDrawing(false);
          setBattleComplete(true);
          setTimeout(() => setShowWinnerReveal(true), 600);
        }, 2500);
      }
    };
    setTimeout(revealNext, 1000);
  }, []);

  const handleJoin = async () => {
    setJoining(true);
    try {
      const res = await fetch(`/api/battles/${battle.id}/join`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) { addToast({ title: t('lobby.joinFailed'), description: data.error, variant: 'destructive' }); return; }
      addToast({ title: t('lobby.joinedTitle'), description: t('lobby.joinedDesc') });
      if (data.battle) setBattle(data.battle);
    } catch { addToast({ title: t('lobby.joinFailed'), variant: 'destructive' }); }
    finally { setJoining(false); }
  };

  const handleReady = async () => {
    setReadyLoading(true);
    try {
      const isCurrentlyReady = myParticipant?.isReady;
      const res = await fetch(`/api/battles/${battle.id}/ready`, { method: isCurrentlyReady ? 'DELETE' : 'POST' });
      const data = await res.json();
      if (!res.ok) { addToast({ title: t('lobby.actionFailed'), description: data.error, variant: 'destructive' }); return; }
      addToast({ title: isCurrentlyReady ? t('lobby.readyRemoved') : t('lobby.ready') });
    } catch { addToast({ title: t('lobby.actionFailed'), variant: 'destructive' }); }
    finally { setReadyLoading(false); }
  };

  const handleStart = async () => {
    setStarting(true);
    try {
      const res = await fetch(`/api/battles/${battle.id}/start`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) { addToast({ title: t('lobby.startFailed'), description: data.error, variant: 'destructive' }); return; }
      if (data.battle) {
        setBattle(data.battle);
        if (!animationPlayedRef.current) { animationPlayedRef.current = true; runRevealAnimation(data.battle); }
      }
    } catch { addToast({ title: t('lobby.startFailed'), variant: 'destructive' }); }
    finally { setStarting(false); }
  };

  const pullsByRound = battle.pulls?.reduce((acc, pull) => {
    if (!acc[pull.roundNumber]) acc[pull.roundNumber] = [];
    acc[pull.roundNumber].push(pull);
    return acc;
  }, {} as Record<number, BattlePull[]>) || {};

  const participantTotals: Record<string, number> = {};
  for (const p of battle.participants) participantTotals[p.id] = 0;
  for (const pull of battle.pulls || []) {
    if (revealedRounds.has(pull.roundNumber)) {
      participantTotals[pull.participantId] = (participantTotals[pull.participantId] || 0) + pull.coinValue;
    }
  }

  const useLowest = battle.winCondition === 'LOWEST';
  const sortedByScore = [...battle.participants]
    .map(p => ({ ...p, runningTotal: participantTotals[p.id] || 0 }))
    .sort((a, b) => useLowest ? a.runningTotal - b.runningTotal : b.runningTotal - a.runningTotal);

  const emptySlots = battle.maxParticipants - battle.participants.length;

  return (
    <div className="min-h-screen font-display">
      <div className="fixed inset-0 bg-grid opacity-20 pointer-events-none" />
      <div className="fixed inset-0 radial-gradient pointer-events-none" />

      <div className="relative container py-10 sm:py-14 max-w-5xl">
        <Link href="/battles" className="inline-flex items-center gap-2 text-[#8888aa] hover:text-white mb-6 transition-colors text-sm">
          <ArrowLeft className="w-4 h-4" /> {t('lobby.backToBattles')}
        </Link>

        {/* ── Battle Header ── */}
        <div className="bg-[#12123a] border border-[rgba(255,255,255,0.08)] rounded-2xl p-5 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              {(battle.roundBoxes && battle.roundBoxes.length > 0) ? (
                <div className="flex -space-x-2 shrink-0">
                  {[...new Map(battle.roundBoxes.map(rb => [rb.boxId, rb])).values()].slice(0, 3).map((rb, i) => (
                    <div key={rb.boxId} className="w-10 h-10 rounded-lg overflow-hidden bg-[#1a1a4a] border-2 border-[#12123a]" style={{ zIndex: 3 - i }}>
                      <img src={rb.box.imageUrl} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              ) : battle.box?.imageUrl ? (
                <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-[#1a1a4a]">
                  <img src={battle.box.imageUrl} alt="" className="w-full h-full object-cover" />
                </div>
              ) : null}
              <div>
                <h1 className="text-lg font-bold text-white">
                  {battle.roundBoxes && battle.roundBoxes.length > 0
                    ? (() => {
                        const unique = [...new Set(battle.roundBoxes.map(rb => rb.box.name))];
                        return unique.length === 1 ? unique[0] : `${unique.length} ${t('boxMix')}`;
                      })()
                    : battle.box?.name || t('detail.battle')}
                </h1>
                <div className="flex items-center gap-2 text-xs text-[#666688]">
                  <span>{battle.rounds} {t('rounds')}</span>
                  <span>·</span>
                  <span>{t(`modeLabelsShort.${battle.battleMode}` as any)}</span>
                  <span>·</span>
                  <span>{t(`winConditionLabelsLong.${battle.winCondition}` as any)}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 text-amber-400 font-bold">
              <Coins className="w-4 h-4" />
              <span>{battle.entryFee} Coins</span>
            </div>
          </div>
        </div>

        {/* ── Lobby Phase: Player Seats + Timer ── */}
        {isLobbyPhase && !isDrawing && !battleComplete && (
          <>
            {/* Countdown / Timer */}
            {battle.status === 'OPEN' && lobbyMs > 0 && (
              <div className="mb-6 text-center">
                <div className={`inline-flex items-center gap-3 px-6 py-3 rounded-2xl border ${
                  lobbyMs < 60000 ? 'bg-red-500/10 border-red-500/20' : 'bg-amber-500/10 border-amber-500/20'
                }`}>
                  <Clock className={`w-5 h-5 ${lobbyMs < 60000 ? 'text-red-400' : 'text-amber-400'}`} />
                  <div>
                    <span className={`text-2xl font-bold font-mono ${lobbyMs < 60000 ? 'text-red-400' : 'text-amber-400'}`}>
                      {formatTimer(lobbyMs)}
                    </span>
                    <p className="text-xs text-[#666688]">{t('lobby.waitingForPlayers')}</p>
                  </div>
                </div>
              </div>
            )}

            {['FULL', 'READY'].includes(battle.status) && autoStartMs > 0 && (
              <div className="mb-6 text-center">
                <div className={`inline-flex items-center gap-3 px-6 py-3 rounded-2xl border ${
                  autoStartMs < 30000 ? 'bg-[#C84FFF]/10 border-[#C84FFF]/30' : 'bg-blue-500/10 border-blue-500/20'
                }`}>
                  <Play className={`w-5 h-5 ${autoStartMs < 30000 ? 'text-[#C84FFF]' : 'text-blue-400'}`} />
                  <div>
                    <span className={`text-2xl font-bold font-mono ${autoStartMs < 30000 ? 'text-[#C84FFF]' : 'text-blue-400'}`}>
                      {formatTimer(autoStartMs)}
                    </span>
                    <p className="text-xs text-[#666688]">
                      {allReady ? t('lobby.allReadyAutoStart') : t('lobby.readyCount', { ready: readyCount, total: battle.participants.length })}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Player Seats */}
            <div className="bg-[#1a1a4a] border border-[rgba(255,255,255,0.08)] rounded-2xl p-6 mb-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-sm font-semibold text-[#8888aa] uppercase tracking-wider">{t('lobby.participants')}</h2>
                <span className="text-xs text-[#666688]">{battle.participants.length}/{battle.maxParticipants}</span>
              </div>

              <div className="flex items-center justify-center gap-4 flex-wrap">
                {battle.participants.map((p, i) => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                    className="relative"
                  >
                    <div className={`w-24 h-28 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 transition-all duration-300 ${
                      p.isReady
                        ? 'border-[#C84FFF] bg-[#C84FFF]/10 shadow-[0_0_20px_rgba(200,79,255,0.15)]'
                        : 'border-[rgba(255,255,255,0.1)] bg-[#12123a]'
                    }`}>
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold transition-all duration-300 ${
                        p.isReady
                          ? 'bg-gradient-to-br from-[#C84FFF] to-[#9333EA] text-white shadow-[0_0_12px_rgba(200,79,255,0.3)]'
                          : 'bg-[#1a1a4a] text-[#8888aa]'
                      }`}>
                        {p.user.name?.[0]?.toUpperCase() || '?'}
                      </div>
                      <span className="text-xs text-white font-medium truncate max-w-[80px] text-center">
                        {p.user.name || t('lobby.playerFallback')}
                      </span>
                    </div>

                    {/* Creator crown */}
                    {p.userId === battle.creatorId && (
                      <div className="absolute -top-2 -left-2 w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center">
                        <Crown className="w-3 h-3 text-black" />
                      </div>
                    )}

                    {/* Ready indicator */}
                    {p.isReady && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-[#C84FFF] rounded-full flex items-center justify-center"
                      >
                        <Check className="w-3.5 h-3.5 text-white" />
                      </motion.div>
                    )}

                    {/* Bot badge */}
                    {isAdmin && p.user.isBot && (
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[9px] px-1.5 py-0.5 bg-purple-500/20 text-purple-400 rounded-full font-medium">
                        {t('lobby.bot')}
                      </div>
                    )}
                  </motion.div>
                ))}

                {/* VS divider between filled seats */}
                {battle.participants.length >= 2 && battle.participants.length < battle.maxParticipants && (
                  <div className="hidden sm:flex items-center px-2">
                    <span className="text-[#C84FFF]/30 font-bold text-sm">{t('lobby.vs')}</span>
                  </div>
                )}

                {/* Empty slots */}
                {Array.from({ length: emptySlots }).map((_, i) => (
                  <div
                    key={`empty-${i}`}
                    className="w-24 h-28 rounded-2xl border-2 border-dashed border-[rgba(255,255,255,0.08)] flex flex-col items-center justify-center gap-2 bg-[#0e0e2a]"
                  >
                    <div className="w-12 h-12 rounded-full border-2 border-dashed border-[rgba(255,255,255,0.08)] flex items-center justify-center animate-pulse">
                      <Plus className="w-5 h-5 text-[#444466]" />
                    </div>
                    <span className="text-[10px] text-[#444466]">{t('lobby.free')}</span>
                  </div>
                ))}
              </div>

              {/* VS divider for 2-player battles */}
              {battle.maxParticipants === 2 && battle.participants.length === 2 && (
                <div className="flex items-center justify-center my-4">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#C84FFF]/20 to-transparent" />
                  <motion.span
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="px-4 text-[#C84FFF] font-bold text-lg"
                  >
                    {t('lobby.vs')}
                  </motion.span>
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#C84FFF]/20 to-transparent" />
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 mb-6 justify-center">
              {canJoin && (
                <button
                  onClick={handleJoin}
                  disabled={joining}
                  className="px-8 py-3 bg-[#C84FFF] text-white font-semibold rounded-xl hover:bg-[#E879F9] transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {joining ? t('lobby.joining') : <><Swords className="w-4 h-4" /> {t('lobby.joinBattle')}</>}
                </button>
              )}

              {isParticipant && (battle.status === 'FULL' || battle.status === 'READY') && (
                <button
                  onClick={handleReady}
                  disabled={readyLoading}
                  className={`px-8 py-3 font-semibold rounded-xl transition-all disabled:opacity-50 flex items-center gap-2 ${
                    myParticipant?.isReady
                      ? 'bg-[#C84FFF]/20 text-[#E879F9] border border-[#C84FFF]/30'
                      : 'bg-[#C84FFF] text-white hover:bg-[#E879F9]'
                  }`}
                >
                  {readyLoading ? t('lobby.loading') : myParticipant?.isReady ? (
                    <><Check className="w-4 h-4" /> {t('lobby.ready')}</>
                  ) : (
                    <><Shield className="w-4 h-4" /> {t('lobby.markReady')}</>
                  )}
                </button>
              )}

              {canStart && (
                <button
                  onClick={handleStart}
                  disabled={starting}
                  className="px-8 py-3 bg-[#C84FFF] text-white font-semibold rounded-xl hover:bg-[#E879F9] transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {starting ? (
                    <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> {t('lobby.starting')}</>
                  ) : (
                    <><Play className="w-4 h-4" /> {t('lobby.startBattle')}</>
                  )}
                </button>
              )}
            </div>

            {/* Admin Bot Control */}
            {isAdmin && battle.status === 'OPEN' && (
              <div className="mb-6">
                <AddBotsControl battleId={battle.id} maxSlots={emptySlots} />
              </div>
            )}
          </>
        )}

        {/* ── Live Scoreboard during reveal ── */}
        {(isDrawing || battleComplete) && !showWinnerReveal && (
          <div className="bg-[#1a1a4a]/80 border border-[rgba(255,255,255,0.08)] rounded-2xl p-5 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-semibold text-[#8888aa] uppercase tracking-wider">{t('lobby.liveScoreboard')}</span>
            </div>
            <div className="space-y-2">
              {sortedByScore.map((p, i) => {
                const maxTotal = Math.max(...sortedByScore.map(s => s.runningTotal), 1);
                const barWidth = maxTotal > 0 ? (p.runningTotal / maxTotal) * 100 : 0;
                return (
                  <div key={p.id} className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      i === 0 ? 'bg-[#C84FFF] text-white' : 'bg-[#12123a] text-[#8888aa]'
                    }`}>{i + 1}</div>
                    <span className="text-white text-sm font-medium w-28 truncate">{p.user.name || p.user.email}</span>
                    <div className="flex-1 h-6 bg-[#12123a] rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${i === 0 ? 'bg-gradient-to-r from-[#C84FFF]/80 to-[#C84FFF]' : 'bg-gradient-to-r from-[#8888aa]/40 to-[#8888aa]/60'}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.max(barWidth, 2)}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                      />
                    </div>
                    <motion.span
                      key={p.runningTotal}
                      className="text-amber-400 font-bold text-sm w-20 text-right tabular-nums"
                      initial={{ scale: 1.3, color: '#C84FFF' }}
                      animate={{ scale: 1, color: '#fbbf24' }}
                      transition={{ duration: 0.4 }}
                    >
                      {p.runningTotal.toFixed(2)}
                    </motion.span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Round Reveals ── */}
        {(isDrawing || battleComplete) && !showWinnerReveal && Object.keys(pullsByRound).length > 0 && (
          <div className="space-y-4 mb-6">
            <h2 className="text-sm font-semibold text-[#8888aa] uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#C84FFF]" /> {t('lobby.roundResults')}
            </h2>
            {Array.from({ length: battle.rounds }, (_, i) => i + 1).map((round) => {
              const roundPulls = pullsByRound[round] || [];
              const isRevealed = revealedRounds.has(round);
              const isCurrent = currentRevealRound === round && isDrawing;

              if (!isRevealed) {
                return (
                  <div key={round} className="bg-[#0e0e2a] border border-dashed border-[rgba(255,255,255,0.05)] rounded-xl p-4 flex items-center justify-center">
                    <span className="text-[#333355] text-sm">{t('detail.roundLabel')} {round}</span>
                  </div>
                );
              }

              const roundHighest = Math.max(...roundPulls.map(p => p.coinValue));

              return (
                <AnimatePresence key={round}>
                  <motion.div
                    initial={{ opacity: 0, y: 30, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className={`bg-[#1a1a4a] border rounded-2xl overflow-hidden ${
                      isCurrent ? 'border-[#C84FFF]/40 shadow-[0_0_25px_rgba(200,79,255,0.1)]' : 'border-[rgba(255,255,255,0.06)]'
                    }`}
                  >
                    <div className={`px-5 py-2.5 flex items-center justify-between ${
                      isCurrent ? 'bg-[#C84FFF]/5' : 'bg-[#12123a]/50'
                    }`}>
                      <div className="flex items-center gap-2">
                        {isCurrent && <span className="w-2 h-2 rounded-full bg-[#C84FFF] animate-pulse" />}
                        <span className="text-sm font-bold text-white">{t('detail.roundLabel')} {round}</span>
                        {battle.roundBoxes && battle.roundBoxes.length > 0 && (() => {
                          const rb = battle.roundBoxes!.find(r => r.roundNumber === round);
                          return rb ? (
                            <span className="text-xs text-[#8888aa] flex items-center gap-1.5">
                              <img src={rb.box.imageUrl} alt="" className="w-4 h-4 rounded object-cover" />
                              {rb.box.name}
                            </span>
                          ) : null;
                        })()}
                      </div>
                      <span className="text-xs text-[#666688]">{round}/{battle.rounds}</span>
                    </div>
                    <div className="p-5">
                      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${Math.min(roundPulls.length, 4)}, 1fr)` }}>
                        {roundPulls.map((pull, pullIdx) => {
                          const pName = battle.participants.find(p => p.id === pull.participantId)?.user?.name || '?';
                          const isRoundBest = pull.coinValue === roundHighest && roundPulls.filter(p => p.coinValue === roundHighest).length === 1;
                          const isTransferred = !!pull.transferredToUserId;

                          return (
                            <motion.div
                              key={pull.id}
                              initial={{ scale: 0.5, opacity: 0, rotateY: 90 }}
                              animate={{ scale: 1, opacity: 1, rotateY: 0 }}
                              transition={{ delay: pullIdx * 0.15, duration: 0.5, ease: 'easeOut' }}
                              className={`relative rounded-xl border p-4 text-center ${getRarityColor(pull.itemRarity)} ${
                                isTransferred ? 'bg-red-500/5' : 'bg-[#12123a]'
                              }`}
                            >
                              {isRoundBest && (
                                <div className="absolute -top-2 -right-2 w-6 h-6 bg-[#C84FFF] rounded-full flex items-center justify-center">
                                  <Star className="w-3.5 h-3.5 text-black" />
                                </div>
                              )}
                              <div className="text-xs text-[#8888aa] mb-2 font-medium truncate">{pName}</div>
                              {pull.itemImage ? (
                                <div className="relative mx-auto w-20 h-28 mb-3">
                                  <img src={pull.itemImage} alt={pull.itemName || ''} className="w-full h-full object-cover rounded-lg" />
                                </div>
                              ) : (
                                <div className="mx-auto w-20 h-28 mb-3 bg-[#1a1a4a] rounded-lg flex items-center justify-center">
                                  <span className="text-[#555577] text-2xl">?</span>
                                </div>
                              )}
                              <div className="text-sm text-white font-semibold truncate mb-1">{pull.itemName || '?'}</div>
                              {pull.itemRarity && (
                                <div className="text-[10px] text-[#8888aa] mb-1 uppercase tracking-wider">{pull.itemRarity}</div>
                              )}
                              <div className="text-amber-400 font-bold">{pull.coinValue.toFixed(2)}</div>
                              {isTransferred && (
                                <div className="mt-1 text-[10px] text-red-400 font-medium">{t('detail.transferred')}</div>
                              )}
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>
              );
            })}
          </div>
        )}

        {/* ── Winner Reveal ── */}
        <AnimatePresence>
          {showWinnerReveal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="mb-6">
              {battle.status === 'FINISHED_DRAW' ? (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  className="bg-gradient-to-b from-blue-500/10 to-blue-500/5 border border-blue-500/30 rounded-3xl p-10 text-center"
                >
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3, type: 'spring', stiffness: 200 }} className="text-7xl mb-5">
                    🤝
                  </motion.div>
                  <h2 className="text-3xl font-bold text-white mb-3">{t('lobby.drawResult')}</h2>
                  <p className="text-[#8888aa] text-lg max-w-md mx-auto">{t('lobby.drawResultDesc')}</p>
                  <div className="mt-6 flex items-center justify-center gap-6">
                    {battle.participants.map(p => (
                      <div key={p.id} className="text-center">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-xl font-bold text-white mx-auto mb-2">
                          {p.user.name?.[0] || '?'}
                        </div>
                        <div className="text-white text-sm font-medium">{p.user.name || p.user.email}</div>
                        <div className="text-amber-400 font-bold">{(participantTotals[p.id] || 0).toFixed(2)}</div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ) : battle.winnerId ? (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  className="relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-[#C84FFF]/8 via-transparent to-transparent rounded-3xl" />
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#C84FFF]/5 rounded-full blur-[100px]" />

                  <div className={`relative border rounded-3xl p-10 ${
                    battle.winnerId === currentUserId
                      ? 'border-[#C84FFF]/40 bg-[#C84FFF]/5'
                      : 'border-[rgba(255,255,255,0.12)] bg-[#1a1a4a]/80'
                  }`}>
                    <div className="flex justify-center mb-6">
                      <motion.div
                        initial={{ y: -60, opacity: 0, scale: 0.3 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2, type: 'spring', stiffness: 150, damping: 12 }}
                        className="relative"
                      >
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-400 via-yellow-300 to-amber-500 flex items-center justify-center shadow-[0_0_60px_rgba(251,191,36,0.4)]">
                          <Trophy className="w-12 h-12 text-black" />
                        </div>
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: [0, 1.5, 1] }}
                          transition={{ delay: 0.6, duration: 0.5 }}
                          className="absolute -top-1 -right-1 w-8 h-8 bg-[#C84FFF] rounded-full flex items-center justify-center"
                        >
                          <Crown className="w-4 h-4 text-black" />
                        </motion.div>
                      </motion.div>
                    </div>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="text-center mb-8">
                      {battle.winnerId === currentUserId ? (
                        <>
                          <h2 className="text-4xl font-bold text-[#C84FFF] mb-2">{t('detail.youWon')}</h2>
                          <p className="text-[#8888aa] text-lg">{t('detail.congrats')}</p>
                        </>
                      ) : (
                        <>
                          <h2 className="text-4xl font-bold text-white mb-2">{battle.winner?.name || t('lobby.playerFallback')} {t('detail.wins')}</h2>
                          <p className="text-[#8888aa] text-lg">{t('detail.betterLuck')}</p>
                        </>
                      )}
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.7 }}
                      className="flex items-stretch justify-center gap-4 mb-8 max-w-2xl mx-auto"
                    >
                      {sortedByScore.map((p, i) => {
                        const isWinner = p.userId === battle.winnerId;
                        return (
                          <motion.div
                            key={p.id}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.8 + i * 0.15 }}
                            className={`flex-1 rounded-2xl p-5 text-center border ${
                              isWinner ? 'bg-[#C84FFF]/10 border-[#C84FFF]/30' : 'bg-[#12123a] border-[rgba(255,255,255,0.08)]'
                            }`}
                          >
                            <div className={`w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center text-lg font-bold ${
                              isWinner ? 'bg-gradient-to-br from-[#C84FFF] to-[#9333EA] text-white' : 'bg-[#1a1a4a] text-[#8888aa]'
                            }`}>{p.user.name?.[0] || '?'}</div>
                            <div className="text-white font-semibold mb-1 truncate">{p.user.name || p.user.email}</div>
                            <div className={`text-2xl font-bold mb-1 ${isWinner ? 'text-[#C84FFF]' : 'text-amber-400'}`}>
                              {p.runningTotal.toFixed(2)}
                            </div>
                            <div className="text-xs text-[#8888aa]">{isWinner ? '👑' : ''}</div>
                            {isWinner && <Crown className="w-5 h-5 text-[#C84FFF] mx-auto mt-2" />}
                          </motion.div>
                        );
                      })}
                    </motion.div>

                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }} className="text-center">
                      <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#12123a] rounded-full text-sm">
                        <Zap className="w-4 h-4 text-[#C84FFF]" />
                        <span className="text-[#8888aa]">
                          {battle.battleMode === 'LOWEST_CARD' && t('lobby.lowestCardTransfer')}
                          {battle.battleMode === 'HIGHEST_CARD' && t('lobby.highestCardTransfer')}
                        </span>
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              ) : null}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Post-battle actions */}
        {battleComplete && (
          <div className="flex gap-3 justify-center">
            <Link href="/battles" className="px-6 py-3 bg-[#12123a] text-white font-semibold rounded-xl hover:bg-[#1a1a4a] transition-all border border-[rgba(255,255,255,0.08)]">
              {t('detail.backToLobby')}
            </Link>
            <Link href="/battles/create" className="px-6 py-3 bg-[#C84FFF] text-white font-semibold rounded-xl hover:bg-[#E879F9] transition-all">
              {t('detail.newBattle')}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
