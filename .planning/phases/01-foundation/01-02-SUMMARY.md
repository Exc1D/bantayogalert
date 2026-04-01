---
phase: 01-foundation
plan: '02'
subsystem: infra
tags: [firebase, firestore, storage, cloud-functions, security-rules, emulator]

# Dependency graph
requires: []
provides:
  - Firebase SDK initialized in app with environment-based config
  - Firebase emulator suite configured (Auth, Firestore, Storage, Functions, UI)
  - Firestore security rules with municipality scoping scaffold
  - Storage security rules with SEC-05 compliance (path, MIME type, size validation)
  - Cloud Functions project scaffolded with setCustomClaims (SEC-06)
affects: [02-auth-role, 03-reporting-domain, 04-desktop-map]

# Tech tracking
tech-stack:
  added: [firebase, firebase-admin, firebase-functions, @types/node]
  patterns:
    - Environment-based Firebase config via import.meta.env
    - Singleton pattern for Firebase app initialization
    - Municipality scope helpers in Firestore rules
    - Server-side-only custom claims setting via Cloud Function

key-files:
  created:
    - src/config/firebase.ts - Firebase SDK initialization
    - firebase.json - Emulator configuration
    - firestore.rules - Security rules with municipality scoping
    - storage.rules - SEC-05 compliant upload rules
    - firestore.indexes.json - Firestore indexes
    - functions/src/index.ts - Cloud Functions with setCustomClaims
    - functions/package.json - Functions dependencies
    - functions/tsconfig.json - Functions TypeScript config
  modified:
    - .env.example - Firebase credentials
    - package.json - Emulator scripts added

key-decisions:
  - "Firebase SDK uses singleton pattern via getFirebaseApp() to prevent duplicate initialization"
  - "All Firebase services accessed via typed getter functions (getAuth, getFirestore, etc.)"
  - "Storage rules enforce SEC-05: path media/{userId}/{reportId}/{uuid}.{ext}, MIME jpeg/png/webp/mp4, 5MB/file"
  - "setCustomClaims is server-side only (SEC-06): validates role and municipality codes before setting claims"
  - "Emulator uses singleProjectMode: true to avoid project isolation issues"

patterns-established:
  - "Config from environment: all Firebase env vars use VITE_ prefix for Vite compatibility"
  - "Cloud Functions TypeScript: commonjs module, ES2020 target, strict mode enabled"
  - "Firestore rules: helper functions for isAuthenticated, isRole, hasValidMunicipalityScope"

requirements-completed: [SEC-05, SEC-06]

# Metrics
duration: 5min
completed: 2026-04-01
---

# Phase 01 Plan 02: Firebase Initialization Summary

**Firebase SDK initialized with environment-based config, emulator suite configured on standard ports, Storage rules and Cloud Functions scaffolded with SEC-05 and SEC-06 compliance**

## Performance

- **Duration:** 5 min
- **Started:** 2026-04-01T13:40:00Z
- **Completed:** 2026-04-01T13:45:00Z
- **Tasks:** 3
- **Files created/modified:** 12

## Accomplishments

- Firebase SDK installed and initialized with singleton pattern
- Firebase emulator suite configured (Firestore 8080, Auth 9099, Storage 9199, Functions 5001, UI 4000)
- Firestore security rules scaffolded with municipality scoping helpers
- Storage security rules enforce SEC-05 (path format, MIME types, file size limits)
- Cloud Functions project scaffolded with SEC-06-compliant setCustomClaims function
- All TypeScript compiles without errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Install Firebase dependencies and create config** - `3c1a294` (feat)
2. **Task 2: Create Firebase emulator configuration** - `b6ffc26` (feat)
3. **Task 3: Scaffold Cloud Functions project with setCustomClaims** - `6169850` (feat)

## Files Created/Modified

- `src/config/firebase.ts` - Firebase SDK initialization with singleton pattern
- `.env.example` - Updated with bantayogalert Firebase project credentials
- `firebase.json` - Emulator configuration (ports: 8080 Firestore, 9099 Auth, 9199 Storage, 5001 Functions, 4000 UI)
- `firestore.rules` - Security rules with municipality scoping scaffold
- `storage.rules` - SEC-05 compliant rules (path: media/{userId}/{reportId}/{uuid}.{ext}, MIME: jpeg/png/webp/mp4, 5MB/file)
- `firestore.indexes.json` - Empty indexes (field overrides)
- `package.json` - Added emulators:start and emulators:exec scripts
- `functions/src/index.ts` - Cloud Functions with setCustomClaims (SEC-06), setUserCustomClaims callable, pendingReportAutoReject and announcementExpiry placeholders
- `functions/package.json` - Functions dependencies (firebase-admin ^12.0.0, firebase-functions ^5.0.0)
- `functions/tsconfig.json` - TypeScript config (commonjs, ES2020, strict mode)
- `functions/.gitignore` - node_modules/, lib/, .env

## Decisions Made

- Used singleton pattern for Firebase app (getApps().length === 0 check) to prevent duplicate initialization in HMR scenarios
- Added `!` assertion on `getApps()[0]` due to `noUncheckedIndexedAccess` TypeScript setting
- Emulator uses `singleProjectMode: true` to prevent project isolation issues in development
- All 12 Camarines Norte municipality codes validated in setCustomClaims function

## Deviations from Plan

None - plan executed exactly as written.

## Auto-fixed Issues

**1. [Rule 1 - Bug] TypeScript noUncheckedIndexedAccess error on getApps()[0]**
- **Found during:** Task 1 (verification)
- **Issue:** `getApps()[0]` returns `FirebaseApp | undefined` due to `noUncheckedIndexedAccess: true` in tsconfig
- **Fix:** Added `!` assertion: `return getApps()[0]!` since we already confirmed length > 0
- **Files modified:** src/config/firebase.ts
- **Verification:** `npx tsc --noEmit` passes without errors
- **Committed in:** `3c1a294` (part of Task 1 commit)

## Issues Encountered

None.

## Next Phase Readiness

- Phase 2 (Auth & Role Model) can now implement AuthContext using getFirebaseAuth() and getFirebaseFirestore()
- Firestore rules scaffold in place; Phase 2 will expand with full user and report rules
- Cloud Functions ready for Phase 2 auth Cloud Function implementations

---
*Phase: 01-foundation*
*Plan: 02*
*Completed: 2026-04-01*
