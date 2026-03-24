'use client';

import Link from 'next/link';

interface Battle {
  id: string;
  name: string;
  rounds: number;
  participants: number;
  maxParticipants: number;
}

interface BattlesWidgetProps {
  battles: Battle[];
  className?: string;
}

export default function BattlesWidget({ battles, className = '' }: BattlesWidgetProps) {
  const displayBattles = battles.slice(0, 3);

  return (
    <div className={`bg-[#1a1a4a] border border-[rgba(255,255,255,0.1)] rounded-2xl p-4 sm:p-6 ${className}`}>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-[#7777a0] mb-3 flex items-center gap-1.5">
        ⚔️ Active Battles
      </div>

      {displayBattles.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-sm text-[#8888aa]">No active battles</p>
          <Link
            href="/battles/create"
            className="text-[#BFFF00] text-[11px] font-semibold mt-2 inline-block hover:underline"
          >
            Create one →
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-2.5">
            {displayBattles.map((battle) => {
              const almostFull = battle.participants === battle.maxParticipants - 1;

              return (
                <div
                  key={battle.id}
                  className="flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[#f0f0f5] truncate">
                      {battle.name}
                    </p>
                    <p className="text-[11px] text-[#8888aa]">
                      {battle.rounds} Rounds · {battle.participants}/{battle.maxParticipants}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {almostFull && (
                      <span className="text-[10px] font-semibold text-red-400 animate-pulse whitespace-nowrap">
                        Almost full!
                      </span>
                    )}
                    <Link
                      href={`/battles/${battle.id}`}
                      className={`bg-[#BFFF00] text-black text-[11px] font-bold rounded-lg px-3 py-1.5 min-h-[44px] min-w-[44px] inline-flex items-center justify-center hover:brightness-110 transition ${
                        almostFull ? 'animate-pulse' : ''
                      }`}
                    >
                      Join
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          <Link
            href="/battles"
            className="text-[#BFFF00] text-[11px] font-semibold mt-4 inline-block hover:underline"
          >
            View all battles →
          </Link>
        </>
      )}
    </div>
  );
}
