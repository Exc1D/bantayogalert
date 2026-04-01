# Bantayog Alert

## What This Is

Bantayog Alert is a dual-surface disaster reporting, official alerting, emergency coordination, and disaster-mapping platform for Camarines Norte, Philippines. It serves three roles — **citizen**, **municipal_admin**, and **provincial_superadmin** — through a map-first desktop command center and a feed-first mobile citizen app. The core value chain is: citizen-submitted reports → admin triage (verify/reject/route/acknowledge/dispatch/resolve) → official announcements → push notification delivery.

## Core Value

Citizens in Camarines Norte can report emergencies in seconds and understand active incidents around them; responders and administrators can verify, route, and resolve incidents with auditable precision — all with municipality scope as an unbreakable security boundary.

## Requirements

### Validated

- [x] **SEC-05**: Storage upload validation — path format `media/{userId}/{reportId}/{uuid}.{ext}`, MIME types `jpeg/png/webp/mp4`, 5MB/file enforced in `storage.rules`
- [x] **SEC-06**: Custom claims set server-side only — `setCustomClaims` uses `admin.auth().setCustomUserClaims()` directly (no callable HTTPS endpoint); validated in Phase 01

### Active

- [ ] R-01: Citizen can submit reports with type, category, severity, description, location, municipality, barangay, and media
- [ ] R-02: Citizens and admins see reports in real-time in feed and map views
- [ ] R-03: Citizens can track their own reports from a profile tab (active + recent)
- [ ] R-04: municipal_admin can verify, reject, route, acknowledge, mark in progress, and resolve reports within their municipality
- [ ] R-05: municipal_admin can only send announcements to their assigned municipality
- [ ] R-06: provincial_superadmin can send province-wide or target-selected municipalities
- [ ] R-07: Citizens receive relevant municipality alerts plus province-wide alerts in an Alerts tab
- [ ] R-08: Contacts directory with CRUD, used for routing destination selection
- [ ] R-09: Routed reports store an immutable snapshot of the chosen contact (DispatchedTarget)
- [ ] R-10: Pre-aggregated analytics at municipality and province levels
- [ ] R-11: Desktop: persistent live map with minimal left nav rail + reusable right-side modal as workspace surface
- [ ] R-12: Desktop: opening or closing the modal must not remount, reset, or refetch the map
- [ ] R-13: Mobile: bottom-tab interface (Feed, Map, Alerts, Profile) with fast report submission
- [ ] R-14: Municipality is a hard security perimeter — municipal_admin can never touch data outside their assigned municipality
- [ ] R-15: All state transitions are logged in append-only Activity subcollections
- [ ] R-16: Pending reports auto-rejected after 72 hours (SYSTEM actor)
- [ ] R-17: Published announcements auto-expire based on expiresAt

### Out of Scope

- Anonymous report submission — all submitters must have an account
- Paid map tile providers — OpenStreetMap only
- Multi-role users — one role per user account
- Separate dev/staging Firebase project — single project with rules differentiating environments
- Social features (comments, reactions) beyond upvote tracking

## Context

**Greenfield build** — no prior implementation exists in this repository.

The existing `bantayog-alert-demo` repo (separate) has partial implementation but is not the target for this project. This repo (`bantayogalert`) starts from scratch using SPEC.md as the source of truth.

**Technical environment:**

- React 18 + Vite + Tailwind CSS + TypeScript (frontend)
- Firebase suite: Auth (email/password + custom claims), Firestore, Storage, Cloud Functions, Cloud Messaging, Hosting
- React-Leaflet + Leaflet for map
- Vitest + React Testing Library + Playwright + Firebase Emulator Suite for testing
- PWA with offline report queue

**Domain context:**

- 12 municipalities in Camarines Norte with agreed stable codes: `basud`, `daet`, `josepanganiban`, `labo`, `mercedes`, `paracale`, `sanlorenzo`, `sanvicente`, `talisay`, `vinzales`, `capalonga`, `staelena`
- 7 workflow states: `pending` → `verified` → `dispatched` → `acknowledged` → `in_progress` → `resolved` (terminal), with `rejected` as terminal
- 3 roles: citizen, municipal_admin, provincial_superadmin
- Map-first desktop and feed-first mobile are non-negotiable UX requirements

**Known issues to address:**

- Municipality scope enforcement must be baked into Firestore rules AND Cloud Function gate — not just UI filtering
- Map persistence guarantee is structural (MapCanvas and RightModal are DOM siblings in DesktopShell), not a coding convention
- Announcements use FCM topic fan-out to avoid per-user Notification doc write storm

## Constraints

- **Tech stack**: React 18, Vite, Tailwind CSS, Firebase — not optional unless explicit tradeoff is explained
- **Security**: Municipality scoping enforced server-side — no exceptions, no UI-only enforcement
- **Performance**: No province-wide Firestore listeners; all queries paginated and scope-bounded
- **Map**: Desktop map must never remount during modal navigation — architectural guarantee required
- **Release gate**: 90/100 on Bantayog Alert Quality Scorecard. Automatic blockers: broken scope rules, broken provincial permissions, map remount, critical security flaw, failing core workflows
- **Offline**: Firestore offline persistence enabled; report submission queued offline and retried on reconnect

## Key Decisions

| Decision                                          | Rationale                                                                    | Outcome   |
| ------------------------------------------------- | ---------------------------------------------------------------------------- | --------- |
| Firebase-first backend                            | Firestore rules + Cloud Functions for all business logic enforcement         | ✓ Phase 01 |
| MapContext + ModalContext as DOM siblings         | Guarantees map never remounts on modal toggle — structural, not conventional | ✓ Phase 01 |
| DispatchedTarget is an immutable snapshot         | Routing history must stay accurate even after contact directory edits        | — Pending |
| Append-only Activity subcollection                | Parent report document stays lean; history never mutates main doc            | — Pending |
| Zod validators + DOMPurify for all user content   | Defense in depth: rules don't catch everything                               | — Pending |
| FCM topic fan-out over per-user notification docs | Province-wide announcement would create thundering herd on writes            | — Pending |
| 12 Fine-grained phases                            | Complex domain requires deliberate sequencing; map shell before admin        | ✓ Phase 01 |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):

1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):

1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---

_Last updated: 2026-04-01 after initialization_
