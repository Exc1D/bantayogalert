# DESIGN.md Gap Bridging Plan

**Date:** 2026-04-05
**Goal:** Bridge all identified gaps between DESIGN.md v2 and current implementation across 5 focused waves
**Scope:** 22 items across 5 waves
**Last updated:** Frontend-design evaluation completed — §22 added to DESIGN.md with Switzer font swap, emoji→Lucide mapping, anti-pattern remediation, and wave reordering

---

## Wave 0: Foundation (CSS Properties + Design Tokens) *(NEW)*

These must be done first because subsequent waves depend on correct foundations.

### 0.1 CSS Custom Properties for Color System
**Files affected:** `src/index.css`, `tailwind.config.js`

**Current:** Colors hardcoded in Tailwind class names directly
**Target:** CSS custom properties as single source of truth, Tailwind derived from them

**Changes:**
- Add all DESIGN.md §3 color tokens as CSS custom properties in `:root`
- Include: brand (navy, brand, brand-light), severity (4 levels + bg variants), status (8 states), alert (4 types)
- Add light/dark mode mappings per DESIGN.md §18.2 via `@media (prefers-color-scheme: dark)`
- Update `tailwind.config.js` to reference CSS variables instead of hex values (e.g., `colors: { severity: { critical: 'var(--color-critical)' } }`)
- This ensures dark mode is a single CSS variable swap, not per-component changes

### 0.2 Bundle Switzer Font (replaces Inter)
**Files affected:** `public/fonts/`, `index.html`, `src/index.css`, `tailwind.config.js`

**Rationale:** Frontend-design evaluation flagged Inter as forbidden (AI aesthetic default). Switzer provides identical tall x-height legibility, Latin Extended support for Filipino characters, and variable-weight loading. See DESIGN.md §22.1

**Changes:**
- Download Switzer variable WOFF2 (Latin Extended, weights 300–700, ~85KB)
- Add single `@font-face` with `font-display: swap`
- Preload in `<head>`: `<link rel="preload" href="/fonts/switzer-var.woff2" as="font" type="font/woff2" crossorigin>`
- Update `tailwind.config.js` font family: `sans: ['Switzer', '-apple-system', ...]`
- Remove any Google Fonts CDN dependencies

### 0.3 Global Motion & Accessibility Rules
**Files affected:** `src/index.css`

**Changes:**
- Add `prefers-reduced-motion: reduce` global rule (collapse all animations to 0.01ms except Leaflet zoom per DESIGN.md §16.2)
- Add global `:focus-visible` rule: `outline: 2px solid #2563EB; outline-offset: 2px;`
- Add skeleton shimmer keyframe animation with dark mode support (§19.3)
- Add `will-change` performance guardrails for animated elements

### 0.4 Emoji-to-Lucide Icon Mapping *(NEW)*

**Rationale:** Frontend-design evaluation flagged emoji usage throughout wireframes as shipping anti-patterns. All emoji in production code must use Lucide Icons instead. Wireframe emoji are acceptable as design shorthand.

**Mapping (DESIGN.md §22.2):** Key replacements: 🔥`flame`, 📋`clipboard-list`, 📷`camera`, 🚨`megaphone`, ✅`check-circle`, 📡`satellite-dish`, ⏳`hourglass`, 🏁`flag`, 📍`map-pin`, 🛡️`shield-check`, 🔔`bell`, 👤`user`, ➕`plus`, 📊`bar-chart-3`, 📇`contact`, 🗺️`map`, ⚠️`alert-triangle`, ℹ️`info`, 🔒`lock`, 📡×`wifi-off`.

**Changes:**
- Audit all components for emoji usage in JSX
- Replace emoji strings with Lucide icon components
- Add `lucide-react` to dependencies if not already present
- Ensure all icons have appropriate `aria-hidden="true"` + parent `aria-label`

---

## Wave 1: Fix Architecture Violations (3 items)

These build on Wave 0 tokens and font foundations.

### 1.1 Restructure Report Form (3 Steps, No Citizen Classification)
**Files affected:** `src/app/report/ReportForm.tsx`, `src/app/report/StepTypeSeverity.tsx`, `src/app/report/StepReview.tsx`, step components, all step-related routes

**Current:** 4 steps — Type/Severity → Description → Location/Media → Review (citizens classify)
**Target:** 3 steps — Evidence → Location → Description (citizens don't classify)

**Changes:**
- Remove `StepTypeSeverity.tsx` entirely from citizen form flow
- Reorder steps to spec order: Evidence (photos) → Location (GPS + pin) → Description (textarea + review summary)
- Update `StepReview.tsx` to omit Type and Severity (admin-only fields)
- Adjust form state management and routing accordingly
- Keep classification in admin triage only (already implemented in `AdminReportDetailPanel.tsx`)

### 1.2 Apply CSS Variable Token Colors Across Components *(moved from Wave 0)*
**Files affected:** All components using severity/status color tokens

**Current:** Only 4 severity colors (`severity-info`, `severity-warning`, `severity-clear`) with wrong hex values
**Target:** Full DESIGN.md palette using CSS variable-backed Tailwind tokens (defined in Wave 0)

**Changes:**
- Find/replace hardcoded color references across components with CSS variable-backed Tailwind classes
- Color tokens are already defined in Wave 0 — this task applies them
- Components to audit: ReportFeedCard, AlertCard, StatusBadge, SeverityBadge, ReportDetailPanel, AdminQueueFeed

### 1.3 Unify Nav Rail Implementations
**Files affected:** `src/app/shell/DesktopNavRail.tsx`, `src/app/shell/DesktopShell.tsx`

**Current:** Two parallel nav rail implementations exist — `DesktopNavRail.tsx` (64px, white) and `DesktopShell.tsx` (80px, slate-950)
**Target:** Single nav rail per DESIGN.md §8.2

**Changes:**
- Delete the unused implementation (likely `DesktopNavRail.tsx`)
- Update the remaining nav rail to match spec: 64px width, `#1B2A4A` navy bg, active indicator as 3px left border in `#3B82F6`
- Report CTA as 40px circle in the nav rail
- Admin section divider and Settings gear at bottom
- Fix DesktopShell to use the unified component

---

## Wave 2: Missing Core Features (5 items)

### 2.1 Status Timeline (Alternating Zigzag)
**Files affected:** `ReportTrack.tsx`, `ReportDetailOwner.tsx`

**Target:** DESIGN.md §8.6 alternating zigzag timeline with citizen-facing labels

**Changes:**
- Convert simple vertical timeline to left/right alternating layout
- Add citizen-facing plain language labels ("Help Is On the Way" instead of "dispatched")
- Add "Next-step hint" cards with ghost future dots
- Add pulse animation for active dispatched/underway states
- Admin activity log shows who performed actions with timestamps

### 2.2 Three-Tier Toast/Notification System
**Files affected:** New toast context/provider, `ConnectionStatusBanner.tsx`

**Changes:**
- **Tier 1:** Critical Alert Banner — full-width, persistent, `#FEF2F2` bg, 56px height, slide-down 300ms
- **Tier 2:** Informational Toast — bottom-right (desktop) / bottom-center (mobile), `#111827` bg, 48px, auto-dismiss 5s, max 3 stacked
- **Tier 3:** System Message Bar — already exists as `ConnectionStatusBanner`, extend to include version conflict and session expiry
- Add priority queueing rules: T1 > T3 > T2 (max 3 visible, FIFO overflow)
- Integrate with existing `sonner` or replace if not flexible enough

### 2.3 Compact Card Mode
**Files affected:** `ReportFeedCard.tsx`

**Changes:**
- Add compact mode variant: severity + type + location + time only (4 items)
- Add density toggle (can be in Settings or as a feed header control)
- Auto-compact mode during declared emergencies (future admin feature)
- Card layout changes: no description, no thumbnails, no status badge in compact mode

### 2.4 Dark Mode (System Auto)
**Files affected:** Components (CSS variables already defined in Wave 0 §0.1), all components

**Changes:**
- CSS custom properties for dark mode are already established in Wave 0 §0.1
- Apply `dark:` Tailwind classes across all components (currently only nav components have dark mode)
- Switch map tiles to CartoDB Dark Matter when dark mode active (in map component + supercluster markers)
- Skeleton shimmer dark variant already added in Wave 0 §0.3
- No manual toggle — V2 feature per spec

### 2.5 Loading Skeletons (Replace Spinners)
**Files affected:** New `Skeleton.tsx` component, Feed components, Admin queue, Profile, any component using `animate-spin`

**Changes:**
- Create `Skeleton` component using shimmer keyframe from Wave 0 §0.3
- Include dark mode shimmer variant (same keyframe works automatically via CSS variable mapping)
- Replace all loading spinners with skeleton blocks matching expected content layout
- Report card skeleton: ~4 rectangular shimmer blocks matching card structure
- Admin queue skeleton, alert feed skeleton, profile skeleton

---

## Wave 3: Mobile Experience (4 items)

### 3.1 Mobile Bottom Sheet (PEEK/HALF/FULL)
**Files affected:** `ReportDetailSheet.tsx` (rewrite), new bottom sheet component

**Target:** DESIGN.md §9.4 three-state bottom sheet for mobile report detail

**States:**
- **PEEK (120px):** severity badge + type + location + timestamp + "Swipe up for details"
- **HALF (50% screen):** Full report card + mini public timeline, map dimmed 30%
- **FULL (90% screen):** Complete report detail with photos, timeline, admin actions, tab bar hidden

**Technical:** Swipe gestures (up to expand, down to collapse), 200ms ease-out transitions, drag bar at top in HALF/FULL states

### 3.2 Mobile Admin Triage Tab
**Files affected:** `MobileBottomTabs.tsx`, new mobile triage page

**Changes:**
- Replace Feed tab with Triage tab for admin users
- Tab order: Map | Triage | Report | Alert | Me
- Summary counts: Pending / Dispatched / Active

### 3.3 Mobile Triage UX (Classify & Verify Bottom Sheet)
**Files affected:** Mobile triage component

**Target:** DESIGN.md §9.6 and §14.4

**Changes:**
- Pending cards show "Classify & Verify" primary action
- Bottom sheet for classification with segmented severity control (not radio buttons)
- Disabled until both Type + Severity selected
- Reject as ghost button below
- Maximum 3 taps for any triage action

### 3.4 Tablet Layout (769px–1279px)
**Files affected:** `ShellRouter.tsx`, new tablet shell component

**Target:** DESIGN.md §10

**Changes:**
- No persistent nav rail → hamburger menu that opens slide-over sidebar
- Workspace drawer overlays map (slide-over, 360px fixed), does NOT squeeze map
- `invalidateSize()` NOT called on drawer open (map doesn't resize)
- Map dimmed 40% when drawer is open (modal overlay behavior)
- No bottom tab bar
- All interactive targets ≥48px
- Physical keyboard shortcuts active

---

## Wave 4: Visual Polish & Accessibility (6 items)

### ~~4.1 Bundle Inter Font as WOFF2~~ → MOVED to Wave 0 §0.2 (Switzer replaces Inter)

### 4.2 Fix Map Pin Design
**Files affected:** `MapClusterIcon.tsx`

**Changes:**
- Pin: outer ring colored by severity (not solid fill), inner icon colored by disaster type (Lucide SVG, not emoji)
- Unclassified pin: `#6B7280` gray fill, dashed stroke, `?` icon, admin-only visibility
- Selected state: scale up, white ring (3px), bounce animation 150ms
- Resolved: 50% opacity + gray overlay ring
- Touch target: 48px × 48px hit area

### 4.3 Fix Municipality Boundaries
**Files affected:** `MunicipalityBoundaries.tsx`

**Changes:**
- Stroke: `#2563EB` at 40% opacity, 2px, dashed `[8, 4]`
- Hover: stroke 80% opacity + fill `#2563EB/10%` + tooltip with municipality name
- `interactive: true` (currently false)

### 4.4 Empty State Components
**Files affected:** `Feed` feed, `MyReportsList`, `AdminQueueFeed`, `AlertsFeed`, new empty state component

**Target:** DESIGN.md §19.1 consistent icon + message + CTA pattern

**States:**
- Feed: no reports
- My Reports: no submissions
- Admin queue: all caught up
- Alerts: no alerts
- Contacts: no contacts yet (inline prompt with "Add your first contact")

### 4.5 Accessibility Fixes
**Files affected:** Multiple components

**Changes:**
- Add `aria-live="polite"` on feed updates, `aria-live="assertive"` on critical alerts
- Add `role="application"` and `aria-label` on map container with accessible description
- Add skip link ("Skip to Feed") hidden at top of page
- Add landmark tags: `<main>`, `<nav>`, `<aside>`, `<dialog>`
- Add `aria-describedby` linking form inputs to error messages
- Add keyboard shortcut `R` to open report form (desktop)
- Add `aria-label="Severity: X"` on all severity badges
- Add `prefers-reduced-motion: reduce` handling (collapse all animations to 0ms except map zoom)

### 4.6 Form Element Fixes
**Files affected:** All form components

**Changes:**
- Input font size: `text-base` (16px) to prevent iOS auto-zoom on focus
- Add inline `⚠` icon to error messages
- Link error messages to inputs via `aria-describedby`
- Focus ring: `ring-2 ring-brand ring-offset-2` on all inputs

---

## Dependencies Between Waves

```
Wave 0 (CSS vars + font + motion + icons) ──┐
                                            ├──→ Wave 1 (Architecture)
Wave 0 (tokens) ────────────────────────────┤
                                            ├──→ Wave 2 (Core Features)
Wave 0 (focus ring, motion) ────────────────┤    Wave 2 depends on Wave 1 colors
                                            ├──→ Wave 3 (Mobile UX)
Wave 0 (colors, icons, motion) ─────────────┤    Wave 3 depends on Wave 1 nav
                                            ├──→ Wave 4 (Polish & A11y)
                                            │
Wave 1 ─────────────────────────────────────┤
                                            │
Wave 2 (skeleton keyframe, dark vars) ──────┘
```

Waves 1–4 all depend on Wave 0. After Wave 0, Waves 1 must complete before Waves 2–4. Waves 2, 3, and 4 can proceed in parallel after Wave 1.

## Execution Order

1. **Wave 0** — Foundation (4 items): CSS variables, Switzer font, motion/a11y rules, emoji→Lucide
2. **Wave 1** — Architecture fixes (3 items): Report form, color application, nav rail
3. **Wave 2** — Core features (5 items): Timeline, toast, compact mode, dark mode, skeletons
4. **Wave 3** — Mobile UX (4 items): Bottom sheet, admin tab, triage, tablet layout
5. **Wave 4** — Polish & accessibility (5 items): Map pins, boundaries, empty states, a11y, form fixes

Estimated: ~21 total items, each with ~2-5 file modifications per item.
