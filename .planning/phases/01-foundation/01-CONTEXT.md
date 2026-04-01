# Phase 1: Foundation - Context

**Gathered:** 2026-04-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 1 delivers a running project scaffold with Firebase connected, tooling configured, and basic shell architecture that renders. This is the foundation all subsequent phases build on. No business logic is implemented here — just the platform that enables everything else.

**Phase 1 delivers:**
1. Vite + React 18 + Tailwind CSS + TypeScript project building and running
2. Firebase initialized and connected to `bantayogalert` project
3. Vitest + Playwright configured with base test infrastructure
4. GitHub Actions CI pipeline (lint → typecheck → test → build)
5. Firebase emulator configuration
6. DesktopShell (stub), MobileShell (stub), and App entry point rendering
7. Initial Firestore and Storage security rules deployed to emulator
8. SEC-05 and SEC-06 requirements satisfied (Storage rules scaffold)

</domain>

<decisions>
## Implementation Decisions

### Firebase Project Setup
- **D-01:** Connect to existing Firebase project `bantayogalert` (project ID confirmed)
- **D-02:** Firebase config stored in `src/config/firebase.ts` using `import.meta.env` variables from `.env`
- **D-03:** Firebase services used: Auth, Firestore, Storage, Cloud Functions, Cloud Messaging, Hosting

### Tooling & DevOps
- **D-04:** TypeScript: `strict: true` + `noUncheckedIndexedAccess: true` + `noUnusedLocals: true` + `noUnusedParameters: true`
- **D-05:** Playwright: full multi-browser suite (Chromium + Firefox + WebKit)
- **D-06:** GitHub Actions CI pipeline: ESLint → `tsc --noEmit` → vitest → playwright → vite build
- **D-07:** Firebase Emulator: standard ports (8080 Firestore, 5001 Functions, 9199 Auth, 4000 Emulator UI)

### Shell Architecture
- **D-08:** DesktopShell stub: minimal NavRail placeholder + MapCanvas placeholder + RightModal placeholder, all rendering in App.tsx
- **D-09:** MobileShell stub: BottomTab with placeholder Feed, Map, Alerts, Profile screens
- **D-10:** Shell stubs include Phase 4 marker comments indicating where full implementation replaces stubs

### src/ Structure
- **D-11:** Flat `src/` structure: `src/components/`, `src/hooks/`, `src/utils/`, `src/lib/`, `src/services/`, `src/types/`, `src/data/`, `src/config/`
- **D-12:** Phase 4 or later migrates to feature-based if complexity warrants it

### Firebase Configuration (for reference in downstream phases)
- apiKey: `AIzaSyDs2ldZL81eralUmvkVTwaaw_O-FSLTtWI`
- authDomain: `bantayogalert.firebaseapp.com`
- projectId: `bantayogalert`
- storageBucket: `bantayogalert.firebasestorage.app`
- messagingSenderId: `491465378559`
- appId: `1:491465378559:web:108a5dee3545c61a2c5aca`

### Claude's Discretion
- Emulator vs production Firestore/Auth initialization strategy — use emulator in dev mode
- Exact directory file counts and naming within `src/components/` subdirs (common, layout, map, feed, etc.)
- Specific Tailwind color variable values (decided by design system)
- Exact Playwright test file locations and names (standard `tests/` or per-feature)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Specs
- `./SPEC.md` — Full technical specification; all domain decisions, Firestore data model, workflow states, and architecture rules live here
- `./CLAUDE.md` — Project guide; defines preferred stack, delivery strategy, and quality scorecard
- `./PROJECT.md` — Core value, active requirements, constraints, and key architectural decisions
- `./.planning/REQUIREMENTS.md` — Full REQ-ID traceability table (SEC-05, SEC-06 are Phase 1 requirements)
- `./.planning/ROADMAP.md` — Phase 1 goal and success criteria

### Phase 1 Specific
- `./.planning/phases/01-foundation/01-CONTEXT.md` — This file

### No external specs — requirements fully captured in decisions above

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- None yet — greenfield project. Phase 1 creates the assets subsequent phases will use.

### Established Patterns
- None yet — patterns will be established in Phase 1 and must be respected by later phases.

### Integration Points
- `src/main.tsx` — React 18 entry point
- `src/App.tsx` — Root component where shell routing lives (Phase 1 placeholder, Phase 4 real routing)
- Firebase initialization is the first external service call; all domain code depends on it being available

</code_context>

<specifics>
## Specific Ideas

- Firebase project ID: `bantayogalert` (already active, confirmed by user)
- Storage rules must validate: upload path format (`media/{userId}/{reportId}/{uuid}.{ext}`), MIME types (`jpeg/png/webp/mp4`), and file size (5MB/file, 10MB/report total) — SEC-05 requirement
- Custom claims (role, municipality) set exclusively by privileged Cloud Function — never client-side — SEC-06 requirement
- All 12 municipality codes: `basud`, `daet`, `josepanganiban`, `labo`, `mercedes`, `paracale`, `sanlorenzo`, `sanvicente`, `talisay`, `vinzales`, `capalonga`, `staelena`

</specifics>

<deferred>
## Deferred Ideas

None — all Phase 1 decisions were captured in this discussion.

</deferred>

---

*Phase: 01-foundation*
*Context gathered: 2026-04-01*
