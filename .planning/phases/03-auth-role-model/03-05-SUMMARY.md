---
phase: 03-auth-role-model
plan: '05'
subsystem: security
tags: [firebase-app-check, input-sanitization, rate-limiting, cloud-functions]

# Dependency graph
requires:
  - phase: 03-02
    provides: Auth UI with login/register/profile pages, route guards
  - phase: 03-03
    provides: setUserRole callable, custom claims infrastructure
provides:
  - Firebase App Check integrated in audit mode (non-blocking)
  - Input sanitization utilities stripping HTML from all text fields
  - Per-user rate limiting (5/hour default, 20/hour surge mode)
  - Cloud Function auth validation middleware (validateSuperadmin, validateMunicipalAdmin, validateWriteScope)
  - setSurgeModeCF callable for admin-controlled surge mode
affects:
  - Phase 12 (App Check enforcement after burn-in)
  - All Cloud Functions using write operations

# Tech tracking
tech-stack:
  added: [firebase/app-check, CustomProvider]
  patterns:
    - CustomProvider for audit/debug mode App Check
    - Firestore transaction for atomic rate limit increment
    - Defense-in-depth: CF-layer sanitization + Firestore rules validation

key-files:
  created:
    - src/lib/app-check/AppCheckProvider.tsx
    - src/lib/app-check/index.ts
    - functions/src/security/sanitize.ts
    - functions/src/security/rateLimit.ts
    - functions/src/security/validateAuth.ts
    - functions/src/security/index.ts
  modified:
    - src/App.tsx
    - functions/src/index.ts
    - firestore.rules
    - .env.example

key-decisions:
  - "D-51: App Check in audit mode (verify, don't enforce) - logs but doesn't block traffic"
  - "D-52: Enforced after Phase 12 burn-in period with real reCAPTCHA Enterprise key"
  - "CustomProvider used instead of enableDebugMode (not available in firebase/app-check 0.5.3)"

patterns-established:
  - "Security middleware pattern: validateSuperadmin/validateMunicipalAdmin/validateAuthenticated/validateWriteScope"
  - "Rate limit state in Firestore: rate_limits/{userId} and rate_limits/surge/{municipalityCode}"
  - "Surge mode per-municipality: admin-enabled 4x rate limit for disaster scenarios"

requirements-completed: [SEC-01, SEC-04, SEC-05, SEC-06, SEC-07]

# Metrics
duration: 8min
completed: 2026-04-03
---

# Phase 03 Plan 05: App Check + Sanitization + Rate Limiting Summary

**Firebase App Check in audit mode with input sanitization and per-user rate limiting for disaster surge scenarios**

## Performance

- **Duration:** 8 min
- **Started:** 2026-04-03T13:51:58Z
- **Completed:** 2026-04-03T14:00:00Z
- **Tasks:** 5
- **Files modified:** 9 (5 created, 4 modified)

## Accomplishments

- Firebase App Check integrated using CustomProvider for audit mode (D-51)
- HTML stripping sanitization for all text fields via regex-based utilities
- Per-user rate limiting: 5 reports/hour default, 20/hour in surge mode
- Auth validation middleware for CF role + municipality scope enforcement
- setSurgeModeCF callable for admin-controlled surge mode activation

## Task Commits

Each task was committed atomically:

1. **Task 1: Integrate Firebase App Check in audit mode** - `ab2beae` (feat)
2. **Task 2: Create input sanitization utilities** - `04671ad` (feat)
3. **Task 3: Create per-user rate limiting with surge mode** - `e71c95f` (feat)
4. **Task 4: Create auth validation middleware for Cloud Functions** - `55e2354` (feat)
5. **Task 5: Update functions/src/index.ts and add surge mode CF** - `961303f` (feat)

## Files Created/Modified

- `src/lib/app-check/AppCheckProvider.tsx` - App Check initialization with CustomProvider for audit mode
- `src/lib/app-check/index.ts` - Module exports
- `src/App.tsx` - Added AppCheckProvider wrapper after AuthProvider
- `functions/src/security/sanitize.ts` - sanitizeText, sanitizeObject, sanitizeUserInput, sanitizeReportInput, sanitizeContactInput, sanitizeAnnouncementInput
- `functions/src/security/rateLimit.ts` - checkRateLimit, incrementRateLimit, setSurgeMode, isSurgeModeActive with Firestore transactions
- `functions/src/security/validateAuth.ts` - validateSuperadmin, validateMunicipalAdmin, validateAuthenticated, validateWriteScope, validateRole
- `functions/src/security/index.ts` - Security module exports
- `functions/src/index.ts` - Added setSurgeModeCF callable and security exports
- `firestore.rules` - Added rate_limits collection rules
- `.env.example` - Added VITE_RECAPTCHA_ENTERPRISE_SITE_KEY placeholder

## Decisions Made

- **CustomProvider for App Check audit mode:** `enableDebugMode` is not available in firebase/app-check 0.5.3, so CustomProvider with placeholder token is used. Traffic is logged but not blocked per D-51.
- **Surge mode per-municipality:** When enabled by admin, all users in that municipality get 4x rate limit (20/hour instead of 5/hour) for disaster scenarios.
- **Firestore transaction for rate limit increment:** Prevents race conditions when multiple CF instances increment simultaneously.

## Deviations from Plan

**1. [Rule 3 - Blocking] App Check enableDebugMode not available in firebase/app-check 0.5.3**
- **Found during:** Task 1 (App Check integration)
- **Issue:** Plan specified `enableDebugMode` from firebase/app-check but it doesn't exist in version 0.5.3
- **Fix:** Used CustomProvider with a placeholder token generator that logs in DEV mode
- **Files modified:** src/lib/app-check/AppCheckProvider.tsx
- **Verification:** App Check initializes without errors, tokens logged in dev console
- **Committed in:** ab2beae (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (blocking)
**Impact on plan:** App Check integration works but uses CustomProvider instead of debug provider. Both achieve audit mode goal (logging, not blocking).

## Issues Encountered

None - all tasks executed as specified.

## Next Phase Readiness

- Phase 03 (auth-role-model) is now complete with all 5 plans finished
- Security infrastructure (App Check, sanitization, rate limiting, auth validation) is in place
- Ready for Phase 04 (Report Model + Workflow) or Phase 05 (Public Reports UI)

---
*Phase: 03-auth-role-model*
*Plan: 05*
*Completed: 2026-04-03*
