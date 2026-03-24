'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Swords, Coins, Users, Clock, Play, Check, Shield, Trophy, Sparkles, Crown } from 'lucide-react';
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

  // Polling for status updates
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

  // Lobby countdown
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

  // Auto-start countdown
  useEffect(() => {
    if (!['FULL', 'READY'].includes(battle.status) || !battle.autoStartAt) return;
    const interval = setInterval(() => {
      const remaining = new Date(battle.autoStartAt!).getTime() - Date.now();
      if (remaining <= 0) {
        setAutoStartTimeLeft('Startet...');
        clearInterval(interval);
        // Trigger auto-start
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
        setTimeout(revealNext, 2000);
      } else {
        setTimeout(() => {
          setIsDrawing(false);
          setBattleComplete(true);
        }, 2000);
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

  const visibleParticipants = isAdmin ? battle.participants : battle.participants.filter(p => !p.user?.isBot);

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

        {/* Participants */}
        <div className="bg-[#1a1a4a] border border-[rgba(255,255,255,0.12)] rounded-2xl p-6 mb-8">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-[#BFFF00]" />
            Teilnehmer
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {battle.participants.map((p, i) => (
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
                {(isDrawing || battleComplete) && (
                  <div className="text-right">
                    <div className="text-amber-400 font-bold">{(participantTotals[p.id] || 0).toFixed(2)}</div>
                    <div className="text-xs text-[#8888aa]">Coins</div>
                  </div>
                )}
              </div>
            ))}
            {/* Empty slots */}
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

        {/* Round Reveals */}
        {(isDrawing || battleComplete) && Object.keys(pullsByRound).length > 0 && (
          <div className="space-y-4 mb-8">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#BFFF00]" />
              Rundenergebnisse
            </h2>
            {Array.from({ length: battle.rounds }, (_, i) => i + 1).map((round) => {
              const roundPulls = pullsByRound[round] || [];
              const isRevealed = revealedRounds.has(round);
              const isCurrent = currentRevealRound === round && isDrawing;

              return (
                <AnimatePresence key={round}>
                  {isRevealed && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`bg-[#1a1a4a] border rounded-xl p-4 ${
                        isCurrent ? 'border-[#BFFF00]/50 shadow-[0_0_20px_rgba(191,255,0,0.1)]' : 'border-[rgba(255,255,255,0.08)]'
                      }`}
                    >
                      <div className="text-sm font-semibold text-[#8888aa] mb-3">Runde {round}</div>
                      <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                        {roundPulls.map((pull) => {
                          const pName = battle.participants.find(p => p.id === pull.participantId)?.user?.name || '?';
                          const isTransferred = !!pull.transferredToUserId;
                          return (
                            <motion.div
                              key={pull.id}
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{ delay: 0.1 }}
                              className={`flex items-center gap-3 p-3 rounded-lg ${
                                isTransferred ? 'bg-red-500/10 border border-red-500/20' : 'bg-[#12123a]'
                              }`}
                            >
                              {pull.itemImage && (
                                <img src={pull.itemImage} alt={pull.itemName || ''} className="w-10 h-10 rounded object-cover" />
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="text-xs text-[#8888aa] truncate">{pName}</div>
                                <div className="text-sm text-white font-medium truncate">{pull.itemName || 'Unbekannt'}</div>
                                <div className="text-xs text-amber-400">{pull.coinValue.toFixed(2)} Coins</div>
                              </div>
                              {isTransferred && (
                                <span className="text-xs text-red-400">↗</span>
                              )}
                            </motion.div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              );
            })}
          </div>
        )}

        {/* Battle Complete Banner */}
        {battleComplete && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-8"
          >
            {battle.status === 'FINISHED_DRAW' ? (
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-8 text-center">
                <div className="text-4xl mb-3">🤝</div>
                <h2 className="text-2xl font-bold text-white mb-2">Unentschieden!</h2>
                <p className="text-[#8888aa]">Beide Spieler haben den gleichen Gesamtwert erreicht. Keine Karten wurden übertragen.</p>
              </div>
            ) : battle.winnerId ? (
              <div className={`rounded-2xl p-8 text-center ${
                battle.winnerId === currentUserId
                  ? 'bg-[#BFFF00]/10 border border-[#BFFF00]/30'
                  : 'bg-red-500/10 border border-red-500/30'
              }`}>
                <div className="text-4xl mb-3">{battle.winnerId === currentUserId ? '🏆' : '😔'}</div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  {battle.winnerId === currentUserId ? 'Du hast gewonnen!' : `${battle.winner?.name || 'Spieler'} hat gewonnen!`}
                </h2>
                <p className="text-[#8888aa]">
                  {battle.battleMode === 'LOWEST_CARD' && 'Die niedrigste Karte des Verlierers wurde übertragen.'}
                  {battle.battleMode === 'HIGHEST_CARD' && 'Die höchste Karte des Verlierers wurde übertragen.'}
                  {battle.battleMode === 'ALL_CARDS' && 'Alle Karten des Verlierers wurden übertragen.'}
                </p>
              </div>
            ) : null}
          </motion.div>
        )}

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
