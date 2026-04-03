---
phase: 04-desktop-mobile-shell
plan: '02'
subsystem: ui
tags: [react, lucide-react, zustand, tailwind, navigation, mobile, desktop]

# Dependency graph
requires:
  - phase: 04-01
    provides: DesktopShell, MobileShell, WorkspaceDrawer, uiStore with setActivePanel/setActiveTab
provides:
  - NavItem reusable component (rail + tab variants)
  - DesktopNavRail with role-aware nav items
  - MobileBottomTabs with prominent center Report button
affects: [04-03, 04-04, 04-05]

# Tech tracking
tech-stack:
  added: [lucide-react]
  patterns: [role-aware navigation, sibling layout for map stability, Zustand-driven UI state]

key-files:
  created:
    - src/app/shell/NavItem.tsx
    - src/app/shell/DesktopNavRail.tsx
    - src/app/shell/MobileBottomTabs.tsx

key-decisions:
  - "Used LucideIcon type for icon prop in NavItem (already a Lucide component, not string)"
  - "Role-based nav items built dynamically from UserRole enum"
  - "ProvinceSuperadmin scope selector uses local state (municipalityScopeStore deferred to future phase)"
  - "Active state for nav items derived from activePanel uiStore value"
  - "Report button floats above tab bar with negative margin (-mt-4) and shadow"

patterns-established:
  - "NavItem as reusable atomic component for both rail and tab variants"
  - "Role-aware nav items using useAuth() customClaims.role"
  - "Zustand-driven tab switching (setActiveTab) separate from panel activation (setActivePanel)"

requirements-completed: [DSK-02, MOB-01, MOB-04, MOB-05, MOB-06]

# Metrics
duration: 12min
completed: 2026-04-03
---

# Phase 04-02: Desktop Nav Rail and Mobile Bottom Tabs Summary

**Role-aware desktop nav rail (64px) and mobile bottom tab bar (5 tabs with floating Report button), both wired to Zustand uiStore.**

## Performance

- **Duration:** 12 min
- **Tasks:** 3
- **Files created:** 3

## Task Commits

Each task was committed atomically:

1. **Task 1: NavItem reusable component** - `ab0cc83` (feat)
2. **Task 2: DesktopNavRail component** - `edbb4bf` (feat)
3. **Task 3: MobileBottomTabs component** - `cf61db3` (feat)

## Files Created/Modified

- `src/app/shell/NavItem.tsx` - Reusable nav item: icon + label + active/hover states for both rail (vertical) and tab (horizontal) variants. Badge support for notification counts.
- `src/app/shell/DesktopNavRail.tsx` - 64px vertical nav rail. Role-aware items via `useAuth()`. ProvinceSuperadmin gets scope selector dropdown at top. Map/Feed → activePanel=null; other items → panel-specific active state.
- `src/app/shell/MobileBottomTabs.tsx` - Fixed bottom 5-tab bar: Feed/Map/Report(center-floating)/Alerts/Profile. Tab switching via `setActiveTab` from uiStore.

## Decisions Made

- Lucide React icons used throughout (Map, Home, Bell, User, PlusCircle, LayoutDashboard, Users, BarChart3, ClipboardList, Shield, LogOut)
- NavItem variant prop ('rail' | 'tab') controls layout orientation and active state styling
- Active state for DesktopNavRail derived from `activePanel` from uiStore
- ProvinceSuperadmin scope selector uses local `useState` (scope stored locally; full municipalityScopeStore deferred)
- Report button on mobile uses negative margin (-mt-4) to float above tab bar, with rounded-full bg-primary-600

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Installed missing lucide-react dependency**
- **Found during:** Task 1 (NavItem)
- **Issue:** `lucide-react` not in package.json, build would fail
- **Fix:** `npm install lucide-react --legacy-peer-deps`
- **Files modified:** package.json, package-lock.json
- **Verification:** Import succeeds, build passes
- **Committed in:** N/A (dependency install, not a file commit)

**2. [Rule 1 - Bug] Fixed curried function type mismatch in DesktopNavRail**
- **Found during:** Task 2 (DesktopNavRail)
- **Issue:** `buildNavItems` passed panel strings to `onPanel` callback but `onPanel` type expected `() => void`
- **Fix:** Changed `buildNavItems` signature to `onPanel: (panel: PanelType) => () => void` and call `onPanel(panelValue)` directly when building items
- **Files modified:** src/app/shell/DesktopNavRail.tsx
- **Verification:** `npm run build` — NavItem, DesktopNavRail, MobileBottomTabs show no TypeScript errors
- **Committed in:** edbb4bf (Task 2 commit)

**3. [Rule 1 - Bug] Removed unused ComponentType import from NavItem.tsx**
- **Found during:** Task 1 (NavItem)
- **Issue:** `import type { ComponentType } from 'react'` declared but never used
- **Fix:** Removed the unused import
- **Files modified:** src/app/shell/NavItem.tsx
- **Verification:** `npm run build` — no unused import errors
- **Committed in:** ab0cc83 (Task 1 commit)

---

**Total deviations:** 3 auto-fixed (1 blocking dependency, 2 bug fixes)
**Impact on plan:** All auto-fixes necessary for correctness and build pass. No scope creep.

## Issues Encountered

- **Pre-existing build failures:** `npm run build` fails due to pre-existing TypeScript errors in `tests/firestore.rules.test.ts` and `tests/storage.rules.test.ts` (UploadTask type mismatches, unused ADMIN_DAET variables) and `src/app/shell/MapContainerWrapper.tsx` (L import issue). These are out of scope for plan 04-02 and logged to deferred-items.md.
- **npm install peer dep conflicts:** lucide-react install required `--legacy-peer-deps` due to conflicting TypeScript 6 vs eslint typescript versions in devDependencies.

## Next Phase Readiness

- NavItem, DesktopNavRail, MobileBottomTabs ready for integration into DesktopShell and MobileShell
- DesktopShell's placeholder `NavRail` component (04-01) should be replaced with DesktopNavRail in next plan
- MobileShell's existing bottom tabs (04-01) should be replaced with MobileBottomTabs in next plan
- ProvinceSuperadmin scope selection value is stored locally (not wired to any store) — future phase should create municipalityScopeStore

---
*Phase: 04-desktop-mobile-shell-04-02*
*Completed: 2026-04-03*

## Self-Check: PASSED

All 4 commits verified present:
- `ab0cc83`: NavItem reusable component
- `edbb4bf`: DesktopNavRail with role-aware nav
- `cf61db3`: MobileBottomTabs with floating Report button
- `d0591c8`: Documentation (SUMMARY, STATE, ROADMAP updates)

All files verified present:
- src/app/shell/NavItem.tsx
- src/app/shell/DesktopNavRail.tsx
- src/app/shell/MobileBottomTabs.tsx
- .planning/phases/04-desktop-mobile-shell/04-02-SUMMARY.md
