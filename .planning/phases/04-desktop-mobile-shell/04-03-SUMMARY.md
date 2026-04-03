---
phase: 04-desktop-mobile-shell
plan: '03'
subsystem: ui
tags: [leaflet, react, focus-trap, keyboard, shell]

# Dependency graph
requires:
  - phase: '04-01'
    provides: DesktopShell, MobileShell, WorkspaceDrawer, NavRail
provides:
  - Leaflet MapContainer with React 18 Strict Mode ref guard
  - MapRefContext for map instance sharing across shell components
  - focus-trap-react focus trapping in drawer
  - Escape key handler closing drawer and returning focus to trigger
  - ShellRouter viewport-based shell switching
affects:
  - Phase 04 (remaining plans)
  - Phase 05+ (report feed, map pins, triage UI)

# Tech tracking
tech-stack:
  added: [focus-trap-react]
  patterns:
    - Ref guard pattern for Leaflet in React 18 Strict Mode
    - React context for map instance sharing (MapRefContext)
    - Viewport-based shell switching via window.matchMedia

key-files:
  created:
    - src/app/shell/MapContainerWrapper.tsx
    - src/app/shell/ShellRouter.tsx
  modified:
    - src/app/shell/DesktopShell.tsx
    - src/app/shell/WorkspaceDrawer.tsx
    - src/App.tsx

key-decisions:
  - "MapContainerWrapper uses module-level MapRefContext with stable ref object"
  - "WorkspaceDrawer reads mapRef via useMap() context instead of prop drilling"
  - "ShellRouter uses window.matchMedia('(min-width: 1280px)') for desktop/mobile switch"

patterns-established:
  - "Leaflet map lifecycle managed via useEffect with guard clause (no deps array)"
  - "Focus trap wraps drawer conditionally (active={drawerOpen})"
  - "invalidateSize only called after mapReady guard prevents null map access"

requirements-completed: [DSK-05, DSK-07, FM-09]

# Metrics
duration: 6min
completed: 2026-04-03
---

# Phase 4 Plan 3: Map Stability & Shell Router Summary

**Leaflet map stability via Strict Mode ref guard, focus-trap-react keyboard handling, and viewport-based ShellRouter**

## Performance

- **Duration:** 6 min
- **Started:** 2026-04-03T14:32:36Z
- **Completed:** 2026-04-03T14:38:00Z
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments

- MapContainerWrapper with Strict Mode ref guard prevents Leaflet double-initialization
- MapRefContext shares map instance across DesktopShell and WorkspaceDrawer
- focus-trap-react traps focus in drawer when open; Escape closes and returns focus to trigger
- ShellRouter switches between DesktopShell and MobileShell based on 1280px viewport breakpoint
- App.tsx routes /app/* and /admin/* through ShellRouter with auth guards

## Task Commits

Each task was committed atomically:

1. **Task 1: MapContainerWrapper with Strict Mode ref guard** - `103db30` (feat)
2. **Task 2: Focus trapping and Escape key in WorkspaceDrawer** - `69d504c` (feat)
3. **Task 3: ShellRouter and App.tsx wiring** - `7e11c15` (feat)

## Files Created/Modified

- `src/app/shell/MapContainerWrapper.tsx` - Leaflet map with ref guard, MapRefContext provider, useMap() hook
- `src/app/shell/ShellRouter.tsx` - Viewport-based shell switcher (>=1280px DesktopShell, else MobileShell)
- `src/app/shell/DesktopShell.tsx` - Updated to use MapContainerWrapper instead of raw MapContainer
- `src/app/shell/WorkspaceDrawer.tsx` - Updated to use useMap() context; added focus-trap-react, Escape key, focus return
- `src/App.tsx` - Replaced AppLayout/AdminPanel placeholders with ShellRouter on /app/* and /admin/* routes

## Decisions Made

- MapRefContext uses a stable ref object so WorkspaceDrawer always accesses current map instance
- DesktopShell passes no props to WorkspaceDrawer — mapRef accessed via useMap() context
- focus-trap-react FocusTrap wraps drawer div conditionally (active={drawerOpen})
- MapContainerWrapper cleanup sets mapRef.current = null to allow re-initialization if needed

## Deviations from Plan

**1. [Rule 2 - Missing Critical] DesktopShell updated to use MapContainerWrapper**
- **Found during:** Task 1 (MapContainerWrapper creation)
- **Issue:** Plan listed DesktopShell as already complete in 04-01 but it still used raw MapContainer; without switching to MapContainerWrapper the mapRef context would never be populated
- **Fix:** Updated DesktopShell to wrap WorkspaceDrawer inside MapContainerWrapper
- **Files modified:** src/app/shell/DesktopShell.tsx
- **Verification:** npm run build passes for modified files
- **Committed in:** 103db30

**2. [Rule 3 - Blocking] Fixed Leaflet import type vs value**
- **Found during:** Task 1 (MapContainerWrapper build verification)
- **Issue:** `import type L from 'leaflet'` caused "L cannot be used as a value" TypeScript errors
- **Fix:** Changed to `import L from 'leaflet'` (value import, not type-only)
- **Files modified:** src/app/shell/MapContainerWrapper.tsx
- **Verification:** npm run build passes
- **Committed in:** 103db30

---

**Total deviations:** 2 auto-fixed (2 missing critical/blocking)
**Impact on plan:** Both auto-fixes essential for correct map lifecycle and build success. No scope creep.

## Issues Encountered

- `focus-trap-react` install required `--legacy-peer-deps` flag due to peer dependency resolution conflict

## Next Phase Readiness

- Shell architecture complete: DesktopShell + MobileShell + ShellRouter all wired
- Map stability established — invalidatesize() called on drawer transitionend
- Focus/keyboard handling in overlays complete
- Phase 04-02 (NavRail with role-aware items) can proceed independently
- Phase 05 (report feed) can build inside the shell content area

---
*Phase: 04-desktop-mobile-shell*
*Completed: 2026-04-03*
