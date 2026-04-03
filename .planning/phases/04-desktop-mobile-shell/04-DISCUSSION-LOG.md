# Phase 4: Desktop & Mobile Shell - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-03
**Phase:** 04-desktop-mobile-shell
**Areas discussed:** Desktop shell architecture, Mobile shell strategy, Map stability

---

## Desktop Shell Architecture

| Option | Description | Selected |
|--------|-------------|----------|
| Sibling layout (map + drawer both children of DesktopShell) | MapContainer and WorkspaceDrawer as siblings, drawer state in DesktopShell | ✓ |
| Nested layout (drawer inside map) | Drawer as child of map — risks map remount on drawer toggle | |

**User's choice:** Sibling layout (D-55 through D-57)
**Notes:** Map stability is non-negotiable per PROJECT.md. Sibling architecture ensures MapContainer never re-renders due to drawer state changes.

---

## Mobile Shell Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Bottom tab bar with CSS display:none/block for map | Map preserved via CSS, not unmount | ✓ |
| Conditional rendering (unmount map on tab switch) | Would cause map state loss | |

**User's choice:** CSS display:none/block preservation (D-63 through D-66)
**Notes:** Mobile shell uses bottom tabs (Feed, Map, Report, Alerts, Profile). Report = full-screen modal. No admin tab separate from citizen tabs.

---

## Navigation Rail Items

| Option | Description | Selected |
|--------|-------------|----------|
| Role-aware nav items via useAuth() | Citizen: Map/Feed/Alerts/Profile/Report; Admin adds Dashboard/Contacts/Analytics/Audit | ✓ |
| Static nav (same items for all roles) | Would show inaccessible routes | |

**User's choice:** Role-aware nav via useAuth() (D-58, D-59)
**Notes:** ProvincialSuperadmin sees all municipalities with scope selector at top of rail.

---

## Map Stability

| Option | Description | Selected |
|--------|-------------|----------|
| useRef guard to prevent double-initialization in Strict Mode | Pattern already in TestMap.tsx | ✓ |
| No guard (relies on React avoiding double-mount) | Would cause Leaflet initialization errors | |

**User's choice:** useRef guard (D-67, D-68)
**Notes:** Map preserves viewport when drawer opens/closes. invalidateSize() called on transitionend.

---

## Claude's Discretion

- Icon library: Lucide React (tree-shakeable, consistent stroke weight)
- Breakpoint: 768px/1280px (no tablet layout)
- Focus trapping: focus-trap-react or custom
- Drawer animation: CSS transform + transition (no animation library)
- Auth routes: outside shell (post-auth only)
