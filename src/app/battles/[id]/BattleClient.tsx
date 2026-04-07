'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Swords, Coins, Trophy, Crown, RefreshCw, ArrowRightLeft, Star, Zap, Sparkles, Share2, Copy, Check } from 'lucide-react';

const MODE_LABELS: Record<string, string> = {
  LOWEST_CARD: '⬇️ Niedrigste Karte',
  HIGHEST_CARD: '⬆️ Höchste Karte',
  ALL_CARDS: '🃏 Alle Karten',
};

const WIN_CONDITION_LABELS: Record<string, string> = {
  HIGHEST: '📈 Höchster Wert',
  LOWEST: '📉 Niedrigster Wert',
  SHARE_MODE: '🤝 Teilen',
  JACKPOT: '🎰 Jackpot',
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  FINISHED_WIN: { label: 'Abgeschlossen', color: 'bg-[#C84FFF]/15 text-[#E879F9] border border-[#C84FFF]/20' },
  FINISHED_DRAW: { label: 'Unentschieden', color: 'bg-blue-500/15 text-blue-400 border border-blue-500/20' },
  CANCELLED: { label: 'Storniert', color: 'bg-red-500/15 text-red-400 border border-red-500/20' },
};

const PLAYER_COLORS = ['#C84FFF', '#3B82F6', '#F59E0B', '#10B981'];

function getRarityColor(rarity: string | null): string {
  if (!rarity) return 'border-[rgba(255,255,255,0.08)]';
  const r = rarity.toLowerCase();
  if (r.includes('legend') || r.includes('mythic') || r.includes('secret') || r.includes('hyper'))
    return 'border-amber-400/60 shadow-[0_0_10px_rgba(251,191,36,0.2)]';
  if (r.includes('epic') || r.includes('ultra'))
    return 'border-purple-400/50';
  if (r.includes('rare') || r.includes('holo'))
    return 'border-blue-400/40';
  if (r.includes('uncommon'))
    return 'border-[#C84FFF]/30';
  return 'border-[rgba(255,255,255,0.08)]';
}

type Battle = {
  id: string;
  creatorId: string;
  status: string;
  rounds: number;
  battleMode: string;
  winCondition: string;
  maxParticipants: number;
  entryFee: number;
  winnerId: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  creator: { id: string; name: string | null; email: string };
  box: any;
  participants: Array<{
    id: string;
    userId: string;
    totalValue: number;
    user: { id: string; name: string | null; email: string; isBot?: boolean };
  }>;
  winner: { id: string; name: string | null; email: string } | null;
  pulls: Array<{
    id: string;
    roundNumber: number;
    coinValue: number;
    itemName: string | null;
    itemImage: string | null;
    itemRarity: string | null;
    transferredToUserId: string | null;
    participantId: string;
    participant: { id: string; userId: string; user: any };
  }>;
};

export function BattleClient({ battle, currentUserId, isAdmin }: {
  battle: Battle;
  currentUserId: string | null;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);

  const statusInfo = STATUS_LABELS[battle.status] || { label: battle.status, color: 'bg-gray-500/20 text-gray-400' };

  const useLowest = battle.winCondition === 'LOWEST';
  const sortedParticipants = [...battle.participants].sort((a, b) =>
    useLowest ? a.totalValue - b.totalValue : b.totalValue - a.totalValue
  );

  const pullsByRound: Record<number, typeof battle.pulls> = {};
  for (const pull of battle.pulls || []) {
    if (!pullsByRound[pull.roundNumber]) pullsByRound[pull.roundNumber] = [];
    pullsByRound[pull.roundNumber].push(pull);
  }

  const transferredPulls = (battle.pulls || []).filter(p => p.transferredToUserId);

  // Cumulative scores per round for the timeline chart
  const cumulativeScores = useMemo(() => {
    const scores: Record<string, number[]> = {};
    for (const p of battle.participants) {
      scores[p.id] = [0];
    }
    for (let r = 1; r <= battle.rounds; r++) {
      const roundPulls = pullsByRound[r] || [];
      for (const p of battle.participants) {
        const prev = scores[p.id][scores[p.id].length - 1];
        const roundPull = roundPulls.find(pull => pull.participantId === p.id);
        scores[p.id].push(prev + (roundPull?.coinValue || 0));
      }
    }
    return scores;
  }, [battle.participants, battle.rounds, battle.pulls]);

  const maxCumulative = useMemo(() => {
    let max = 1;
    for (const vals of Object.values(cumulativeScores)) {
      for (const v of vals) if (v > max) max = v;
    }
    return max;
  }, [cumulativeScores]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    router.refresh();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const handleShare = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const winnerName = battle.winner?.name || 'Unentschieden';
    const text = `Pack-Attack Battle: ${battle.box?.name} — ${battle.rounds} Runden — Gewinner: ${winnerName}`;
    if (navigator.share) {
      try { await navigator.share({ title: 'Pack-Attack Battle', text, url }); } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const maxTotal = Math.max(...sortedParticipants.map(p => p.totalValue), 1);

  const participantColorMap: Record<string, string> = {};
  battle.participants.forEach((p, i) => { participantColorMap[p.id] = PLAYER_COLORS[i % PLAYER_COLORS.length]; });

  return (
    <div className="min-h-screen font-display">
      <div className="fixed inset-0 bg-grid opacity-20 pointer-events-none" />
      <div className="fixed inset-0 radial-gradient pointer-events-none" />

      <div className="relative container py-10 sm:py-14 max-w-5xl">
        <div className="flex items-center justify-between mb-6">
          <Link href="/battles" className="inline-flex items-center gap-2 text-[#8888aa] hover:text-white transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" /> Zurück zu Battles
          </Link>
          <div className="flex items-center gap-2">
            <button onClick={handleShare} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#12123a] border border-[rgba(255,255,255,0.08)] text-[#8888aa] hover:text-white hover:border-[rgba(255,255,255,0.2)] transition-all text-xs">
              {copied ? <><Check className="w-3 h-3 text-emerald-400" /> Kopiert</> : <><Share2 className="w-3 h-3" /> Teilen</>}
            </button>
            <button onClick={handleRefresh} className="p-1.5 rounded-lg text-[#8888aa] hover:text-white transition-colors">
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Winner Banner */}
        {battle.status === 'FINISHED_DRAW' ? (
          <div className="relative overflow-hidden bg-gradient-to-b from-blue-500/10 to-blue-500/5 border border-blue-500/20 rounded-2xl p-8 text-center mb-6">
            <div className="text-5xl mb-4">🤝</div>
            <h1 className="text-3xl font-bold text-white mb-2">Unentschieden!</h1>
            <p className="text-[#8888aa] text-sm max-w-md mx-auto mb-6">
              {battle.winCondition === 'SHARE_MODE' ? 'Karten wurden gleichmäßig aufgeteilt.' : 'Gleicher Gesamtwert — keine Karten übertragen.'}
            </p>
            <div className="flex items-center justify-center gap-6">
              {sortedParticipants.map((p, i) => (
                <div key={p.id} className="text-center">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold text-white mx-auto mb-2" style={{ background: `linear-gradient(135deg, ${participantColorMap[p.id]}, ${participantColorMap[p.id]}88)` }}>
                    {p.user.name?.[0] || '?'}
                  </div>
                  <div className="text-white text-sm font-medium">{p.user.name || p.user.email}</div>
                  <div className="text-amber-400 font-bold">{p.totalValue.toFixed(2)}</div>
                </div>
              ))}
            </div>
          </div>
        ) : battle.status === 'FINISHED_WIN' && battle.winner ? (
          <div className="relative overflow-hidden rounded-2xl mb-6">
            <div className="absolute inset-0 bg-gradient-to-b from-[#C84FFF]/8 via-transparent to-transparent" />
            <div className={`relative border rounded-2xl p-8 ${
              battle.winnerId === currentUserId ? 'border-[#C84FFF]/40 bg-[#C84FFF]/5' : 'border-[rgba(255,255,255,0.08)] bg-[#1a1a4a]/80'
            }`}>
              <div className="flex justify-center mb-5">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 via-yellow-300 to-amber-500 flex items-center justify-center shadow-[0_0_40px_rgba(251,191,36,0.3)]">
                    <Trophy className="w-10 h-10 text-black" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-7 h-7 bg-[#C84FFF] rounded-full flex items-center justify-center">
                    <Crown className="w-3.5 h-3.5 text-black" />
                  </div>
                </div>
              </div>

              <div className="text-center mb-6">
                {battle.winnerId === currentUserId ? (
                  <>
                    <h1 className="text-3xl font-bold text-[#C84FFF] mb-1">Du hast gewonnen!</h1>
                    <p className="text-[#8888aa]">Glückwunsch zum Sieg!</p>
                  </>
                ) : (
                  <>
                    <h1 className="text-3xl font-bold text-white mb-1">{battle.winner.name || battle.winner.email} gewinnt!</h1>
                    <p className="text-[#8888aa]">Nächstes Mal hast du mehr Glück!</p>
                  </>
                )}
              </div>

              {/* Score comparison */}
              <div className="flex items-stretch justify-center gap-3 mb-6 max-w-2xl mx-auto">
                {sortedParticipants.map((p, i) => {
                  const isWinner = p.userId === battle.winnerId;
                  const barWidth = maxTotal > 0 ? (p.totalValue / maxTotal) * 100 : 0;
                  return (
                    <div key={p.id} className={`flex-1 rounded-xl p-4 text-center border ${
                      isWinner ? 'bg-[#C84FFF]/10 border-[#C84FFF]/30' : 'bg-[#12123a] border-[rgba(255,255,255,0.06)]'
                    }`}>
                      <div className={`w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center text-lg font-bold ${
                        isWinner ? 'bg-gradient-to-br from-[#C84FFF] to-[#9333EA] text-white' : 'bg-[#1a1a4a] text-[#8888aa]'
                      }`}>{p.user.name?.[0] || '?'}</div>
                      <div className="text-white font-medium text-sm mb-1 truncate">{p.user.name || p.user.email}</div>
                      <div className="h-1.5 bg-[#1a1a4a] rounded-full overflow-hidden my-2 mx-2">
                        <div className={`h-full rounded-full ${isWinner ? 'bg-[#C84FFF]' : 'bg-[#8888aa]/40'}`} style={{ width: `${barWidth}%` }} />
                      </div>
                      <div className={`text-2xl font-bold ${isWinner ? 'text-[#C84FFF]' : 'text-amber-400'}`}>{p.totalValue.toFixed(2)}</div>
                      <div className="text-[10px] text-[#666688] mt-0.5">{isWinner ? 'Gewinner' : 'Verlierer'}</div>
                    </div>
                  );
                })}
              </div>

              <div className="text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#12123a] rounded-full text-xs">
                  <Zap className="w-3 h-3 text-[#C84FFF]" />
                  <span className="text-[#8888aa]">
                    {battle.winCondition === 'JACKPOT' && 'Jackpot — Gewinner erhält alle Karten'}
                    {battle.winCondition !== 'JACKPOT' && battle.battleMode === 'LOWEST_CARD' && 'Niedrigste Karte übertragen'}
                    {battle.winCondition !== 'JACKPOT' && battle.battleMode === 'HIGHEST_CARD' && 'Höchste Karte übertragen'}
                    {battle.winCondition !== 'JACKPOT' && battle.battleMode === 'ALL_CARDS' && 'Alle Karten übertragen'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : battle.status === 'CANCELLED' ? (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-8 text-center mb-6">
            <div className="text-5xl mb-3">❌</div>
            <h1 className="text-2xl font-bold text-white mb-1">Battle storniert</h1>
            <p className="text-[#8888aa] text-sm">Dieses Battle wurde storniert.</p>
          </div>
        ) : null}

        {/* Battle Info Bar */}
        <div className="bg-[#12123a] border border-[rgba(255,255,255,0.06)] rounded-xl p-4 mb-6">
          <div className="flex items-center gap-3 mb-3">
            {battle.box?.imageUrl && (
              <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-[#1a1a4a]">
                <img src={battle.box.imageUrl} alt="" className="w-full h-full object-cover" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-bold text-white truncate">{battle.box?.name || 'Battle'}</h2>
              <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusInfo.color}`}>{statusInfo.label}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="bg-[#0e0e2a] rounded-lg px-3 py-2">
              <div className="text-[#444466]">Belohnung</div>
              <div className="text-white font-medium">{MODE_LABELS[battle.battleMode]}</div>
            </div>
            <div className="bg-[#0e0e2a] rounded-lg px-3 py-2">
              <div className="text-[#444466]">Gewinnlogik</div>
              <div className="text-white font-medium">{WIN_CONDITION_LABELS[battle.winCondition]}</div>
            </div>
            <div className="bg-[#0e0e2a] rounded-lg px-3 py-2">
              <div className="text-[#444466]">Runden</div>
              <div className="text-white font-medium">{battle.rounds}</div>
            </div>
            <div className="bg-[#0e0e2a] rounded-lg px-3 py-2">
              <div className="text-[#444466]">Einsatz</div>
              <div className="text-amber-400 font-medium flex items-center gap-1"><Coins className="w-3 h-3" />{battle.entryFee}</div>
            </div>
          </div>
        </div>

        {/* Round-by-Round Score Timeline */}
        {battle.rounds > 0 && Object.keys(pullsByRound).length > 0 && (
          <div className="bg-[#12123a] border border-[rgba(255,255,255,0.06)] rounded-xl p-5 mb-6">
            <h2 className="text-sm font-semibold text-[#8888aa] uppercase tracking-wider mb-4">Punkteverlauf</h2>

            {/* Legend */}
            <div className="flex items-center gap-4 mb-4 flex-wrap">
              {battle.participants.map((p) => (
                <div key={p.id} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: participantColorMap[p.id] }} />
                  <span className="text-xs text-[#8888aa]">{p.user.name || p.user.email}</span>
                </div>
              ))}
            </div>

            {/* SVG Chart */}
            <div className="relative h-40 w-full">
              <svg viewBox={`0 0 ${(battle.rounds + 1) * 80} 160`} className="w-full h-full" preserveAspectRatio="none">
                {/* Grid lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((frac) => (
                  <line key={frac} x1="0" y1={150 - frac * 140} x2={(battle.rounds + 1) * 80} y2={150 - frac * 140} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
                ))}

                {/* Player lines */}
                {battle.participants.map((p) => {
                  const vals = cumulativeScores[p.id] || [];
                  const points = vals.map((v, i) => `${i * 80 + 40},${150 - (v / maxCumulative) * 140}`).join(' ');
                  return (
                    <g key={p.id}>
                      <polyline fill="none" stroke={participantColorMap[p.id]} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points={points} />
                      {vals.map((v, i) => (
                        <circle key={i} cx={i * 80 + 40} cy={150 - (v / maxCumulative) * 140} r="4" fill={participantColorMap[p.id]} stroke="#0e0e2a" strokeWidth="2" />
                      ))}
                    </g>
                  );
                })}

                {/* Round labels */}
                {Array.from({ length: battle.rounds + 1 }, (_, i) => (
                  <text key={i} x={i * 80 + 40} y="160" textAnchor="middle" fill="#444466" fontSize="10" fontFamily="inherit">
                    {i === 0 ? 'Start' : `R${i}`}
                  </text>
                ))}
              </svg>
            </div>
          </div>
        )}

        {/* Round-by-Round Card Breakdown */}
        {Object.keys(pullsByRound).length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-[#8888aa] uppercase tracking-wider mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#C84FFF]" /> Runden-Übersicht
            </h2>
            <div className="space-y-3">
              {Array.from({ length: battle.rounds }, (_, i) => i + 1).map((round) => {
                const roundPulls = pullsByRound[round] || [];
                if (roundPulls.length === 0) return null;
                const roundHighest = Math.max(...roundPulls.map(p => p.coinValue));

                return (
                  <div key={round} className="bg-[#12123a] border border-[rgba(255,255,255,0.06)] rounded-xl overflow-hidden">
                    <div className="px-4 py-2.5 bg-[#0e0e2a] flex items-center justify-between">
                      <span className="text-xs font-bold text-white">Runde {round}</span>
                      <span className="text-[10px] text-[#444466]">{round}/{battle.rounds}</span>
                    </div>
                    <div className="p-4">
                      <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${Math.min(roundPulls.length, 4)}, 1fr)` }}>
                        {roundPulls.map((pull) => {
                          const pName = battle.participants.find(p => p.id === pull.participantId)?.user?.name || '?';
                          const isRoundBest = pull.coinValue === roundHighest && roundPulls.filter(p => p.coinValue === roundHighest).length === 1;
                          const isTransferred = !!pull.transferredToUserId;

                          return (
                            <div key={pull.id} className={`relative rounded-xl border p-3 text-center ${getRarityColor(pull.itemRarity)} ${isTransferred ? 'bg-red-500/5' : 'bg-[#0e0e2a]'}`}>
                              {isRoundBest && (
                                <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#C84FFF] rounded-full flex items-center justify-center">
                                  <Star className="w-3 h-3 text-black" />
                                </div>
                              )}
                              <div className="text-[10px] text-[#666688] mb-1.5 font-medium truncate">{pName}</div>
                              {pull.itemImage ? (
                                <div className="mx-auto w-16 h-22 mb-2">
                                  <img src={pull.itemImage} alt={pull.itemName || ''} className="w-full h-full object-cover rounded-lg" />
                                </div>
                              ) : (
                                <div className="mx-auto w-16 h-22 mb-2 bg-[#1a1a4a] rounded-lg flex items-center justify-center">
                                  <span className="text-[#333355] text-xl">?</span>
                                </div>
                              )}
                              <div className="text-xs text-white font-semibold truncate mb-0.5">{pull.itemName || 'Unbekannt'}</div>
                              {pull.itemRarity && (
                                <div className="text-[9px] text-[#666688] mb-0.5 uppercase tracking-wider">{pull.itemRarity}</div>
                              )}
                              <div className="text-amber-400 font-bold text-sm">{pull.coinValue.toFixed(2)}</div>
                              {isTransferred && (
                                <div className="mt-1 text-[9px] text-red-400 font-medium flex items-center justify-center gap-0.5">
                                  <ArrowRightLeft className="w-2.5 h-2.5" /> Übertragen
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Transferred Cards Summary */}
        {transferredPulls.length > 0 && (
          <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-5 mb-6">
            <h2 className="text-sm font-semibold text-[#8888aa] uppercase tracking-wider mb-3 flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4 text-red-400" /> Übertragene Karten
            </h2>
            <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
              {transferredPulls.map((pull) => {
                const fromPlayer = battle.participants.find(p => p.id === pull.participantId);
                const toPlayer = battle.participants.find(p => p.userId === pull.transferredToUserId);
                return (
                  <div key={pull.id} className={`rounded-lg p-2.5 flex items-center gap-2.5 border ${getRarityColor(pull.itemRarity)} bg-[#0e0e2a]`}>
                    {pull.itemImage ? (
                      <img src={pull.itemImage} alt={pull.itemName || ''} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-[#1a1a4a] flex items-center justify-center shrink-0">
                        <span className="text-[#333355] text-sm">?</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-white font-medium truncate">{pull.itemName || 'Unbekannt'}</div>
                      <div className="text-[10px] text-amber-400 font-bold">{pull.coinValue.toFixed(2)}</div>
                      <div className="text-[10px] text-[#666688] flex items-center gap-1">
                        <span className="text-red-400">{fromPlayer?.user?.name || '?'}</span>
                        <span>→</span>
                        <span className="text-[#C84FFF]">{toPlayer?.user?.name || '?'}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 justify-center">
          <Link href="/battles" className="px-5 py-2.5 bg-[#12123a] text-white font-semibold rounded-xl hover:bg-[#1a1a4a] transition-all border border-[rgba(255,255,255,0.08)] text-sm">
            Zurück zur Lobby
          </Link>
          <Link href="/battles/create" className="px-5 py-2.5 bg-[#C84FFF] text-white font-semibold rounded-xl hover:bg-[#E879F9] transition-all text-sm">
            Neues Battle
          </Link>
        </div>
      </div>
    </div>
  );
}
