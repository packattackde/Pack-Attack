'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { GiMedal, GiArcheryTarget } from 'react-icons/gi';
import { InfoTooltip } from '@/components/InfoTooltip';

interface Achievement {
  id: string;
  name: string;
  icon: string;
  progress: number;
  target: number;
  isUnlocked: boolean;
  unlockedAt?: string;
}

interface ApiAchievement {
  id: string;
  name: string;
  icon: string;
  progress: number;
  requirement: number;
  isUnlocked: boolean;
  isSecret: boolean;
  unlockedAt?: string;
}

interface AchievementsWidgetProps {
  className?: string;
}

export default function AchievementsWidget({ className = '' }: AchievementsWidgetProps) {
  const [recentUnlocks, setRecentUnlocks] = useState<Achievement[]>([]);
  const [nextUp, setNextUp] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch('/api/user/achievements')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
      })
      .then((data) => {
        const rawList: ApiAchievement[] = Array.isArray(data) ? data : (data.achievements ?? []);

        // Recent unlocks: last 3 unlocked, sorted by unlock date desc
        const unlocked = rawList
          .filter((a) => a.isUnlocked && !a.isSecret)
          .map((a) => ({
            id: a.id, name: a.name, icon: a.icon,
            progress: a.progress, target: a.requirement,
            isUnlocked: true, unlockedAt: a.unlockedAt,
          }))
          .sort((a, b) => {
            if (a.unlockedAt && b.unlockedAt) return new Date(b.unlockedAt).getTime() - new Date(a.unlockedAt).getTime();
            return 0;
          })
          .slice(0, 3);

        // Next up: 3 closest to completion (not unlocked, not secret, target > 0)
        const upcoming = rawList
          .filter((a) => !a.isUnlocked && !a.isSecret && a.requirement > 0)
          .map((a) => ({
            id: a.id, name: a.name, icon: a.icon,
            progress: a.progress, target: a.requirement,
            isUnlocked: false,
          }))
          .sort((a, b) => (b.progress / b.target) - (a.progress / a.target))
          .slice(0, 3);

        setRecentUnlocks(unlocked);
        setNextUp(upcoming);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, []);

  return (
    <div className={`bg-[#1a1a4a] border border-[rgba(255,255,255,0.1)] rounded-2xl h-full p-4 sm:p-6 ${className}`}>
      <style>{`
        @keyframes bar-pulse {
          0%, 100% { box-shadow: 0 0 0 rgba(200,79,255,0); }
          50% { box-shadow: 0 0 8px rgba(200,79,255,0.4); }
        }
        .bar-pulse { animation: bar-pulse 1.5s ease-in-out infinite; }
      `}</style>

      <p className="text-[10px] font-semibold uppercase tracking-wider text-[#7777a0] mb-3 flex items-center gap-1.5">
        <GiMedal className="w-3.5 h-3.5 text-[#C84FFF] shrink-0" /> ACHIEVEMENTS
        <InfoTooltip infoKey="dashboard.achievements" />
      </p>

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[rgba(255,255,255,0.06)] animate-pulse flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-[rgba(255,255,255,0.06)] rounded animate-pulse w-2/3" />
                <div className="h-[5px] bg-[rgba(255,255,255,0.06)] rounded-full animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <p className="text-sm text-[#8888aa] py-4 text-center">
          Could not load achievements
        </p>
      )}

      {!loading && !error && (
        <>
          {/* Recent Unlocks */}
          {recentUnlocks.length > 0 && (
            <div className="mb-5">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-[#fbbf24] mb-3 flex items-center gap-1.5">
<GiMedal className="w-3.5 h-3.5 text-[#C84FFF]" /> Recently Unlocked
              </div>
              <div className="flex gap-2">
                {recentUnlocks.map((ach) => (
                  <div
                    key={ach.id}
                    className="flex-1 flex flex-col items-center gap-1.5 p-2.5 rounded-xl bg-[rgba(251,191,36,0.06)] border border-[rgba(251,191,36,0.15)]"
                  >
                    <span className="text-xl">{ach.icon}</span>
                    <span className="text-[9px] text-[#f0f0f5] font-semibold text-center leading-tight line-clamp-2">
                      {ach.name}
                    </span>
                    <span className="text-[8px] text-[#fbbf24] font-bold">✓ Unlocked</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Next Up */}
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-[#7777a0] mb-3 flex items-center gap-1.5">
<GiArcheryTarget className="w-3.5 h-3.5 text-[#C84FFF]" /> Next Up
            </div>
            {nextUp.length === 0 ? (
              <p className="text-[11px] text-[#8888aa] text-center py-3">All achievements unlocked! 🎉</p>
            ) : (
              <div className="space-y-3">
                {nextUp.map((ach) => {
                  const pct = Math.min(Math.round((ach.progress / ach.target) * 100), 100);
                  const almostThere = pct >= 90;
                  return (
                    <div key={ach.id} className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-[rgba(200,79,255,0.08)] border border-[rgba(200,79,255,0.15)] flex items-center justify-center text-base flex-shrink-0">
                        {ach.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] font-semibold text-[#f0f0f5] truncate mb-1">
                          {ach.name}
                        </div>
                        <div className="h-[5px] bg-[rgba(255,255,255,0.06)] rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full bg-[#C84FFF] ${almostThere ? 'bar-pulse' : ''}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <div className="flex justify-between mt-1">
                          <span className="text-[9px] text-[#7777a0]">{ach.progress} / {ach.target}</span>
                          {almostThere && (
                            <span className="text-[9px] text-[#C84FFF] font-semibold">Almost there!</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      <Link
        href="/dashboard"
        className="text-[#C84FFF] text-[11px] font-semibold mt-4 inline-block hover:underline"
      >
        All achievements →
      </Link>
    </div>
  );
}
