# Bantayog Alert — Project Memory

## Current Status
- **Phase 1: Project Foundation** — ✅ COMPLETE (2026-04-03)
- **Phase 2: Domain Model & Backend Contracts** — PENDING

## Phase 1 Exit Criteria — All Met
- ✅ `npm run build` — passes (204KB bundle, PWA generated)
- ✅ `npm run test` — passes (3 unit tests)
- ✅ Firebase emulator config in place
- ⚠️ Playwright smoke test — configured but not executed

## Phase 1 Files Created
- `vite.config.ts` — React, Tailwind v4, PWA, path aliases
- `tsconfig.app.json` — strict mode, `@/` path alias
- `firebase.json` — emulator + hosting config
- `firestore.rules`, `storage.rules`, `firestore.indexes.json` — placeholder rules
- `.env.{development,staging,production}` — Firebase config
- `src/firebase/config.ts`, `src/firebase/emulator.ts` — Firebase SDK
- `src/app/router.tsx`, `src/app/App.tsx` — React Router
- `src/shared/lib/store.ts` — Zustand UI state
- `src/index.css` — Tailwind v4 design tokens
- `vitest.config.ts`, `playwright.config.ts`
- `.github/workflows/ci.yml`
- `tests/unit/example.test.ts`, `tests/e2e/smoke.spec.ts`
- `public/robots.txt`

## Phase 2 Deliverables (pending)
1. TypeScript types for all entities (§5)
2. Zod validation schemas
3. Enum definitions
4. State machine implementation
5. Three-layer status mapping
6. Cloud Functions stubs
7. Firestore rules skeleton
8. Storage rules
9. Reference data (municipalities, barangays)
10. Municipality GeoJSON
11. Unit tests for state machine

## Project Root
`/home/exxeed/dev/projects/bantayogalert`

## Tech Stack Notes
- Tailwind CSS v4 uses `@tailwindcss/vite` plugin and `@theme` directive
- Firebase emulators connect via `VITE_USE_EMULATORS=true` env flag
- PWA Workbox caches OSM tiles with CacheFirst (500 tile limit)
