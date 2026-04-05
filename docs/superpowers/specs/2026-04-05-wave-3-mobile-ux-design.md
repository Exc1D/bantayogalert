# Wave 3: Mobile UX Design Specification

**Date:** 2026-04-05
**Status:** Design — User Approved
**Predecessors:** Wave 0 (Foundation), Wave 1 (Architecture), Wave 2 (Core Features) — all COMPLETE

## 1. Scope & Goals

### Problems Solved
- Mobile has no bottom sheet — report detail and admin triage use route-based full-page swaps that lose map context
- No tablet layout — everything below 1280px renders mobile bottom tabs, which wastes screen real estate on tablets
- Admin functions on mobile are buried in the Profile tab (2-3 extra taps) — admins need a dedicated tab
- `MobileBottomTabs.tsx` exists unused, duplicating MobileShell's inline nav
- `WorkspaceDrawer` hardcodes `w-[480px]` — no mobile adaptation

### What's In Scope
1. Three-tier breakpoint shell routing (mobile/tablet/desktop)
2. Bottom sheet component with PEEK/HALF/FULL states + swipe gestures
3. TabletShell with orientation-aware overlay (portrait=bottom, landscape=right)
4. Admin navigation integration (replace unused MobileBottomTabs, add admin tab)

### What's Out of Scope
- Map pin redesign (Wave 4)
- Municipality boundary fixes (Wave 4)
- Empty states (Wave 4)
- A11y audit (Wave 4)
- Toast tier wiring (Wave 2.2 follow-up)

## 2. Architecture

### 2.1 Breakpoint System

Replace the single `matchMedia('(min-width: 1280px)')` in `ShellRouter` with three-tier breakpoints:

| Breakpoint | Range | Shell | Navigation | Detail View |
|------------|-------|-------|------------|-------------|
| **Mobile** | 0–768px | `MobileShell` | Bottom tab bar (5 tabs) | Bottom sheet |
| **Tablet** | 769–1279px | `TabletShell` (new) | Top nav bar (horizontal) | Orientation-aware overlay |
| **Desktop** | 1280px+ | `DesktopShell` | Left nav rail (64px, navy) | Right workspace drawer (480px) |

### 2.2 ShellRouter Changes

`ShellRouter` will export three responsive hooks:
- `useMobile()`: `window.innerWidth <= 768`
- `useTablet()`: `window.innerWidth >= 769 && window.innerWidth <= 1279`
- `useDesktop()`: `window.innerWidth >= 1280`

Implementation: Single `matchMedia` listener for each breakpoint, not multiple listeners. The current `mq.matches` pattern extends cleanly — we'll use a combined listener function that re-evaluates all breakpoints on a single resize event.

### 2.3 Shell Component Structure

```
ShellRouter
├── MobileShell — existing, enhanced with bottom sheet provider
├── TabletShell — new: top nav + map + overlay drawer
└── DesktopShell — existing, unchanged
```

`MobileShell` gains a `BottomSheetProvider` context that any child can use to open/close the sheet. This replaces route-based content swaps for detail views.

## 3. Bottom Sheet Component

### 3.1 State Machine

```
CLOSED ↔ PEEK (30vh) ↔ HALF (60vh) ↔ FULL (100vh)
```

- Transitions are animated with 250ms ease-out
- Finger release near a snap point → auto-snaps to nearest
- Swipe down from FULL content scrolls to top, then collapses

### 3.2 Props Interface

```typescript
interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  states?: ("peek" | "half" | "full")[];  // configurable snap points, defaults to all three
  defaultState?: "peek" | "half" | "full"; // initial state on open
  children: React.ReactNode;
}
```

### 3.3 Technical Decisions

- **Portal rendering**: `createPortal` to `document.body` — avoids z-index stacking context issues with the Leaflet map
- **Touch handling**: `touchstart`/`touchmove`/`touchend` — no gesture library needed. We track `startY`, `currentY`, and `deltaY` to compute drag position.
- **Scroll containment**: Sheet body uses `overflow-y: auto`. When scrolled to top, touch-drag moves the sheet. When scrolled past top, body scrolls normally.
- **Backdrop**: Semi-transparent overlay (`bg-black/40`) at HALF and FULL states. Tap to collapse to PEEK, or close if already PEEK.
- **Hide tab bar**: When sheet is HALF or FULL, `MobileShell`'s bottom tab bar hides automatically (sheet is primary context).

### 3.4 Accessibility

- `role="dialog"` + `aria-modal="true"` + `aria-label` from content title
- Focus trap within sheet when open
- Escape key closes sheet
- `prefers-reduced-motion: reduce` collapses animation to 0.01ms

## 4. Tablet Layout

### 4.1 TabletShell Structure

- **Top nav bar**: Horizontal row of icon buttons (same nav items as mobile bottom tabs). Background: `bg-white dark:bg-slate-800` with bottom border. Height: 56px.
- **Map area**: Full remaining viewport below the nav bar.
- **Overlay drawer**: Appears when user taps a report or needs admin context.

### 4.2 Orientation-Aware Overlay

The overlay drawer adapts based on device orientation:

```typescript
const orientation = window.innerWidth > window.innerHeight ? "landscape" : "portrait";
const placement = orientation === "landscape" ? "right" : "bottom";
```

- **Portrait**: Slides up from bottom (touch-optimized for handheld tablets)
- **Landscape**: Slides in from right (screen edge is closer, consistent with desktop mental model)

Implementation: A single `OverlayDrawer` component with a `placement: "bottom" | "right"` prop. Animation: `translateY` for bottom, `translateX` for right.

### 4.3 Map Behavior

- Map does NOT resize when overlay opens — it stays full-viewport underneath
- Overlay dims map with semi-transparent backdrop (40% black overlay on map area)
- No `invalidateSize()` call needed since map container doesn't change dimensions

## 5. Admin Mobile Integration

### 5.1 Tab Bar Reorganization

Replace `MobileShell`'s inline `<nav>` with the existing `MobileBottomTabs` component (currently unused, already has conditional admin tab logic):

**Non-admin tabs:** Map | Report | Feed | Alerts | Me
**Admin tabs:** Map | Report | Feed | Alerts | Admin | Me

Tab order places Admin before Me (profile). The Report button is rendered as a raised center CTA (pattern already in `MobileBottomTabs`).

### 5.2 Admin Queue on Mobile

`AdminQueueFeed` renders as a full-screen route when Admin tab is active. The existing three-tab layout (Pending / Verified / Dispatched) works on mobile with no changes — cards are already responsive.

### 5.3 Admin Triage Flow

```
Admin tab → AdminQueueFeed (full screen)
  → Tap report card → BottomSheet opens at PEEK with summary
    → Swipe to HALF → Full report + citizen contact
    → Swipe to FULL → Operations Command (classify, verify, assign, status update)
```

`AdminReportDetailPanel` is adapted for mobile via a wrapper that:
- Stacks triage actions vertically
- Reduces padding from 24px to 16px
- Uses smaller text and tighter spacing

No rewrite of `AdminReportDetailPanel` itself — it's reused as-is.

### 5.4 Bottom Sheet Content Zones

| State | Citizen View | Admin View |
|-------|-------------|------------|
| **PEEK** | Severity badge + type + location + "Tap for details" | Summary + "Classify & Verify" hint |
| **HALF** | Full report card + mini timeline | Report + citizen contact info |
| **FULL** | Full report detail + photos + complete timeline | Operations Command: all triage actions |

## 6. Files to Create/Modify

### New Files
| File | Purpose |
|------|---------|
| `src/components/ui/BottomSheet.tsx` | Core bottom sheet component |
| `src/components/ui/OverlayDrawer.tsx` | Tablet overlay drawer (orientation-aware) |
| `src/app/shell/TabletShell.tsx` | Tablet layout shell |
| `src/app/shell/MobileBottomTabs.tsx` | (existing, currently unused — will be integrated) |
| `src/wrappers/AdminReportDetailMobile.tsx` | Mobile adapter for AdminReportDetailPanel |

### Modified Files
| File | Change |
|------|--------|
| `src/app/shell/ShellRouter.tsx` | Three-tier breakpoint logic |
| `src/app/shell/MobileShell.tsx` | Integrate MobileBottomTabs, BottomSheetProvider |
| `src/stores/uiStore.ts` | Add bottom sheet state fields if needed (likely local state is sufficient) |
| `src/app/router.tsx` | Add admin route for mobile if not present |

### Unchanged Files
| File | Why |
|------|-----|
| `src/app/shell/DesktopShell.tsx` | Already correct for desktop |
| `src/app/shell/WorkspaceDrawer.tsx` | Desktop-only, no mobile impact |
| `src/components/report/AdminReportDetailPanel.tsx` | Reused via mobile adapter |

## 7. Implementation Order (Bottom-Up)

1. **Breakpoint hooks** — `ShellRouter.tsx` refactor (enables all other work)
2. **Bottom sheet** — `BottomSheet.tsx` + `OverlayDrawer.tsx` (enables mobile/tablet detail views)
3. **TabletShell** — `TabletShell.tsx` (new shell, uses overlay drawer)
4. **Admin integration** — Replace MobileShell nav with MobileBottomTabs, add admin tab, add bottom sheet to admin triage flow

## 8. Error Handling

- If orientation detection fails, default to portrait behavior (bottom overlay)
- If touch events are unavailable (keyboard/screen reader), sheet expands via tap on drag handle — same states accessible
- Sheet state resets on navigation — no persistence needed for transient UI
- `matchMedia` polyfill is built into Vite environment — no library needed

## 9. Testing Strategy

| Test | Type | Coverage |
|------|------|----------|
| BottomSheet snap transitions | Unit (RTL) | PEEK↔HALF↔FULL, touch drag, backdrop tap |
| ShellRouter breakpoint hooks | Unit (RTL) | Resize events, correct shell rendering |
| TabletShell orientation | Unit (RTL) | Portrait vs layout detection, drawer placement |
| MobileBottomTabs rendering | Unit (RTL) | Admin vs non-admin tab states |
| Admin triage e2e on mobile | Playwright | Open queue → open sheet → triage action |
| Accessibility (keyboard + screen reader) | Manual + RTL | Focus trap, Escape key, ARIA labels |
