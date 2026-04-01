# Bantayog Alert — Project State

## Project Reference

**Project:** Bantayog Alert
**Core Value:** Disaster reporting and emergency coordination platform for Camarines Norte, Philippines serving citizens, municipal admins, and provincial superadmins
**Current Focus:** Pre-implementation planning
**Roadmap:** `.planning/ROADMAP.md`

---

## Current Position

**Phase:** 0 (Pre-Planning)

**Current Roadmap Phase Status:**

| Phase                                 | Status      | Plans |
| ------------------------------------- | ----------- | ----- |
| 1. Foundation                         | Not started | 0/6   |
| 2. Auth & Role Model                  | Not started | 0/8   |
| 3. Reporting Domain                   | Not started | 0/8   |
| 4. Desktop Map + Modal Architecture   | Not started | 0/9   |
| 5. Mobile Shell + Navigation          | Not started | 0/6   |
| 6. Admin Triage + Workflow            | Not started | 0/13  |
| 7. Contacts Directory                 | Not started | 0/4   |
| 8. Announcements + Push Notifications | Not started | 0/8   |
| 9. Profile + Report Tracker           | Not started | 0/4   |
| 10. Analytics + Disaster Mapping      | Not started | 0/5   |
| 11. PWA + Accessibility + Hardening   | Not started | 0/8   |
| 12. Release Verification              | Not started | 0/6   |

**Overall Progress:** 0/72 requirements planned

---

## Performance Metrics

| Metric              | Value | Target          |
| ------------------- | ----- | --------------- |
| Requirements mapped | 0/72  | 72/72           |
| Phases planned      | 0/12  | 12/12           |
| Test coverage       | 0%    | 100% at release |
| Scorecard score     | TBD   | 90+             |

---

## Accumulated Context

### Key Architectural Decisions

| Decision                                          | Rationale                                                             | Status                 |
| ------------------------------------------------- | --------------------------------------------------------------------- | ---------------------- |
| Firebase-first backend                            | Firestore rules + Cloud Functions for all business logic enforcement  | Pending implementation |
| MapContext + ModalContext as DOM siblings         | Guarantees map never remounts on modal toggle                         | Pending implementation |
| DispatchedTarget is an immutable snapshot         | Routing history must stay accurate even after contact directory edits | Pending implementation |
| Append-only Activity subcollection                | Parent report document stays lean; history never mutates main doc     | Pending implementation |
| Zod validators + DOMPurify for all user content   | Defense in depth                                                      | Pending implementation |
| FCM topic fan-out over per-user notification docs | Avoids thundering herd on writes                                      | Pending implementation |

### Security Boundaries

- Municipality scope is a hard security boundary
- municipal_admin must never touch data outside their assigned municipality
- provincial_superadmin has province-wide access
- Scope enforcement must exist server-side (Firestore rules + Cloud Function gate)

### Scope Exclusions

- Anonymous report submission (all submitters must have an account)
- Paid map tile providers (OpenStreetMap only)
- Multi-role users (one role per user)
- Social features beyond upvote tracking
- Real-time chat between citizens and responders

---

## Phase Dependencies

```
Phase 1 (Foundation)
    └── Phase 2 (Auth & Role Model)
            └── Phase 3 (Reporting Domain)
                    └── Phase 4 (Desktop Map + Modal)
                            ├── Phase 5 (Mobile Shell)
                            └── Phase 6 (Admin Triage + Workflow)
                                    ├── Phase 7 (Contacts Directory)
                                    └── Phase 8 (Announcements + Push)
                                            └── Phase 9 (Profile + Tracker)
                                                    └── Phase 10 (Analytics)
                                                            └── Phase 11 (PWA + A11y + Hardening)
                                                                    └── Phase 12 (Release Verification)
```

---

## Session Continuity

- **Roadmap created:** 2026-04-01
- **Next action:** Begin Phase 1 with `/gsd:plan-phase 1`
- **Files created:**
  - `.planning/ROADMAP.md` — phase structure and success criteria
  - `.planning/STATE.md` — current project state
  - `.planning/REQUIREMENTS.md` — updated traceability section

---

## Notes

This is a greenfield project. No prior implementation exists in this repository.

The existing `bantayog-alert-demo` repo (separate) has partial implementation but is not the target for this project.

12 municipalities in Camarines Norte: basud, daet, josepanganiban, labo, mercedes, paracale, sanlorenzo, sanvicente, talisay, vinzales, capalonga, staelena

Preferred stack: React 18, Vite, Tailwind CSS, Firebase (Auth, Firestore, Storage, Cloud Functions, Cloud Messaging, Hosting), React-Leaflet, PWA, Vitest, React Testing Library, Playwright.
