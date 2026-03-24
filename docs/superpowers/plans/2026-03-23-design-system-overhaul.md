# Design System Overhaul — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform Pack Attack from a generic blue/purple SaaS look to a premium collector aesthetic with neon-green (#BFFF00) on deep navy (#0B0B2B), improving spacing, gamification visibility, and mobile experience across all pages.

**Architecture:** Token-first migration. Define CSS custom properties first, then update Tailwind-consumed components one-by-one. Each task is independently deployable. No big-bang — old styles coexist until fully replaced.

**Tech Stack:** Next.js 14+ (App Router), Tailwind CSS v4 (`@tailwindcss/postcss`), Framer Motion 12, CVA (class-variance-authority), Outfit + Syne fonts.

**Spec:** `docs/superpowers/specs/2026-03-23-design-system-overhaul.md`

---

## File Structure

### Modified Files

| File | Responsibility | Task |
|---|---|---|
| `src/app/globals.css` | Design tokens, utility classes, animations, scrollbar | 1 |
| `src/components/ui/button.tsx` | Button variants (CVA) | 2 |
| `src/components/ui/card.tsx` | Card component styling | 3 |
| `src/components/ui/badge.tsx` | Badge variants including rarity | 4 |
| `src/components/Navigation.tsx` | Main nav bar + mobile menu | 5 |
| `src/app/layout.tsx` | Root layout, theme-color, bg | 6 |
| `src/app/page.tsx` | Homepage hero, stats, featured | 7 |
| `src/app/collection/page.tsx` | Collection header + stats | 9 |
| `src/app/collection/CollectionClient.tsx` | Collection card grid + filters | 9 |
| `src/app/(dashboard)/dashboard/page.tsx` | Dashboard header + bg | 10 |
| `src/app/(dashboard)/dashboard/DashboardClient.tsx` | Dashboard XP, stats, pulls | 10 |
| `src/app/open/[boxId]/page.tsx` + related | Pack opening experience | 8 |
| `src/app/battles/**/*.tsx` | Battles pages | 11 |
| `src/app/shop/**/*.tsx`, checkout, purchase-coins | Shop & commerce pages | 12 |
| `src/app/(auth)/**/*.tsx` | Auth pages (login/register) | 13 |
| `src/app/(admin)/**/*.tsx`, `src/app/(shop)/**/*.tsx` | Admin & Shop dashboards | 13 |
| `src/app/leaderboard/page.tsx` | Leaderboard | 13 |

### New Files

| File | Responsibility | Task |
|---|---|---|
| `src/components/AchievementToast.tsx` | Achievement notification slide-in | 15 |
| `src/components/LevelUpCelebration.tsx` | Full-screen level-up animation | 16 |
| `src/hooks/useCountUp.ts` | Animated number counter hook | 17 |

---

## Phase 1: Design Foundation

### Task 1: Design Tokens & Global Styles

**Files:**
- Modify: `src/app/globals.css` (lines 356-396 :root, lines 79-91 glass, lines 115-125 grid, lines 144-206 rarity glows, lines 262-309 rarity hover, lines 478-488 body, lines 699-721 scrollbar, lines 728-743 focus)

- [ ] **Step 1: Add new CSS custom properties**

In `src/app/globals.css`, find the `:root` block (around line 356). Add the Pack Attack design tokens **before** the existing `--primary` variable. Keep the old variables for now (they'll be removed after full migration).

```css
:root {
  /* === PACK ATTACK DESIGN SYSTEM === */
  /* Core Backgrounds */
  --pa-bg-deep: #06061a;
  --pa-bg-base: #0B0B2B;
  --pa-bg-surface: #10103a;
  --pa-bg-elevated: #16164a;
  --pa-bg-card: #12123a;

  /* Neon Green — Primary Brand */
  --pa-neon: #BFFF00;
  --pa-neon-dim: #9acc00;
  --pa-neon-glow: rgba(191, 255, 0, 0.3);
  --pa-neon-subtle: rgba(191, 255, 0, 0.08);

  /* Text */
  --pa-text-primary: #f0f0f5;
  --pa-text-secondary: #8888aa;
  --pa-text-muted: #7777a0;
  --pa-text-on-neon: #000000;

  /* Borders */
  --pa-border: rgba(255, 255, 255, 0.06);
  --pa-border-hover: rgba(255, 255, 255, 0.12);
  --pa-bg-hover: rgba(255, 255, 255, 0.06);

  /* Rarity Colors */
  --rarity-common: #8b8ba0;
  --rarity-uncommon: #4ade80;
  --rarity-rare: #60a5fa;
  --rarity-epic: #a78bfa;
  --rarity-legendary: #fbbf24;
  --rarity-mythic: #ff6b6b;

  /* Semantic */
  --pa-success: #4ade80;
  --pa-warning: #fbbf24;
  --pa-error: #ef4444;
  --pa-info: #60a5fa;

  /* Spacing Scale */
  --pa-space-xs: 4px;
  --pa-space-sm: 8px;
  --pa-space-md: 12px;
  --pa-space-lg: 16px;
  --pa-space-xl: 20px;
  --pa-space-2xl: 24px;
  --pa-space-3xl: 32px;
  --pa-space-4xl: 48px;

  /* Border Radius Scale */
  --pa-radius-sm: 8px;
  --pa-radius-md: 12px;
  --pa-radius-lg: 16px;
  --pa-radius-xl: 20px;
  --pa-radius-full: 100px;

  /* Existing variables below — keep for backward compat */
  --primary: 59 130 246;
  /* ... rest of existing :root ... */
}
```

- [ ] **Step 2: Update body background**

Find the `body` styles (around line 478). Update **only** `color` and `background` — keep all other existing properties (line-height, font-smoothing, min-height, overflow-x, etc.):

- `color: white` → `color: var(--pa-text-primary)`
- `background: rgb(3 7 18)` → `background: var(--pa-bg-deep)`

Do NOT remove `line-height: 1.5`, `-webkit-font-smoothing: antialiased`, `-moz-osx-font-smoothing: grayscale`, or any other existing properties.

- [ ] **Step 3: Update glass classes**

Find `.glass` and `.glass-strong` (around lines 79-91). Update borders to use new tokens:

```css
.glass {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--pa-border);
}

.glass-strong {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid var(--pa-border-hover);
}
```

- [ ] **Step 4: Update background grid pattern**

Find `.bg-grid` (around line 115). Change from blue tint to neon-green tint:

```css
.bg-grid {
  background-image:
    linear-gradient(rgba(191, 255, 0, 0.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(191, 255, 0, 0.02) 1px, transparent 1px);
  background-size: 50px 50px;
}
```

- [ ] **Step 4b: Update radial-gradient class**

Find `.radial-gradient` (around line 123). Update the base color from `rgb(3 7 18)` to `var(--pa-bg-deep)`:

```css
.radial-gradient {
  background: radial-gradient(ellipse at center, transparent 0%, var(--pa-bg-deep) 70%);
}
```

- [ ] **Step 5: Update rarity glow animations**

Find the rarity glow keyframes and animations (around lines 144-206). Update the colors to use the new rarity tokens. The structure stays the same, but ensure the colors match:

- `animate-glow-uncommon`: shadows use `var(--rarity-uncommon)` / `rgba(74, 222, 128, ...)`
- `animate-glow-rare`: shadows use `var(--rarity-rare)` / `rgba(96, 165, 250, ...)`
- `animate-glow-epic`: shadows use `var(--rarity-epic)` / `rgba(167, 139, 250, ...)`
- `animate-glow-legendary`: shadows use `var(--rarity-legendary)` / `rgba(251, 191, 36, ...)`

These colors should already match — verify and adjust if needed.

- [ ] **Step 6: Add new keyframe animations**

Add after the existing keyframes (after line 38):

```css
@keyframes legendary-pulse {
  0%, 100% { box-shadow: 0 0 15px rgba(251, 191, 36, 0.1); }
  50% { box-shadow: 0 0 25px rgba(251, 191, 36, 0.2); }
}

@keyframes neon-breathe {
  0%, 100% { box-shadow: 0 0 12px var(--pa-neon-glow); }
  50% { box-shadow: 0 0 24px var(--pa-neon-glow); }
}
```

- [ ] **Step 7: Update scrollbar colors**

Find scrollbar styles (around lines 699-721). Update to navy tones:

```css
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: var(--pa-bg-base);
}

::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.12);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.2);
}

* {
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.12) var(--pa-bg-base);
}
```

- [ ] **Step 8: Update focus-visible styles**

Find focus styles (around lines 728-743). Update to use neon color:

```css
:focus {
  outline: none;
}

:focus-visible {
  outline: 2px solid var(--pa-neon);
  outline-offset: 2px;
}

.focus-ring:focus-visible {
  outline: 2px solid var(--pa-neon);
  outline-offset: 2px;
  border-radius: 0.5rem;
}
```

- [ ] **Step 9: Update autofill styles**

Find autofill styles (around lines 794-821). Update the inset box-shadow to use navy:

```css
input:-webkit-autofill,
input:-webkit-autofill:hover,
input:-webkit-autofill:focus,
textarea:-webkit-autofill,
textarea:-webkit-autofill:focus {
  -webkit-box-shadow: 0 0 0 1000px var(--pa-bg-surface) inset !important;
  -webkit-text-fill-color: var(--pa-text-primary) !important;
  transition: background-color 5000s ease-in-out 0s;
}
```

- [ ] **Step 10: Verify changes render correctly**

Run: `npm run dev`

Open browser, check:
- Background color is deep navy (#06061A) not gray
- Scrollbar matches dark theme
- Grid pattern has green tint (subtle)
- Glass elements have updated borders

- [ ] **Step 11: Commit**

```bash
git add src/app/globals.css
git commit -m "feat: add Pack Attack design tokens and update global styles to navy/neon-green theme"
```

---

### Task 2: Button Component Redesign

**Files:**
- Modify: `src/components/ui/button.tsx` (50 lines, full rewrite of CVA config)

- [ ] **Step 1: Read current button component**

Read `src/components/ui/button.tsx` to confirm current structure before editing.

- [ ] **Step 2: Update CVA variants**

Replace the entire `buttonVariants` definition. Keep the component structure (React.forwardRef, Slot support, etc.) — only change the CVA config:

```typescript
const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BFFF00] focus-visible:ring-offset-2 focus-visible:ring-offset-[#06061a] disabled:pointer-events-none disabled:opacity-50 select-none touch-manipulation active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-[#BFFF00] text-black hover:shadow-[0_0_24px_rgba(191,255,0,0.3)] hover:scale-[1.02]",
        destructive:
          "bg-red-500/12 text-red-400 border border-red-500/25 hover:bg-red-500/20",
        outline:
          "border border-[rgba(191,255,0,0.3)] text-[#BFFF00] bg-transparent hover:bg-[rgba(191,255,0,0.08)] hover:border-[rgba(191,255,0,0.5)]",
        secondary:
          "bg-[rgba(255,255,255,0.04)] text-[#8888aa] border border-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.08)] hover:text-[#f0f0f5]",
        ghost:
          "text-[#8888aa] hover:bg-[rgba(255,255,255,0.06)] hover:text-[#f0f0f5]",
        link: "text-[#BFFF00] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-5 py-2 min-w-[44px]",
        sm: "h-10 px-4 min-w-[44px] text-xs",
        lg: "h-12 px-8 min-w-[48px] text-base",
        icon: "h-11 w-11 min-w-[44px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)
```

Key changes:
- `rounded-lg` → `rounded-xl` (larger radius)
- Focus ring: blue → neon green, offset uses deep navy
- Default: blue bg → neon green bg with black text + glow hover
- Destructive: solid red → subtle red bg with red text + border
- Outline: generic → neon green border + text
- Secondary: gray → subtle white glass
- Ghost: updated text colors
- Link: blue → neon green
- Default size: `px-4` → `px-5` (slightly more padding)

- [ ] **Step 3: Verify buttons render correctly**

Run: `npm run dev`

Check any page with buttons (e.g., homepage). Verify:
- Primary buttons are neon green with black text
- Hover shows green glow shadow
- Outline buttons have green border
- Ghost buttons are subtle

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/button.tsx
git commit -m "feat: redesign Button component with neon-green primary and navy theme"
```

---

### Task 3: Card Component Redesign

**Files:**
- Modify: `src/components/ui/card.tsx` (56 lines)

- [ ] **Step 1: Read current card component**

Read `src/components/ui/card.tsx` to confirm structure.

- [ ] **Step 2: Update Card styles**

Update each sub-component's className:

```typescript
// Card
"rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[#12123a] text-[#f0f0f5] shadow-sm transition-all duration-300"

// CardHeader
"flex flex-col space-y-1.5 p-7"

// CardTitle
"text-xl font-semibold leading-none tracking-tight"

// CardDescription
"text-sm text-[#8888aa]"

// CardContent
"p-7 pt-0"

// CardFooter
"flex items-center p-7 pt-0"
```

Key changes:
- `rounded-lg` → `rounded-2xl` (20px radius)
- `border-gray-800` → `border-[rgba(255,255,255,0.06)]`
- `bg-gray-900/50` → `bg-[#12123a]`
- `text-white` → `text-[#f0f0f5]`
- `text-gray-400` → `text-[#8888aa]`
- `p-6` → `p-7` (more generous padding — 28px)
- Added `transition-all duration-300` for hover animations

- [ ] **Step 3: Verify cards render correctly**

Run: `npm run dev`, check dashboard or any page with cards.

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/card.tsx
git commit -m "feat: redesign Card component with navy bg, larger radius, and generous padding"
```

---

### Task 4: Badge Component Redesign

**Files:**
- Modify: `src/components/ui/badge.tsx` (42 lines)

- [ ] **Step 1: Read current badge component**

Read `src/components/ui/badge.tsx`.

- [ ] **Step 2: Update CVA variants**

Replace the `badgeVariants` definition:

```typescript
const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold tracking-wide transition-colors focus:outline-none focus:ring-2 focus:ring-[#BFFF00] focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-[rgba(191,255,0,0.3)] bg-[rgba(191,255,0,0.1)] text-[#BFFF00]",
        secondary:
          "border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.05)] text-[#8888aa]",
        destructive:
          "border-red-500/30 bg-red-500/12 text-red-400",
        outline:
          "border-[rgba(255,255,255,0.12)] text-[#f0f0f5]",
        success:
          "border-green-500/30 bg-green-500/12 text-green-400",
        warning:
          "border-yellow-500/30 bg-yellow-500/12 text-yellow-400",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)
```

Key changes:
- `px-2.5 py-0.5` → `px-3 py-1` (more padding)
- Added `tracking-wide`
- Default: neon green tinted
- All variants: subtle transparent backgrounds with matching borders (premium glass look)
- Removed solid backgrounds, using opacity-based tints throughout

- [ ] **Step 3: Verify badges render correctly**

Check collection page (rarity badges), battle page (status badges).

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/badge.tsx
git commit -m "feat: redesign Badge component with glass-tinted variants and neon-green default"
```

---

### Task 5: Navigation Redesign

**Files:**
- Modify: `src/components/Navigation.tsx` (498 lines)

This is the largest single-file change. Focus on color/style swaps — do not restructure the component logic.

- [ ] **Step 1: Read current Navigation component**

Read `src/components/Navigation.tsx` fully.

- [ ] **Step 2: Update top-level nav bar classes**

Find the nav element (around line 210). Change:

```
border-white/[0.08] bg-gray-950
```

to:

```
border-[rgba(255,255,255,0.06)] bg-[#0B0B2B]
```

- [ ] **Step 3: Update logo styling**

Find the logo section (around lines 213-220). Change:
- Blue icon box (`bg-blue-500/20 border-blue-500/30`) → Remove the icon box entirely or change to neon: `bg-[rgba(191,255,0,0.15)] border-[rgba(191,255,0,0.25)]`
- Text "Pack" + "Attack": Change from white + blue-400 to neon gradient:

```tsx
<span className="text-lg font-bold font-heading bg-gradient-to-r from-[#BFFF00] to-[#7fff00] bg-clip-text text-transparent">
  PACKATTACK
</span>
```

- [ ] **Step 4: Update nav link active states**

Find active link styling. Change:
- Desktop active: `bg-white/10 text-white` → `bg-[rgba(191,255,0,0.08)] text-[#BFFF00]`
- Desktop inactive: keep `text-[#8888aa]` (was likely gray-400, similar)
- Desktop hover: → `hover:text-[#f0f0f5] hover:bg-[rgba(255,255,255,0.04)]`
- Mobile active: `bg-blue-500/15 text-white` → `bg-[rgba(191,255,0,0.1)] text-[#BFFF00]`

- [ ] **Step 5: Update Level Badge**

Find level badge (around lines 271-284). Change:
- Container: `bg-purple-500/10 border-purple-500/25` → `bg-[rgba(191,255,0,0.08)] border-[rgba(191,255,0,0.2)]`
- XP fill bar: `bg-purple-500/15` → `bg-[#BFFF00]` (solid neon fill with opacity via scaleX)
- Zap icon: `text-purple-400` → `text-[#BFFF00]`
- Level text: `text-purple-300` → `text-[#BFFF00]`

- [ ] **Step 6: Update Coin Display**

Find coin display (around lines 261-268). Keep the gold/yellow colors — they are semantically correct for coins:
- Container: `bg-yellow-500/10 border-yellow-500/25` → keep as-is (gold for coins is good)
- Text: `text-yellow-400` → keep as-is

- [ ] **Step 7: Update Cart Badge**

Find cart badge (around lines 288-297). Change:
- Badge: `bg-blue-500` → `bg-[#BFFF00] text-black`

- [ ] **Step 8: Update Mobile Menu**

Find mobile menu overlay (around lines 372-484). Change:
- Background: `bg-gray-950/98` → `bg-[#0B0B2B]/98`
- Sign out button colors
- Level info section colors to match desktop updates
- Active link states to use neon-green

- [ ] **Step 9: Verify navigation on desktop and mobile**

Run: `npm run dev`

Check both desktop (> 768px) and mobile (< 768px) views:
- Logo is neon green gradient text
- Active link has green tint background
- Level badge is neon green
- Cart badge is neon green
- Mobile menu matches theme

- [ ] **Step 10: Commit**

```bash
git add src/components/Navigation.tsx
git commit -m "feat: redesign Navigation with neon-green branding, updated level badge, and navy theme"
```

---

### Task 6: Root Layout Update

**Files:**
- Modify: `src/app/layout.tsx` (261 lines)

- [ ] **Step 1: Read current layout**

Read `src/app/layout.tsx`.

- [ ] **Step 2: Update theme-color meta**

Find the viewport config (around lines 31-49). Change `themeColor`:

```typescript
themeColor: [
  { media: "(prefers-color-scheme: light)", color: "#0B0B2B" },
  { media: "(prefers-color-scheme: dark)", color: "#0B0B2B" },
],
```

(Both set to navy since we're dark-mode only.)

- [ ] **Step 3: Verify meta tag in browser**

Run: `npm run dev`, inspect `<meta name="theme-color">` in dev tools — should be `#0B0B2B`.

- [ ] **Step 4: Commit**

```bash
git add src/app/layout.tsx
git commit -m "feat: update theme-color meta to navy (#0B0B2B)"
```

---

### Task 7: Typography Scale & Mobile Responsive Type

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1: Add responsive typography utilities**

Add after the `:root` block in globals.css. Use `clamp()` for fluid type (the project already uses this pattern with `--text-xs` through `--text-4xl`). Update the existing fluid variables to match the spec:

```css
:root {
  /* Update existing fluid type vars */
  --text-xs: clamp(0.75rem, 0.7rem + 0.15vw, 0.75rem);   /* 12px floor */
  --text-sm: clamp(0.8125rem, 0.75rem + 0.2vw, 0.875rem);
  --text-base: clamp(0.875rem, 0.8rem + 0.2vw, 0.875rem);
  --text-lg: clamp(1rem, 0.9rem + 0.3vw, 1.125rem);
  --text-xl: clamp(1.125rem, 1rem + 0.4vw, 1.25rem);       /* M Heading */
  --text-2xl: clamp(1.25rem, 1.1rem + 0.5vw, 1.5rem);      /* L Heading */
  --text-3xl: clamp(1.5rem, 1.2rem + 0.8vw, 1.875rem);
  --text-4xl: clamp(1.625rem, 1.3rem + 1vw, 2.25rem);      /* XL Heading */
}
```

- [ ] **Step 2: Add touch-to-tap media query for mobile**

Add to globals.css for converting hover effects on touch devices:

```css
@media (hover: none) {
  .rarity-card-hover[data-rarity]:hover {
    transform: none;
    box-shadow: none;
  }
  .rarity-card-hover[data-rarity]:active {
    transform: translateY(-2px);
    transition-duration: 0.1s;
  }
}
```

- [ ] **Step 3: Add reduced glow intensity for mobile**

```css
@media (max-width: 767px) {
  .animate-glow-uncommon,
  .animate-glow-rare,
  .animate-glow-epic,
  .animate-glow-legendary {
    animation: none;
  }
}
```

- [ ] **Step 4: Verify responsive type renders correctly**

Check on mobile viewport (375px) and desktop (1280px). Headings should scale fluidly.

- [ ] **Step 5: Commit**

```bash
git add src/app/globals.css
git commit -m "feat: add responsive typography scale, mobile touch states, and reduced mobile glow"
```

---

## Phase 2: Core Pages

### Task 8: Pack Opening Experience Redesign

**Files:**
- Modify: `src/app/open/[boxId]/page.tsx` and its client components

This is the highest-priority page. The pack opening is the core experience.

- [ ] **Step 1: Read current pack opening files**

```bash
find src/app/open -name "*.tsx" -type f
```

Read all files found. Also search for related components:

```bash
grep -rl "PackOpen\|CardReveal\|card-reveal\|deck-card" src/components/ --include="*.tsx"
```

Read all found files to understand current implementation.

- [ ] **Step 2: Update background and container colors**

In the pack opening page and its client component(s):
- Background: any `bg-gray-950` / `bg-gray-900` → `bg-[#06061a]`
- Card backgrounds: → `bg-[#12123a]`
- Borders: → `border-[rgba(255,255,255,0.06)]`
- Text colors: → `text-[#f0f0f5]` primary, `text-[#8888aa]` secondary

- [ ] **Step 3: Update card reveal rarity staging**

Ensure each rarity tier has escalating visual intensity during reveal:
- Common: Quick flip, subtle gray border glow
- Uncommon: Standard flip, green border glow
- Rare: Slower flip, blue glow, slight screen-edge tint
- Epic: Slow flip, purple glow, stronger screen-edge tint
- Legendary: Slowest flip, gold pulsing glow, full-screen flash overlay using `bg-[rgba(251,191,36,0.15)]`
- Mythic: Same as legendary but red, with CSS pseudo-element particle burst

For the particle burst, add a CSS class:

```css
/* In globals.css */
@keyframes particle-burst {
  0% { opacity: 1; transform: scale(0.5); }
  100% { opacity: 0; transform: scale(2); }
}

.particle-burst::after {
  content: '';
  position: fixed;
  inset: 0;
  background: radial-gradient(circle, rgba(255,107,107,0.2) 0%, transparent 70%);
  animation: particle-burst 1s ease-out forwards;
  pointer-events: none;
}
```

- [ ] **Step 4: Add vibration feedback for mobile (optional)**

In the reveal handler, add:

```typescript
// Vibrate on legendary/mythic pull (mobile only)
if ('vibrate' in navigator && (rarity === 'legendary' || rarity === 'mythic')) {
  navigator.vibrate([100, 50, 200]);
}
```

- [ ] **Step 5: Update post-reveal card display**

After all cards are revealed, update the layout:
- Card backgrounds: navy
- "Best pull" highlight: neon green border glow
- Action buttons (Sell, Keep): neon green primary button

- [ ] **Step 6: Verify pack opening flow**

Open a pack in the app. Check:
- Full opening sequence renders with new colors
- Rarity staging works (different effects per tier)
- Post-reveal layout uses navy theme
- Mobile: touch interactions work, vibration fires on legendary (if supported)

- [ ] **Step 7: Commit**

```bash
git add src/app/open/ src/components/ src/app/globals.css
git commit -m "feat: redesign pack opening with rarity staging, neon theme, and mobile vibration"
```

---

### Task 9: Collection Page Redesign

**Files:**
- Modify: `src/app/collection/page.tsx` (155 lines)
- Modify: `src/app/collection/CollectionClient.tsx`

**Files:**
- Modify: `src/app/page.tsx` (490 lines)

- [ ] **Step 1: Read current homepage**

Read `src/app/page.tsx` fully.

- [ ] **Step 2: Update background effects**

Find background elements (around lines 154-158). Change:
- Blue blur blob: `bg-blue-500/8` → `bg-[rgba(191,255,0,0.05)]`
- Purple blur blob: `bg-purple-500/8` → `bg-[rgba(191,255,0,0.03)]`

- [ ] **Step 3: Update hero section**

Find hero (around lines 163-205). Change:
- Badge border: `border-white/[0.08] bg-white/[0.03]` → keep (matches glass)
- Gradient text: Replace blue/purple gradient with neon:

```tsx
<span className="bg-gradient-to-r from-[#BFFF00] to-[#7fff00] bg-clip-text text-transparent">
```

- Primary CTA button: `from-blue-600 to-blue-500 shadow-blue-500/25` → `bg-[#BFFF00] text-black hover:shadow-[0_0_24px_rgba(191,255,0,0.3)]`
- Secondary CTA button: keep outline style but use neon border: `border-[rgba(191,255,0,0.3)] text-[#BFFF00] hover:bg-[rgba(191,255,0,0.08)]`

- [ ] **Step 4: Update stats bar**

Find stats bar (around lines 210-228). Change icon colors:
- Blue icon → `text-[#BFFF00]`
- Purple icon → `text-[#BFFF00]` or keep purple for variety — use neon for primary stat, keep others
- Green icon → keep green

Update container: `border-white/[0.06] bg-white/[0.02]` → keep (matches glass tokens)

- [ ] **Step 5: Update Hit of the Day**

Find Hit of the Day (around lines 234-291). The amber/gold glow for rarity is correct — keep it. Update:
- Card background: any `bg-gray-900` → `bg-[#12123a]`
- Text colors: `text-gray-400` → `text-[#8888aa]`

- [ ] **Step 6: Update Featured Boxes grid**

Find featured boxes (around lines 300-356). Change:
- Card backgrounds: `bg-gray-900` / `bg-gray-800` → `bg-[#12123a]`
- Border: add `border border-[rgba(255,255,255,0.06)]`
- Game tag: `bg-black/60` → `bg-[#0B0B2B]/80`
- Price text: make neon `text-[#BFFF00]`
- Border radius: ensure `rounded-2xl`

- [ ] **Step 7: Update Active Battles section**

Find active battles (around lines 362-441). Change:
- Card styling to match new card design
- "Join" button/text: use neon green
- Status badge colors: keep yellow/green (semantic)

- [ ] **Step 8: Verify homepage renders correctly**

Run: `npm run dev`, check homepage thoroughly:
- Background blobs are neon-tinted
- Hero text gradient is neon green
- CTA buttons are neon
- All cards use navy backgrounds
- Stats bar icons updated

- [ ] **Step 9: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: redesign homepage with neon-green hero, navy cards, and updated color scheme"
```

---

- [ ] **Step 1: Read current collection page and client component**

Read `src/app/collection/page.tsx` and `src/app/collection/CollectionClient.tsx`.

- [ ] **Step 2: Update header section**

Find header (around lines 89-101). Change:
- Gradient text: `from-emerald-400 to-cyan-400` → `from-[#BFFF00] to-[#7fff00]`
- Badge: glass styling should auto-update from Task 1

- [ ] **Step 3: Update stats bar**

Find stats bar (around lines 104-131). Change:
- Container: `glass-strong` keeps updated styles from Task 1
- Stat value colors:
  - Total Value: `text-amber-400` → keep (gold for value makes sense)
  - Rare: `text-purple-400` → keep (matches rarity color)
  - Mythic/Legendary: `text-amber-500` → keep
  - Total Cards primary stat: make neon `text-[#BFFF00]`
  - Sealed Products: `text-teal-400` → `text-[#BFFF00]`

- [ ] **Step 4: Update empty state**

Find empty state (around lines 133-147). Change:
- Icon gradient: `from-emerald-500 to-cyan-500` → `from-[#BFFF00] to-[#7fff00]`
- Button: `from-emerald-600 to-cyan-600` → `bg-[#BFFF00] text-black hover:shadow-[0_0_24px_rgba(191,255,0,0.3)]`

- [ ] **Step 5: Update CollectionClient component**

In `src/app/collection/CollectionClient.tsx`, apply these changes:
- Card container backgrounds: any `bg-gray-900` / `bg-gray-800` → `bg-[#12123a]`
- Borders: `border-gray-800` / `border-gray-700` → `border-[rgba(255,255,255,0.06)]`
- Filter/sort active states: any `bg-blue-*` / `text-blue-*` → `bg-[rgba(191,255,0,0.08)] text-[#BFFF00]`
- Filter/sort inactive: → `text-[#8888aa] hover:text-[#f0f0f5]`
- Sort dropdown background: → `bg-[#16164a]`
- Sell button: → neon green primary
- Secondary text: `text-gray-400` → `text-[#8888aa]`
- Rarity card hover effects already updated via globals.css

- [ ] **Step 6: Verify collection page**

Run: `npm run dev`, navigate to /collection:
- Header gradient is neon green
- Stats use correct colors
- Empty state button is neon
- Card grid uses navy backgrounds

- [ ] **Step 7: Commit**

```bash
git add src/app/collection/
git commit -m "feat: redesign Collection page with neon-green accents and navy theme"
```

---

### Task 10: Dashboard Page Redesign

**Files:**
- Modify: `src/app/(dashboard)/dashboard/page.tsx` (133 lines)
- Modify: `src/app/(dashboard)/dashboard/DashboardClient.tsx`

- [ ] **Step 1: Read current dashboard files**

Read `src/app/(dashboard)/dashboard/page.tsx` and `src/app/(dashboard)/dashboard/DashboardClient.tsx`.

- [ ] **Step 2: Update background**

Find background effects (around lines 105-108). Change:
- Gradient: `from-gray-950 via-slate-900 to-gray-950` → `from-[#06061a] via-[#0B0B2B] to-[#06061a]`
- Grid opacity: `opacity-30` → `opacity-20` (subtler)

- [ ] **Step 3: Update header section**

Find welcome header (around lines 111-121). Change:
- Gradient text: `from-blue-400 to-purple-400` → `from-[#BFFF00] to-[#7fff00]`
- Badge: glass → auto-updated from Task 1

- [ ] **Step 4: Update DashboardClient component**

In `src/app/(dashboard)/dashboard/DashboardClient.tsx`, apply:

**XP/Level Section:**
- XP bar container: → `bg-[rgba(255,255,255,0.06)] rounded-md`
- XP bar fill: → `bg-gradient-to-r from-[#BFFF00] to-[#7fff00]` with `shadow-[0_0_12px_rgba(191,255,0,0.3)]`
- Level number: → `text-[#BFFF00] font-heading font-extrabold`
- Title badge (e.g., "Elite Collector"): → `bg-[rgba(191,255,0,0.08)] border border-[rgba(191,255,0,0.2)] text-[#BFFF00] rounded-full`
- XP text: → `text-[#7777a0]`

**Stats Cards:**
- Container: → `bg-[#12123a] border-[rgba(255,255,255,0.06)] rounded-2xl`
- Primary stat values: → `text-[#BFFF00] font-heading font-extrabold`
- Labels: → `text-[#7777a0] uppercase tracking-wider text-xs`

**Recent Pulls:**
- Card backgrounds: → `bg-[#12123a]`
- Rarity colors should use existing rarity tokens
- "View Collection" link: → `text-[#BFFF00]`

**Shipping/Profile Section:**
- Card backgrounds: → `bg-[#12123a]`
- Edit buttons: → neon outline style

- [ ] **Step 5: Verify dashboard**

Run: `npm run dev`, navigate to /dashboard:
- Background is navy gradient
- Welcome text is neon green
- XP bar is neon green with glow
- Stats cards use navy backgrounds
- Level badge is neon themed

- [ ] **Step 6: Commit**

```bash
git add "src/app/(dashboard)/dashboard/"
git commit -m "feat: redesign Dashboard with neon-green XP bar, navy stats cards, and updated theme"
```

---

## Phase 3: Secondary Pages

**Standard color swap reference** for all Phase 3 tasks:

| Old | New | Notes |
|---|---|---|
| `bg-gray-950` / `bg-gray-900` | `bg-[#06061a]` / `bg-[#0B0B2B]` | Page backgrounds |
| `bg-gray-900/50` / `bg-gray-800` | `bg-[#12123a]` | Card backgrounds |
| `border-gray-800` / `border-gray-700` | `border-[rgba(255,255,255,0.06)]` | Borders |
| `from-gray-950 via-slate-900 to-gray-950` | `from-[#06061a] via-[#0B0B2B] to-[#06061a]` | Gradient BGs |
| `text-gray-400` / `text-gray-300` | `text-[#8888aa]` / `text-[#f0f0f5]` | Text colors |
| `bg-blue-500` / `bg-blue-600` (buttons) | `bg-[#BFFF00] text-black` | Primary CTAs |
| `from-blue-600 to-blue-500` (gradients) | `bg-[#BFFF00]` | CTA gradients → solid neon |
| `text-blue-400` (accents) | `text-[#BFFF00]` | Accent text |
| `border-blue-500` | `border-[rgba(191,255,0,0.3)]` | Accent borders |
| `shadow-blue-500/25` | `shadow-[0_0_24px_rgba(191,255,0,0.3)]` | Glow shadows |
| `bg-purple-500/10` (level) | `bg-[rgba(191,255,0,0.08)]` | Level badge BG |
| `text-purple-400` (level) | `text-[#BFFF00]` | Level accent |
| `bg-black/60` (overlays) | `bg-[#0B0B2B]/80` | Dark overlays |

---

### Task 11: Battles Pages

**Files:**
- Modify: `src/app/battles/page.tsx`
- Modify: `src/app/battles/create/page.tsx`
- Modify: Any BattleClient components referenced

- [ ] **Step 1: Read battles files**

Read `src/app/battles/page.tsx` and `src/app/battles/create/page.tsx`. Search for any client components:

```bash
grep -rl "BattleClient\|BattlesClient" src/ --include="*.tsx"
```

- [ ] **Step 2: Apply standard color swaps**

Using the reference table above, update all files:
- Page backgrounds, card backgrounds, borders, text colors
- "Create Battle" CTA: → neon green
- Battle status badges: keep yellow/green (semantic — not brand colors)
- Entry price display: → `text-[#BFFF00]`
- Participant avatars: keep existing styles

- [ ] **Step 3: Verify battles pages**

Navigate to /battles and /battles/create. Check colors, create a test battle if possible.

- [ ] **Step 4: Commit**

```bash
git add src/app/battles/
git commit -m "feat: apply neon-green/navy theme to battles pages"
```

---

### Task 12: Shop & Commerce Pages

**Files:**
- Modify: `src/app/shop/**/*.tsx`
- Modify: `src/app/checkout/page.tsx`
- Modify: `src/app/purchase-coins/page.tsx`
- Modify: `src/app/boxes/page.tsx` + associated client component

- [ ] **Step 1: Read and list all shop/commerce files**

```bash
find src/app/shop src/app/checkout src/app/purchase-coins src/app/boxes -name "*.tsx" -type f
```

Read key page files.

- [ ] **Step 2: Apply standard color swaps**

For all files:
- All backgrounds, borders, text per reference table
- "Buy" / "Add to Cart" buttons → neon green
- Price displays → `text-[#BFFF00]`
- Cart badge → neon green (should already be done via Navigation)
- Game badges on boxes: keep existing `.badge-pokemon`, `.badge-mtg` etc. classes

- [ ] **Step 3: Verify shop pages**

Navigate through /boxes, /shop, /checkout, /purchase-coins.

- [ ] **Step 4: Commit**

```bash
git add src/app/shop/ src/app/checkout/ src/app/purchase-coins/ src/app/boxes/
git commit -m "feat: apply neon-green/navy theme to shop, boxes, and commerce pages"
```

---

### Task 13: Auth, Admin, Shop Dashboard & Leaderboard Pages

**Files:**
- Modify: `src/app/(auth)/login/page.tsx`, `src/app/(auth)/register/page.tsx`
- Modify: All under `src/app/(admin)/admin/`
- Modify: All under `src/app/(shop)/shop-dashboard/`
- Modify: `src/app/leaderboard/page.tsx`
- Modify: Other remaining pages (`src/app/sales-history/`, `src/app/feedback/`, `src/app/verify-email/`)

- [ ] **Step 1: Apply standard color swaps to auth pages**

Login/Register: backgrounds, inputs, CTA buttons → neon green

- [ ] **Step 2: Apply standard color swaps to admin pages**

Admin doesn't need heavy gamification — just consistent navy backgrounds, updated borders, and neon-green accent for primary actions.

- [ ] **Step 3: Apply standard color swaps to shop dashboard pages**

Same approach as admin — consistency over gamification.

- [ ] **Step 4: Update leaderboard page**

Apply standard swaps. Additionally:
- Top 3 ranks: gold (#FBBF24), silver (#C0C0C0), bronze (#CD7F32) highlights
- Current user row: neon-green subtle background `bg-[rgba(191,255,0,0.06)]`

- [ ] **Step 5: Apply standard swaps to remaining pages**

Sales history, feedback, verify-email — standard swap.

- [ ] **Step 6: Verify all pages**

Navigate through every page. Check for visual consistency.

- [ ] **Step 7: Commit**

```bash
git add src/app/
git commit -m "feat: apply neon-green/navy theme to auth, admin, shop dashboard, leaderboard, and remaining pages"
```

---

### Task 14: Global Search & Final Color Cleanup

- [ ] **Step 1: Search for remaining old color references**

```bash
grep -rn "bg-blue-500\|bg-blue-600\|text-blue-400\|border-blue-500\|bg-gray-950\|bg-gray-900/50\|border-gray-800\|from-blue-\|to-blue-\|shadow-blue-" src/ --include="*.tsx" | grep -v node_modules | grep -v ".next"
```

- [ ] **Step 2: Fix any remaining instances**

Apply standard swaps to any files found in step 1. Some usages may be intentional (e.g., rarity-rare uses blue) — only change brand/UI blues, not semantic/rarity blues.

- [ ] **Step 3: Full app walkthrough**

Navigate through every page on both desktop and mobile viewports:
- No blue primary buttons remaining
- No gray-950/gray-900 backgrounds
- Consistent neon-green accents
- Rarity colors preserved (blue for rare is correct)
- Mobile navigation works
- All cards use navy backgrounds

- [ ] **Step 4: Commit**

```bash
git add src/
git commit -m "chore: fix remaining legacy blue/gray color references across codebase"
```

---

## Phase 4: Gamification & Micro-Interactions

### Task 15: Achievement Toast System

**Files:**
- Create: `src/components/AchievementToast.tsx`
- Modify: Component where achievements are triggered

- [ ] **Step 1: Create AchievementToast component**

```tsx
'use client'

import { motion, AnimatePresence } from 'framer-motion'

interface AchievementToastProps {
  title: string
  description: string
  icon?: string
  visible: boolean
  onClose: () => void
}

export function AchievementToast({ title, description, icon = '🏆', visible, onClose }: AchievementToastProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 80, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="fixed bottom-6 right-6 z-[100] flex items-center gap-4 rounded-2xl border border-[rgba(191,255,0,0.2)] bg-[#12123a] px-6 py-4 shadow-[0_0_30px_rgba(191,255,0,0.15)]"
          onClick={onClose}
        >
          <span className="text-3xl">{icon}</span>
          <div>
            <p className="text-sm font-bold text-[#BFFF00]">{title}</p>
            <p className="text-xs text-[#8888aa]">{description}</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
```

- [ ] **Step 2: Verify component renders**

Import and test with a hardcoded `visible={true}` on a page.

- [ ] **Step 3: Commit**

```bash
git add src/components/AchievementToast.tsx
git commit -m "feat: add AchievementToast component with Framer Motion slide-in animation"
```

---

### Task 16: Level-Up Celebration Animation

**Files:**
- Create: `src/components/LevelUpCelebration.tsx`

- [ ] **Step 1: Create LevelUpCelebration component**

A full-screen overlay that fires when user levels up:

```tsx
'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useEffect } from 'react'

interface LevelUpCelebrationProps {
  level: number
  title: string
  visible: boolean
  onClose: () => void
}

export function LevelUpCelebration({ level, title, visible, onClose }: LevelUpCelebrationProps) {
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(onClose, 4000)
      return () => clearTimeout(timer)
    }
  }, [visible, onClose])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
              className="mb-4 text-6xl"
            >
              ⬆️
            </motion.div>
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="font-heading text-lg font-bold uppercase tracking-widest text-[#8888aa]"
            >
              Level Up!
            </motion.p>
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="font-heading text-7xl font-extrabold text-[#BFFF00] drop-shadow-[0_0_30px_rgba(191,255,0,0.4)]"
            >
              {level}
            </motion.p>
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="mt-2 text-lg font-semibold text-[#f0f0f5]"
            >
              {title}
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
```

- [ ] **Step 2: Verify component renders**

Test with hardcoded props.

- [ ] **Step 3: Commit**

```bash
git add src/components/LevelUpCelebration.tsx
git commit -m "feat: add LevelUpCelebration component with spring-animated full-screen overlay"
```

---

### Task 17: Number Counter Animation Hook

**Files:**
- Create: `src/hooks/useCountUp.ts`

- [ ] **Step 1: Create the hook**

```typescript
'use client'

import { useEffect, useRef, useState } from 'react'

export function useCountUp(target: number, duration: number = 800): number {
  const [current, setCurrent] = useState(0)
  const prevTarget = useRef(target)

  useEffect(() => {
    const start = prevTarget.current
    prevTarget.current = target

    if (start === target) {
      setCurrent(target)
      return
    }

    const startTime = performance.now()
    let rafId: number

    const animate = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3) // easeOutCubic

      setCurrent(Math.round(start + (target - start) * eased))

      if (progress < 1) {
        rafId = requestAnimationFrame(animate)
      }
    }

    rafId = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafId)
  }, [target, duration])

  return current
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useCountUp.ts
git commit -m "feat: add useCountUp hook for animated number transitions"
```

---

### Task 18: Gamification Integration & Final Cleanup

**Files:**
- Modify: `src/app/globals.css` (remove old `--primary` / `--secondary` if no longer referenced)

- [ ] **Step 1: Wire AchievementToast into the app**

Find where achievements are triggered (search for achievement-related API calls or state). Add the `AchievementToast` component to the root layout or a global provider so it can be triggered from anywhere.

- [ ] **Step 2: Wire LevelUpCelebration into the level system**

Find where level-up is detected (likely after XP gain in pack opening or battle completion). Trigger `LevelUpCelebration` when the user's level increases.

- [ ] **Step 3: Wire useCountUp into Dashboard stats**

In `DashboardClient.tsx`, use the `useCountUp` hook for stat values (Packs Opened, Battles Won, etc.) so they animate when the page loads.

- [ ] **Step 4: Search for and remove old color tokens**

```bash
grep -rn "\-\-primary\|--secondary" src/ --include="*.tsx" --include="*.css" | grep -v node_modules | grep -v ".next"
```

Replace any remaining `--primary` references with `--pa-neon`. Once no references remain, remove `--primary: 59 130 246` and `--secondary: 139 92 246` from `:root` in globals.css.

- [ ] **Step 5: Final full-app verification**

Navigate through every page on desktop AND mobile. Check:
- No broken styles (missing colors, invisible text)
- Consistent neon-green accents throughout
- Cards all use navy backgrounds
- Buttons are all neon-green primary
- Mobile: touch targets work, no hover-stuck states
- Rarity colors preserved and distinct from brand colors
- XP bar animates with neon gradient
- Achievement toast slides in correctly
- Number counters animate on dashboard

- [ ] **Step 6: Commit**

```bash
git add src/
git commit -m "feat: integrate gamification components and remove legacy color tokens"
```

---

## Summary

| Phase | Tasks | Focus |
|---|---|---|
| Phase 1 | Tasks 1–7 | Design tokens, globals, UI components, navigation, layout, typography & mobile |
| Phase 2 | Tasks 8–10 | Pack Opening, Collection, Dashboard (priority pages) |
| Phase 3 | Tasks 11–14 | Battles, Shop, Auth/Admin/Leaderboard, final color cleanup |
| Phase 4 | Tasks 15–18 | Gamification components (toast, level-up, counters), integration & cleanup |

**Total: 18 tasks.** Each task is independently committable and deployable.
