# Dashboard Homepage — Design Spec

**Date:** 2026-03-24
**Status:** Approved
**Scope:** Replace generic homepage with personalized user dashboard

---

## 1. Overview

The homepage (`/`) becomes a protected, personalized dashboard for logged-in users. Non-authenticated visitors are redirected to `/login`. The dashboard shows user-specific KPIs, global activity, real-time pull feed, and gamification-driven CTAs.

**Layout:** Bento-Grid (Widget cards of varying sizes)
**Responsive:** 12-column → 6-column (tablet) → 1-column (mobile)
**Real-time:** Server-Sent Events (SSE) for live pull feed

---

## 2. Authentication Gate

- `/` requires authentication — `getCurrentSession()` check
- If no session → redirect to `/login`
- Shop owners (`role === 'SHOP_OWNER'`) see the same dashboard for now (shop-specific dashboard is a separate future spec)

---

## 3. Live Pull Ticker (Horizontal)

**Position:** Top of page, above the Bento grid
**Data source:** SSE endpoint (`/api/pulls/live`)
**Filter:** Only Rare and above (rare, epic/super rare, legendary/mythic/secret)

**Per ticker item (entire item is a clickable link to the box):**
- Card thumbnail image (32×44px)
- Card name
- Username
- Rarity badge (color-coded: blue=rare, purple=epic, gold=legendary)
- Box name
- Relative timestamp ("3s ago")
- **"Open →" CTA** — small button/link on each ticker item linking to `/open/{boxId}`

**Animations:**
- Continuous horizontal scroll (CSS `translateX` animation, duplicated track for seamless loop)
- **Legendary hit trigger:** Ticker pauses ~2s, entry glows golden with particle burst, "LEGENDARY!" badge pulses, then resumes
- Red pulsing "LIVE" indicator on the left

**SSE endpoint spec (`/api/pulls/live`):**
- Streams new Pull events where rarity ≥ rare
- Event format: `{ pullId, userId, userName, cardId, cardName, cardImage, rarity, coinValue, boxId, boxName, timestamp }`
- New items prepended to ticker track
- Client keeps max ~20 items in DOM, removes oldest

---

## 4. Bento Grid Widgets

### 4.1 Welcome + Level/XP (span 8 columns)

- "Welcome back, **{name}**!" heading
- Dynamic subtitle based on context:
  - Default: "Ready to pull some cards? 🎴"
  - If luck streak (3+ rare pulls in a row): "Your luck streak: {n} hits! 🔥"
  - If battles waiting: "{n} Battles are waiting for you ⚔️"
  - If achievement almost done: "Almost there — {achievement name}!"
- Level number (large, neon green) + Title badge ("Elite Collector")
- XP progress bar (neon green gradient fill with glow)
- XP numbers: "43,200 / 57,600 XP" + "72% to Level 25"

### 4.2 Coin Balance (span 4 columns)

- Current coin balance (large, prominent)
- "Coins aufladen" CTA button (neon green, links to `/purchase-coins`)
- **Low coins trigger:** When balance < price of cheapest active box, button pulses gently with "Running low!" text
- Small sparkle animation on the coin icon

### 4.3 Today's Best Pull (span 4 columns)

- Card image (70×98px with rarity border glow)
- Card name, rarity badge
- Coin value (CountUp animation on page load)
- "Pulled by {username}"
- **CTA: "Open this Box →"** button linking to `/open/{boxId}`
- Card has rarity-appropriate glow pulse animation (same as pack opening)

### 4.4 My Stats (span 4 columns)

- 2×2 grid of stat cards:
  - Packs Opened (neon green)
  - Battles Won (gold)
  - Win Rate (blue)
  - Collection Value (purple)
- Values use CountUp animation on mount
- Each value is a link (packs → collection, battles → battles page, etc.)

### 4.5 Active Battles (span 4 columns)

- List of up to 3 open battles (WAITING status)
- Per battle: Name, round count, player count, "Join" button
- **Almost full trigger:** If `participants.length === maxParticipants - 1`, Join button pulses with "Almost full!" micro-badge
- "View all battles →" link at bottom

### 4.6 Featured Boxes (span 4 columns)

- Horizontally scrollable mini box cards
- Per box: Image, name, price in coins
- Each card links to `/open/{boxId}`
- "Browse all →" link
- **Scroll UX:** Same as Recent Pulls — no scrollbar, arrow buttons on desktop, swipe on touch

### 4.7 My Recent Pulls (span 5 columns)

- Horizontal scroll of last 8 pulls with card images
- Rarity-colored borders (blue=rare, purple=epic, gold=legendary)
- Card name below each
- **Fresh pull shimmer:** If a pull is < 5 minutes old and rare+, it has a shimmer animation
- "View collection →" link
- **Scroll UX:** No visible scrollbar. Left/right arrow buttons for navigation. On touch devices: swipe gesture (native scroll with `scrollbar-hide`)

### 4.8 Leaderboard Snippet (span 3 columns)

- Top 3 with rank badges (gold/silver/bronze)
- User's own rank highlighted in neon green
- Points displayed
- "Full leaderboard →" link
- Month label at top

### 4.9 Next Achievements (span 4 columns)

- 3 closest-to-completion achievements
- Per achievement: Icon, name, progress bar, fraction text (e.g., "847 / 1000")
- **Almost there trigger:** If progress > 90%, progress bar pulses in neon green with "Almost there!" label
- "All achievements →" link

---

## 5. Gamification Triggers Summary

| Trigger | Condition | Effect |
|---|---|---|
| Legendary in ticker | Rarity = legendary/mythic/secret | Ticker pauses, golden glow + particles, badge pulses |
| Low coins | Balance < cheapest box price | "Aufladen" button pulses, "Running low!" text |
| Battle almost full | Players = max - 1 | Join button pulses, "Almost full!" badge |
| Achievement close | Progress > 90% | Progress bar pulses green, "Almost there!" label |
| Fresh pull | Pull age < 5min, rarity ≥ rare | Shimmer animation on card in Recent Pulls |
| Stats on load | Page mount | CountUp animation on all stat values |
| Best pull value | Page mount | Coin value counts up from 0 |
| Dynamic welcome | Context-dependent | Subtitle changes based on streaks/battles/achievements |

---

## 6. SSE Implementation

### New API endpoint: `GET /api/pulls/live`

```typescript
// Response: text/event-stream
// Sends events when new rare+ pulls occur

export async function GET(request: Request) {
  const stream = new ReadableStream({
    start(controller) {
      // Poll DB every 3 seconds for new pulls with rarity >= rare
      // Or use Prisma $subscribe if available
      // Send as SSE: `data: ${JSON.stringify(pullEvent)}\n\n`
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    }
  });
}
```

**Client-side:**
```typescript
const eventSource = new EventSource('/api/pulls/live');
eventSource.onmessage = (event) => {
  const pull = JSON.parse(event.data);
  // Prepend to ticker, animate if legendary
};
```

**Fallback:** If SSE connection drops, fall back to polling `/api/pulls/recent?rarity=rare` every 10 seconds.

**SSE architecture note:**
- Each client connection maintains its own polling loop (query new pulls since `lastSeenTimestamp` every 3s)
- Query is lightweight: `WHERE timestamp > lastSeen AND rarity IN (rare, epic, legendary, ...) LIMIT 5`
- Index on `(timestamp, cardId)` ensures fast lookups
- For scaling: Consider Redis pub/sub in the future, but direct DB polling is fine for <100 concurrent users
- Page is fully dynamic (no ISR) since it contains user-specific data

---

## 7. Data Requirements

### Server Component (page.tsx) fetches:

| Data | Source | Cache |
|---|---|---|
| User profile + level + XP | `getCurrentSession()` + Prisma | No cache (personalized) |
| User stats (packs, battles, wins) | Prisma aggregate queries | No cache |
| User recent pulls (last 8) | Prisma `Pull` with Card include | No cache |
| Today's best pull | Prisma `Pull` where timestamp >= today, max cardValue | 60s ISR or no cache |
| Active battles (up to 3) | Prisma `Battle` where status WAITING | 30s ISR |
| Featured boxes (up to 6) | Prisma `Box` where featured=true | 60s ISR |
| Leaderboard top 3 + user rank | Prisma `BattleLeaderboard` current month | 120s ISR |
| Next 3 achievements | `/api/user/achievements` client-side fetch | On mount |
| Coin balance | Session or Prisma | No cache |
| Cheapest box price | Prisma `Box` min price | Cached in server component |

**Caching strategy:** Page is fully dynamic (`export const dynamic = 'force-dynamic'`) since it contains user-specific data. Global data (best pull, battles, boxes, leaderboard) is fetched server-side alongside user data — no ISR needed.

**Luck streak definition:** Last N consecutive pulls (by timestamp DESC) where rarity ≥ rare. Streak breaks when a common/uncommon pull is found. Calculated server-side in the page's data fetch, not a separate API.

### Client Components:

- `LiveTicker` — SSE connection + ticker rendering
- `CoinBalance` — Polls `/api/user/coins` for live balance updates
- `AchievementsWidget` — Fetches on mount from `/api/user/achievements`
- All CountUp animations — client-side only (Framer Motion or custom hook)

---

## 8. File Structure

```
src/app/page.tsx                          — Server component, auth gate, data fetching
src/app/DashboardClient.tsx               — Client component, renders all widgets
src/components/dashboard/
  LiveTicker.tsx                          — SSE-powered horizontal ticker
  WelcomeWidget.tsx                       — Welcome + Level/XP
  CoinBalanceWidget.tsx                   — Balance + Aufladen CTA
  BestPullWidget.tsx                      — Today's best pull + Open Box CTA
  StatsWidget.tsx                         — 4-stat grid with CountUp
  BattlesWidget.tsx                       — Active battles + Join
  FeaturedBoxesWidget.tsx                 — Scrollable box cards
  RecentPullsWidget.tsx                   — User's recent pulls
  LeaderboardWidget.tsx                   — Top 3 + user rank
  AchievementsWidget.tsx                  — Next achievements + progress
src/app/api/pulls/live/route.ts           — SSE endpoint for live pulls
```

---

## 9. Mobile Optimization

- All widgets stack to single column on < 640px
- Live ticker: smaller text (text-xs), reduced padding
- Stats grid: stays 2×2 on mobile
- Battles/Boxes: full width cards
- Recent pulls: horizontal scroll maintained
- Touch-friendly: all CTAs min 44px touch target
- Navbar: existing responsive behavior preserved

---

## 10. Design Tokens (from existing system)

---

## 11. Future: Draggable Widgets (Phase 2)

- All widgets except Live Ticker, Welcome, and Coin Balance become drag-reorderable
- Library: `react-grid-layout` or `dnd-kit`
- Layout persisted in `User.dashboardLayout` (JSON field in DB) or `localStorage`
- "Reset to default" button
- Separate spec & implementation ticket

---

## 12. Design Tokens (from existing system)

- Card backgrounds: `bg-[#1a1a4a]`
- Borders: `border-[rgba(255,255,255,0.1)]`
- Shadows: `shadow-lg`
- Neon accent: `#BFFF00`
- Text primary: `#f0f0f5`
- Text secondary: `#8888aa`
- Text muted: `#7777a0`
- Rarity colors: common=#8b8ba0, uncommon=#4ade80, rare=#60a5fa, epic=#a78bfa, legendary=#fbbf24
