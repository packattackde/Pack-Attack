'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Swords, Coins, Users, Trophy, Crown, RefreshCw, ArrowRightLeft } from 'lucide-react';

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

  const statusInfo = STATUS_LABELS[battle.status] || { label: battle.status, color: 'bg-gray-500/20 text-gray-400' };
  const sortedParticipants = [...battle.participants].sort((a, b) => b.totalValue - a.totalValue);

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#06061a] via-[#0B0B2B] to-[#06061a] font-display">
      <div className="fixed inset-0 bg-grid opacity-30" />
      <div className="fixed inset-0 radial-gradient" />

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

        {/* Result Banner */}
        {battle.status === 'FINISHED_DRAW' ? (
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-8 text-center mb-8">
            <div className="text-5xl mb-4">🤝</div>
            <h1 className="text-3xl font-bold text-white mb-2">Unentschieden!</h1>
            <p className="text-[#8888aa]">Beide Spieler haben den gleichen Gesamtwert erreicht. Keine Karten wurden übertragen.</p>
          </div>
        ) : battle.status === 'FINISHED_WIN' && battle.winner ? (
          <div className={`rounded-2xl p-8 text-center mb-8 ${
            battle.winnerId === currentUserId
              ? 'bg-[#BFFF00]/10 border border-[#BFFF00]/30'
              : 'bg-[#1a1a4a] border border-[rgba(255,255,255,0.12)]'
          }`}>
            <div className="text-5xl mb-4">🏆</div>
            <h1 className="text-3xl font-bold text-white mb-2">
              {battle.winner.name || battle.winner.email} hat gewonnen!
            </h1>
            <p className="text-[#8888aa]">
              {battle.battleMode === 'LOWEST_CARD' && 'Die niedrigste Karte des Verlierers wurde übertragen.'}
              {battle.battleMode === 'HIGHEST_CARD' && 'Die höchste Karte des Verlierers wurde übertragen.'}
              {battle.battleMode === 'ALL_CARDS' && 'Alle Karten des Verlierers wurden übertragen.'}
            </p>
          </div>
        ) : battle.status === 'CANCELLED' ? (
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-8 text-center mb-8">
            <div className="text-5xl mb-4">❌</div>
            <h1 className="text-3xl font-bold text-white mb-2">Battle storniert</h1>
            <p className="text-[#8888aa]">Dieses Battle wurde storniert.</p>
          </div>
        ) : null}

        {/* Battle Info */}
        <div className="bg-[#1a1a4a] border border-[rgba(255,255,255,0.12)] rounded-2xl p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <Swords className="w-5 h-5 text-[#BFFF00]" />
              <h2 className="text-xl font-bold text-white">Battle #{battle.id.slice(-6)}</h2>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusInfo.color}`}>
                {statusInfo.label}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
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

        {/* Participant Results */}
        <div className="space-y-4 mb-8">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            Ergebnisse
          </h2>
          {sortedParticipants.map((p, i) => {
            const isWinner = p.userId === battle.winnerId;
            const playerPulls = (battle.pulls || []).filter(pull => pull.participantId === p.id);

            return (
              <div
                key={p.id}
                className={`bg-[#1a1a4a] border rounded-2xl p-5 ${
                  isWinner ? 'border-[#BFFF00]/30 shadow-[0_0_20px_rgba(191,255,0,0.08)]' : 'border-[rgba(255,255,255,0.08)]'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      isWinner ? 'bg-[#BFFF00] text-black' : 'bg-[#12123a] text-[#8888aa]'
                    }`}>
                      {i + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-semibold">{p.user.name || p.user.email}</span>
                        {isWinner && <Crown className="w-4 h-4 text-[#BFFF00]" />}
                        {isAdmin && p.user.isBot && (
                          <span className="text-xs px-1.5 py-0.5 bg-purple-500/20 text-purple-400 rounded">Bot</span>
                        )}
                      </div>
                      <div className="text-xs text-[#8888aa]">
                        {isWinner ? 'Gewinner' : battle.status === 'FINISHED_DRAW' ? 'Unentschieden' : 'Verlierer'}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-amber-400">{p.totalValue.toFixed(2)}</div>
                    <div className="text-xs text-[#8888aa]">Gesamtwert</div>
                  </div>
                </div>

                {/* Player's cards */}
                <div className="grid gap-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7">
                  {playerPulls.map((pull) => {
                    const isTransferred = !!pull.transferredToUserId;
                    return (
                      <div
                        key={pull.id}
                        className={`p-2 rounded-lg text-center ${
                          isTransferred ? 'bg-red-500/10 border border-red-500/20' : 'bg-[#12123a]'
                        }`}
                      >
                        {pull.itemImage && (
                          <img src={pull.itemImage} alt={pull.itemName || ''} className="w-full h-16 object-cover rounded mb-1" />
                        )}
                        <div className="text-xs text-white truncate">{pull.itemName || '?'}</div>
                        <div className="text-xs text-amber-400">{pull.coinValue.toFixed(2)}</div>
                        {isTransferred && (
                          <div className="text-[10px] text-red-400 flex items-center justify-center gap-0.5 mt-0.5">
                            <ArrowRightLeft className="w-2.5 h-2.5" /> Übertragen
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Transferred Cards Summary */}
        {transferredPulls.length > 0 && (
          <div className="bg-[#1a1a4a] border border-[rgba(255,255,255,0.12)] rounded-2xl p-6 mb-8">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5 text-red-400" />
              Übertragene Karten
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
              {transferredPulls.map((pull) => {
                const fromPlayer = battle.participants.find(p => p.id === pull.participantId);
                const toPlayer = battle.participants.find(p => p.userId === pull.transferredToUserId);
                return (
                  <div key={pull.id} className="bg-[#12123a] rounded-lg p-3 flex items-center gap-3">
                    {pull.itemImage && (
                      <img src={pull.itemImage} alt={pull.itemName || ''} className="w-12 h-12 rounded object-cover" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-white font-medium truncate">{pull.itemName || 'Unbekannt'}</div>
                      <div className="text-xs text-amber-400">{pull.coinValue.toFixed(2)} Coins</div>
                      <div className="text-xs text-[#8888aa]">
                        {fromPlayer?.user?.name || '?'} → {toPlayer?.user?.name || '?'}
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
