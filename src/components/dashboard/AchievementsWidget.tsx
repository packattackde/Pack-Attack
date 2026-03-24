'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Achievement {
  id: string;
  name: string;
  icon: string;
  progress: number;
  target: number;
}

interface ApiAchievement {
  id: string;
  name: string;
  icon: string;
  progress: number;
  requirement: number;
  isUnlocked: boolean;
  isSecret: boolean;
}

interface AchievementsWidgetProps {
  className?: string;
}

export default function AchievementsWidget({ className = '' }: AchievementsWidgetProps) {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch('/api/user/achievements')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
      })
      .then((data) => {
        // API returns { achievements: [...], byCategory: {...}, summary: {...} }
        const rawList: ApiAchievement[] = Array.isArray(data) ? data : (data.achievements ?? []);
        // Map API fields to widget fields and filter to incomplete, non-secret achievements
        const mapped: Achievement[] = rawList
          .filter((a) => !a.isUnlocked && !a.isSecret)
          .map((a) => ({
            id: a.id,
            name: a.name,
            icon: a.icon,
            progress: a.progress,
            target: a.requirement,
          }));
        // Sort by progress percentage descending, pick top 3 closest to completion
        const sorted = mapped
          .filter((a) => a.target > 0)
          .sort((a, b) => b.progress / b.target - a.progress / a.target)
          .slice(0, 3);
        setAchievements(sorted);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, []);

  return (
    <div className={`bg-[#1a1a4a] border border-[rgba(255,255,255,0.1)] rounded-2xl p-5 sm:p-6 ${className}`}>
      <style>{`
        @keyframes bar-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        .bar-pulse { animation: bar-pulse 1.5s ease-in-out infinite; }
      `}</style>

      <div className="text-[10px] font-semibold uppercase tracking-wider text-[#7777a0] mb-3 flex items-center gap-1.5">
        🎯 Next Achievements
      </div>

      {loading && (
        <div className="space-y-4">
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
          <div className="space-y-3.5">
            {achievements.map((achievement) => {
              const pct = Math.round((achievement.progress / achievement.target) * 100);
              const almostDone = pct > 90;

              return (
                <div key={achievement.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[rgba(191,255,0,0.08)] flex items-center justify-center flex-shrink-0 text-base">
                    {achievement.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="text-[11px] font-semibold text-[#f0f0f5] truncate">
                        {achievement.name}
                      </p>
                      <span className="text-[10px] text-[#8888aa] flex-shrink-0">
                        {achievement.progress}/{achievement.target}
                      </span>
                    </div>
                    <div className="w-full h-[5px] bg-[rgba(255,255,255,0.06)] rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-[#BFFF00] rounded-full transition-all duration-500 ${
                          almostDone ? 'bar-pulse' : ''
                        }`}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                    {almostDone && (
                      <p className="text-[9px] text-[#BFFF00] font-semibold mt-0.5">
                        Almost there!
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <Link
            href="/achievements"
            className="text-[#BFFF00] text-[11px] font-semibold mt-4 inline-block hover:underline"
          >
            All achievements →
          </Link>
        </>
      )}
    </div>
  );
}
