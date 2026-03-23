# Pack Attack — Design System Overhaul

**Date:** 2026-03-23
**Status:** Approved
**Vibe:** Premium Collector — Elegant, deep shadows, holographic effects, luxury unboxing
**Brand Identity:** Neon-Green (#BFFF00) on Deep Navy (#0B0B2B) — consistent across all touchpoints
**Mode:** Dark-mode only. No light-mode variant planned.

---

## 1. Design Tokens & Color System

### Core Palette

| Token | Hex | Usage |
|---|---|---|
| `--pa-bg-deep` | `#06061A` | Page background, deepest layer |
| `--pa-bg-base` | `#0B0B2B` | Section backgrounds, navbar |
| `--pa-bg-surface` | `#10103A` | Slightly elevated surfaces |
| `--pa-bg-elevated` | `#16164A` | Modals, dropdowns, popovers |
| `--pa-bg-card` | `#12123A` | Card backgrounds |
| `--pa-neon` | `#BFFF00` | Primary accent, CTAs, active states |
| `--pa-neon-dim` | `#9ACC00` | Secondary neon, hover states |
| `--pa-neon-glow` | `rgba(191,255,0,0.3)` | Box-shadow glow effects |
| `--pa-neon-subtle` | `rgba(191,255,0,0.08)` | Subtle backgrounds, hover fills |
| `--pa-text-on-neon` | `#000000` | Text on neon-colored surfaces |
| `--pa-bg-hover` | `rgba(255,255,255,0.06)` | Hover surface for interactive elements |

### Text Colors

| Token | Hex | Usage |
|---|---|---|
| `--pa-text-primary` | `#F0F0F5` | Headings, primary content |
| `--pa-text-secondary` | `#8888AA` | Descriptions, meta text |
| `--pa-text-muted` | `#7777A0` | Labels, disabled text (WCAG AA compliant on navy) |

### Border System

| Token | Value | Usage |
|---|---|---|
| `--pa-border` | `rgba(255,255,255,0.06)` | Default card/section borders |
| `--pa-border-hover` | `rgba(255,255,255,0.12)` | Hover state borders |

### Rarity Colors (Unchanged — Independent from Brand)

| Rarity | Color | Glow Intensity |
|---|---|---|
| Common | `#8B8BA0` | None |
| Uncommon | `#4ADE80` | Subtle on hover |
| Rare | `#60A5FA` | Medium on hover |
| Epic | `#A78BFA` | Permanent subtle glow |
| Legendary | `#FBBF24` | Permanent pulsing glow |
| Mythic | `#FF6B6B` | Permanent strong glow + particles |

### Semantic Colors

| Token | Color | Usage |
|---|---|---|
| `--pa-success` | `#4ADE80` | Success states, confirmations |
| `--pa-warning` | `#FBBF24` | Warnings, coin displays |
| `--pa-error` | `#EF4444` | Errors, destructive actions |
| `--pa-info` | `#60A5FA` | Informational states |

---

## 2. Typography

### Font Stack (Unchanged)

- **Display/Headings:** Syne (weights: 400–800)
- **Body/UI:** Outfit (weights: 300–900)

### Scale

| Level | Font | Weight | Size | Usage |
|---|---|---|---|---|
| XL Heading | Syne | 800 | 36px | Page titles, hero text |
| L Heading | Syne | 700 | 24px | Section headings |
| M Heading | Syne | 700 | 18px | Card titles, sub-sections |
| Body Bold | Outfit | 600 | 16px | Emphasis, labels |
| Body | Outfit | 400 | 14px | Default body text |
| Label | Outfit | 500 | 12px, uppercase, 1px tracking | Meta labels, categories |
| Small | Outfit | 400 | 12px | Fine print, timestamps |

### Responsive Scale (Mobile < 768px)

| Level | Desktop | Mobile |
|---|---|---|
| XL Heading | 36px | 26px |
| L Heading | 24px | 20px |
| M Heading | 18px | 16px |
| Body | 14px | 14px |
| Label | 12px | 12px |

Use `clamp()` for fluid transitions (already established pattern in project).

---

## 3. Spacing & Layout Rules

### Spacing Scale

| Token | Value | Usage |
|---|---|---|
| `xs` | 4px | Tight internal spacing |
| `sm` | 8px | Icon gaps, badge padding |
| `md` | 12px | Grid gaps, list item gaps |
| `lg` | 16px | Card padding internal |
| `xl` | 20px | Card body padding, section gaps |
| `2xl` | 24px | Section padding |
| `3xl` | 32px | Page section separation |
| `4xl` | 48px | Major section breaks |

### Rules

- **Minimum gap between elements:** 12px (never tighter)
- **Card internal padding:** 20–28px
- **Page max-width:** 1280px (unchanged)
- **Grid gaps:** 16–20px between cards

### Border Radius Scale

| Element | Radius |
|---|---|
| Cards, Modals | 20px |
| Buttons | 12px |
| Inputs | 12px |
| Badges, Pills | 100px (fully rounded) |
| Collection cards | 14px |
| Small elements | 8–10px |

---

## 4. Component Redesign

### Buttons

| Variant | Background | Text | Border | Use Case |
|---|---|---|---|---|
| Primary (Neon) | `#BFFF00` | `#000000` | None | Main CTAs, "Open Pack", "Buy" |
| Outline | Transparent | `#BFFF00` | `rgba(191,255,0,0.3)` | Secondary actions |
| Ghost | `rgba(255,255,255,0.04)` | `#8888AA` | `var(--pa-border)` | Tertiary, filters |
| Destructive | `rgba(239,68,68,0.12)` | `#EF4444` | `rgba(239,68,68,0.25)` | Delete, cancel |

**Interactions:**
- Hover: `box-shadow: 0 0 24px var(--pa-neon-glow)` + `scale(1.02)` for Primary
- Active: `scale(0.98)` press-down
- Focus-visible: 2px outline with neon color, 2px offset (`:focus-visible` only — no outlines on mouse clicks)

### Cards

- Background: `var(--pa-bg-card)` with `1px solid var(--pa-border)`
- Border-radius: 20px
- Hover: `translateY(-4px)` + `box-shadow: 0 20px 40px rgba(0,0,0,0.4)` + border brightens
- Game badge in top-left corner (Pokemon=yellow, MTG=red, One Piece=red, Lorcana=purple)

### Badges / Pills

- Rounded-full (100px radius)
- Font: 12–13px, weight 600, uppercase with 0.5px tracking
- Background: rarity-color at 12% opacity
- Border: rarity-color at 30% opacity
- Legendary+: subtle box-shadow glow

### Navigation

- Background: `var(--pa-bg-base)` with bottom border
- Logo: Syne 800, Neon-Green gradient text
- Active nav link: `var(--pa-neon-subtle)` background + neon text color
- Inactive links: `var(--pa-text-secondary)`
- Right side: Coin balance (gold), Level badge with mini XP bar, Avatar
- Height: 64px with comfortable padding

---

## 5. Page-Specific Designs

### 5.1 Pack Opening (Priority 1)

**Current state:** Basic card reveal with CSS animations
**Target state:** Multi-stage dramatic reveal ceremony

**Design:**
- Full-screen overlay during opening sequence
- Pack "tear" animation → cards slide out staggered
- Each card: 3D flip reveal with rarity-colored glow building up
- Common cards: Quick reveal, subtle effect
- Rare+: Slower reveal, screen-edge glow in rarity color
- Legendary/Mythic: Full-screen flash, CSS pseudo-element particle burst (no external library), optional `Navigator.vibrate()` on mobile (with feature detection fallback)
- Post-reveal: Cards laid out in a fan pattern, best pull highlighted
- Framer Motion `layoutId` for smooth transitions from reveal → collection

### 5.2 Collection (Priority 2)

**Current state:** Basic grid with rarity indicators
**Target state:** Premium card showcase with tiered visual treatment

**Design:**
- 5-column grid (desktop), 3 (tablet), 2 (mobile)
- Gap: 14px between cards
- Each card: aspect-ratio 2.5/3.5, gradient border matching rarity
- Hover: lift + scale(1.03) + rarity-colored box-shadow
- Common: Subtle gray gradient border
- Uncommon: Green gradient border, glow on hover
- Rare: Blue gradient border, glow on hover
- Epic: Purple gradient border, permanent subtle glow
- Legendary: Gold gradient border, permanent pulsing glow animation (3s cycle)
- Mythic: Red/pink border, strong permanent glow + CSS particle effect
- Filter bar redesign: Pill-style filter chips with neon active state
- Sort controls: Dropdown with neon accent

### 5.3 Dashboard / Profile (Priority 3)

**Current state:** Basic stats display
**Target state:** Gamification-centered profile hub

**Design:**
- **XP Section (Hero):** Large level display (Syne 800), title badge (e.g., "Elite Collector"), full-width XP progress bar with neon gradient fill + glow shadow, percentage and XP numbers below
- **Stats Grid:** 4-column grid with icon + value + label per stat (Packs Opened, Battles Won, Legendaries, Day Streak)
- **Recent Pulls:** Horizontal scrollable row of last 10 pulls with rarity styling
- **Achievement Showcase:** Grid of unlocked achievement badges with locked ones grayed out
- All stat values: Syne 800 font, large size, color-coded (neon for primary, gold for battles, purple for rares)

---

## 6. Animation System

### Framer Motion Patterns

| Animation | Duration | Easing | Usage |
|---|---|---|---|
| Card hover lift | 0.3s | `cubicBezier(0.23, 1, 0.32, 1)` | All interactive cards |
| Page transition | 0.2s | `easeOut` | Route changes |
| Card reveal flip | 0.6s | `spring(stiffness: 200, damping: 20)` | Pack opening |
| Number counter | 0.8s | `easeOut` | XP gain, coin changes |
| Toast slide-in | 0.3s | `spring(stiffness: 300, damping: 25)` | Achievement notifications |
| Skeleton shimmer | 1.5s | `linear`, infinite | Loading states |

### CSS Animations (Keep & Adapt)

- Rarity glow pulses (existing, update colors)
- Card reveal entrance (existing, enhance)
- Gradient glow (existing)
- Shimmer effect (existing)
- Float animation (existing)
- **New:** `legendary-pulse` — 3s box-shadow pulse for legendary cards
- **New:** `neon-breathe` — subtle neon glow intensity cycle for CTAs

### Reduced Motion

All animations respect `prefers-reduced-motion: reduce` — fall back to opacity transitions only.

---

## 7. Glassmorphism & Effects

### Glass Variants (Updated)

| Class | Background | Blur | Border | Usage |
|---|---|---|---|---|
| `.glass` | `rgba(255,255,255,0.03)` | `12px` | `rgba(255,255,255,0.06)` | Subtle overlays |
| `.glass-strong` | `rgba(255,255,255,0.05)` | `16px` | `rgba(255,255,255,0.1)` | Modals, popovers |

### Background Effects

- Grid pattern overlay: update from blue to neon-green at 2% opacity
- Radial gradient: update to use navy tones
- Animated background blobs: update from blue to neon-green at 5% opacity

---

## 8. Mobile Optimization

**The redesign is mobile-first.** All components must work flawlessly on mobile devices.

### Layout Adaptations

| Component | Desktop | Mobile |
|---|---|---|
| Navigation | Horizontal nav links + right-side badges | Hamburger menu + sticky bottom bar with key actions |
| Card grid (Boxes) | 3 columns, 20px gap | 2 columns, 12px gap |
| Collection grid | 5 columns, 14px gap | 3 columns, 10px gap |
| Stats grid | 4 columns | 2 columns |
| Dashboard XP section | Horizontal layout | Full-width stacked |
| Pack opening | Centered overlay | Full-screen immersive |

### Mobile-Specific Features

- **Sticky bottom action bar:** Primary CTA (Open Pack / Buy) always accessible
- **Touch targets:** Minimum 44x44px for all interactive elements (existing standard, maintain)
- **Safe area padding:** Respect notched devices via `env(safe-area-inset-*)` (existing, maintain)
- **Swipe gestures:** Horizontal swipe for collection cards, swipe-to-close for modals (existing pattern)
- **Pull-to-refresh:** Disabled via `overscroll-behavior: none` (existing, maintain)
- **Pack opening on mobile:** Full-screen takeover, swipe/tap to reveal cards, haptic feedback via `Navigator.vibrate()` (with feature detection)
- **Card hover effects:** Convert to tap-and-hold or active states on touch devices (`@media (hover: none)`)

### Performance on Mobile

- Reduce glow/shadow intensity on mobile (lighter box-shadows, fewer blur layers)
- Disable background animated blobs on screens < 768px (existing pattern)
- Use `will-change` sparingly, only on actively animating elements
- Skeleton loading states: Solid `--pa-bg-surface` base with gradient shimmer (neon-tinted at 3% opacity)

---

## 9. Implementation Phases

### Phase 1: Design Foundation

**Scope:** Design tokens, core components, navigation

**Tasks:**
1. Define CSS custom properties in globals.css (all `--pa-*` tokens)
2. Update Tailwind theme extension with new color palette
3. Redesign `Button` component (`src/components/ui/button.tsx`) — new variants
4. Redesign `Card` component (`src/components/ui/card.tsx`) — new styling
5. Redesign `Badge` component (`src/components/ui/badge.tsx`) — rarity styles
6. Redesign `Navigation` component — neon branding, level badge, new layout
7. Update `globals.css` — background colors, glass classes, grid pattern, scrollbar
8. Update root `layout.tsx` — background color, theme-color meta
9. Typography scale adjustments across all headings

**Impact:** Every page gets the new color scheme and base styling automatically.

### Phase 2: Core Pages

**Scope:** Pack Opening, Collection, Dashboard

**Tasks:**
1. Pack Opening redesign — enhanced reveal animations, rarity staging, full-screen overlay
2. Collection view — rarity-glow cards, gradient borders, improved grid layout
3. Collection filters — pill-style filter chips with neon active states
4. Dashboard XP section — large level display, gradient XP bar, title badge
5. Dashboard stats grid — icon + value + label cards
6. Dashboard recent pulls — horizontal scroll with rarity styling

### Phase 3: Secondary Pages & Polish

**Scope:** All remaining pages

**Tasks:**
1. Homepage hero section — neon gradient text, updated stats bar
2. Battles page — redesigned battle cards, neon accents
3. Shop/Marketplace — updated product cards, cart styling
4. Leaderboard — rank visualization with tier colors
5. Auth pages (login/register) — updated to match new design
6. Admin & Shop dashboards — apply new card/table styling
7. Box browsing page — updated grid with game badges

### Phase 4: Gamification & Micro-Interactions

**Scope:** Advanced interactive features

**Tasks:**
1. Achievement toast system — slide-in notifications with Framer Motion
2. Level-up celebration — full-screen animation on level advancement
3. Streak indicator — fire icon with count in navigation/dashboard
4. Live feed component — real-time stream of other users' recent pulls
5. Number counter animations — count-up effect for XP, coins, stats
6. Sound design — deferred to a separate future spec (requires autoplay policy handling, volume controls, mute toggles)

---

## 10. Migration Strategy

### Approach: Token-First Migration

1. **Add new tokens alongside old ones** — no breaking changes initially
2. **Migrate component-by-component** — each PR updates one component to new tokens
3. **Remove old tokens** after all components are migrated

### Key Files to Modify

| File | Changes |
|---|---|
| `src/app/globals.css` | New CSS custom properties, updated glass/grid/glow classes |
| `src/components/ui/button.tsx` | New variant styles using neon palette |
| `src/components/ui/card.tsx` | New background, border, radius, hover effects |
| `src/components/ui/badge.tsx` | Rarity-colored variants with glow |
| `src/components/Navigation.tsx` | Complete visual overhaul |
| `src/app/layout.tsx` | Background color, theme-color meta |
| `src/app/page.tsx` | Homepage hero, featured boxes, stats |
| `src/app/collection/page.tsx` | Rarity-glow card grid |
| `src/app/(dashboard)/dashboard/page.tsx` | XP section, stats grid |

### Backward Compatibility

- Existing Tailwind utility classes (bg-gray-*, text-blue-*) will be gradually replaced
- No big-bang migration — incremental per component/page
- Each phase can be deployed independently
