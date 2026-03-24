# Dashboard Homepage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the generic public homepage with a personalized Bento-grid dashboard for logged-in users, featuring a real-time pull ticker (SSE), user KPIs, gamification CTAs, and responsive mobile layout.

**Architecture:** Server component (`page.tsx`) handles auth gate + data fetching. Client component (`DashboardClient.tsx`) renders the Bento grid with individual widget components. SSE endpoint streams rare+ pulls in real-time. Non-authenticated users redirect to `/login`.

**Tech Stack:** Next.js 14 App Router, React Server Components, Prisma, Server-Sent Events, Framer Motion (CountUp animations), Tailwind CSS v4.

**Spec:** `docs/superpowers/specs/2026-03-24-dashboard-homepage-design.md`

---

## File Structure

### New Files

| File | Responsibility |
|---|---|
| `src/app/api/pulls/live/route.ts` | SSE endpoint — streams rare+ pulls every 3s |
| `src/components/dashboard/LiveTicker.tsx` | Horizontal scrolling ticker with SSE connection |
| `src/components/dashboard/WelcomeWidget.tsx` | Welcome message, level/XP bar, CTAs |
| `src/components/dashboard/CoinBalanceWidget.tsx` | Coin balance + "Aufladen" CTA |
| `src/components/dashboard/BestPullWidget.tsx` | Today's best pull + "Open Box" CTA |
| `src/components/dashboard/StatsWidget.tsx` | 4-stat grid with CountUp |
| `src/components/dashboard/BattlesWidget.tsx` | Active battles + Join buttons |
| `src/components/dashboard/FeaturedBoxesWidget.tsx` | Scrollable boxes with arrow nav |
| `src/components/dashboard/RecentPullsWidget.tsx` | User's recent pulls with arrow nav |
| `src/components/dashboard/LeaderboardWidget.tsx` | Top 3 + user rank |
| `src/components/dashboard/AchievementsWidget.tsx` | Next 3 achievements + progress bars |
| `src/components/dashboard/ScrollableRow.tsx` | Reusable horizontal scroll with arrow buttons |

### Modified Files

| File | Changes |
|---|---|
| `src/app/page.tsx` | Complete rewrite — auth gate, Prisma queries, render DashboardPage |
| `src/hooks/useCountUp.ts` | Already exists — reuse for stat animations |

### Unchanged Files

- `src/app/layout.tsx` — Navigation stays unconditional
- `src/lib/auth.ts` — Use existing `getCurrentSession()`
- `src/lib/prisma.ts` — Use existing `prisma` client
- `src/lib/level.ts` — Use existing `titleForLevel`, `xpProgressInCurrentLevel`
- All existing API routes — no changes needed

---

## Task 1: SSE Endpoint for Live Pulls

**Files:**
- Create: `src/app/api/pulls/live/route.ts`

- [ ] **Step 1: Create the SSE endpoint**

```typescript
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

// Rarity values that qualify as "hits" for the live feed
const HIT_RARITIES = [
  'rare', 'r', 'holo rare', 'holo', 'promo',
  'super rare', 'sr', 'epic', 'ultra rare', 'ultra', 'double rare', 'rr',
  'leader', 'special', 'illustration rare', 'full art', 'v', 'vstar', 'vmax', 'ex', 'gx',
  'legendary', 'mythic', 'mythic rare', 'secret', 'secret rare', 'ssr', 'ur',
  'alt art', 'alternate art', 'art rare', 'gold', 'hyper rare', 'chase', 'manga',
];

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();
  let lastTimestamp = new Date();
  let closed = false;

  const stream = new ReadableStream({
    async start(controller) {
      // Send initial keepalive
      controller.enqueue(encoder.encode(': keepalive\n\n'));

      const poll = async () => {
        if (closed) return;

        try {
          const newPulls = await prisma.pull.findMany({
            where: {
              timestamp: { gt: lastTimestamp },
              card: {
                rarity: { in: HIT_RARITIES, mode: 'insensitive' },
              },
            },
            include: {
              user: { select: { id: true, name: true } },
              card: { select: { id: true, name: true, imageUrlGatherer: true, rarity: true, coinValue: true } },
              box: { select: { id: true, name: true } },
            },
            orderBy: { timestamp: 'desc' },
            take: 5,
          });

          if (newPulls.length > 0) {
            lastTimestamp = newPulls[0].timestamp;
            for (const pull of newPulls) {
              const event = {
                pullId: pull.id,
                userId: pull.user.id,
                userName: pull.user.name || 'Anonymous',
                cardId: pull.card?.id,
                cardName: pull.card?.name || 'Unknown',
                cardImage: pull.card?.imageUrlGatherer,
                rarity: pull.card?.rarity || 'rare',
                coinValue: pull.card?.coinValue ? Number(pull.card.coinValue) : 0,
                boxId: pull.box?.id || pull.boxId,
                boxName: pull.box?.name || 'Pack',
                timestamp: pull.timestamp.toISOString(),
              };
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
            }
          }
        } catch (err) {
          // Silently continue on DB errors
        }

        if (!closed) {
          setTimeout(poll, 3000);
        }
      };

      poll();

      // Keepalive every 30 seconds
      const keepalive = setInterval(() => {
        if (closed) { clearInterval(keepalive); return; }
        try { controller.enqueue(encoder.encode(': keepalive\n\n')); } catch { clearInterval(keepalive); }
      }, 30000);
    },
    cancel() {
      closed = true;
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
```

- [ ] **Step 2: Verify endpoint works**

Run: `npm run dev`, then: `curl -N http://localhost:3000/api/pulls/live`
Expected: SSE stream with keepalive comments, pull events when new rare+ pulls occur.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/pulls/live/route.ts
git commit -m "feat: add SSE endpoint for live rare+ pull feed"
```

---

## Task 2: ScrollableRow Component

**Files:**
- Create: `src/components/dashboard/ScrollableRow.tsx`

- [ ] **Step 1: Create reusable scroll component with arrow buttons**

```typescript
'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ScrollableRowProps {
  children: React.ReactNode;
  className?: string;
}

export function ScrollableRow({ children, className = '' }: ScrollableRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
  }, []);

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', checkScroll, { passive: true });
    const observer = new ResizeObserver(checkScroll);
    observer.observe(el);
    return () => { el.removeEventListener('scroll', checkScroll); observer.disconnect(); };
  }, [checkScroll]);

  const scroll = (direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.7;
    el.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  return (
    <div className="relative group">
      {canScrollLeft && (
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-[#1e1e55] border border-[rgba(255,255,255,0.15)] shadow-lg flex items-center justify-center text-[#f0f0f5] opacity-0 group-hover:opacity-100 transition-opacity hover:border-[rgba(191,255,0,0.3)]"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      )}
      <div
        ref={scrollRef}
        className={`flex overflow-x-auto scrollbar-hide ${className}`}
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {children}
      </div>
      {canScrollRight && (
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-[#1e1e55] border border-[rgba(255,255,255,0.15)] shadow-lg flex items-center justify-center text-[#f0f0f5] opacity-0 group-hover:opacity-100 transition-opacity hover:border-[rgba(191,255,0,0.3)]"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/dashboard/ScrollableRow.tsx
git commit -m "feat: add ScrollableRow component with arrow navigation"
```

---

## Task 3: Dashboard Widgets (Batch 1 — Static Widgets)

**Files:**
- Create: `src/components/dashboard/WelcomeWidget.tsx`
- Create: `src/components/dashboard/CoinBalanceWidget.tsx`
- Create: `src/components/dashboard/StatsWidget.tsx`
- Create: `src/components/dashboard/BestPullWidget.tsx`

These are the simpler widgets that render server-provided data without client-side fetching.

- [ ] **Step 1: Create WelcomeWidget**

Props: `{ userName, level, xp, xpForNextLevel, xpPercent, title, dynamicSubtitle }`
Contains: Welcome heading, dynamic subtitle, "Open Box" + "Join Battle" CTA buttons, Level/XP bar.
All classes use direct Tailwind (no custom CSS classes).

- [ ] **Step 2: Create CoinBalanceWidget**

Props: `{ coins, cheapestBoxPrice }`
Contains: Large coin balance, "Coins aufladen" button (links to `/purchase-coins`), pulsing animation when `coins < cheapestBoxPrice`, "Running low!" warning text.

- [ ] **Step 3: Create StatsWidget**

Props: `{ packsOpened, battlesWon, winRate, collectionValue }`
Contains: 2×2 grid of stat cards. Each value uses `useCountUp` hook for animated entrance.

- [ ] **Step 4: Create BestPullWidget**

Props: `{ cardName, cardImage, rarity, coinValue, pullerName, boxId, boxName }`
Contains: Card image with rarity glow, card info, coin value, "Open this Box →" CTA linking to `/open/{boxId}`.

- [ ] **Step 5: Commit**

```bash
git add src/components/dashboard/
git commit -m "feat: add Welcome, CoinBalance, Stats, BestPull dashboard widgets"
```

---

## Task 4: Dashboard Widgets (Batch 2 — Interactive Widgets)

**Files:**
- Create: `src/components/dashboard/BattlesWidget.tsx`
- Create: `src/components/dashboard/FeaturedBoxesWidget.tsx`
- Create: `src/components/dashboard/RecentPullsWidget.tsx`
- Create: `src/components/dashboard/LeaderboardWidget.tsx`
- Create: `src/components/dashboard/AchievementsWidget.tsx`

- [ ] **Step 1: Create BattlesWidget**

Props: `{ battles: Array<{ id, name, rounds, participants, maxParticipants }> }`
Contains: List of up to 3 battles with Join button. "Almost full!" pulse when `participants === max - 1`. "View all battles →" link.

- [ ] **Step 2: Create FeaturedBoxesWidget**

Props: `{ boxes: Array<{ id, name, imageUrl, price }> }`
Contains: `ScrollableRow` wrapping mini box cards. Each links to `/open/{boxId}`. "Browse all →" link.

- [ ] **Step 3: Create RecentPullsWidget**

Props: `{ pulls: Array<{ cardName, cardImage, rarity, timestamp }> }`
Contains: `ScrollableRow` wrapping pull cards with rarity borders. Fresh pulls (< 5min) get shimmer animation. "View collection →" link.

- [ ] **Step 4: Create LeaderboardWidget**

Props: `{ entries: Array<{ rank, name, points }>, userRank, userPoints, month }`
Contains: Top 3 with gold/silver/bronze badges. User's own rank highlighted. "Full leaderboard →" link.

- [ ] **Step 5: Create AchievementsWidget**

Props: `{ achievements: Array<{ name, icon, progress, target }> }`
Client component — fetches from `/api/user/achievements` on mount.
Contains: 3 closest achievements with progress bars. >90% progress bars pulse with "Almost there!" label. "All achievements →" link.

- [ ] **Step 6: Commit**

```bash
git add src/components/dashboard/
git commit -m "feat: add Battles, FeaturedBoxes, RecentPulls, Leaderboard, Achievements widgets"
```

---

## Task 5: Live Ticker Component

**Files:**
- Create: `src/components/dashboard/LiveTicker.tsx`

- [ ] **Step 1: Create LiveTicker with SSE connection**

Client component that:
- Connects to `/api/pulls/live` via `EventSource`
- Maintains array of max 20 ticker items
- Renders horizontal scrolling track (CSS animation, duplicated for seamless loop)
- Each item: card image, username, card name, rarity badge, box name (clickable → `/open/{boxId}`), timestamp, "Open →" CTA
- Legendary items: golden glow + pulse animation
- Red "LIVE" indicator on left
- Reconnects on disconnect with exponential backoff
- Falls back to polling `/api/pulls/recent` if SSE fails

- [ ] **Step 2: Commit**

```bash
git add src/components/dashboard/LiveTicker.tsx
git commit -m "feat: add LiveTicker component with SSE connection and legendary animations"
```

---

## Task 6: Dashboard Page — Server Component

**Files:**
- Modify: `src/app/page.tsx` (complete rewrite)

- [ ] **Step 1: Rewrite page.tsx as authenticated dashboard**

```typescript
import { redirect } from 'next/navigation';
import { getCurrentSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { titleForLevel, xpProgressInCurrentLevel } from '@/lib/level';
// ... widget imports

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const session = await getCurrentSession();
  if (!session?.user?.email) redirect('/login');

  // Fetch all data in parallel
  const [user, recentPulls, battleStats, bestPull, activeBattles, featuredBoxes, leaderboard, cheapestBox] = await Promise.all([
    prisma.user.findUnique({ where: { email: session.user.email }, select: { ... } }),
    prisma.pull.findMany({ where: { userId: ... }, orderBy: { timestamp: 'desc' }, take: 8, include: { card: true } }),
    // ... other queries
  ]);

  // Calculate derived data (XP, winRate, dynamicSubtitle, luckStreak)
  // Serialize Decimals with Number()

  return (
    <div className="min-h-screen bg-[#06061a]">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 py-6">
        <LiveTicker />
        <div className="grid grid-cols-12 gap-4 sm:gap-5">
          <WelcomeWidget className="col-span-12 lg:col-span-8" ... />
          <CoinBalanceWidget className="col-span-12 lg:col-span-4" ... />
          <BestPullWidget className="col-span-12 sm:col-span-6 lg:col-span-4" ... />
          <StatsWidget className="col-span-12 sm:col-span-6 lg:col-span-4" ... />
          <BattlesWidget className="col-span-12 sm:col-span-6 lg:col-span-4" ... />
          <FeaturedBoxesWidget className="col-span-12 sm:col-span-6 lg:col-span-4" ... />
          <RecentPullsWidget className="col-span-12 lg:col-span-5" ... />
          <LeaderboardWidget className="col-span-12 sm:col-span-6 lg:col-span-3" ... />
          <AchievementsWidget className="col-span-12 sm:col-span-6 lg:col-span-4" ... />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Test auth redirect**

Visit `/` when not logged in → should redirect to `/login`.
Visit `/` when logged in → should show dashboard.

- [ ] **Step 3: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: replace homepage with authenticated Bento-grid dashboard"
```

---

## Task 7: Dynamic Subtitle Logic

**Files:**
- Modify: `src/app/page.tsx` (add subtitle calculation)

- [ ] **Step 1: Implement luck streak and dynamic subtitle**

In the server component, after fetching user pulls:

```typescript
// Calculate luck streak: consecutive rare+ pulls from most recent
function calculateLuckStreak(pulls: any[]): number {
  const hitRarities = new Set(['rare', 'holo rare', 'super rare', 'epic', 'ultra rare', ...]);
  let streak = 0;
  for (const pull of pulls) {
    const rarity = (pull.card?.rarity || '').toLowerCase().trim();
    if (hitRarities.has(rarity)) streak++;
    else break;
  }
  return streak;
}

// Dynamic subtitle priority:
// 1. Luck streak >= 3: "Your luck streak: {n} hits! 🔥"
// 2. Active battles > 0: "{n} Battles are waiting for you ⚔️"
// 3. Achievement > 90%: "Almost there — {name}!"
// 4. Default: "Ready to open some packs? 🎴"
```

- [ ] **Step 2: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: add dynamic welcome subtitle with luck streak, battles, achievements context"
```

---

## Task 8: Mobile Optimization Pass

**Files:**
- Modify: All widget components

- [ ] **Step 1: Audit all widgets on 375px viewport**

Check each widget renders correctly on iPhone SE width (375px):
- LiveTicker: smaller text, compact items
- WelcomeWidget: CTAs stack vertically on mobile
- CoinBalance: full width
- Stats: stays 2×2 grid
- Battles: full width cards
- Boxes/Pulls: ScrollableRow with arrow buttons hidden on touch (swipe native)

- [ ] **Step 2: Fix any mobile issues found**

Apply responsive Tailwind classes (`text-sm sm:text-base`, `p-4 sm:p-5`, `gap-3 sm:gap-4`, etc.)

- [ ] **Step 3: Commit**

```bash
git add src/components/dashboard/
git commit -m "fix: mobile optimization pass for all dashboard widgets"
```

---

## Task 9: Cleanup Old Homepage Code

**Files:**
- Modify: `src/app/globals.css` (remove unused deck animation CSS if still present)

- [ ] **Step 1: Remove old homepage-specific CSS**

Search for and remove any CSS that was only used by the old homepage (if any).

- [ ] **Step 2: Verify full build passes**

```bash
npm run typecheck && npm run build
```

- [ ] **Step 3: Commit**

```bash
git add src/app/globals.css
git commit -m "chore: remove unused homepage CSS"
```

---

## Summary

| Task | What | Files |
|---|---|---|
| 1 | SSE Endpoint | `api/pulls/live/route.ts` |
| 2 | ScrollableRow | `components/dashboard/ScrollableRow.tsx` |
| 3 | Static Widgets (4) | Welcome, CoinBalance, Stats, BestPull |
| 4 | Interactive Widgets (5) | Battles, FeaturedBoxes, RecentPulls, Leaderboard, Achievements |
| 5 | Live Ticker | `components/dashboard/LiveTicker.tsx` |
| 6 | Dashboard Page | `app/page.tsx` (rewrite) |
| 7 | Dynamic Subtitle | Logic in `page.tsx` |
| 8 | Mobile Optimization | All widgets |
| 9 | Cleanup | Remove old CSS |

**Total: 9 tasks, ~12 new files, 1 rewritten file.**

**Important reminders:**
- Before each commit: code review + `npm run typecheck` + `npm run build`
- Never include Co-Authored-By in commits
- Use direct Tailwind classes, never custom CSS classes like `glass` or `card-lift`
- Card backgrounds: `bg-[#1a1a4a]`, borders: `border-[rgba(255,255,255,0.1)]`
- All coin values: `.toFixed(2)`, all Decimals: `Number(x)` before serializing
