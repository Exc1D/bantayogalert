# Bantayog Alert — Architectural Decisions

## Phase 1 Decisions

### Tailwind CSS v4
**Decision**: Used Tailwind CSS v4 with `@tailwindcss/vite` plugin and `@theme` directive for design tokens.
**Rationale**: v4 uses a new CSS-first configuration approach — no `tailwind.config.js` needed.
**Trade-off**: Newer ecosystem, fewer templates available.

### Zustand over Redux/Jotai
**Decision**: Zustand for global UI state management.
**Rationale**: Lightweight (2KB), minimal boilerplate, works well with React Query for async state.
**Alternative considered**: Redux Toolkit — heavier but more mature.

### Firebase SDK Singleton Pattern
**Decision**: Module-level singleton getters (`getFirebaseApp()`, `getFirebaseAuth()`, etc.) in `src/firebase/config.ts`.
**Rationale**: Prevents multiple Firebase app instances during hot reloads.
**Alternative**: React context — adds unnecessary Provider nesting.

### verbatimModuleSyntax
**Decision**: Kept `verbatimModuleSyntax: true` in tsconfig.app.json.
**Rationale**: Enforces explicit `import type` for type-only imports, improves build clarity.
**Impact**: Required `type` keyword on all Firebase type imports.

## Pending Decisions (Phase 2+)

### Coordinate Precision Strategy
Approximate location in public docs (reduced precision ~100m), exact in `report_private`.
**Status**: SPECS.md defined, implementation pending Phase 2/5.

### Supercluster vs react-leaflet-markercluster
Map marker clustering approach not yet chosen.
**Status**: Deferred to Phase 6 (Realtime Map & Feed).

### Charting Library for Analytics
Recharts vs Chart.js — not chosen yet.
**Status**: Deferred to Phase 11 (Analytics).
