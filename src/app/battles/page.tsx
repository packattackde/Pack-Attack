import { getCurrentSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Plus, Users, Trophy, Coins, Swords, Clock, ChevronRight } from 'lucide-react';
import { CompletedBattleCard } from './CompletedBattleCard';

const MODE_LABELS: Record<string, string> = {
  LOWEST_CARD: 'Niedrigste Karte',
  HIGHEST_CARD: 'Höchste Karte',
  ALL_CARDS: 'Alle Karten',
};

const WIN_CONDITION_SHORT: Record<string, string> = {
  HIGHEST: '📈 Höchster',
  LOWEST: '📉 Niedrigster',
};

async function getBattles() {
  try {
    const battles = await prisma.battle.findMany({
      include: {
        creator: { select: { id: true, name: true, email: true } },
        box: true,
        participants: {
          include: { user: { select: { id: true, name: true, email: true, isBot: true } } },
        },
        winner: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return battles.map(battle => ({
      ...battle,
      box: { ...battle.box, price: Number(battle.box.price) },
    }));
  } catch {
    return [];
  }
}

export default async function BattlesPage() {
  const session = await getCurrentSession();
  const battles = await getBattles();
  const isAdmin = session?.user?.role === 'ADMIN';

  const activeBattles = battles.filter(b => ['OPEN', 'FULL', 'READY', 'ACTIVE'].includes(b.status));
  const completedBattles = battles.filter(b => ['FINISHED_WIN', 'FINISHED_DRAW'].includes(b.status));

  const getVisibleParticipants = (battle: any) => {
    if (isAdmin) return battle.participants;
    return battle.participants.filter((p: any) => !p.user?.isBot);
  };

  return (
    <div className="min-h-screen font-display">
      <div className="fixed inset-0 bg-grid opacity-30" />
      <div className="fixed inset-0 radial-gradient" />
      <div className="fixed top-20 right-10 w-96 h-96 bg-[rgba(191,255,0,0.08)] rounded-full blur-3xl hidden lg:block" />

      <div className="relative container py-14 sm:py-16">
        {/* Header */}
        <div className="mb-12 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-4 rounded-full text-sm bg-[#1a1a4a] border border-[rgba(255,255,255,0.12)] shadow-md">
              <Swords className="w-4 h-4 text-[#BFFF00]" />
              <span className="text-[#f0f0f5]">PvP Arena</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-3">
              <span className="text-white">Box </span>
              <span className="text-[#BFFF00]">Battles</span>
            </h1>
            <p className="text-[#8888aa] text-lg">
              Tritt gegen andere Spieler an. Der höchste Kartenwert gewinnt!
            </p>
          </div>
          {session ? (
            <Link
              href="/battles/create"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#BFFF00] hover:bg-[#d4ff4d] text-black font-semibold rounded-xl transition-all hover:scale-105 shimmer"
            >
              <Plus className="w-5 h-5" />
              Battle erstellen
            </Link>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white gradient-border bg-[#12123a] hover:bg-[#12123a]/80 transition-all"
            >
              Anmelden zum Erstellen
            </Link>
          )}
        </div>

        {battles.length === 0 ? (
          <div className="rounded-2xl p-12 text-center bg-[#1e1e55] border border-[rgba(255,255,255,0.15)] shadow-lg">
            <div className="inline-flex items-center justify-center w-20 h-20 mb-6 rounded-2xl bg-[rgba(191,255,0,0.08)]">
              <Swords className="w-10 h-10 text-[#BFFF00]" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">Keine Battles gefunden</h2>
            <p className="text-[#8888aa] mb-6">Sei der Erste und erstelle ein Battle!</p>
            {session ? (
              <Link
                href="/battles/create"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#BFFF00] text-black font-semibold rounded-xl transition-all hover:scale-105"
              >
                <Plus className="w-5 h-5" />
                Battle erstellen
              </Link>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#BFFF00] text-black font-semibold rounded-xl transition-all hover:scale-105"
              >
                Anmelden zum Erstellen
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-10">
            {/* Active Battles */}
            {activeBattles.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-2 h-2 rounded-full bg-green-500 pulse-live" />
                  <h2 className="text-2xl font-bold text-white">Aktive Battles</h2>
                  <span className="text-sm text-[#8888aa]">({activeBattles.length})</span>
                </div>
                <div className="grid gap-6 sm:gap-7 md:grid-cols-2 lg:grid-cols-3">
                  {activeBattles.map((battle) => {
                    const entryFee = battle.box.price * battle.rounds;
                    const modeLabel = MODE_LABELS[battle.battleMode] || battle.battleMode;
                    const statusLabel = battle.status === 'OPEN' ? 'Offen'
                      : battle.status === 'FULL' ? 'Voll'
                      : battle.status === 'READY' ? 'Bereit'
                      : 'Läuft';

                    const statusColor = battle.status === 'OPEN'
                      ? 'bg-yellow-500/20 text-yellow-400'
                      : battle.status === 'ACTIVE'
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-blue-500/20 text-blue-400';

                    return (
                      <Link
                        key={battle.id}
                        href={`/battles/${battle.id}`}
                        className="group bg-[#1a1a4a] border border-[rgba(255,255,255,0.12)] shadow-lg rounded-2xl p-7 hover:-translate-y-1.5 hover:border-[rgba(191,255,0,0.3)] hover:shadow-[0_8px_30px_rgba(191,255,0,0.1)] transition-all duration-300"
                      >
                        <div className="flex items-center justify-between mb-5">
                          <span className="text-sm font-medium text-[#f0f0f5]">
                            {battle.rounds} Runde{battle.rounds !== 1 ? 'n' : ''}
                          </span>
                          <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${statusColor}`}>
                            {battle.status === 'OPEN' ? (
                              <><Clock className="w-3 h-3" />{statusLabel}</>
                            ) : battle.status === 'ACTIVE' ? (
                              <><div className="w-2 h-2 rounded-full bg-green-500 pulse-live" />{statusLabel}</>
                            ) : (
                              <><Users className="w-3 h-3" />{statusLabel}</>
                            )}
                          </span>
                        </div>

                        <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-[#BFFF00] transition-colors line-clamp-1">
                          {battle.box.name}
                        </h3>
                        <p className="text-sm text-[#8888aa] mb-4">
                          {modeLabel} · {WIN_CONDITION_SHORT[battle.winCondition] || battle.winCondition}
                        </p>

                        <div className="flex items-center gap-2 mb-4">
                          {getVisibleParticipants(battle).slice(0, 4).map((p: any, i: number) => (
                            <div
                              key={p.id}
                              className="w-9 h-9 rounded-full bg-gradient-to-br from-[#BFFF00] to-[#a0d600] flex items-center justify-center text-xs font-bold text-white"
                              style={{ marginLeft: i > 0 ? '-8px' : '0' }}
                            >
                              {p.user.name?.[0] || '?'}
                            </div>
                          ))}
                          <span className="text-sm text-[#8888aa] ml-2">
                            {battle.participants.length}/{battle.maxParticipants}
                            {battle.status === 'OPEN' && battle.participants.length < battle.maxParticipants && (
                              <span className="ml-1 text-green-400">• Offen</span>
                            )}
                          </span>
                        </div>

                        <div className="flex items-center justify-between pt-4 mt-1 border-t border-[rgba(255,255,255,0.1)]">
                          <div className="flex items-center gap-1 text-amber-400">
                            <Coins className="w-4 h-4" />
                            <span className="font-semibold">{entryFee.toFixed(0)}</span>
                          </div>
                          <span className="text-[#BFFF00] text-sm font-medium group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                            Ansehen <ChevronRight className="w-4 h-4" />
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Completed Battles */}
            {completedBattles.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-8">
                  <Trophy className="w-5 h-5 text-amber-400" />
                  <h2 className="text-2xl font-bold text-white">Abgeschlossen</h2>
                  <span className="text-sm text-[#8888aa]">({completedBattles.length})</span>
                </div>
                <div className="grid gap-6 sm:gap-7 md:grid-cols-2 lg:grid-cols-3">
                  {completedBattles.map((battle) => (
                    <CompletedBattleCard
                      key={battle.id}
                      battle={battle}
                      isAdmin={isAdmin}
                      visibleParticipants={getVisibleParticipants(battle)}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
