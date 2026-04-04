# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Bantayog Alert** is a disaster reporting and emergency coordination platform for Camarines Norte, Philippines. It has three user roles:
- **Citizens**: Submit emergency reports, track status, view verified incidents
- **Municipal Admins**: Triage/verify reports within their municipality boundary
- **Provincial Superadmins**: Province-wide oversight

Core principle: Municipality boundary enforcement is server-side (Firestore rules + Cloud Functions) — never client-only filtering.

## Commonly Used Commands

```bash
# Development
npm run dev              # Start Vite dev server
npm run build            # Production build (tsc -b && vite build)
npm run lint             # ESLint check
npm run format           # Prettier format

# Testing
npm run test             # Vitest unit tests
npm run test:ui          # Vitest with UI browser

# Firebase Emulators (requires .env.local with emulator config)
npm run emulators        # Start all emulators (auth, firestore, storage, functions)
firebase emulators:start --project demo-bantayogalert

# Playwright
npx playwright test      # Run E2E tests
npx playwright test --ui # Interactive E2E testing
```

## Tech Stack

| Layer | Technology | Key Constraint |
|-------|------------|----------------|
| UI | React 18.3.1 + Vite + Tailwind CSS 3.4.17 | **Stay on Tailwind v3** — v4 is incompatible |
| Mapping | react-leaflet 4.2.1 + Leaflet 1.9.4 | **v4 requires React 18** — v5 requires React 19 |
| State | TanStack Query 5.x + Zustand 5.x | React Query for async, Zustand for sync UI state |
| Routing | React Router 6.5.0 | **Stay on v6** — v7 has breaking changes |
| Backend | Firebase (Firestore, Auth, Storage, Functions) | Functions use Node 20 |

**Critical conflicts to avoid:**
- `react-leaflet v5` with React 18 (breaks)
- `Tailwind CSS v4` (incompatible with v3 config approach)
- `React Router v7` (different API from v6)

## Architecture

### Three-Tier Report Model
Reports split across three Firestore collections for security:
- `reports/` — Public tier (citizen-visible, verified-only)
- `report_private/` — Owner + admin tier (exact location, contact info)
- `report_ops/` — Admin-only tier (workflow state, triage, routing)

### Map Stability Requirement
The `MapContainer` (Leaflet) must **never remount** when drawer/modal state changes. This is achieved via sibling layout architecture:
- Map and workspace drawer are **siblings** in the component tree, not parent-child
- Drawer slides over map without unmounting it
- `invalidateSize()` called on drawer's `transitionend` event

### Server-Side Municipality Scoping
Every write to sensitive collections goes through Cloud Functions (not direct Firestore writes from client). Scoping enforced at three layers:
1. Firebase Auth custom claims (`role`, `municipalityCode`)
2. Firestore security rules
3. Cloud Function authorization checks

## Project Structure

```
src/
├── app/                    # App shell: router, providers, desktop/mobile shells
│   ├── App.tsx             # Root component
│   ├── router.tsx          # Route definitions
│   ├── providers.tsx       # Context providers (Auth, Query, etc.)
│   ├── DesktopShell.tsx    # Desktop layout (nav rail + map + drawer)
│   └── MobileShell.tsx     # Mobile layout (bottom tabs)
├── lib/
│   ├── auth/               # Auth context, hooks, Firebase setup
│   ├── firebase/           # Firebase SDK initialization
│   └── geo/                # Municipality data, geohash utilities
├── components/             # Shared UI components
│   └── map/                # Leaflet map components (TestMap.tsx)
├── features/               # Domain-scoped modules (future)
└── types/                  # TypeScript types and Zod schemas
    ├── report.ts           # ReportPublic, ReportPrivate, ReportOps
    ├── workflow.ts         # WorkflowState, VALID_TRANSITIONS map
    ├── status.ts           # PublicStatus, OwnerStatus
    └── user.ts             # User role types

functions/src/              # Cloud Functions (Node 20)
├── index.ts                # Function exports (currently stub)
└── types/
    └── report.ts           # Report types for Cloud Functions

firestore.rules              # Firestore security rules
storage.rules                # Storage security rules
firestore.indexes.json      # Composite Firestore indexes
```

## Key Patterns

### Workflow State Machine
Reports follow a strict state machine (`workflow.ts`):
- `pending → verified/rejected`
- `verified → dispatched/resolved`
- `dispatched → acknowledged/in_progress/resolved`
- `acknowledged → in_progress/resolved`
- `in_progress → resolved/dispatched` (reroute)

Invalid transitions are rejected by Cloud Functions with `failed-precondition`.

### Three-Layer Status Mapping
Every workflow state maps to three citizen-facing labels:
1. **Internal** (`internalState`): `pending`, `verified`, `dispatched`, etc.
2. **Owner** (`ownerStatus`): "Submitted", "Verified", "Responders Notified", etc.
3. **Public** (`publicStatus`): Only visible after verification

### Optimistic Concurrency
`report_ops` documents have a `version` field. Triage operations must provide the expected version; mismatches return `failed-precondition` to prevent conflicting admin actions.

## Firebase Configuration

- **Emulator ports**: Auth=9099, Firestore=8080, Storage=9199, Functions=5001, Emulator UI=4000
- **Emulator project**: `demo-bantayogalert`
- **Functions runtime**: Node 20 (`nodejs20`)
- **Storage rules**: Restrict to JPEG/PNG/WebP, max 10MB for reports, 2MB for avatars

## Testing Strategy

| Type | Tool | Location |
|------|------|----------|
| Unit/Component | Vitest + RTL | `src/**/*.test.ts*` |
| Integration | Vitest + Firebase Emulator | `tests/integration/` |
| E2E | Playwright | `tests/e2e/` |
| Security Rules | @firebase/rules-unit-testing | `tests/rules/` |

## GSD Workflow

Before making file changes, use GSD commands to maintain planning context:
- `/gsd:quick` — Small fixes, doc updates
- `/gsd:debug` — Bug investigation
- `/gsd:execute-phase` — Planned phase work

The `.planning/` directory contains phase plans and research. Do not edit code outside a GSD workflow unless explicitly requested.
