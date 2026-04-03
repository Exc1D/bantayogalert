# Phase 4: Desktop & Mobile Shell - Context

**Gathered:** 2026-04-03
**Status:** Ready for planning

<domain>
## Phase Boundary

The app shell renders correctly on desktop (map-first command center) and mobile (feed-first mini social app) with persistent map stability. Phase 4 establishes the layout architecture that all subsequent phases (report submission, map/feed, triage) build inside.

**Delivers:**
- DesktopShell: left nav rail + Leaflet map + 480px right workspace drawer (≥1280px)
- MobileShell: bottom tab bar with Feed/Map/Report/Alerts/Profile (≤768px)
- MapContainer never remounts when drawer opens/closes (sibling layout architecture)
- Leaflet `invalidateSize()` called after drawer CSS transition ends
- React 18 Strict Mode compatibility (ref guard prevents double-mount)
- Role-aware navigation items (citizen vs municipal_admin vs provincial_superadmin)
- Focus trapping and Escape key handling in overlays

**Constraints (non-negotiable from prior phases):**
- React 18.3.28, react-leaflet 4.2.1, Tailwind CSS 3.4.17
- `MapContainer` mounted as sibling to drawer (never child) — D-01, D-02 from PROJECT.md
- Dark mode: `class` strategy on `<html>` (D-20)
- ProtectedRoute and AdminRoute already exist at `src/lib/router/guards.tsx`
- AuthProvider wraps App — auth state available throughout shell
</domain>

<decisions>
## Implementation Decisions

### Desktop Shell Architecture
- **D-55:** `DesktopShell` component at `src/app/shell/DesktopShell.tsx` — renders at ≥1280px viewport only
- **D-56:** Sibling layout: `MapContainer` and `WorkspaceDrawer` are children of `DesktopShell`, not nested. Drawer state managed in `DesktopShell` via `useState` — passed to drawer as props, map receives no drawer-related props
- **D-57:** `MobileShell` component at `src/app/shell/MobileShell.tsx` — renders at ≤768px viewport only. Use CSS `display: none/block` on map tab to preserve Leaflet instance, not conditional rendering

### Navigation Rail
- **D-58:** Desktop nav rail: vertical left rail, 64px wide collapsed, icons + labels visible
- **D-59:** Nav items role-aware via `useAuth()`:
  - Citizen: Map, Feed, Alerts, Profile, Report
  - MunicipalAdmin: adds Dashboard, Contacts, Analytics, Audit
  - ProvincialSuperadmin: sees all municipalities (scope selector at top of rail)

### Workspace Drawer
- **D-60:** Drawer slides in from right, 480px wide on desktop. CSS `transform: translateX()` transition
- **D-61:** `invalidateSize()` called on Leaflet map after drawer's `transitionend` event
- **D-62:** Drawer content panels: ReportDetail, ContactDetail, AnnouncementDetail, Settings (routed via drawer sub-route)

### Mobile Bottom Tabs
- **D-63:** Bottom tab bar: 5 tabs — Feed, Map, Report, Alerts, Profile. Icons + labels, fixed bottom
- **D-64:** Tab bar shows Report button prominently (center position, larger icon)
- **D-65:** Report submission: full-screen modal on mobile (slides up from bottom)
- **D-66:** Admin access on mobile: Profile tab → scroll down → Admin Panel section (no separate admin tab)

### Leaflet Map Stability
- **D-67:** `MapContainer` uses a `useRef` guard to prevent double-initialization in React 18 Strict Mode
- **D-68:** Map preserves viewport (center, zoom, selected markers) when drawer opens/closes

### Responsive Breakpoint
- **D-69:** Breakpoint at 768px/1280px. `DesktopShell` shown ≥1280px, `MobileShell` shown ≤768px. No hybrid "tablet" layout (out of scope for v1).

### Focus & Keyboard
- **D-70:** Focus trapping in drawer and modals using `focus-trap-react` or custom implementation
- **D-71:** Escape key closes active overlay (drawer or modal), returns focus to trigger element

### Auth Flow Integration
- **D-72:** Auth routes (/auth/login, /auth/register, /auth/profile) remain outside shell — shell is post-auth only
- **D-73:** Unauthenticated users redirected to /auth/login (existing ProtectedRoute behavior)

### Dark Mode
- **D-74:** Shell respects dark mode class on `<html>`. Tailwind `dark:` variants used throughout. D-20 dark mode strategy carried forward.

### Claude's Discretion
- Icon library: Lucide React (tree-shakeable, consistent stroke weight) — standard choice for React + Tailwind projects
- Nav rail collapse behavior: always expanded in v1 (collapse to icons-only is nice-to-have for Phase 12)
- Map tile provider: OpenStreetMap via react-leaflet (no paid tiles in v1)
- Drawer animation: CSS `transform` + `transition` (no animation library needed)
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Definition
- `.planning/CLAUDE.md` — Stack locked: React 18.3.28, react-leaflet 4.2.1, Tailwind 3.4.17, Firebase 12.x
- `.planning/PROJECT.md` — Core value, three-tier report, map stability via sibling layout, dark mode class strategy
- `.planning/REQUIREMENTS.md` §Desktop Shell + Mobile Shell — DSK-01 through DSK-07, MOB-01 through MOB-07, FM-09

### Prior Phase Context
- `.planning/phases/01-project-foundation-tooling/01-CONTEXT.md` — D-01 through D-20 (project structure, Tailwind, dark mode)
- `.planning/phases/02-domain-model-backend-contracts/02-CONTEXT.md` — D-21 through D-42 (types, schemas, state machine)
- `.planning/phases/03-auth-role-model/03-CONTEXT.md` — D-43 through D-54 (auth, custom claims, Firestore rules)

### Phase-Internal
- `.planning/ROADMAP.md` §Phase 4 — Success criteria (13 must-be-TRUE statements)
- `src/lib/router/guards.tsx` — Existing ProtectedRoute and AdminRoute (Phase 3)
- `src/app/providers.tsx` — Existing providers structure (Phase 1)
- `src/components/map/TestMap.tsx` — Existing Leaflet test map (Phase 1)
</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/map/TestMap.tsx` — Existing Leaflet map; contains MapContainer usage pattern to follow
- `src/lib/router/guards.tsx` — `ProtectedRoute`, `AdminRoute` — role-aware nav must use same `useAuth()` pattern
- `src/app/providers.tsx` — `AppProviders` wraps with QueryClient, Helmet; `DesktopShell` and `MobileShell` will be children of providers

### Established Patterns
- Feature-based structure: shell components go in `src/app/shell/` (new directory for this phase)
- Tailwind v3: `dark:` variants, `class` dark mode strategy (D-20)
- Zustand store pattern: sync UI state (drawer open/closed) goes in Zustand, not React state
- `src/app/router.tsx` — routes defined here; Phase 4 adds shell routes for /app/* and /admin/*

### Integration Points
- `src/App.tsx` — Phase 4 replaces placeholder AppLayout/AdminPanel with DesktopShell/MobileShell; AuthProvider already wraps here
- Shell routes added to `src/app/router.tsx` — /app/* and /admin/* sub-routes
- Nav rail items click → workspace drawer opens with panel content (not navigation)
- Leaflet map reads municipality GeoJSON from `/public/data/municipalities.geojson` (seeded Phase 2)
</code_context>

<specifics>
## Specific Ideas

No user-provided UI references. Phase 4 establishes the layout shell — downstream phases fill in the actual content (report feed, map pins, etc.). Aesthetic decisions (colors, spacing) follow existing Tailwind theme from Phase 1.
</specifics>

<deferred>
## Deferred Ideas

None — Phase 4 scope stayed well-bounded to shell layout only.

### Reviewed Todos (not folded)
None — no pending todos matched Phase 4 scope.
</deferred>
