# Bantayog Alert — Roadmap

## Overview

**Project:** Bantayog Alert — dual-surface disaster reporting and emergency coordination platform
**Total Phases:** 12
**Total v1 Requirements:** 72
**Coverage:** 72/72 mapped

---

## Phases

- [x] **Phase 1: Foundation** — Project scaffold, Firebase setup, basic shell, tooling (completed 2026-04-01)
- [ ] **Phase 2: Auth & Role Model** — Complete auth flows, role enforcement, municipality scoping
- [ ] **Phase 3: Reporting Domain** — Report submission, media uploads, Zod validation, sanitization, basic feed
- [ ] **Phase 4: Desktop Map + Modal Architecture** — Full Leaflet integration, marker management, right-modal reuse
- [ ] **Phase 5: Mobile Shell + Navigation** — Mobile layout, tab navigation, mobile-specific report flow, basic PWA
- [ ] **Phase 6: Admin Triage + Workflow** — Admin verification, routing, state transitions, activity logging, auto-reject
- [ ] **Phase 7: Contacts Directory** — Contact CRUD, routing snapshots, contact selection
- [ ] **Phase 8: Announcements + Push Notifications** — Announcement creation, FCM, delivery logs, Alerts tab
- [ ] **Phase 9: Profile + Report Tracker** — Citizen report history, preferences, notification settings
- [ ] **Phase 10: Analytics + Disaster Mapping** — Pre-aggregated analytics, admin dashboard, province analytics
- [ ] **Phase 11: PWA + Accessibility + Hardening** — Offline support, accessibility audit, performance tuning, SEO
- [ ] **Phase 12: Release Verification** — Scorecard evaluation, bug fixes, production deployment

---

## Phase Details

### Phase 1: Foundation

**Goal:** Project scaffold, tooling, Firebase setup, and basic shell architecture in place

**Depends on:** Nothing

**Requirements:** SEC-06, SEC-05

**Success Criteria** (what must be TRUE):

1. A running Vite + React 18 + Tailwind CSS + TypeScript project exists with Firebase initialized
2. Playwright and Vitest are configured with base test files and CI configuration
3. Firebase Auth, Firestore, Storage, and Cloud Functions are provisioned in the Firebase project
4. Initial Firestore security rules and Storage rules are deployed
5. Basic DesktopShell (NavRail placeholder, MapCanvas placeholder, RightModal placeholder) renders correctly
6. Basic MobileShell (BottomTab with placeholder screens) renders correctly

**Plans:** 3/3 plans complete

Plans:
- [x] 01-01-PLAN.md — Project scaffold (Vite + React 18 + Tailwind + TypeScript + CI pipeline)
- [x] 01-02-PLAN.md — Firebase initialization + emulator config + Storage rules (SEC-05, SEC-06 scaffold)
- [x] 01-03-PLAN.md — Shell stubs (DesktopShell + MobileShell) + Vitest/Playwright setup

---

### Phase 2: Auth & Role Model

**Goal:** Users can create accounts, sign in, and role-based access is enforced server-side

**Depends on:** Phase 1

**Requirements:** AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, AUTH-06, SEC-01, SEC-02, SEC-03

**Success Criteria** (what must be TRUE):

1. User can sign up with email/password and create an account
2. User can sign in and maintain a session across page reloads
3. User can sign out from any page
4. Firebase Auth custom claims store role (citizen, municipal_admin, provincial_superadmin) and municipality code
5. RoleGate component hides UI elements from unauthorized roles; ProtectedRoute redirects unauthenticated users
6. municipal_admin custom claim includes their assigned municipality code
7. Firestore security rules enforce that municipal_admin can never read or write reports, contacts, announcements, or audit data outside their assigned municipality
8. provincial_superadmin has province-wide access enforced by Firestore rules

**Plans:** 5/7 plans executed

---

### Phase 3: Reporting Domain

**Goal:** Citizens can submit reports with media; public feed displays paginated results

**Depends on:** Phase 2

**Requirements:** REPO-01, REPO-02, REPO-03, REPO-04, REPO-05, FEED-01, FEED-02, SEC-04

**Success Criteria** (what must be TRUE):

1. Citizen can submit a report with type, category, severity, description, location (lat/lng/municipality/barangay), and optional media
2. Report submission is rate-limited server-side at 60 seconds per user
3. Media uploads are compressed client-side to max 1024px dimension and 0.7 JPEG quality before upload to Firebase Storage
4. All user text content is sanitized with DOMPurify before storage
5. All write payloads are validated with Zod schemas before submission
6. Public report feed displays reports newest-first with cursor-based pagination (20 per page)
7. Feed queries are scoped by municipality for municipal_admin; province-wide for citizens
8. Citizens cannot access admin-only report fields (verifiedBy, rejectedReason, dispatchedTo) via Firestore rules

**Plans:** TBD

---

### Phase 4: Desktop Map + Modal Architecture

**Goal:** Desktop map-first interface with persistent Leaflet canvas and section-aware right modal

**Depends on:** Phase 3

**Requirements:** MAP-01, MAP-02, MAP-03, MAP-04, MAP-05, MAP-06, MAP-07, FEED-03, FEED-04, FEED-05

**Success Criteria** (what must be TRUE):

1. Desktop uses AppShell with NavRail (64px, icon + tooltip) on the left
2. MapCanvas (Leaflet) is always mounted in DesktopShell and never unmounts during navigation
3. RightModal renders as a DOM sibling to MapCanvas in DesktopShell; opening/closing does not remount Leaflet
4. MapContext manages viewport state (pan, zoom, selected pin) across modal interactions
5. ModalContext manages section state; RightModal renders FeedPanel, ReportDetail, ProfilePanel, AlertsPanel, AdminPanel, or ContactsPanel based on context
6. Clicking a map pin opens ReportDetail in RightModal without changing map viewport
7. Mobile and desktop map displays report pins with severity color coding
8. Marker clustering activates when more than 50 pins are visible in viewport
9. Map viewport changes are debounced 300ms before re-querying the report feed

**Plans:** TBD

**UI hint:** yes

---

### Phase 5: Mobile Shell + Navigation

**Goal:** Complete mobile bottom-tab interface with fast report submission flow

**Depends on:** Phase 4

**Requirements:** MOBI-01, MOBI-02, MOBI-03, MOBI-04, MOBI-05, MOBI-06

**Success Criteria** (what must be TRUE):

1. Mobile uses BottomTab with 4 tabs: Feed, Map, Alerts, Profile
2. FAB on Feed and Map tabs opens the 4-step report submission flow
3. Report submission flow completes all 4 steps: Type Selection, Location (auto-detect with adjustable pin), Details (category, severity, description), Media (optional), then Submit
4. Mobile map has floating filter chips (type, severity) and current-location FAB
5. PWA manifest is configured and service worker caches the app shell for offline use
6. Offline report submissions are queued in IndexedDB and retried on reconnect

**Plans:** TBD

**UI hint:** yes

---

### Phase 6: Admin Triage + Workflow

**Goal:** Admins can verify, reject, route, acknowledge, and resolve reports with full activity logging

**Depends on:** Phase 4

**Requirements:** WORK-01, WORK-02, WORK-03, WORK-04, WORK-05, WORK-06, WORK-07, WORK-08, WORK-09, WORK-10, OBS-01, OBS-02, OBS-03

**Success Criteria** (what must be TRUE):

1. municipal_admin can verify a pending report (pending to verified)
2. municipal_admin can reject a pending report with a reason (pending to rejected)
3. municipal_admin can route a verified report by selecting a contact (verified to dispatched), storing immutable DispatchedTarget snapshot
4. municipal_admin can acknowledge a dispatched report (dispatched to acknowledged)
5. municipal_admin can mark an acknowledged report as in_progress (acknowledged to in_progress)
6. municipal_admin can resolve an in_progress report with notes and evidence photos (in_progress to resolved)
7. All state transitions use Firestore runTransaction to prevent race conditions
8. Every state transition appends an Activity document with actorUid, action, previousState, newState, notes, and timestamp
9. provincial_superadmin can perform all triage actions across any municipality
10. Reports pending more than 72 hours are auto-rejected by a scheduled Cloud Function with actorUid='SYSTEM'
11. All critical workflow mutations are logged to the append-only audit collection
12. Failed push notification sends are marked failed in delivery log with error reason; retry is scheduled
13. Client-side error boundary catches and reports uncaught errors

**Plans:** TBD

---

### Phase 7: Contacts Directory

**Goal:** Contact CRUD with routing snapshot integrity for dispatched reports

**Depends on:** Phase 6

**Requirements:** CONT-01, CONT-02, CONT-03, CONT-04

**Success Criteria** (what must be TRUE):

1. Admin can create contacts with agency name, contact person, phone, email, type, and municipality
2. Admin can list contacts filtered by municipality
3. Admin can edit and deactivate contacts
4. Contact snapshots stored on dispatched reports are immutable; routing history remains accurate after directory edits

**Plans:** TBD

---

### Phase 8: Announcements + Push Notifications

**Goal:** Admins can create and send announcements; citizens receive push notifications in the Alerts tab

**Depends on:** Phase 6

**Requirements:** ALRT-01, ALRT-02, ALRT-03, ALRT-04, ALRT-05, ALRT-06, ALRT-07, ALRT-08

**Success Criteria** (what must be TRUE):

1. municipal_admin can create and publish announcements scoped to their municipality only
2. provincial_superadmin can create and publish announcements scoped to any single municipality, multiple municipalities, or the whole province
3. Published announcements are visible in the Alerts tab to qualifying users
4. Citizens see multi_municipality announcements if their municipality is in targetMunicipalities
5. Announcement delivery logs are written to the Announcement/notifications subcollection
6. Push notifications are sent via FCM topic (municipality_{code} or province_wide)
7. Published announcements cannot be edited; only provincial_superadmin can unpublish
8. A scheduled Cloud Function auto-expires announcements past their expiresAt timestamp

**Plans:** TBD

---

### Phase 9: Profile + Report Tracker

**Goal:** Citizens can view their report history and manage notification preferences

**Depends on:** Phase 8

**Requirements:** PROF-01, PROF-02, PROF-03, PROF-04

**Success Criteria** (what must be TRUE):

1. Citizen profile displays display name, email, role badge, and municipality
2. Report tracker shows citizen's own active and recent reports with current publicStatus label
3. User can update notification preferences (push on/off, municipality alerts on/off, province alerts on/off)
4. Citizen can open any of their tracked reports for full detail

**Plans:** TBD

---

### Phase 10: Analytics + Disaster Mapping

**Goal:** Pre-aggregated analytics available at municipality and province levels

**Depends on:** Phase 6

**Requirements:** OBS-02 (analytics portion)

**Success Criteria** (what must be TRUE):

1. Scheduled Cloud Function computes daily and weekly analytics at municipality level (report counts by type, severity, status)
2. Scheduled Cloud Function computes daily and weekly analytics at province level
3. municipal_admin can view analytics dashboard scoped to their municipality
4. provincial_superadmin can view analytics dashboard across all municipalities or for the whole province
5. Analytics screens read pre-aggregated documents, never scan raw reports

**Plans:** TBD

---

### Phase 11: PWA + Accessibility + Hardening

**Goal:** Offline support, accessibility compliance, performance optimization, and SEO setup

**Depends on:** Phase 10

**Requirements:** A11Y-01, A11Y-02, A11Y-03, A11Y-04, A11Y-05, SEO-01, SEO-02, SEO-03

**Success Criteria** (what must be TRUE):

1. All interactive elements are keyboard navigable throughout the application
2. Modals manage focus correctly (trap focus on open, restore on close)
3. Color contrast meets WCAG 2.1 AA on both public and admin surfaces
4. Screen reader announces status changes and toast messages
5. Form inputs have associated labels; error messages are programmatically associated
6. Public routes have correct title, meta description, canonical URL, and Open Graph tags
7. sitemap.xml includes only public routes; robots.txt disallows /admin/, /profile/, /auth/
8. Admin, auth, profile, and authenticated routes have noindex meta tags

**Plans:** TBD

---

### Phase 12: Release Verification

**Goal:** Production-ready release with 90+ scorecard score

**Depends on:** Phase 11

**Requirements:** (all phases)

**Success Criteria** (what must be TRUE):

1. Full test suite passes (unit, integration, E2E)
2. Bantayog Alert Quality Scorecard evaluates to 90/100 or higher
3. Security audit passes with zero critical or high-severity flaws
4. Performance audit meets targets (LCP under 2.5s, CLS under 0.1)
5. All release blockers resolved before deployment
6. Application deployed to Firebase Hosting production

**Plans:** TBD

---

## Coverage

| Phase | Requirement Count | Requirements |
|-------|-------------------|--------------|
| 1 | 2 | SEC-06, SEC-05 |
| 2 | 9 | AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, AUTH-06, SEC-01, SEC-02, SEC-03 |
| 3 | 8 | REPO-01, REPO-02, REPO-03, REPO-04, REPO-05, FEED-01, FEED-02, SEC-04 |
| 4 | 10 | MAP-01, MAP-02, MAP-03, MAP-04, MAP-05, MAP-06, MAP-07, FEED-03, FEED-04, FEED-05 |
| 5 | 6 | MOBI-01, MOBI-02, MOBI-03, MOBI-04, MOBI-05, MOBI-06 |
| 6 | 13 | WORK-01, WORK-02, WORK-03, WORK-04, WORK-05, WORK-06, WORK-07, WORK-08, WORK-09, WORK-10, OBS-01, OBS-02, OBS-03 |
| 7 | 4 | CONT-01, CONT-02, CONT-03, CONT-04 |
| 8 | 8 | ALRT-01, ALRT-02, ALRT-03, ALRT-04, ALRT-05, ALRT-06, ALRT-07, ALRT-08 |
| 9 | 4 | PROF-01, PROF-02, PROF-03, PROF-04 |
| 10 | 1 | OBS-02 (analytics portion) |
| 11 | 8 | A11Y-01, A11Y-02, A11Y-03, A11Y-04, A11Y-05, SEO-01, SEO-02, SEO-03 |
| 12 | 0 | (verification phase) |
| **Total** | **72** | |

---

## Progress Table

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 3/3 | Complete | 2026-04-01 |
| 2. Auth & Role Model | 0/8 | Not started | - |
| 3. Reporting Domain | 0/8 | Not started | - |
| 4. Desktop Map + Modal Architecture | 0/9 | Not started | - |
| 5. Mobile Shell + Navigation | 0/6 | Not started | - |
| 6. Admin Triage + Workflow | 0/13 | Not started | - |
| 7. Contacts Directory | 0/4 | Not started | - |
| 8. Announcements + Push Notifications | 0/8 | Not started | - |
| 9. Profile + Report Tracker | 0/4 | Not started | - |
| 10. Analytics + Disaster Mapping | 0/5 | Not started | - |
| 11. PWA + Accessibility + Hardening | 0/8 | Not started | - |
| 12. Release Verification | 0/6 | Not started | - |

---

*Last updated: 2026-04-01*
