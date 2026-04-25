'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Swords, Coins, Trophy, Crown, RefreshCw, ArrowRightLeft, Star, Zap, Sparkles, Share2, Copy, Check } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { CardTransferAnimation } from './CardTransferAnimation';

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
  roundBoxes?: Array<{ roundNumber: number; boxId: string; box: { id: string; name: string; imageUrl: string; price: number } }>;
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
  const t = useTranslations('battles');
  const tc = useTranslations('common');

  const statusColor = {
    FINISHED_WIN: 'bg-[#C84FFF]/15 text-[#E879F9] border border-[#C84FFF]/20',
    FINISHED_DRAW: 'bg-blue-500/15 text-blue-400 border border-blue-500/20',
    CANCELLED: 'bg-red-500/15 text-red-400 border border-red-500/20',
  }[battle.status] || 'bg-gray-500/20 text-gray-400';

  const statusLabel = t(`statusLabels.${battle.status}` as any);

  const useLowest = battle.winCondition === 'LOWEST';
  const sortedParticipants = [...battle.participants].sort((a, b) =>
    useLowest ? a.totalValue - b.totalValue : b.totalValue - a.totalValue
  );

  const pullsByRound: Record<number, typeof battle.pulls> = {};
  for (const pull of battle.pulls || []) {
    if (!pullsByRound[pull.roundNumber]) pullsByRound[pull.roundNumber] = [];
    pullsByRound[pull.roundNumber].push(pull);
  }

  // Use DB flag if set, otherwise reconstruct from battle mode so the
  // visualization always works — even for older battles where the
  // `transferredToUserId` column wasn't populated.
  const transferredPulls = useMemo(() => {
    const flagged = (battle.pulls || []).filter(p => p.transferredToUserId);
    if (flagged.length > 0) return flagged;

    if (battle.status !== 'FINISHED_WIN' || !battle.winnerId) return [];
    if (!['LOWEST_CARD', 'HIGHEST_CARD'].includes(battle.battleMode)) return [];

    const pickLowest = battle.battleMode === 'LOWEST_CARD';
    const losers = battle.participants.filter(p => p.userId !== battle.winnerId);
    const reconstructed: typeof battle.pulls = [];

    for (const loser of losers) {
      const loserPulls = (battle.pulls || [])
        .filter(p => p.participantId === loser.id)
        .sort((a, b) =>
          a.coinValue !== b.coinValue
            ? a.coinValue - b.coinValue
            : a.roundNumber - b.roundNumber
        );
      if (loserPulls.length === 0) continue;

      const chosen = pickLowest ? loserPulls[0] : loserPulls[loserPulls.length - 1];
      reconstructed.push({ ...chosen, transferredToUserId: battle.winnerId });
    }

    return reconstructed;
  }, [battle.pulls, battle.participants, battle.status, battle.battleMode, battle.winnerId]);

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
    const winnerName = battle.winner?.name || t('statusLabels.FINISHED_DRAW');
    const shareText = `${t('detail.shareTitle')}: ${battle.box?.name} — ${battle.rounds} ${t('rounds')} — ${winnerName}`;
    if (navigator.share) {
      try { await navigator.share({ title: t('detail.shareTitle'), text: shareText, url }); } catch {}
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
            <ArrowLeft className="w-4 h-4" /> {t('detail.backToBattles')}
          </Link>
          <div className="flex items-center gap-2">
            <button onClick={handleShare} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#12123a] border border-[rgba(255,255,255,0.08)] text-[#8888aa] hover:text-white hover:border-[rgba(255,255,255,0.2)] transition-all text-xs">
              {copied ? <><Check className="w-3 h-3 text-emerald-400" /> {t('detail.copied')}</> : <><Share2 className="w-3 h-3" /> {t('detail.share')}</>}
            </button>
            <button onClick={handleRefresh} className="p-1.5 rounded-lg text-[#8888aa] hover:text-white transition-colors">
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Winner Banner */}
        {battle.status === 'FINISHED_DRAW' ? (
          <div className="relative overflow-hidden bg-gradient-to-b from-blue-500/10 to-blue-500/5 border border-blue-500/20 rounded-2xl p-8 text-center mb-6">
            <div className="text-4xl sm:text-5xl mb-4">🤝</div>
            <h1 className="text-3xl font-bold text-white mb-2">{t('detail.drawTitle')}</h1>
            <p className="text-[#8888aa] text-sm max-w-md mx-auto mb-6">
              {battle.winCondition === 'SHARE_MODE' ? t('detail.drawShareMode') : t('detail.drawEqual')}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 px-2">
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
                    <h1 className="text-3xl font-bold text-[#C84FFF] mb-1">{t('detail.youWon')}</h1>
                    <p className="text-[#8888aa]">{t('detail.congrats')}</p>
                  </>
                ) : (
                  <>
                    <h1 className="text-3xl font-bold text-white mb-1">{battle.winner.name || battle.winner.email} {t('detail.wins')}</h1>
                    <p className="text-[#8888aa]">{t('detail.betterLuck')}</p>
                  </>
                )}
              </div>

              {/* Score comparison */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 max-w-2xl mx-auto w-full px-2">
                {sortedParticipants.map((p) => {
                  const isWinner = p.userId === battle.winnerId;
                  const barWidth = maxTotal > 0 ? (p.totalValue / maxTotal) * 100 : 0;
                  return (
                    <div key={p.id} className={`rounded-2xl p-5 text-center border transition-all ${
                      isWinner ? 'bg-[#C84FFF]/10 border-[#C84FFF]/30 shadow-[0_0_30px_rgba(200,79,255,0.1)]' : 'bg-[#12123a] border-[rgba(255,255,255,0.06)]'
                    }`}>
                      <div className={`w-14 h-14 rounded-full mx-auto mb-3 flex items-center justify-center text-xl font-bold ${
                        isWinner ? 'bg-gradient-to-br from-[#C84FFF] to-[#9333EA] text-white shadow-[0_0_20px_rgba(200,79,255,0.3)]' : 'bg-[#1a1a4a] text-[#8888aa]'
                      }`}>{p.user.name?.[0] || '?'}</div>
                      <div className="text-white font-semibold text-sm mb-2 truncate">{p.user.name || p.user.email}</div>
                      <div className="h-2.5 bg-[#0e0e2a] rounded-full overflow-hidden my-3 mx-4">
                        <div className={`h-full rounded-full transition-all duration-700 ${isWinner ? 'bg-gradient-to-r from-[#C84FFF] to-[#E879F9]' : 'bg-[#8888aa]/40'}`} style={{ width: `${barWidth}%` }} />
                      </div>
                      <div className={`text-3xl font-bold mb-1 ${isWinner ? 'text-[#C84FFF]' : 'text-amber-400'}`}>{p.totalValue.toFixed(2)}</div>
                      <div className={`text-xs font-semibold mt-1 ${isWinner ? 'text-[#C84FFF]' : 'text-[#666688]'}`}>
                        {isWinner ? <span className="flex items-center justify-center gap-1"><Crown className="w-3.5 h-3.5" /> {tc('winner')}</span> : tc('loser')}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Card Transfer Animation — embedded directly INSIDE the winner banner
                  so the user sees the loot moving to the winner without needing to scroll. */}
              {battle.winnerId && transferredPulls.length > 0 && (
                <div className="max-w-2xl mx-auto w-full px-2 mb-4">
                  <CardTransferAnimation
                    transferredPulls={transferredPulls}
                    participants={battle.participants}
                    winnerId={battle.winnerId}
                    currentUserId={currentUserId}
                    embedded
                  />
                </div>
              )}

              <div className="text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#12123a] rounded-full text-xs">
                  <Zap className="w-3 h-3 text-[#C84FFF]" />
                  <span className="text-[#8888aa]">
                    {battle.battleMode === 'LOWEST_CARD' && t('detail.lowestTransferred')}
                    {battle.battleMode === 'HIGHEST_CARD' && t('detail.highestTransferred')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : battle.status === 'CANCELLED' ? (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-8 text-center mb-6">
            <div className="text-5xl mb-3">❌</div>
            <h1 className="text-2xl font-bold text-white mb-1">{t('detail.cancelled')}</h1>
            <p className="text-[#8888aa] text-sm">{t('detail.cancelledDesc')}</p>
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
              <h2 className="text-sm font-bold text-white truncate">{battle.box?.name || t('detail.battle')}</h2>
              <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusColor}`}>{statusLabel}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="bg-[#0e0e2a] rounded-lg px-3 py-2">
              <div className="text-[#444466]">{t('detail.reward')}</div>
              <div className="text-white font-medium">{t(`modeLabelsShort.${battle.battleMode}` as any)}</div>
            </div>
            <div className="bg-[#0e0e2a] rounded-lg px-3 py-2">
              <div className="text-[#444466]">{t('detail.winCondition')}</div>
              <div className="text-white font-medium">{t(`winConditionLabelsFull.${battle.winCondition}` as any)}</div>
            </div>
            <div className="bg-[#0e0e2a] rounded-lg px-3 py-2">
              <div className="text-[#444466]">{t('rounds')}</div>
              <div className="text-white font-medium">{battle.rounds}</div>
            </div>
            <div className="bg-[#0e0e2a] rounded-lg px-3 py-2">
              <div className="text-[#444466]">{t('detail.entryFee')}</div>
              <div className="text-amber-400 font-medium flex items-center gap-1"><Coins className="w-3 h-3" />{battle.entryFee}</div>
            </div>
          </div>
        </div>

        {/* Round-by-Round Score Timeline — redesigned for readability */}
        {battle.rounds > 0 && Object.keys(pullsByRound).length > 0 && (() => {
          // Chart geometry (in SVG user units — scales responsively via viewBox)
          const PAD_LEFT = 46;
          const PAD_RIGHT = 70;
          const PAD_TOP = 16;
          const PAD_BOTTOM = 34;
          const COL_W = 70;
          const chartW = PAD_LEFT + (battle.rounds + 1) * COL_W + PAD_RIGHT;
          const chartH = 280;
          const plotY0 = PAD_TOP;
          const plotY1 = chartH - PAD_BOTTOM;
          const plotH = plotY1 - plotY0;

          // Y-axis tick values: "nice" rounded steps
          const niceStep = (rawMax: number) => {
            if (rawMax <= 1) return 0.25;
            if (rawMax <= 5) return 1;
            if (rawMax <= 20) return 5;
            if (rawMax <= 50) return 10;
            if (rawMax <= 200) return 25;
            if (rawMax <= 500) return 50;
            return Math.ceil(rawMax / 4 / 10) * 10;
          };
          const step = niceStep(maxCumulative);
          const yMax = Math.max(step, Math.ceil(maxCumulative / step) * step);
          const yTicks: number[] = [];
          for (let v = 0; v <= yMax + 0.0001; v += step) yTicks.push(Number(v.toFixed(2)));

          const xFor = (i: number) => PAD_LEFT + i * COL_W + COL_W / 2;
          const yFor = (v: number) => plotY1 - (v / yMax) * plotH;

          return (
            <div className="bg-[#12123a] border border-[rgba(255,255,255,0.06)] rounded-xl p-5 mb-6">
              <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
                <h2 className="text-sm font-semibold text-[#8888aa] uppercase tracking-wider">{t('detail.scoreTimeline')}</h2>
                <div className="text-[10px] text-[#666688] uppercase tracking-wider">
                  {t('detail.start')} → R{battle.rounds}
                </div>
              </div>

              {/* Legend — shows running final score per player */}
              <div className="flex items-center gap-4 mb-5 flex-wrap">
                {battle.participants.map((p) => {
                  const final = (cumulativeScores[p.id] || [0]).slice(-1)[0];
                  const isWinner = p.userId === battle.winnerId;
                  return (
                    <div key={p.id} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full shrink-0 shadow" style={{ backgroundColor: participantColorMap[p.id], boxShadow: isWinner ? `0 0 8px ${participantColorMap[p.id]}` : undefined }} />
                      <span className={`text-xs ${isWinner ? 'text-white font-semibold' : 'text-[#c8c8d8]'}`}>
                        {p.user.name || p.user.email}
                      </span>
                      <span className="text-xs font-bold tabular-nums" style={{ color: participantColorMap[p.id] }}>
                        {final.toFixed(2)}
                      </span>
                      {isWinner && <Crown className="w-3 h-3 text-amber-400" />}
                    </div>
                  );
                })}
              </div>

              {/* SVG Chart */}
              <div className="relative w-full overflow-x-auto">
                <div style={{ minWidth: Math.max(500, chartW), height: chartH }}>
                  <svg
                    viewBox={`0 0 ${chartW} ${chartH}`}
                    className="w-full h-full"
                    preserveAspectRatio="xMidYMid meet"
                    role="img"
                    aria-label={t('detail.scoreTimeline')}
                  >
                    {/* Y-axis gridlines + value labels */}
                    {yTicks.map((tick) => {
                      const y = yFor(tick);
                      return (
                        <g key={tick}>
                          <line
                            x1={PAD_LEFT}
                            y1={y}
                            x2={chartW - PAD_RIGHT + 20}
                            y2={y}
                            stroke="rgba(255,255,255,0.08)"
                            strokeDasharray={tick === 0 ? undefined : '3 4'}
                            strokeWidth={tick === 0 ? 1.2 : 1}
                          />
                          <text
                            x={PAD_LEFT - 8}
                            y={y + 4}
                            textAnchor="end"
                            fill="#8888aa"
                            fontSize="11"
                            fontFamily="inherit"
                            className="tabular-nums"
                          >
                            {tick.toFixed(tick < 10 ? 2 : 0)}
                          </text>
                        </g>
                      );
                    })}

                    {/* Vertical round column markers (very subtle) */}
                    {Array.from({ length: battle.rounds + 1 }, (_, i) => (
                      <line
                        key={`v-${i}`}
                        x1={xFor(i)}
                        y1={plotY0}
                        x2={xFor(i)}
                        y2={plotY1}
                        stroke="rgba(255,255,255,0.035)"
                        strokeWidth="1"
                      />
                    ))}

                    {/* Player lines — area fill + line + points, winner rendered last (on top) */}
                    {[...battle.participants]
                      .sort((a, b) => (a.userId === battle.winnerId ? 1 : b.userId === battle.winnerId ? -1 : 0))
                      .map((p) => {
                        const vals = cumulativeScores[p.id] || [];
                        const color = participantColorMap[p.id];
                        const isWinner = p.userId === battle.winnerId;
                        const linePts = vals.map((v, i) => `${xFor(i)},${yFor(v)}`).join(' ');
                        // Area polygon: line points + down-to-baseline closure
                        const areaPts =
                          linePts +
                          ` ${xFor(vals.length - 1)},${yFor(0)} ${xFor(0)},${yFor(0)}`;
                        const finalVal = vals[vals.length - 1] ?? 0;
                        const finalX = xFor(vals.length - 1);
                        const finalY = yFor(finalVal);
                        return (
                          <g key={p.id} opacity={isWinner ? 1 : 0.85}>
                            {/* Area fill */}
                            <polygon points={areaPts} fill={color} opacity={isWinner ? 0.16 : 0.08} />
                            {/* Main line */}
                            <polyline
                              fill="none"
                              stroke={color}
                              strokeWidth={isWinner ? 3.5 : 2.5}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              points={linePts}
                              style={isWinner ? { filter: `drop-shadow(0 0 4px ${color})` } : undefined}
                            />
                            {/* Round points */}
                            {vals.map((v, i) => (
                              <circle
                                key={i}
                                cx={xFor(i)}
                                cy={yFor(v)}
                                r={isWinner ? 5 : 4}
                                fill={color}
                                stroke="#0e0e2a"
                                strokeWidth="2.5"
                              />
                            ))}
                            {/* Final value label at end of line */}
                            <g>
                              <rect
                                x={finalX + 8}
                                y={finalY - 11}
                                width={finalVal >= 10 ? 44 : 40}
                                height={22}
                                rx={4}
                                fill={color}
                                fillOpacity={isWinner ? 1 : 0.9}
                              />
                              <text
                                x={finalX + 8 + (finalVal >= 10 ? 22 : 20)}
                                y={finalY + 4}
                                textAnchor="middle"
                                fill={isWinner ? '#fff' : '#0e0e2a'}
                                fontSize="11"
                                fontWeight="700"
                                fontFamily="inherit"
                                className="tabular-nums"
                              >
                                {finalVal.toFixed(2)}
                              </text>
                            </g>
                          </g>
                        );
                      })}

                    {/* Round labels on X-axis */}
                    {Array.from({ length: battle.rounds + 1 }, (_, i) => (
                      <text
                        key={i}
                        x={xFor(i)}
                        y={chartH - 10}
                        textAnchor="middle"
                        fill="#8888aa"
                        fontSize="12"
                        fontWeight="600"
                        fontFamily="inherit"
                      >
                        {i === 0 ? t('detail.start') : `R${i}`}
                      </text>
                    ))}

                    {/* Y-axis baseline */}
                    <line
                      x1={PAD_LEFT}
                      y1={plotY1}
                      x2={chartW - PAD_RIGHT + 20}
                      y2={plotY1}
                      stroke="rgba(255,255,255,0.25)"
                      strokeWidth="1.5"
                    />
                    <line
                      x1={PAD_LEFT}
                      y1={plotY0}
                      x2={PAD_LEFT}
                      y2={plotY1}
                      stroke="rgba(255,255,255,0.12)"
                      strokeWidth="1"
                    />
                  </svg>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Round-by-Round Card Breakdown */}
        {Object.keys(pullsByRound).length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-[#8888aa] uppercase tracking-wider mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#C84FFF]" /> {t('detail.roundOverview')}
            </h2>
            <div className="space-y-3">
              {Array.from({ length: battle.rounds }, (_, i) => i + 1).map((round) => {
                const roundPulls = pullsByRound[round] || [];
                if (roundPulls.length === 0) return null;
                const roundHighest = Math.max(...roundPulls.map(p => p.coinValue));

                return (
                  <div key={round} className="bg-[#12123a] border border-[rgba(255,255,255,0.06)] rounded-xl overflow-hidden">
                    <div className="px-4 py-2.5 bg-[#0e0e2a] flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{t('detail.roundLabel')} {round}</span>
                      <span className="text-[10px] text-[#444466]">{round}/{battle.rounds}</span>
                    </div>
                    <div className="p-4">
                      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
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
                                <div className="mx-auto w-16 h-[88px] mb-2">
                                  <img src={pull.itemImage} alt={pull.itemName || ''} className="w-full h-full object-cover rounded-lg" />
                                </div>
                              ) : (
                                <div className="mx-auto w-16 h-[88px] mb-2 bg-[#1a1a4a] rounded-lg flex items-center justify-center">
                                  <span className="text-[#333355] text-xl">?</span>
                                </div>
                              )}
                              <div className="text-xs text-white font-semibold truncate mb-0.5">{pull.itemName || '?'}</div>
                              {pull.itemRarity && (
                                <div className="text-[9px] text-[#666688] mb-0.5 uppercase tracking-wider">{pull.itemRarity}</div>
                              )}
                              <div className="text-amber-400 font-bold text-sm">{pull.coinValue.toFixed(2)}</div>
                              {isTransferred && (
                                <div className="mt-1 text-[9px] text-red-400 font-medium flex items-center justify-center gap-0.5">
                                  <ArrowRightLeft className="w-2.5 h-2.5" /> {t('detail.transferred')}
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
              <ArrowRightLeft className="w-4 h-4 text-red-400" /> {t('detail.transferredCards')}
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
                      <div className="text-xs text-white font-medium truncate">{pull.itemName || '?'}</div>
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
        <div className="flex flex-col sm:flex-row gap-3 justify-center px-2">
          <Link href="/battles" className="px-5 py-2.5 bg-[#12123a] text-white font-semibold rounded-xl hover:bg-[#1a1a4a] transition-all border border-[rgba(255,255,255,0.08)] text-sm">
            {t('detail.backToLobby')}
          </Link>
          <Link href="/battles/create" className="px-5 py-2.5 bg-[#C84FFF] text-white font-semibold rounded-xl hover:bg-[#E879F9] transition-all text-sm">
            {t('detail.newBattle')}
          </Link>
        </div>
      </div>
    </div>
  );
}
