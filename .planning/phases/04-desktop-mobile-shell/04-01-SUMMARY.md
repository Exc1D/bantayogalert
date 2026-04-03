---
phase: '04'
plan: '01'
subsystem: shell
tags: [layout, zustand, react-leaflet, desktop, mobile]
dependency_graph:
  requires: []
  provides: [DSK-01, DSK-03, DSK-04, DSK-06, DSK-07, MOB-01, MOB-02, MOB-03]
  affects: [04-02, 04-03, 05, 06]
tech_stack:
  added: [zustand@5.x]
  patterns: [sibling-layout, zustand-ui-store, css-display-preservation]
key_files:
  created:
    - src/stores/uiStore.ts
    - src/app/shell/DesktopShell.tsx
    - src/app/shell/MobileShell.tsx
    - src/app/shell/WorkspaceDrawer.tsx
decisions: []
metrics:
  duration: ~
  completed: '2026-04-03'
  tasks: 4
  files: 4
---

# Phase 04 Plan 01: Desktop & Mobile Shell Summary

## One-liner

Scaffolded desktop and mobile shell layouts with sibling architecture preserving Leaflet map stability, Zustand-managed drawer state, and CSS-display-preserved map instances.

## Completed Tasks

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Zustand uiStore | `ca6218f` | src/stores/uiStore.ts |
| 2 | DesktopShell | `8b2f7b7` | src/app/shell/DesktopShell.tsx |
| 3 | MobileShell | `b2b6aa9` | src/app/shell/MobileShell.tsx |
| 4 | WorkspaceDrawer | `d7374a6` | src/app/shell/WorkspaceDrawer.tsx |

## What Was Built

### src/stores/uiStore.ts
Zustand store managing ephemeral UI state:
- `drawerOpen: boolean` + `setDrawerOpen`
- `activePanel: ActivePanel` + `setActivePanel` (auto-opens drawer when panel set)
- `activeTab: ActiveTab` + `setActiveTab`

### src/app/shell/DesktopShell.tsx
Desktop layout at >=1280px:
- Three direct children as siblings (NavRail + MapContainer + WorkspaceDrawer)
- MapContainer receives NO drawer props (sibling architecture)
- `useState` mounted flag for client-only rendering

### src/app/shell/MobileShell.tsx
Mobile layout at <=768px:
- Bottom tab bar (Feed/Map/Report/Alerts/Profile) fixed at 64px
- Map tab uses `hidden`/`block` CSS classes to preserve Leaflet instance
- Map fills `h-[calc(100vh-64px)]`

### src/app/shell/WorkspaceDrawer.tsx
480px right drawer:
- `transform: translateX(100%)` when closed, `translateX(0)` when open
- CSS transition 300ms ease-in-out
- `transitionend` → `mapRef.current?.invalidateSize()`
- Reads state from uiStore (Zustand)
- Backdrop overlay, close button, `aria-modal` dialog

## Deviations from Plan

None - plan executed exactly as written.

## Deferred Issues

None.

## Self-Check

- [x] All 4 files exist at specified paths
- [x] All TypeScript compiles without errors (new files)
- [x] DesktopShell has 3 sibling children (NavRail, MapContainer, WorkspaceDrawer)
- [x] MobileShell uses Tailwind hidden/block for map tab preservation
- [x] WorkspaceDrawer reads from uiStore and calls invalidateSize on transitionend
- [x] Drawer state in Zustand, not local useState passed as props
