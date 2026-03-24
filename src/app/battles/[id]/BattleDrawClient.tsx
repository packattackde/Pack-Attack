'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Swords, Coins, Users, Clock, Play, Check, Shield, Trophy, Sparkles, Crown, Star, Zap } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { AddBotsControl } from '../components/AddBotsControl';
import { motion, AnimatePresence } from 'framer-motion';

const MODE_LABELS: Record<string, string> = {
  LOWEST_CARD: 'Niedrigste Karte',
  HIGHEST_CARD: 'Höchste Karte',
  ALL_CARDS: 'Alle Karten',
};

const WIN_CONDITION_LABELS: Record<string, string> = {
  HIGHEST: 'Höchster Gesamtwert gewinnt',
  LOWEST: 'Niedrigster Gesamtwert gewinnt',
};

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
    return 'border-green-400/30';
  return 'border-[rgba(255,255,255,0.08)]';
}

export function BattleDrawClient({ battle: initialBattle, currentUserId, isAdmin }: {
  battle: Battle;
  currentUserId: string | null;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const { addToast } = useToast();
  const [battle, setBattle] = useState<Battle>(initialBattle);
  const [joining, setJoining] = useState(false);
  const [readyLoading, setReadyLoading] = useState(false);
  const [starting, setStarting] = useState(false);
  const [lobbyTimeLeft, setLobbyTimeLeft] = useState('');
  const [autoStartTimeLeft, setAutoStartTimeLeft] = useState('');
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

  const canJoin = battle.status === 'OPEN' && !isParticipant && !isFull && currentUserId && currentUserId !== battle.creatorId;
  const canReady = (battle.status === 'FULL' || battle.status === 'READY') && isParticipant && !myParticipant?.isReady;
  const canStart = (battle.status === 'FULL' || battle.status === 'READY') && (isCreator || isAdmin) && allReady;

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
            addToast({ title: 'Battle storniert', description: 'Das Battle wurde automatisch storniert.' });
          }
        }
      } catch {}
    };

    pollingRef.current = setInterval(poll, 3000);
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [battle.id, battle.status]);

  useEffect(() => {
    if (battle.status !== 'OPEN' || !battle.lobbyExpiresAt) return;
    const interval = setInterval(() => {
      const remaining = new Date(battle.lobbyExpiresAt!).getTime() - Date.now();
      if (remaining <= 0) {
        setLobbyTimeLeft('Abgelaufen');
        clearInterval(interval);
      } else {
        const m = Math.floor(remaining / 60000);
        const s = Math.floor((remaining % 60000) / 1000);
        setLobbyTimeLeft(`${m}:${s.toString().padStart(2, '0')}`);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [battle.status, battle.lobbyExpiresAt]);

  useEffect(() => {
    if (!['FULL', 'READY'].includes(battle.status) || !battle.autoStartAt) return;
    const interval = setInterval(() => {
      const remaining = new Date(battle.autoStartAt!).getTime() - Date.now();
      if (remaining <= 0) {
        setAutoStartTimeLeft('Startet...');
        clearInterval(interval);
        fetch(`/api/battles/${battle.id}/auto-start`, { method: 'POST' }).catch(() => {});
      } else {
        const m = Math.floor(remaining / 60000);
        const s = Math.floor((remaining % 60000) / 1000);
        setAutoStartTimeLeft(`${m}:${s.toString().padStart(2, '0')}`);
      }
    }, 1000);
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
      if (!res.ok) {
        addToast({ title: 'Fehler', description: data.error, variant: 'destructive' });
        return;
      }
      addToast({ title: 'Beigetreten!', description: 'Du bist dem Battle beigetreten.' });
      if (data.battle) setBattle(data.battle);
    } catch {
      addToast({ title: 'Fehler', description: 'Beitritt fehlgeschlagen', variant: 'destructive' });
    } finally {
      setJoining(false);
    }
  };

  const handleReady = async () => {
    setReadyLoading(true);
    try {
      const isCurrentlyReady = myParticipant?.isReady;
      const res = await fetch(`/api/battles/${battle.id}/ready`, {
        method: isCurrentlyReady ? 'DELETE' : 'POST',
      });
      const data = await res.json();
      if (!res.ok) {
        addToast({ title: 'Fehler', description: data.error, variant: 'destructive' });
        return;
      }
      addToast({ title: isCurrentlyReady ? 'Bereit aufgehoben' : 'Bereit!', description: isCurrentlyReady ? 'Du bist nicht mehr bereit.' : 'Du bist bereit!' });
    } catch {
      addToast({ title: 'Fehler', description: 'Aktion fehlgeschlagen', variant: 'destructive' });
    } finally {
      setReadyLoading(false);
    }
  };

  const handleStart = async () => {
    setStarting(true);
    try {
      const res = await fetch(`/api/battles/${battle.id}/start`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        addToast({ title: 'Fehler', description: data.error, variant: 'destructive' });
        return;
      }
      if (data.battle) {
        setBattle(data.battle);
        if (!animationPlayedRef.current) {
          animationPlayedRef.current = true;
          runRevealAnimation(data.battle);
        }
      }
    } catch {
      addToast({ title: 'Fehler', description: 'Start fehlgeschlagen', variant: 'destructive' });
    } finally {
      setStarting(false);
    }
  };

  const pullsByRound = battle.pulls?.reduce((acc, pull) => {
    if (!acc[pull.roundNumber]) acc[pull.roundNumber] = [];
    acc[pull.roundNumber].push(pull);
    return acc;
  }, {} as Record<number, BattlePull[]>) || {};

  const participantTotals: Record<string, number> = {};
  for (const p of battle.participants) {
    participantTotals[p.id] = 0;
  }
  for (const pull of battle.pulls || []) {
    if (revealedRounds.has(pull.roundNumber)) {
      participantTotals[pull.participantId] = (participantTotals[pull.participantId] || 0) + pull.coinValue;
    }
  }

  const useLowest = battle.winCondition === 'LOWEST';
  const sortedByScore = [...battle.participants]
    .map(p => ({ ...p, runningTotal: participantTotals[p.id] || 0 }))
    .sort((a, b) => useLowest ? a.runningTotal - b.runningTotal : b.runningTotal - a.runningTotal);

  const winnerParticipant = battle.winnerId
    ? battle.participants.find(p => p.userId === battle.winnerId)
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#06061a] via-[#0B0B2B] to-[#06061a] font-display">
      <div className="fixed inset-0 bg-grid opacity-30" />
      <div className="fixed inset-0 radial-gradient" />

      <div className="relative container py-14 sm:py-16 max-w-5xl">
        <Link href="/battles" className="inline-flex items-center gap-2 text-[#8888aa] hover:text-white mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Zurück zu Battles
        </Link>

        {/* Battle Header */}
        <div className="bg-[#1a1a4a] border border-[rgba(255,255,255,0.12)] rounded-2xl p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Swords className="w-5 h-5 text-[#BFFF00]" />
                <h1 className="text-2xl font-bold text-white">Battle #{battle.id.slice(-6)}</h1>
              </div>
              <p className="text-[#8888aa]">{battle.box?.name || 'Unbekannte Box'}</p>
            </div>
            <div className="flex flex-wrap gap-3 text-sm">
              <div className="px-3 py-1.5 bg-[#12123a] rounded-lg text-[#f0f0f5]">
                <span className="text-[#8888aa]">Belohnung:</span> {MODE_LABELS[battle.battleMode] || battle.battleMode}
              </div>
              <div className="px-3 py-1.5 bg-[#12123a] rounded-lg text-[#f0f0f5]">
                <span className="text-[#8888aa]">Gewinnlogik:</span> {WIN_CONDITION_LABELS[battle.winCondition] || battle.winCondition}
              </div>
              <div className="px-3 py-1.5 bg-[#12123a] rounded-lg text-[#f0f0f5]">
                <span className="text-[#8888aa]">Spieler:</span> {battle.participants.length}/{battle.maxParticipants}
              </div>
              <div className="px-3 py-1.5 bg-[#12123a] rounded-lg text-[#f0f0f5]">
                <span className="text-[#8888aa]">Runden:</span> {battle.rounds}
              </div>
              <div className="px-3 py-1.5 bg-[#12123a] rounded-lg text-amber-400 flex items-center gap-1">
                <Coins className="w-3 h-3" />
                {battle.entryFee}
              </div>
            </div>
          </div>
        </div>

        {/* Lobby Timer */}
        {battle.status === 'OPEN' && lobbyTimeLeft && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-6 flex items-center gap-3">
            <Clock className="w-5 h-5 text-yellow-400" />
            <div>
              <span className="text-yellow-400 font-semibold">Lobby-Timer: {lobbyTimeLeft}</span>
              <p className="text-sm text-[#8888aa]">Warte auf Mitspieler...</p>
            </div>
          </div>
        )}

        {/* Auto-start Timer */}
        {['FULL', 'READY'].includes(battle.status) && autoStartTimeLeft && (
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-6 flex items-center gap-3">
            <Play className="w-5 h-5 text-blue-400" />
            <div>
              <span className="text-blue-400 font-semibold">Auto-Start in: {autoStartTimeLeft}</span>
              <p className="text-sm text-[#8888aa]">
                {allReady ? 'Alle Spieler sind bereit!' : 'Warte auf Bereit-Markierung...'}
              </p>
            </div>
          </div>
        )}

        {/* Live Scoreboard during reveal */}
        {(isDrawing || battleComplete) && !showWinnerReveal && (
          <div className="bg-[#1a1a4a]/80 border border-[rgba(255,255,255,0.08)] rounded-2xl p-5 mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-semibold text-[#8888aa] uppercase tracking-wider">Live Punktestand</span>
            </div>
            <div className="space-y-2">
              {sortedByScore.map((p, i) => {
                const maxTotal = Math.max(...sortedByScore.map(s => s.runningTotal), 1);
                const barWidth = maxTotal > 0 ? (p.runningTotal / maxTotal) * 100 : 0;
                return (
                  <div key={p.id} className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      i === 0 ? 'bg-[#BFFF00] text-black' : 'bg-[#12123a] text-[#8888aa]'
                    }`}>
                      {i + 1}
                    </div>
                    <span className="text-white text-sm font-medium w-28 truncate">{p.user.name || p.user.email}</span>
                    <div className="flex-1 h-6 bg-[#12123a] rounded-full overflow-hidden relative">
                      <motion.div
                        className={`h-full rounded-full ${i === 0 ? 'bg-gradient-to-r from-[#BFFF00]/80 to-[#BFFF00]' : 'bg-gradient-to-r from-[#8888aa]/40 to-[#8888aa]/60'}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.max(barWidth, 2)}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                      />
                    </div>
                    <motion.span
                      key={p.runningTotal}
                      className="text-amber-400 font-bold text-sm w-20 text-right tabular-nums"
                      initial={{ scale: 1.3, color: '#BFFF00' }}
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

        {/* Participants (lobby only) */}
        {!isDrawing && !battleComplete && (
          <div className="bg-[#1a1a4a] border border-[rgba(255,255,255,0.12)] rounded-2xl p-6 mb-8">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-[#BFFF00]" />
              Teilnehmer
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {battle.participants.map((p) => (
                <div
                  key={p.id}
                  className={`flex items-center gap-3 p-4 rounded-xl border ${
                    p.isReady ? 'border-green-500/30 bg-green-500/5' : 'border-[rgba(255,255,255,0.08)] bg-[#12123a]'
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#BFFF00] to-[#a0d600] flex items-center justify-center text-sm font-bold text-black">
                    {p.user.name?.[0] || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium truncate">
                        {p.user.name || p.user.email}
                      </span>
                      {p.userId === battle.creatorId && (
                        <Crown className="w-3.5 h-3.5 text-amber-400" />
                      )}
                      {isAdmin && p.user.isBot && (
                        <span className="text-xs px-1.5 py-0.5 bg-purple-500/20 text-purple-400 rounded">Bot</span>
                      )}
                    </div>
                    <div className="text-xs text-[#8888aa]">
                      {p.isReady ? (
                        <span className="text-green-400 flex items-center gap-1"><Check className="w-3 h-3" /> Bereit</span>
                      ) : (
                        'Wartet...'
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {Array.from({ length: battle.maxParticipants - battle.participants.length }).map((_, i) => (
                <div key={`empty-${i}`} className="flex items-center gap-3 p-4 rounded-xl border border-dashed border-[rgba(255,255,255,0.1)] bg-[#12123a]/50">
                  <div className="w-10 h-10 rounded-full bg-[#1a1a4a] flex items-center justify-center">
                    <Users className="w-4 h-4 text-[#8888aa]" />
                  </div>
                  <span className="text-[#8888aa] text-sm">Freier Platz</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Round Reveals */}
        {(isDrawing || battleComplete) && !showWinnerReveal && Object.keys(pullsByRound).length > 0 && (
          <div className="space-y-5 mb-8">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#BFFF00]" />
              Rundenergebnisse
            </h2>
            {Array.from({ length: battle.rounds }, (_, i) => i + 1).map((round) => {
              const roundPulls = pullsByRound[round] || [];
              const isRevealed = revealedRounds.has(round);
              const isCurrent = currentRevealRound === round && isDrawing;

              if (!isRevealed) {
                return (
                  <div key={round} className="bg-[#12123a]/50 border border-dashed border-[rgba(255,255,255,0.06)] rounded-xl p-4 flex items-center justify-center">
                    <span className="text-[#555577] text-sm">Runde {round}</span>
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
                      isCurrent ? 'border-[#BFFF00]/50 shadow-[0_0_30px_rgba(191,255,0,0.12)]' : 'border-[rgba(255,255,255,0.08)]'
                    }`}
                  >
                    <div className={`px-5 py-3 flex items-center justify-between ${
                      isCurrent ? 'bg-[#BFFF00]/5' : 'bg-[#12123a]/50'
                    }`}>
                      <div className="flex items-center gap-2">
                        {isCurrent && <div className="w-2 h-2 rounded-full bg-[#BFFF00] pulse-live" />}
                        <span className="text-sm font-bold text-white">Runde {round}</span>
                      </div>
                      <span className="text-xs text-[#8888aa]">{round} / {battle.rounds}</span>
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
                                <div className="absolute -top-2 -right-2 w-6 h-6 bg-[#BFFF00] rounded-full flex items-center justify-center">
                                  <Star className="w-3.5 h-3.5 text-black" />
                                </div>
                              )}
                              <div className="text-xs text-[#8888aa] mb-2 font-medium truncate">{pName}</div>
                              {pull.itemImage ? (
                                <div className="relative mx-auto w-20 h-28 mb-3">
                                  <img
                                    src={pull.itemImage}
                                    alt={pull.itemName || ''}
                                    className="w-full h-full object-cover rounded-lg"
                                  />
                                </div>
                              ) : (
                                <div className="mx-auto w-20 h-28 mb-3 bg-[#1a1a4a] rounded-lg flex items-center justify-center">
                                  <span className="text-[#555577] text-2xl">?</span>
                                </div>
                              )}
                              <div className="text-sm text-white font-semibold truncate mb-1">{pull.itemName || 'Unbekannt'}</div>
                              {pull.itemRarity && (
                                <div className="text-[10px] text-[#8888aa] mb-1 uppercase tracking-wider">{pull.itemRarity}</div>
                              )}
                              <div className="text-amber-400 font-bold">{pull.coinValue.toFixed(2)}</div>
                              {isTransferred && (
                                <div className="mt-1 text-[10px] text-red-400 font-medium">Übertragen ↗</div>
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

        {/* Winner Reveal */}
        <AnimatePresence>
          {showWinnerReveal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="mb-8"
            >
              {battle.status === 'FINISHED_DRAW' ? (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  className="bg-gradient-to-b from-blue-500/10 to-blue-500/5 border border-blue-500/30 rounded-3xl p-10 text-center"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
                    className="text-7xl mb-5"
                  >
                    🤝
                  </motion.div>
                  <h2 className="text-3xl font-bold text-white mb-3">Unentschieden!</h2>
                  <p className="text-[#8888aa] text-lg max-w-md mx-auto">
                    Alle Spieler haben den gleichen Gesamtwert erreicht. Keine Karten wurden übertragen.
                  </p>
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
                  {/* Background glow */}
                  <div className="absolute inset-0 bg-gradient-to-b from-[#BFFF00]/8 via-transparent to-transparent rounded-3xl" />
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#BFFF00]/5 rounded-full blur-[100px]" />

                  <div className={`relative border rounded-3xl p-10 ${
                    battle.winnerId === currentUserId
                      ? 'border-[#BFFF00]/40 bg-[#BFFF00]/5'
                      : 'border-[rgba(255,255,255,0.12)] bg-[#1a1a4a]/80'
                  }`}>
                    {/* Trophy animation */}
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
                          className="absolute -top-1 -right-1 w-8 h-8 bg-[#BFFF00] rounded-full flex items-center justify-center"
                        >
                          <Crown className="w-4 h-4 text-black" />
                        </motion.div>
                      </motion.div>
                    </div>

                    {/* Winner name */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className="text-center mb-8"
                    >
                      {battle.winnerId === currentUserId ? (
                        <>
                          <h2 className="text-4xl font-bold text-[#BFFF00] mb-2">Du hast gewonnen!</h2>
                          <p className="text-[#8888aa] text-lg">Glückwunsch zum Sieg!</p>
                        </>
                      ) : (
                        <>
                          <h2 className="text-4xl font-bold text-white mb-2">
                            {battle.winner?.name || 'Spieler'} gewinnt!
                          </h2>
                          <p className="text-[#8888aa] text-lg">Nächstes Mal hast du mehr Glück!</p>
                        </>
                      )}
                    </motion.div>

                    {/* Final scores */}
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
                              isWinner
                                ? 'bg-[#BFFF00]/10 border-[#BFFF00]/30'
                                : 'bg-[#12123a] border-[rgba(255,255,255,0.08)]'
                            }`}
                          >
                            <div className={`w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center text-lg font-bold ${
                              isWinner
                                ? 'bg-gradient-to-br from-[#BFFF00] to-[#a0d600] text-black'
                                : 'bg-[#1a1a4a] text-[#8888aa]'
                            }`}>
                              {p.user.name?.[0] || '?'}
                            </div>
                            <div className="text-white font-semibold mb-1 truncate">{p.user.name || p.user.email}</div>
                            <div className={`text-2xl font-bold mb-1 ${isWinner ? 'text-[#BFFF00]' : 'text-amber-400'}`}>
                              {p.runningTotal.toFixed(2)}
                            </div>
                            <div className="text-xs text-[#8888aa]">
                              {isWinner ? 'Gewinner' : battle.status === 'FINISHED_DRAW' ? 'Unentschieden' : 'Verlierer'}
                            </div>
                            {isWinner && (
                              <div className="mt-2">
                                <Crown className="w-5 h-5 text-[#BFFF00] mx-auto" />
                              </div>
                            )}
                          </motion.div>
                        );
                      })}
                    </motion.div>

                    {/* Reward info */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1.2 }}
                      className="text-center"
                    >
                      <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#12123a] rounded-full text-sm">
                        <Zap className="w-4 h-4 text-[#BFFF00]" />
                        <span className="text-[#8888aa]">
                          {battle.battleMode === 'LOWEST_CARD' && 'Die niedrigste Karte des Verlierers wurde übertragen'}
                          {battle.battleMode === 'HIGHEST_CARD' && 'Die höchste Karte des Verlierers wurde übertragen'}
                          {battle.battleMode === 'ALL_CARDS' && 'Alle Karten des Verlierers wurden übertragen'}
                        </span>
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              ) : null}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          {canJoin && (
            <button
              onClick={handleJoin}
              disabled={joining}
              className="px-6 py-3 bg-[#BFFF00] text-black font-semibold rounded-xl hover:bg-[#d4ff4d] transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {joining ? 'Trete bei...' : 'Battle beitreten'}
              <Swords className="w-4 h-4" />
            </button>
          )}

          {isParticipant && (battle.status === 'FULL' || battle.status === 'READY') && (
            <button
              onClick={handleReady}
              disabled={readyLoading}
              className={`px-6 py-3 font-semibold rounded-xl transition-all disabled:opacity-50 flex items-center gap-2 ${
                myParticipant?.isReady
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : 'bg-[#BFFF00] text-black hover:bg-[#d4ff4d]'
              }`}
            >
              {readyLoading ? 'Lade...' : myParticipant?.isReady ? (
                <><Check className="w-4 h-4" /> Bereit!</>
              ) : (
                <><Shield className="w-4 h-4" /> Bereit melden</>
              )}
            </button>
          )}

          {canStart && (
            <button
              onClick={handleStart}
              disabled={starting}
              className="px-6 py-3 bg-[#BFFF00] text-black font-semibold rounded-xl hover:bg-[#d4ff4d] transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {starting ? (
                <><div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> Startet...</>
              ) : (
                <><Play className="w-4 h-4" /> Battle starten</>
              )}
            </button>
          )}

          {battleComplete && (
            <div className="flex gap-3">
              <Link href="/battles" className="px-6 py-3 bg-[#12123a] text-white font-semibold rounded-xl hover:bg-[#1a1a4a] transition-all border border-[rgba(255,255,255,0.12)]">
                Zurück zur Lobby
              </Link>
              <Link href="/battles/create" className="px-6 py-3 bg-[#BFFF00] text-black font-semibold rounded-xl hover:bg-[#d4ff4d] transition-all">
                Neues Battle
              </Link>
            </div>
          )}
        </div>

        {/* Admin Bot Control */}
        {isAdmin && battle.status === 'OPEN' && (
          <div className="mt-8">
            <AddBotsControl battleId={battle.id} maxSlots={battle.maxParticipants - battle.participants.length} />
          </div>
        )}
      </div>
    </div>
  );
}
