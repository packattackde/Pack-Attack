'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Swords, Coins, Users, Trophy, Crown, RefreshCw, ArrowRightLeft, Star, Zap, Shield } from 'lucide-react';

const MODE_LABELS: Record<string, string> = {
  LOWEST_CARD: 'Niedrigste Karte',
  HIGHEST_CARD: 'Höchste Karte',
  ALL_CARDS: 'Alle Karten',
};

const WIN_CONDITION_LABELS: Record<string, string> = {
  HIGHEST: 'Höchster Gesamtwert gewinnt',
  LOWEST: 'Niedrigster Gesamtwert gewinnt',
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  FINISHED_WIN: { label: 'Abgeschlossen', color: 'bg-green-500/20 text-green-400' },
  FINISHED_DRAW: { label: 'Unentschieden', color: 'bg-blue-500/20 text-blue-400' },
  CANCELLED: { label: 'Storniert', color: 'bg-red-500/20 text-red-400' },
};

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
    return 'border-green-400/30';
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
  const [expandedPlayer, setExpandedPlayer] = useState<string | null>(null);

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

  const handleRefresh = () => {
    setIsRefreshing(true);
    router.refresh();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const maxTotal = Math.max(...sortedParticipants.map(p => p.totalValue), 1);

  return (
    <div className="min-h-screen font-display">
      <div className="fixed inset-0 bg-grid opacity-20 pointer-events-none" />
      <div className="fixed inset-0 radial-gradient pointer-events-none" />

      <div className="relative container py-14 sm:py-16 max-w-5xl">
        <div className="flex items-center justify-between mb-6">
          <Link href="/battles" className="inline-flex items-center gap-2 text-[#8888aa] hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Zurück zu Battles
          </Link>
          <button onClick={handleRefresh} className="text-[#8888aa] hover:text-white transition-colors">
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Winner Banner */}
        {battle.status === 'FINISHED_DRAW' ? (
          <div className="relative overflow-hidden bg-gradient-to-b from-blue-500/10 to-blue-500/5 border border-blue-500/30 rounded-3xl p-10 text-center mb-8">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[200px] bg-blue-500/5 rounded-full blur-[80px]" />
            <div className="relative">
              <div className="text-7xl mb-5">🤝</div>
              <h1 className="text-4xl font-bold text-white mb-3">Unentschieden!</h1>
              <p className="text-[#8888aa] text-lg max-w-md mx-auto mb-8">
                Alle Spieler haben den gleichen Gesamtwert erreicht. Keine Karten wurden übertragen.
              </p>
              <div className="flex items-center justify-center gap-6">
                {sortedParticipants.map(p => (
                  <div key={p.id} className="text-center">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-2xl font-bold text-white mx-auto mb-2 shadow-[0_0_20px_rgba(96,165,250,0.3)]">
                      {p.user.name?.[0] || '?'}
                    </div>
                    <div className="text-white font-semibold">{p.user.name || p.user.email}</div>
                    <div className="text-amber-400 font-bold text-lg">{p.totalValue.toFixed(2)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : battle.status === 'FINISHED_WIN' && battle.winner ? (
          <div className="relative overflow-hidden rounded-3xl mb-8">
            {/* Glow effects */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#BFFF00]/8 via-transparent to-transparent" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#BFFF00]/5 rounded-full blur-[100px]" />

            <div className={`relative border p-10 rounded-3xl ${
              battle.winnerId === currentUserId
                ? 'border-[#BFFF00]/40 bg-[#BFFF00]/5'
                : 'border-[rgba(255,255,255,0.12)] bg-[#1a1a4a]/80'
            }`}>
              {/* Trophy */}
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-400 via-yellow-300 to-amber-500 flex items-center justify-center shadow-[0_0_60px_rgba(251,191,36,0.4)]">
                    <Trophy className="w-12 h-12 text-black" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-8 h-8 bg-[#BFFF00] rounded-full flex items-center justify-center">
                    <Crown className="w-4 h-4 text-black" />
                  </div>
                </div>
              </div>

              {/* Winner text */}
              <div className="text-center mb-8">
                {battle.winnerId === currentUserId ? (
                  <>
                    <h1 className="text-4xl font-bold text-[#BFFF00] mb-2">Du hast gewonnen!</h1>
                    <p className="text-[#8888aa] text-lg">Glückwunsch zum Sieg!</p>
                  </>
                ) : (
                  <>
                    <h1 className="text-4xl font-bold text-white mb-2">
                      {battle.winner.name || battle.winner.email} gewinnt!
                    </h1>
                    <p className="text-[#8888aa] text-lg">Nächstes Mal hast du mehr Glück!</p>
                  </>
                )}
              </div>

              {/* Score comparison */}
              <div className="flex items-stretch justify-center gap-4 mb-8 max-w-2xl mx-auto">
                {sortedParticipants.map((p, i) => {
                  const isWinner = p.userId === battle.winnerId;
                  const barWidth = maxTotal > 0 ? (p.totalValue / maxTotal) * 100 : 0;
                  return (
                    <div
                      key={p.id}
                      className={`flex-1 rounded-2xl p-5 text-center border transition-all ${
                        isWinner
                          ? 'bg-[#BFFF00]/10 border-[#BFFF00]/30'
                          : 'bg-[#12123a] border-[rgba(255,255,255,0.08)]'
                      }`}
                    >
                      <div className={`w-14 h-14 rounded-full mx-auto mb-3 flex items-center justify-center text-xl font-bold ${
                        isWinner
                          ? 'bg-gradient-to-br from-[#BFFF00] to-[#a0d600] text-black shadow-[0_0_20px_rgba(191,255,0,0.3)]'
                          : 'bg-[#1a1a4a] text-[#8888aa]'
                      }`}>
                        {p.user.name?.[0] || '?'}
                      </div>
                      <div className="text-white font-semibold mb-1 truncate flex items-center justify-center gap-1.5">
                        {p.user.name || p.user.email}
                        {isAdmin && p.user.isBot && (
                          <span className="text-[10px] px-1 py-0.5 bg-purple-500/20 text-purple-400 rounded">Bot</span>
                        )}
                      </div>
                      {/* Score bar */}
                      <div className="h-2 bg-[#1a1a4a] rounded-full overflow-hidden my-3 mx-4">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${
                            isWinner ? 'bg-gradient-to-r from-[#BFFF00]/80 to-[#BFFF00]' : 'bg-[#8888aa]/40'
                          }`}
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                      <div className={`text-3xl font-bold mb-1 ${isWinner ? 'text-[#BFFF00]' : 'text-amber-400'}`}>
                        {p.totalValue.toFixed(2)}
                      </div>
                      <div className="text-xs text-[#8888aa]">Gesamtwert</div>
                      {isWinner && (
                        <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 bg-[#BFFF00]/10 rounded-full">
                          <Crown className="w-3.5 h-3.5 text-[#BFFF00]" />
                          <span className="text-xs text-[#BFFF00] font-semibold">Gewinner</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Reward info */}
              <div className="text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#12123a] rounded-full text-sm">
                  <Zap className="w-4 h-4 text-[#BFFF00]" />
                  <span className="text-[#8888aa]">
                    {battle.battleMode === 'LOWEST_CARD' && 'Die niedrigste Karte des Verlierers wurde übertragen'}
                    {battle.battleMode === 'HIGHEST_CARD' && 'Die höchste Karte des Verlierers wurde übertragen'}
                    {battle.battleMode === 'ALL_CARDS' && 'Alle Karten des Verlierers wurden übertragen'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : battle.status === 'CANCELLED' ? (
          <div className="bg-red-500/10 border border-red-500/30 rounded-3xl p-10 text-center mb-8">
            <div className="text-6xl mb-4">❌</div>
            <h1 className="text-3xl font-bold text-white mb-2">Battle storniert</h1>
            <p className="text-[#8888aa]">Dieses Battle wurde storniert.</p>
          </div>
        ) : null}

        {/* Battle Info Bar */}
        <div className="bg-[#1a1a4a] border border-[rgba(255,255,255,0.12)] rounded-2xl p-5 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <Swords className="w-5 h-5 text-[#BFFF00]" />
              <h2 className="text-lg font-bold text-white">Battle #{battle.id.slice(-6)}</h2>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusInfo.color}`}>
                {statusInfo.label}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
            <div className="bg-[#12123a] rounded-lg p-3">
              <div className="text-[#8888aa] text-xs">Belohnung</div>
              <div className="text-white font-medium">{MODE_LABELS[battle.battleMode] || battle.battleMode}</div>
            </div>
            <div className="bg-[#12123a] rounded-lg p-3">
              <div className="text-[#8888aa] text-xs">Gewinnlogik</div>
              <div className="text-white font-medium">{WIN_CONDITION_LABELS[battle.winCondition] || battle.winCondition}</div>
            </div>
            <div className="bg-[#12123a] rounded-lg p-3">
              <div className="text-[#8888aa] text-xs">Spieler</div>
              <div className="text-white font-medium">{battle.participants.length}</div>
            </div>
            <div className="bg-[#12123a] rounded-lg p-3">
              <div className="text-[#8888aa] text-xs">Runden</div>
              <div className="text-white font-medium">{battle.rounds}</div>
            </div>
            <div className="bg-[#12123a] rounded-lg p-3">
              <div className="text-[#8888aa] text-xs">Einsatz</div>
              <div className="text-amber-400 font-medium flex items-center gap-1">
                <Coins className="w-3 h-3" /> {battle.entryFee}
              </div>
            </div>
          </div>
        </div>

        {/* Round-by-Round Breakdown */}
        {Object.keys(pullsByRound).length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#BFFF00]" />
              Runden-Übersicht
            </h2>
            <div className="space-y-4">
              {Array.from({ length: battle.rounds }, (_, i) => i + 1).map((round) => {
                const roundPulls = pullsByRound[round] || [];
                if (roundPulls.length === 0) return null;

                const roundHighest = Math.max(...roundPulls.map(p => p.coinValue));

                return (
                  <div key={round} className="bg-[#1a1a4a] border border-[rgba(255,255,255,0.08)] rounded-2xl overflow-hidden">
                    <div className="px-5 py-3 bg-[#12123a]/50 flex items-center justify-between">
                      <span className="text-sm font-bold text-white">Runde {round}</span>
                      <span className="text-xs text-[#8888aa]">{round} / {battle.rounds}</span>
                    </div>
                    <div className="p-5">
                      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${Math.min(roundPulls.length, 4)}, 1fr)` }}>
                        {roundPulls.map((pull) => {
                          const pName = battle.participants.find(p => p.id === pull.participantId)?.user?.name || '?';
                          const isRoundBest = pull.coinValue === roundHighest && roundPulls.filter(p => p.coinValue === roundHighest).length === 1;
                          const isTransferred = !!pull.transferredToUserId;

                          return (
                            <div
                              key={pull.id}
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
                                <div className="mt-1 text-[10px] text-red-400 font-medium flex items-center justify-center gap-0.5">
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
          <div className="bg-gradient-to-b from-red-500/5 to-transparent border border-red-500/20 rounded-2xl p-6 mb-8">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5 text-red-400" />
              Übertragene Karten
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
              {transferredPulls.map((pull) => {
                const fromPlayer = battle.participants.find(p => p.id === pull.participantId);
                const toPlayer = battle.participants.find(p => p.userId === pull.transferredToUserId);
                return (
                  <div key={pull.id} className={`rounded-xl p-3 flex items-center gap-3 border ${getRarityColor(pull.itemRarity)} bg-[#12123a]`}>
                    {pull.itemImage ? (
                      <img src={pull.itemImage} alt={pull.itemName || ''} className="w-14 h-14 rounded-lg object-cover shrink-0" />
                    ) : (
                      <div className="w-14 h-14 rounded-lg bg-[#1a1a4a] flex items-center justify-center shrink-0">
                        <span className="text-[#555577]">?</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-white font-semibold truncate">{pull.itemName || 'Unbekannt'}</div>
                      <div className="text-xs text-amber-400 font-bold">{pull.coinValue.toFixed(2)} Coins</div>
                      <div className="text-xs text-[#8888aa] flex items-center gap-1 mt-0.5">
                        <span className="text-red-400">{fromPlayer?.user?.name || '?'}</span>
                        <span>→</span>
                        <span className="text-green-400">{toPlayer?.user?.name || '?'}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Link href="/battles" className="px-6 py-3 bg-[#12123a] text-white font-semibold rounded-xl hover:bg-[#1a1a4a] transition-all border border-[rgba(255,255,255,0.12)]">
            Zurück zur Lobby
          </Link>
          <Link href="/battles/create" className="px-6 py-3 bg-[#BFFF00] text-black font-semibold rounded-xl hover:bg-[#d4ff4d] transition-all">
            Neues Battle
          </Link>
        </div>
      </div>
    </div>
  );
}
