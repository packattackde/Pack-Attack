import { getCurrentSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Plus, Users, Trophy, Coins, Swords, Clock, ChevronRight, Crown } from 'lucide-react';

const MODE_LABELS: Record<string, string> = {
  LOWEST_CARD: '⬇️ Niedrigste',
  HIGHEST_CARD: '⬆️ Höchste',
  ALL_CARDS: '🃏 Alle',
};

const STATUS_CONFIG: Record<string, { label: string; color: string; dot?: boolean }> = {
  OPEN: { label: 'Offen', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' },
  FULL: { label: 'Voll', color: 'bg-blue-500/15 text-blue-400 border-blue-500/20' },
  READY: { label: 'Bereit', color: 'bg-amber-500/15 text-amber-400 border-amber-500/20' },
  ACTIVE: { label: 'Läuft', color: 'bg-[#C84FFF]/15 text-[#E879F9] border-[#C84FFF]/20', dot: true },
  FINISHED_WIN: { label: 'Beendet', color: 'bg-[#C84FFF]/10 text-[#C84FFF]/60 border-[#C84FFF]/10' },
  FINISHED_DRAW: { label: 'Unentschieden', color: 'bg-blue-500/10 text-blue-400/60 border-blue-500/10' },
};

async function getBattles(isAdmin: boolean) {
  try {
    const battles = await prisma.battle.findMany({
      where: isAdmin ? {} : { privacy: 'PUBLIC' },
      include: {
        creator: { select: { id: true, name: true, email: true } },
        box: true,
        roundBoxes: {
          include: { box: true },
          orderBy: { roundNumber: 'asc' },
        },
        participants: {
          include: { user: { select: { id: true, name: true, email: true, isBot: true } } },
        },
        winner: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 60,
    });
    return battles.map(battle => ({
      ...battle,
      box: battle.box ? { ...battle.box, price: Number(battle.box.price) } : null,
      roundBoxes: battle.roundBoxes.map(rb => ({
        ...rb,
        box: { ...rb.box, price: Number(rb.box.price) },
      })),
    }));
  } catch {
    return [];
  }
}

export default async function BattlesPage() {
  const session = await getCurrentSession();
  const isAdmin = session?.user?.role === 'ADMIN';
  const battles = await getBattles(!!isAdmin);

  const activeBattles = battles.filter(b => ['OPEN', 'FULL', 'READY', 'ACTIVE'].includes(b.status));
  const completedBattles = battles.filter(b => ['FINISHED_WIN', 'FINISHED_DRAW'].includes(b.status));

  const getVisibleParticipants = (battle: any) => {
    if (isAdmin) return battle.participants;
    return battle.participants.filter((p: any) => !p.user?.isBot);
  };

  return (
    <div className="min-h-screen font-display">
      <div className="fixed inset-0 bg-grid opacity-20 pointer-events-none" />
      <div className="fixed inset-0 radial-gradient pointer-events-none" />

      <div className="relative container py-10 sm:py-14">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold">
              <span className="text-white">Box </span>
              <span className="text-[#C84FFF]">Battles</span>
            </h1>
            <p className="text-[#8888aa] text-sm mt-1">Tritt gegen andere Spieler an und gewinne Karten</p>
          </div>
          {session ? (
            <Link
              href="/battles/create"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#C84FFF] hover:bg-[#E879F9] text-white font-semibold rounded-xl transition-all hover:scale-[1.02] text-sm shrink-0"
            >
              <Plus className="w-4 h-4" />
              Battle erstellen
            </Link>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-white bg-[#12123a] border border-[rgba(255,255,255,0.1)] hover:border-[rgba(255,255,255,0.2)] transition-all text-sm shrink-0"
            >
              Anmelden
            </Link>
          )}
        </div>

        {battles.length === 0 ? (
          <div className="rounded-2xl p-12 text-center bg-[#1a1a4a] border border-[rgba(255,255,255,0.08)]">
            <Swords className="w-12 h-12 text-[#C84FFF] mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Keine Battles</h2>
            <p className="text-[#8888aa] text-sm mb-6">Sei der Erste und erstelle ein Battle!</p>
            <Link
              href={session ? '/battles/create' : '/login'}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#C84FFF] text-white font-semibold rounded-xl text-sm"
            >
              <Plus className="w-4 h-4" />
              {session ? 'Battle erstellen' : 'Anmelden'}
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Active Battles */}
            {activeBattles.length > 0 && (
              <section>
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <h2 className="text-lg font-bold text-white">Aktive Battles</h2>
                  <span className="text-xs text-[#666688] bg-[#12123a] px-2 py-0.5 rounded-full">{activeBattles.length}</span>
                </div>
                <div className="space-y-3">
                  {activeBattles.map((battle) => {
                    const entryFee = Number(battle.entryFee);
                    const modeLabel = MODE_LABELS[battle.battleMode] || battle.battleMode;
                    const status = STATUS_CONFIG[battle.status] || STATUS_CONFIG.OPEN;
                    const visibleP = getVisibleParticipants(battle);
                    const emptySlots = battle.maxParticipants - battle.participants.length;
                    const firstBox = battle.roundBoxes?.length > 0 ? battle.roundBoxes[0].box : battle.box;
                    const uniqueBoxNames = battle.roundBoxes?.length > 0
                      ? [...new Set(battle.roundBoxes.map((rb: any) => rb.box.name))]
                      : [firstBox?.name];
                    const displayName = uniqueBoxNames.length === 1 ? uniqueBoxNames[0] : `${uniqueBoxNames.length} Boxen Mix`;

                    return (
                      <Link
                        key={battle.id}
                        href={`/battles/${battle.id}`}
                        className={`group flex items-center gap-4 bg-[#12123a] border rounded-xl p-4 hover:border-[rgba(200,79,255,0.3)] transition-all duration-200 ${
                          battle.status === 'OPEN'
                            ? 'border-emerald-500/15 hover:bg-[#12123a]/80'
                            : 'border-[rgba(255,255,255,0.06)] hover:bg-[#1a1a4a]'
                        }`}
                      >
                        {/* Box thumbnail */}
                        <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-[#1a1a4a]">
                          {firstBox?.imageUrl && <img src={firstBox.imageUrl} alt="" className="w-full h-full object-cover" />}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-white text-sm truncate group-hover:text-[#C84FFF] transition-colors">
                              {displayName}
                            </h3>
                            <span className={`shrink-0 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${status.color}`}>
                              {status.dot && <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />}
                              {status.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-[#666688]">
                            <span>{battle.rounds} Runden</span>
                            <span className="text-[#444466]">·</span>
                            <span>{modeLabel}</span>
                          </div>
                        </div>

                        {/* Player slots */}
                        <div className="hidden sm:flex items-center gap-1 shrink-0">
                          {visibleP.slice(0, 4).map((p: any) => (
                            <div
                              key={p.id}
                              className="w-8 h-8 rounded-full bg-gradient-to-br from-[#C84FFF] to-[#7C3AED] flex items-center justify-center text-[10px] font-bold text-white"
                            >
                              {p.user.name?.[0]?.toUpperCase() || '?'}
                            </div>
                          ))}
                          {Array.from({ length: Math.min(emptySlots, 3) }).map((_, i) => (
                            <div
                              key={`empty-${i}`}
                              className="w-8 h-8 rounded-full border-2 border-dashed border-[rgba(255,255,255,0.1)] flex items-center justify-center"
                            >
                              <Plus className="w-3 h-3 text-[#444466]" />
                            </div>
                          ))}
                        </div>

                        {/* Price + CTA */}
                        <div className="shrink-0 text-right">
                          <div className="flex items-center gap-1 text-amber-400 font-bold text-sm justify-end">
                            <Coins className="w-3.5 h-3.5" />
                            {entryFee.toFixed(0)}
                          </div>
                          {battle.status === 'OPEN' && emptySlots > 0 ? (
                            <span className="text-[10px] text-emerald-400 font-medium">Beitreten</span>
                          ) : (
                            <span className="text-[10px] text-[#666688]">Ansehen</span>
                          )}
                        </div>

                        <ChevronRight className="w-4 h-4 text-[#444466] group-hover:text-[#C84FFF] transition-colors shrink-0" />
                      </Link>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Completed Battles */}
            {completedBattles.length > 0 && (
              <section>
                <div className="flex items-center gap-2.5 mb-4">
                  <Trophy className="w-4 h-4 text-amber-400/60" />
                  <h2 className="text-lg font-bold text-[#8888aa]">Abgeschlossen</h2>
                  <span className="text-xs text-[#666688] bg-[#12123a] px-2 py-0.5 rounded-full">{completedBattles.length}</span>
                </div>
                <div className="space-y-2">
                  {completedBattles.map((battle) => {
                    const entryFee = Number(battle.entryFee);
                    const modeLabel = MODE_LABELS[battle.battleMode] || battle.battleMode;
                    const isDraw = battle.status === 'FINISHED_DRAW';
                    const firstBox = battle.roundBoxes?.length > 0 ? battle.roundBoxes[0].box : battle.box;
                    const uniqueBoxNames = battle.roundBoxes?.length > 0
                      ? [...new Set(battle.roundBoxes.map((rb: any) => rb.box.name))]
                      : [firstBox?.name];
                    const displayName = uniqueBoxNames.length === 1 ? uniqueBoxNames[0] : `${uniqueBoxNames.length} Boxen Mix`;

                    return (
                      <Link
                        key={battle.id}
                        href={`/battles/${battle.id}`}
                        className="group flex items-center gap-4 bg-[#0e0e2a] border border-[rgba(255,255,255,0.04)] rounded-xl p-3.5 hover:border-[rgba(255,255,255,0.1)] hover:bg-[#12123a] transition-all duration-200"
                      >
                        <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-[#1a1a4a] opacity-60">
                          {firstBox?.imageUrl && <img src={firstBox.imageUrl} alt="" className="w-full h-full object-cover" />}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-[#8888aa] text-sm truncate group-hover:text-white transition-colors">
                            {displayName}
                          </h3>
                          <div className="flex items-center gap-2 text-xs text-[#444466]">
                            <span>{battle.rounds} Runden</span>
                            <span>·</span>
                            <span>{modeLabel}</span>
                          </div>
                        </div>

                        {/* Winner */}
                        {isDraw ? (
                          <span className="text-xs text-blue-400/60 font-medium shrink-0">Unentschieden</span>
                        ) : battle.winner ? (
                          <div className="hidden sm:flex items-center gap-1.5 shrink-0">
                            <Crown className="w-3 h-3 text-amber-400/60" />
                            <span className="text-xs text-[#8888aa] font-medium">{battle.winner.name || 'Gewinner'}</span>
                          </div>
                        ) : null}

                        <div className="flex items-center gap-1 text-[#666688] text-xs font-medium shrink-0">
                          <Coins className="w-3 h-3" />
                          {entryFee.toFixed(0)}
                        </div>

                        <ChevronRight className="w-4 h-4 text-[#333355] group-hover:text-[#666688] transition-colors shrink-0" />
                      </Link>
                    );
                  })}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
