---
phase: 02-auth-role-model
plan: '05'
subsystem: auth
tags: [firebase, cloud-functions, custom-claims, firestore-rules, callable-functions]

# Dependency graph
requires:
  - phase: 02-auth-role-model (02-02, 02-03)
    provides: Custom claims structure, role model definitions, Firestore auth helpers
provides:
  - Callable setCustomClaims Cloud Function for provincial_superadmin
  - Callable createAdminRequest for user admin access requests
  - Callable reviewAdminRequest for provincial_superadmin approval/rejection
  - Firestore rules for adminRequests collection
affects:
  - Phase 03 (Reporting Domain) - report submission requires custom claims
  - Phase 06 (Admin Triage) - admin approval panel needs these functions

# Tech tracking
tech-stack:
  added: [firebase-admin, firebase-functions]
  patterns:
    - Callable HTTPS Cloud Functions with auth token validation
    - Server-side custom claims setting (SEC-06 requirement)
    - Municipality scope enforcement in Cloud Functions

key-files:
  created:
    - functions/src/setCustomClaims.ts - callable function for setting custom claims
    - functions/src/adminRequest.ts - createAdminRequest and reviewAdminRequest
  modified:
    - functions/src/index.ts - re-exports callable functions
    - firestore.rules - added adminRequests collection rules

key-decisions:
  - 'Provincial superadmin sets custom claims via privileged callable function'
  - 'Users request admin role via createAdminRequest, provincial superadmin reviews via reviewAdminRequest'
  - 'Municipality scope enforced at Cloud Function level for cross-municipality privilege escalation prevention'

patterns-established:
  - 'Callable Cloud Function pattern: auth token validation → data validation → business logic → Firestore update'
  - 'Re-export pattern: index.ts re-exports from separate module files'

requirements-completed: [AUTH-04, AUTH-06]

# Metrics
duration: 5min
completed: 2026-04-02
---

# Phase 02 Plan 05: Municipal Admin Approval Workflow Summary

**Cloud Functions for custom claims setting and municipal admin approval workflow with Firestore security rules**

## Performance

- **Duration:** 5 min
- **Started:** 2026-04-01T19:14:53Z
- **Completed:** 2026-04-01T19:19:XXZ
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments

- Callable setCustomClaims Cloud Function with provincial_superadmin authorization
- Callable createAdminRequest for users to request municipal_admin role
- Callable reviewAdminRequest for provincial_superadmin to approve/reject requests
- Firestore rules for adminRequests collection

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Cloud Function to set custom claims** - `d840fdc` (feat)
2. **Task 2: Create Cloud Function for admin request workflow** - `8691e0c` (feat)
3. **Task 3: Update Firestore rules for adminRequests collection** - `bfe0c16` (feat)

## Files Created/Modified

- `functions/src/setCustomClaims.ts` - Callable HTTPS function for provincial_superadmin to set custom claims
- `functions/src/adminRequest.ts` - createAdminRequest and reviewAdminRequest callable functions
- `functions/src/index.ts` - Re-exports callable functions from separate modules
- `firestore.rules` - Added adminRequests collection rules
- `functions/lib/index.js` - Compiled output

## Decisions Made

- Used callable HTTPS functions (https.onCall) for client-callable operations
- Provincial superadmin can only grant municipal_admin for their own municipality (scope validation)
- Existing setCustomClaims in index.ts converted to re-export from new module

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## Next Phase Readiness

- Cloud Functions ready for deployment with `firebase deploy --only functions`
- Firestore rules ready for deployment
- Auth context can now use these functions for admin approval workflow

---

_Phase: 02-auth-role-model_
_Completed: 2026-04-02_
