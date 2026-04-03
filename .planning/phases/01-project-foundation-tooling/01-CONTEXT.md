# Phase 1: Project Foundation & Tooling - Context

**Gathered:** 2026-04-03
**Status:** Ready for planning

<domain>
## Phase Boundary

A production-ready project scaffold with working build, test, development tooling, and PWA shell. This phase establishes the foundation — no business logic, no Firebase data structures, no UI components beyond a minimal placeholder. All decisions here constrain later phases.

**Delivers:**
- Vite + React 18 + TypeScript + Tailwind CSS scaffold
- Firebase project configured with emulator support
- React Query + Zustand initialized (empty stores, no business logic)
- PWA service worker and manifest (installable app shell)
- Playwright smoke test + Vitest test runner
- GitHub Actions CI pipeline (build + test + emulators)
- Project folder structure and TypeScript/ESLint/Prettier conventions

**Constraints (non-negotiable from CLAUDE.md):**
- React 18.3.28 (NOT React 19 — react-leaflet v4 requires React 18)
- react-leaflet 4.2.1 (NOT v5 — v5 requires React 19)
- Tailwind CSS 3.4.17 (NOT v4 — v4 has breaking changes)
- React Router 6.5.0 (NOT v7 — v7 has breaking changes)
- Firebase SDK 12.x
- TanStack Query 5.x + Zustand 5.x
</domain>

<decisions>
## Implementation Decisions

### Project Structure — Feature-based (src/features/)
- **D-01:** Source code organized under `src/features/{feature}/` with co-located components, hooks, types, and queries — NOT flat `src/components/` or `src/pages/`. This keeps domain logic isolated as the app scales to 12 municipalities.
- **D-02:** Shared/UI layer at `src/components/ui/` (dumb presentation components) and `src/lib/` (utilities, Firebase helpers, constants).
- **D-03:** `src/app/router.tsx` defines React Router v6 routes. `src/app/providers.tsx` wraps the app with React Query + Zustand providers.
- **D-04:** TypeScript `paths` alias: `@/` → `src/` for clean imports (e.g., `@/components/ui/Button`).

### Firebase Project Setup — Single project with environment overlays
- **D-05:** Single Firebase project for development. `.env.local` holds dev Firebase config; `.env.production` holds production config. No separate dev/staging Firebase projects (overhead for v1).
- **D-06:** Firebase config loaded from environment variables via `src/lib/firebase/config.ts` — throws if any required key is missing at runtime.
- **D-07:** Firebase emulator suite configured via `firebase.json` with Auth, Firestore, Storage, and Functions emulators on default ports. Emulators started via `npm run emulators`.
- **D-08:** `firestore.rules` and `storage.rules` created as stub files in `/firestore/` and `/storage/` (rules will be written in Phase 3). `firebase.json` points to these paths.

### TypeScript Configuration
- **D-09:** `strict: true` in `tsconfig.json` — all strict checks enabled (noImplicitAny, strictNullChecks, strictFunctionTypes, etc.).
- **D-10:** `noUncheckedIndexedAccess: true` — arrays and objects must be accessed with guards until Phase 2 types are defined.
- **D-11:** `paths` alias `@/*` mapped to `src/*` in both `tsconfig.json` and `vite.config.ts`.

### PWA Configuration
- **D-12:** Workbox strategy: `CacheFirst` for static assets (JS, CSS, images, fonts), `NetworkFirst` for API/Firestore requests, `StaleWhileRevalidate` for municipality GeoJSON tiles during emergency scenarios.
- **D-13:** App manifest (`public/manifest.json`) includes icons at 192×192 and 512×512, `display: standalone`, `theme_color: #dc2626` (emergency/red), `background_color: #ffffff`.
- **D-14:** Service worker registered via `vite-plugin-pwa` with `registerType: 'prompt'` (user-initiated install, not forced).

### Test & CI Conventions
- **D-15:** Vitest for unit/integration tests. Test files co-located with source (`*.test.ts` / `*.test.tsx` next to source files).
- **D-16:** Playwright for smoke/E2E tests. Tests live in `tests/smoke/` — `home.spec.ts` verifies the shell renders without console errors.
- **D-17:** GitHub Actions CI pipeline: on push to `main` and PRs → `npm ci` → `npm run build` → `npm run test` → `npm run emulators:ci` (headless) → Playwright smoke test.

### Tailwind CSS
- **D-18:** Tailwind v3.4.17 with `postcss.config.js` and `tailwind.config.js` (NOT Tailwind v4 CSS-first approach). Content paths: `src/**/*.{ts,tsx}`.
- **D-19:** Custom theme extends Tailwind defaults with disaster/emergency color semantics: `severity-critical` (red-600), `severity-warning` (amber-500), `severity-info` (blue-500), `severity-clear` (green-500).
- **D-20:** Dark mode: `class` strategy (toggles via `class` on `<html>`), NOT `media` — emergency workers may prefer dark in low-light conditions.

### Claude's Discretion
- ESLint/Prettier config choices (rules, plugins, Prettier line length, etc.) — standard Vite/Eslint/Prettier ecosystem defaults with minimal overrides.
- Firebase emulator startup configuration (memory limits, port allocation).
- The placeholder app shell (what the root `App.tsx` renders) — a blank white page with the page title "Bantayog Alert" is sufficient for Phase 1 smoke test.

### Folded Todos
None — no pending todos matched Phase 1 scope.
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Definition
- `CLAUDE.md` — Full tech stack locked (React 18.3.28, react-leaflet 4.2.1, Tailwind 3.4.17, Firebase 12.x, TanStack Query 5.x, Zustand 5.x, React Router 6.5.0). Critical dependency conflict warnings MUST be respected.
- `.planning/PROJECT.md` — Project vision, core value, constraints, and key architectural decisions (three-tier report split, map sibling layout, pre-aggregated analytics, custom claims RBAC).
- `.planning/REQUIREMENTS.md` — All v1 requirements mapped to phases. Phase 1 covers PWA-01, PWA-02, PWA-05, PWA-06.

### Phase-Internal
- `.planning/ROADMAP.md` §Phase 1 — Success criteria that define "done" for Phase 1 (8 specific must-be-TRUE statements).

### Stack Research
- `.planning/research/STACK.md` — Stack recommendation rationale (if exists; may have been generated during roadmap creation).
</canonical_refs>

<code_context>
## Existing Code Insights

**This is a greenfield project — no source code exists yet.**

### Reusable Assets
None — Phase 1 creates the scaffold that all subsequent phases will build upon.

### Established Patterns
None yet — patterns will be established in Phase 1 and carried forward.

### Integration Points
- `src/app/providers.tsx` — Where React Query and Zustand are initialized; later phases add feature providers here.
- `src/app/router.tsx` — Where routes are defined; Phase 4 adds the desktop/mobile shell routes.
- `vite.config.ts` — Where vite-plugin-pwa is configured; later phases add PWA offline strategies.
- `firebase.json` — Where emulator configuration lives; Phase 3 adds security rules paths.

### Creative Options
- **Install prompt strategy**: `registerType: 'prompt'` (user controls when to install) vs `autoUpdate` (forces the new SW). D-14 selects `prompt` for user agency during emergencies.
</code_context>

<specifics>
## Specific Ideas

No specific UI/UX references or "I want it like X" moments for Phase 1. This phase is pure infrastructure — aesthetic choices are deferred to Phase 4 (Desktop & Mobile Shell) where the actual UI surfaces.

**One functional specificity:** The placeholder shell MUST render without any console errors (Error level). React Query and Zustand must be accessible from `window` or a test utility so Phase 2 can validate the providers are wired correctly.
</specifics>

<deferred>
## Deferred Ideas

None — Phase 1 scope is well-bounded.

### Reviewed Todos (not folded)
None — no todos were found for Phase 1 scope.
</deferred>

---

*Phase: 01-project-foundation-tooling*
*Context gathered: 2026-04-03*
