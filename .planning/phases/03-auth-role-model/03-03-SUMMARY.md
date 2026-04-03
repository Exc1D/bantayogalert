---
phase: 03-auth-role-model
plan: '03'
subsystem: auth
tags: [firebase-auth, custom-claims, cloud-functions, callable-functions, auth-trigger]

# Dependency graph
requires:
  - phase: '03-01'
    provides: Firebase Auth setup (email/password + Google OAuth, browserLocalPersistence)
provides:
  - setUserRole callable CF (superadmin-only role assignment)
  - onUserCreated auth trigger (default claims on registration)
  - setCustomClaims utility (atomic Firestore doc + ID token update)
  - Client-side claims utilities (extractCustomClaims, hasRole, isSuperadmin, isMunicipalAdmin)
affects:
  - Phase 03-05 (App Check)
  - Phase 08 (Contacts)
  - Phase 09 (Admin Triage)

# Tech tracking
tech-stack:
  added: [firebase-admin SDK, firebase-functions v7]
  patterns:
    - Atomic claims update: Firestore doc update + setCustomUserClaims together
    - Auth trigger: onCreate fires on Firebase Auth user creation
    - Callable functions: onCall with HttpsError for permission-denied

key-files:
  created:
    - functions/src/auth/claims.ts
    - functions/src/auth/setUserRole.ts
    - functions/src/auth/onUserCreated.ts
    - src/lib/auth/claims.ts
  modified:
    - functions/src/index.ts

key-decisions:
  - "D-47: Claims set atomically on user document AND ID token - both updated together"
  - "D-48: Default role on registration: citizen, provinceCode=CMN, municipalityCode=null"

patterns-established:
  - "Callable function authorization: check context.auth.token first, throw HttpsError permission-denied if unauthorized"
  - "Atomic custom claims: Firestore update then setCustomUserClaims, both must succeed"

requirements-completed: [AUTH-05, AUTH-06, SEC-04]

# Metrics
duration: 3min
completed: 2026-04-03
---

# Phase 03 Plan 03: Custom Claims Cloud Functions Summary

**setUserRole callable for superadmin role assignment, onUserCreated auth trigger for default claims, and shared claims utilities for both server and client**

## Performance

- **Duration:** 3 min
- **Started:** 2026-04-03T13:44:06Z
- **Completed:** 2026-04-03T13:46:49Z
- **Tasks:** 5
- **Files modified:** 5

## Accomplishments

- setUserRole callable Cloud Function: superadmin-only, validates role and municipalityCode per role constraints
- onUserCreated auth trigger: automatically sets default citizen claims and creates Firestore user document on new user registration
- Server-side setCustomClaims: atomically updates Firestore user doc + ID token claims together
- Client-side claims utilities: extractCustomClaims, hasRole, isMunicipalAdmin, isSuperadmin for AuthProvider and components
- Cloud Functions wired and exported from functions/src/index.ts

## Task Commits

Each task was committed atomically:

1. **Task 1: Create server-side custom claims utilities** - `a16333d` (feat)
2. **Task 2: Create setUserRole callable Cloud Function** - `3cb8cf8` (feat)
3. **Task 3: Create onUserCreated auth trigger for default claims** - `e6b652a` (feat)
4. **Task 4: Wire Cloud Functions in functions/src/index.ts** - `c1afe62` (feat)
5. **Task 5: Create client-side custom claims utilities** - `7de4d1b` (feat)

## Files Created/Modified

- `functions/src/auth/claims.ts` - Server-side: setCustomClaims, verifyCustomClaims, isSuperadmin, isMunicipalAdmin
- `functions/src/auth/setUserRole.ts` - Callable CF: superadmin role assignment with full validation
- `functions/src/auth/onUserCreated.ts` - Auth trigger: default claims on new user registration
- `functions/src/index.ts` - Exports setUserRole and onUserCreated, keeps stub for health checks
- `src/lib/auth/claims.ts` - Client-side: extractCustomClaims, hasRole, isMunicipalAdmin, isSuperadmin, getDefaultClaims

## Decisions Made

- Claims atomicity: setCustomClaims updates Firestore doc first (merge), then setCustomUserClaims on ID token
- onUserCreated sets notificationPreferences with defaults (pushEnabled: false, emailEnabled: true, alertTypes: ['all'])
- Role validation regex: MUNICIPALITY_CODE_REGEX = /^[A-Z]{3,4}$/ for 3-4 uppercase letter municipality codes
- ProvinceCode always 'CMN' (Camarines Norte) - enforced server-side, not configurable by clients

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## Next Phase Readiness

- Phase 03-05 (App Check) can proceed independently - this plan's Cloud Functions work is complete
- setUserRole callable ready for admin UI (Phase 03-02 auth UI) when that plan resumes
- Client-side claims utilities ready for AuthProvider integration

---

*Phase: 03-auth-role-model 03*
*Completed: 2026-04-03*
