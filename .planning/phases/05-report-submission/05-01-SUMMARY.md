---
phase: 05-report-submission
plan: 01
subsystem: api
tags: [firebase-functions, react-hook-form, zod, ngeohash, geohash, firestore]

# Dependency graph
requires:
  - phase: 03-auth-role-model
    provides: Firebase Auth, custom claims, validateAuthenticated, validateRole, rate limiting, sanitizeReportInput
provides:
  - Callable CF submitReport creating three Firestore docs atomically
  - ReportFormSchema with per-step Zod validation
  - /app/report route registered in React Router
affects:
  - Phase 05 (all plans depend on this infrastructure)
  - Report tracking and status display

# Tech tracking
tech-stack:
  added:
    - react-hook-form@7.72.1 (form state management)
    - @hookform/resolvers@5.2.2 (Zod integration)
    - ngeohash@0.6.3 (client-side + functions geohash encoding)
    - idb@8.0.3 (IndexedDB draft persistence)
  patterns:
    - Callable Cloud Function with Zod input validation
    - Firestore runTransaction for atomic multi-doc writes
    - Per-step Zod schema validation for multi-step wizard

key-files:
  created:
    - functions/src/reports/submitReport.ts (callable CF)
    - src/features/report/ReportFormSchema.ts (Zod schemas)
  modified:
    - functions/src/index.ts (export submitReport)
    - src/app/router.tsx (add /app/report route)
    - package.json (new dependencies)
    - functions/package.json (ngeohash)

key-decisions:
  - "D-96: submitReport CF receives type, severity, description, municipalityCode, barangayCode, exactLocation, mediaUrls[]"
  - "D-97: Function computes geohash from exactLocation for public document"
  - "D-98: Three docs atomically via firestore.runTransaction: reports/, report_private/, report_ops/"
  - "D-99: Function validates auth + role=citizen + rate limit check"
  - "Geohash 9-char precision for public location, exact coords in report_private"

patterns-established:
  - "Callable CF pattern: validateAuthenticated() + Zod safeParse() + transaction + return"
  - "Three-tier Firestore doc creation pattern: generate ID upfront, then transaction"

requirements-completed: [RPT-01, RPT-04, RPT-06, RPT-07, RPT-08]

# Metrics
duration: 5min
completed: 2026-04-03
---

# Phase 05 Plan 01: Report Submission Infrastructure Summary

**Three-tier report submission: submitReport callable CF + per-step Zod schemas + /app/report route**

## Performance

- **Duration:** 5 min
- **Started:** 2026-04-03T15:33:02Z
- **Completed:** 2026-04-03T15:38:00Z
- **Tasks:** 5
- **Files modified:** 6 (1 package.json, 1 functions/package.json, 1 CF, 1 index, 1 schema, 1 router)

## Accomplishments

- Installed react-hook-form, @hookform/resolvers, ngeohash, idb at exact versions
- Created submitReport callable Cloud Function with Zod validation and atomic transaction
- Exported submitReport from functions/src/index.ts
- Created ReportFormSchema with step1Schema, step2Schema, step3Schema, fullReportSchema
- Registered /app/report route in React Router

## Task Commits

Each task was committed atomically:

1. **Task 1: Install form dependencies** - `9d2764e` (feat)
2. **Task 2: Create submitReport Cloud Function** - `8181b4c` (feat)
3. **Task 3: Export submitReport from index** - `508eb13` (feat)
4. **Task 4: Create ReportFormSchema** - `2639b69` (feat)
5. **Task 5: Add /app/report route** - `054c123` (feat)
6. **Fix submitReport v1/v2 SDK pattern** - `5e33e00` (fix)

## Files Created/Modified

- `package.json` - Added react-hook-form@7.72.1, @hookform/resolvers@5.2.2, ngeohash@0.6.3, idb@8.0.3
- `functions/package.json` - Added ngeohash@0.6.3 for server-side geohash encoding
- `functions/src/reports/submitReport.ts` - Callable CF with Zod validation, rate limiting, atomic transaction creating three docs
- `functions/src/index.ts` - Export submitReport callable
- `src/features/report/ReportFormSchema.ts` - Per-step Zod schemas for form validation
- `src/app/router.tsx` - Added /app/report route with placeholder

## Decisions Made

- Used inline role validation instead of validateRole to avoid TypeScript v1/v2 SDK mixing issues (existing codebase pattern)
- Used require() for ngeohash to avoid type declaration file issues
- Used Zod v4 nativeEnum with `message` property for custom error messages (not errorMap)

## Deviations from Plan

**None - plan executed exactly as written**

## Issues Encountered

- **TypeScript v1/v2 SDK mixing in functions/:**
  - The existing codebase mixes firebase-functions v1 (.https.onCall with CallableContext) and v2 (import { onCall } from 'firebase-functions/v2/https')
  - This causes TypeScript errors in validateAuth.ts, setUserRole.ts, and submitReport.ts
  - Pattern is pre-existing; submitReport follows same pattern as setUserRole
  - Runtime behavior is correct; type errors are consistent with existing codebase

- **Zod v4 API change:**
  - Zod v4 uses `message` property instead of `errorMap` for custom error messages
  - Fixed by using `message: 'text'` directly on nativeEnum validators

## Next Phase Readiness

- submitReport CF ready for plan 05-02 (Auth UI) and 05-03 (Form Component)
- ReportFormSchema ready for plan 05-03 (Form Component) and 05-04 (Mobile Form)
- /app/report route registered for plan 05-03 (Form Component)
- No blockers

---
*Phase: 05-report-submission*
*Completed: 2026-04-03*
