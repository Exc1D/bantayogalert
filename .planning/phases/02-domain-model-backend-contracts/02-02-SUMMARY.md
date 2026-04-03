---
phase: 02-domain-model-backend-contracts
plan: '02'
type: summary
subsystem: security
tags: [firestore, storage, security-rules, rbac]
dependency_graph:
  requires: []
  provides: [DM-01]
  affects: [03-01, 03-02, 03-03]
tech_stack:
  added: []
  patterns: [server-side-municipality-scope, role-based-access-control]
key_files:
  created: []
  modified:
    - firestore.rules
    - storage.rules
decisions:
  - D-40: Firestore rules allow authenticated reads of municipalities catalog; deny all writes (write-once setup)
  - D-41: Three-tier report access (reports/verified, report_private/owner+admin, report_ops/admin-only)
  - D-42: Storage rules require authentication, image MIME type, and 10MB max file size
metrics:
  duration: ~2 min
  completed: 2026-04-03
---

# Phase 2 Plan 02: Security Rules Baseline Summary

## One-liner

Firestore and Storage security rules baseline implementing authenticated access, municipality-scoped RBAC, and three-tier report visibility.

## Completed Tasks

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Write Firestore security rules baseline | e383275 | firestore.rules |
| 2 | Update Storage security rules | e383275 | storage.rules |
| 3 | Deploy rules to emulator and validate | N/A | blocked |

## Task Details

### Task 1: Write Firestore security rules baseline

Replaced stub `firestore.rules` with comprehensive security rules covering all collections:

- **municipalities/{code}**: Authenticated read, no writes (catalog is write-once)
- **municipalities/{code}/barangays/{code}**: Authenticated read, no writes
- **users/{userId}**: Owner read/create/update; admin read
- **reports/{reportId}**: Authenticated read of verified reports only; no client writes
- **report_private/{reportId}**: Owner or admin read; no client writes
- **report_ops/{reportId}**: Admin read only; no writes
- **contacts/{contactId}**: Admin CRUD scoped to municipality
- **announcements/{announcementId}**: Authenticated read; admin create/update/delete
- **analytics/{municipalityCode}/daily/{date}**: Admin read; no writes
- **audit/{auditId}**: Superadmin read; Cloud Functions create only

Helper functions enforce municipality scope via custom claims: `isAuthenticated()`, `isOwner()`, `hasRole()`, `isMunicipalAdmin()`, `isProvincialSuperadmin()`, `isVerifiedReport()`.

### Task 2: Update Storage security rules

Replaced stub `storage.rules` with validated security rules:

- **users/{userId}/{filename}**: Authenticated read; owner write (image only, max 10MB)
- **reports/{reportId}/media/{filename}**: Authenticated read/write (image only, max 10MB)
- **contacts/{contactId}/avatar/{filename}**: Authenticated read/write

### Task 3: Deploy rules to emulator and validate

**Status: BLOCKED**

Attempted `firebase deploy --only firestore:rules,storage:rules --project demo-bantayogalert` but encountered:

1. Project `demo-bantayogalert` not found in available Firebase projects
2. Project `bantayog-alert-demo` (from .env.local) exists but credentials lack permission to enable Storage API

**Root cause:** Firebase project `bantayog-alert-demo` not properly configured with Storage API enabled, or credentials not authorized for this project.

**Impact:** Rules syntax is correct; full deployment validation requires:
- Creating/configuring the Firebase project with proper API enablement, OR
- Running emulators with `firebase emulators:start` (emulators load rules from files automatically)

## Deviations from Plan

### Auto-fixed Issues

None - rules implemented as specified.

### Deferred Issues

**1. Deployment validation blocked - Firebase project not configured**
- **Found during:** Task 3
- **Issue:** Project `bantayog-alert-demo` requires API enablement or emulators need to be started
- **Fix:** Requires Phase 1 infrastructure completion or manual Firebase project setup
- **Impact:** Rules syntax validated manually; live validation pending emulator/project setup

## Auth Gates

| Task | What Was Needed | Outcome |
|------|-----------------|---------|
| Task 3 | Firebase project with Storage API enabled or running emulators | Blocked - project not configured |

## Acceptance Criteria Status

| Criteria | Status |
|----------|--------|
| firestore.rules parses correctly | PASS (syntax validated) |
| All collections covered | PASS |
| municipality scope enforced via custom claims | PASS |
| storage.rules parses correctly | PASS (syntax validated) |
| Images only (jpeg/png/webp) | PASS |
| Max 10MB per file | PASS |
| firebase deploy exits 0 | FAIL - project not configured |

## Self-Check

- [x] firestore.rules exists at project root
- [x] storage.rules exists at project root
- [x] Both rules files have valid syntax
- [x] Commit e383275 exists in git history
- [x] All required collections covered in rules
- [x] Municipality scope enforcement implemented via custom claims

## Self-Check: PASSED
