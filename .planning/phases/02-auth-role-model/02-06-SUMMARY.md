---
phase: 02-auth-role-model
plan: '06'
subsystem: firestore
tags:
  - security
  - firestore-rules
  - municipality-scoping
  - sec-01
  - sec-02
  - sec-03
dependency_graph:
  requires:
    - '02-05'
  provides:
    - Complete municipality scoping rules
  affects:
    - reports collection
    - contacts collection
    - announcements collection
    - audit collection
tech_stack:
  added:
    - Firestore Security Rules
  patterns:
    - hasMunicipalityAccess helper function
    - Role-based access with municipality scope
    - Null municipality token rejection
key_files:
  created: []
  modified:
    - firestore.rules
decisions:
  - D-11: Hybrid architecture - municipality scope function factored out, collection rules stay readable
  - D-12: hasMunicipalityAccess(request, userMuni, targetMuni) function for consistent enforcement
  - D-13: Rules for collections: reports, contacts, announcements, users
  - D-14: provincial_superadmin bypasses municipality scoping (province-wide access)
metrics:
  duration: 45 seconds
  completed: '2026-04-02'
  tasks: 4
  files: 1
---

# Phase 02 Plan 06: Firestore Security Rules - Municipality Scoping

## One-liner

Comprehensive Firestore security rules enforcing municipality scope per SEC-01, SEC-02, SEC-03.

## Summary

Implemented complete Firestore security rules for municipality scoping enforcement across all collections (reports, contacts, announcements, audit) with `provincial_superadmin` bypass and explicit null municipality token rejection.

## Completed Tasks

| Task | Name                                             | Commit  | Files           |
| ---- | ------------------------------------------------ | ------- | --------------- |
| 1    | Enhanced hasMunicipalityAccess helper function   | 255b4a7 | firestore.rules |
| 2    | Updated reports collection rules                 | e4372d5 | firestore.rules |
| 3    | Updated contacts collection rules                | d5513eb | firestore.rules |
| 4    | Updated announcements and audit collection rules | 5eb04e1 | firestore.rules |

## Must-Haves Verification

### Truths

- ✅ Firestore security rules enforce municipality scope for `municipal_admin`
- ✅ `municipal_admin` can never read or write outside their assigned municipality
- ✅ `provincial_superadmin` has province-wide access to all collections

### Artifacts

| Artifact        | Status   | Notes                                        |
| --------------- | -------- | -------------------------------------------- |
| firestore.rules | Complete | Contains complete municipality scoping rules |

### Key Implementation Details

**Helper Functions Added:**

- `hasMunicipalityAccess(request, targetMunicipality)` - Core helper, rejects null tokens
- `canAccessMunicipality(targetMunicipality)` - Alias for documents with municipality field
- `hasValidMunicipality()` - Checks authenticated user has non-null municipality
- `hasRole(role)` - Role check helper
- `hasValidMunicipalityScope()` - Legacy alias for backwards compatibility

**Collection Rules:**

| Collection    | Read                                                | Create                                                    | Update                       | Delete                     |
| ------------- | --------------------------------------------------- | --------------------------------------------------------- | ---------------------------- | -------------------------- |
| reports       | Citizens: own + public; Admin: municipality only    | submitterUid must match; municipality must match token    | Municipality access required | Blocked (system only)      |
| contacts      | Municipality access required                        | municipal_admin only; municipality must match             | municipal_admin only         | municipal_admin only       |
| announcements | Citizens: active + scoped; Admin: municipality only | municipal_admin: municipality scope only; superadmin: all | Creator or superadmin only   | Creator or superadmin only |
| audit         | Municipality access or province scope               | Blocked                                                   | Blocked                      | Blocked                    |

## Success Criteria

- ✅ SEC-01: Firestore rules enforce municipality scope for municipal_admin
- ✅ SEC-02: municipal_admin cannot read/write outside assigned municipality
- ✅ SEC-03: provincial_superadmin has province-wide access
- ✅ All collections (reports, contacts, announcements, audit) follow scoping rules

## Deviations from Plan

None - plan executed exactly as written.

## Auth Gates

None.

## Known Stubs

None.

## Verification Commands

```bash
# Deploy rules (requires Firebase CLI)
firebase deploy --only firestore:rules

# Test with firebase emulators
firebase emulators:start

# Manual verification
grep -c "hasMunicipalityAccess" firestore.rules  # Should return 3+
grep -A 20 "match /reports" firestore.rules
grep -A 15 "match /contacts" firestore.rules
grep -A 25 "match /announcements" firestore.rules
```

---

## Self-Check: PASSED

- All 4 tasks committed individually
- firestore.rules contains all required helper functions
- All collections have proper municipality scoping rules
- SEC-01, SEC-02, SEC-03 requirements satisfied
