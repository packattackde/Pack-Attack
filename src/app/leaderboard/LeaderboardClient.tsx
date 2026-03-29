'use client';

import { useState, useEffect, useCallback } from 'react';
import { Trophy, Crown, Coins, Swords, Flame } from 'lucide-react';
import Link from 'next/link';
import { PRIZE_CONFIG } from '@/lib/leaderboard';

type Scope = 'weekly' | 'monthly' | 'all-time';

type Row = {
  rank: number;
  points: number;
  userId: string;
  userName: string;
  userAvatar: string | null;
  battlesPlayed: number;
  battlesWon: number;
  winRate: number;
  currentStreak: number;
};

function prizeForRank(rank: number): number {
  return PRIZE_CONFIG.find(p => p.rank === rank)?.prize ?? 0;
}

export function LeaderboardClient() {
  const [scope, setScope] = useState<Scope>('weekly');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [meId, setMeId] = useState<string | null>(null);

  const pageSize = 50;

  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search.trim()), 250);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    fetch('/api/leaderboard/me')
      .then(r => r.json())
      .then(d => {
        if (d.success && d.user?.id) setMeId(d.user.id);
      })
      .catch(() => {});
  }, []);

  const fetchBoard = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        scope,
        page: String(page),
        pageSize: String(pageSize),
      });
      if (searchDebounced) params.set('search', searchDebounced);
      const res = await fetch(`/api/leaderboard?${params}`);
      const data = await res.json();
      if (data.success) {
        setRows(data.leaderboard);
        setTotal(data.total);
        setTotalPages(data.totalPages ?? 1);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [scope, page, searchDebounced]);

  useEffect(() => {
    fetchBoard();
  }, [fetchBoard]);

  useEffect(() => {
    setPage(1);
  }, [scope, searchDebounced]);

  const formatNumber = (num: number) => {
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString();
  };

  const getInitials = (name: string) =>
    name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

  const top3 = rows.slice(0, 3);
  const rest = rows.slice(3);

  const scopeLabel =
    scope === 'weekly'
      ? 'Diese Woche'
      : scope === 'monthly'
        ? 'Dieser Monat'
        : 'All-Time';

  return (
    <div className="min-h-screen font-display">
      <div className="fixed inset-0 bg-grid opacity-30" />
      <div className="fixed inset-0 radial-gradient" />
      <div className="fixed top-20 right-10 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl hidden lg:block" />

      <div className="relative container py-12">
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 rounded-full bg-[#1a1a4a] shadow-md text-sm border border-amber-500/20">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span className="text-[#f0f0f5]">Battle Rankings</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-3">
            <span className="text-white">Battle </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">
              Leaderboard
            </span>
          </h1>
          <p className="text-[#8888aa] text-lg mb-6 max-w-xl mx-auto">
            Punkte kommen nur aus Battles. Wöchentliche Monats-Top-10 können zusätzlich Coin-Preise gewinnen — siehe unten.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-6">
            <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-[#1a1a4a] shadow-md border border-[rgba(255,255,255,0.06)]">
              {(['weekly', 'monthly', 'all-time'] as const).map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setScope(s)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    scope === s
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
                      : 'text-[#8888aa] hover:text-white'
                  }`}
                >
                  {s === 'weekly' ? 'Woche' : s === 'monthly' ? 'Monat' : 'All-Time'}
                </button>
              ))}
            </div>
            <input
              type="search"
              placeholder="Spieler suchen…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full sm:w-64 rounded-xl bg-[#12123a] border border-[rgba(255,255,255,0.1)] px-4 py-2 text-sm text-white placeholder:text-[#555]"
            />
          </div>
        </div>

        {loading ? (
          <div className="bg-[#1e1e55] border border-[rgba(255,255,255,0.15)] shadow-lg rounded-2xl p-12 text-center">
            <div className="w-12 h-12 border-4 border-amber-400/30 border-t-amber-400 rounded-full animate-spin mx-auto mb-4" />
            <span className="text-[#8888aa]">Lade Rangliste…</span>
          </div>
        ) : rows.length === 0 ? (
          <div className="bg-[#1e1e55] border border-[rgba(255,255,255,0.15)] shadow-lg rounded-2xl p-12 text-center">
            <Trophy className="w-12 h-12 text-amber-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-3">Noch keine Einträge</h2>
            <p className="text-[#8888aa] mb-6">Spiele Battles, um Punkte zu sammeln.</p>
            <Link
              href="/battles"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl"
            >
              <Swords className="w-5 h-5" />
              Zu Battles
            </Link>
          </div>
        ) : (
          <>
            <p className="text-center text-sm text-[#8888aa] mb-4">{scopeLabel}</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              <div className="order-2 md:order-1 md:mt-8">
                {top3[1] ? (
                  <PodiumCard
                    place={2}
                    entry={top3[1]}
                    formatNumber={formatNumber}
                    getInitials={getInitials}
                    prize={scope === 'monthly' ? prizeForRank(2) : 0}
                    meId={meId}
                  />
                ) : (
                  <EmptyPodium />
                )}
              </div>
              <div className="order-1 md:order-2">
                {top3[0] ? (
                  <PodiumCard
                    place={1}
                    entry={top3[0]}
                    formatNumber={formatNumber}
                    getInitials={getInitials}
                    prize={scope === 'monthly' ? prizeForRank(1) : 0}
                    highlight
                    meId={meId}
                  />
                ) : (
                  <EmptyPodium tall />
                )}
              </div>
              <div className="order-3 md:mt-8">
                {top3[2] ? (
                  <PodiumCard
                    place={3}
                    entry={top3[2]}
                    formatNumber={formatNumber}
                    getInitials={getInitials}
                    prize={scope === 'monthly' ? prizeForRank(3) : 0}
                    meId={meId}
                  />
                ) : (
                  <EmptyPodium />
                )}
              </div>
            </div>

            {rest.length > 0 && (
              <div className="bg-[#1e1e55] border border-[rgba(255,255,255,0.15)] shadow-lg rounded-2xl overflow-hidden mb-10">
                <div className="px-6 py-4 border-b border-[rgba(255,255,255,0.06)]">
                  <h2 className="font-semibold text-white text-center">Weitere Plätze</h2>
                </div>
                <div className="divide-y divide-[rgba(255,255,255,0.06)]">
                  {rest.map(entry => (
                    <div
                      key={entry.userId}
                      className={`px-6 py-4 flex items-center gap-4 hover:bg-white/5 transition-colors ${
                        meId === entry.userId ? 'bg-[rgba(200,79,255,0.1)]' : ''
                      }`}
                    >
                      <span className="w-10 text-center font-bold text-[#8888aa]">#{entry.rank}</span>
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 p-0.5 flex-shrink-0">
                        <div className="w-full h-full rounded-full bg-[#0B0B2B] flex items-center justify-center overflow-hidden">
                          {entry.userAvatar ? (
                            <img src={entry.userAvatar} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-xs font-bold text-[#C84FFF]">{getInitials(entry.userName)}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-white truncate">{entry.userName}</h3>
                        <p className="text-xs text-gray-500">
                          {entry.battlesWon} Siege · {entry.winRate}% WR
                          {entry.currentStreak >= 3 && (
                            <span className="ml-2 inline-flex items-center gap-0.5 text-orange-400">
                              <Flame className="w-3 h-3" />
                              {entry.currentStreak}
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-white">{formatNumber(entry.points)}</span>
                        <span className="text-xs text-gray-500 ml-1">PTS</span>
                      </div>
                      {scope === 'monthly' && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 rounded-lg flex-shrink-0">
                          <Coins className="w-4 h-4 text-amber-400" />
                          <span className="font-semibold text-amber-400">{prizeForRank(entry.rank).toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mb-10">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="px-4 py-2 rounded-lg bg-[#1a1a4a] text-white disabled:opacity-40"
                >
                  Zurück
                </button>
                <span className="text-[#8888aa] self-center">
                  Seite {page} / {totalPages} ({total} Spieler)
                </span>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  className="px-4 py-2 rounded-lg bg-[#1a1a4a] text-white disabled:opacity-40"
                >
                  Weiter
                </button>
              </div>
            )}

            {scope === 'monthly' && (
              <div className="bg-[#1e1e55] border border-[rgba(255,255,255,0.1)] rounded-2xl p-6 mb-10">
                <h3 className="text-white font-semibold mb-2">Monatliche Coin-Preise (Top 10)</h3>
                <p className="text-sm text-[#8888aa] mb-4">
                  Zusätzlich zu den Battle-Punkten vergibt Pack Attack monatliche Preise — unabhängig von der obigen Monatswertung.
                </p>
                <ul className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm text-[#ccc]">
                  {PRIZE_CONFIG.map(p => (
                    <li key={p.rank}>
                      #{p.rank}: {p.prize.toLocaleString()} coins
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="bg-[#1e1e55] border border-[rgba(255,255,255,0.15)] shadow-lg rounded-2xl p-8 text-center">
              <Swords className="w-8 h-8 text-amber-400 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-white mb-2">Mitmachen</h2>
              <p className="text-[#8888aa] mb-6">Battles spielen, Punkte und Streaks aufbauen.</p>
              <Link
                href="/battles"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl"
              >
                <Swords className="w-5 h-5" />
                Battle Arena
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function PodiumCard({
  place,
  entry,
  formatNumber,
  getInitials,
  prize,
  highlight,
  meId,
}: {
  place: 1 | 2 | 3;
  entry: Row;
  formatNumber: (n: number) => string;
  getInitials: (n: string) => string;
  prize: number;
  highlight?: boolean;
  meId: string | null;
}) {
  const ring =
    place === 1
      ? 'border-amber-500/50'
      : place === 2
        ? 'border-slate-500/30'
        : 'border-orange-600/30';
  const isMe = meId === entry.userId;

  return (
    <div
      className={`bg-[#1e1e55] border shadow-lg rounded-2xl p-6 text-center ${ring} ${
        highlight ? 'border-2 relative overflow-hidden' : 'border'
      } ${isMe ? 'ring-2 ring-[#C84FFF]/40' : ''}`}
    >
      {highlight && (
        <div className="absolute inset-0 bg-gradient-to-b from-amber-500/10 to-transparent pointer-events-none" />
      )}
      <div className="relative">
        {place === 1 && <Crown className="w-10 h-10 mx-auto mb-2 text-amber-400" />}
        <div
          className={`w-20 h-20 mx-auto mb-4 rounded-full p-1 ${
            place === 1
              ? 'bg-gradient-to-br from-amber-400 to-orange-500'
              : place === 2
                ? 'bg-gradient-to-br from-slate-400 to-slate-600'
                : 'bg-gradient-to-br from-orange-500 to-orange-700'
          }`}
        >
          <div className="w-full h-full rounded-full bg-[#0B0B2B] flex items-center justify-center overflow-hidden">
            {entry.userAvatar ? (
              <img src={entry.userAvatar} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xl font-bold text-white">{getInitials(entry.userName)}</span>
            )}
          </div>
        </div>
        <h3 className="font-bold text-white mb-2 truncate">{entry.userName}</h3>
        <div className="text-2xl font-black text-white mb-1">
          {formatNumber(entry.points)} <span className="text-sm text-gray-500">PTS</span>
        </div>
        <div className="text-xs text-gray-500 mb-2">
          {entry.battlesWon} Siege · {entry.winRate}% WR
        </div>
        {prize > 0 && (
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 rounded-xl">
            <Coins className="w-4 h-4 text-amber-400" />
            <span className="font-bold text-amber-400">{prize.toLocaleString()}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyPodium({ tall }: { tall?: boolean }) {
  return (
    <div
      className={`bg-[#1a1a4a] shadow-md rounded-2xl p-6 text-center border border-[rgba(255,255,255,0.06)] flex items-center justify-center ${
        tall ? 'min-h-[320px]' : 'min-h-[280px]'
      }`}
    >
      <span className="text-gray-600 text-2xl">—</span>
    </div>
  );
}
