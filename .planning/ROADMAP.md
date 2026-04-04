# Bantayog Alert — Roadmap

**Project:** Bantayog Alert — Disaster reporting platform for Camarines Norte, Philippines
**Granularity:** Fine (12 phases)
**Coverage:** 73/73 v1 requirements mapped

## Phases

- [ ] **Phase 1: Project Foundation & Tooling** — Scaffolding, CI/CD, PWA shell
- [x] **Phase 2: Domain Model & Backend Contracts** — Types, schemas, state machine, Firestore structure (completed 2026-04-03)
- [x] **Phase 3: Auth & Role Model** — Firebase Auth, custom claims, RBAC, security rules (completed 2026-04-03)
- [x] **Phase 4: Desktop & Mobile Shell** — Persistent map canvas, workspace drawer, bottom tabs (completed 2026-04-03)
- [ ] **Phase 5: Report Submission** — Multi-step form, location picker, media upload, three-tier doc creation
- [x] **Phase 6: Real-time Map & Feed** — Leaflet map, marker clustering, paginated feed, dual-canvas filters (completed 2026-04-03)
- [ ] **Phase 7: Profile & Report Tracker** — User profile, My Reports list, owner status display
- [x] **Phase 8: Contacts Management** — Responder contacts CRUD, municipality-scoped, snapshot capture (completed 2026-04-04)
- [ ] **Phase 9: Admin Triage** — Report verification, dispatch, routing, state machine, optimistic concurrency
- [x] **Phase 10: Announcements, Push & Alerts** — Announcement creation, FCM delivery, Alerts tab (completed 2026-04-04)
- [ ] **Phase 11: Analytics & Disaster Mapping** — Pre-aggregated dashboards, charts, audit log
- [ ] **Phase 12: Hardening, PWA, SEO & Release** — Accessibility audit, performance tuning, App Check enforcement

---

## Phase Details

### Phase 1: Project Foundation & Tooling

**Goal**: A production-ready project scaffold with working build, test, and development tooling.

**Depends on**: Nothing

**Requirements**: PWA-01, PWA-02, PWA-05, PWA-06

**Success Criteria** (what must be TRUE):
1. `npm run dev` starts the Vite dev server without errors
2. `npm run build` produces a production bundle with no TypeScript errors
3. `npm run test` executes Vitest tests and reports results
4. Firebase Emulator Suite starts and all emulators (Auth, Firestore, Storage, Functions) are reachable
5. Playwright smoke test runs headless and passes against the dev server
6. PWA service worker is registered and the app is installable via browser prompt
7. React Query and Zustand are initialized and accessible via provider context
8. App manifest is served with correct icons and theme colors for home-screen installation

**Plans**: 8 plans
- [x] 01-01-PLAN.md — Base Scaffold (package.json, tsconfig, vite.config, main.tsx, App.tsx)
- [x] 01-02-PLAN.md — Tooling Config (ESLint, Prettier, Tailwind, .env.example)
- [x] 01-03-PLAN.md — Firebase & Emulators (firebase.json, rules stubs, config.ts)
- [x] 01-04-PLAN.md — Feature Structure (providers, router, folder structure)
- [x] 01-05-PLAN.md — PWA Configuration (vite-plugin-pwa, manifest, icons)
- [x] 01-06-PLAN.md — Vitest Setup (test runner, smoke test)
- [x] 01-07-PLAN.md — Playwright Setup (e2e smoke tests)
- [ ] 01-08-PLAN.md — GitHub Actions CI (pipeline, .gitignore)

---

### Phase 2: Domain Model & Backend Contracts

**Goal**: All TypeScript interfaces, Zod schemas, enums, and Firestore collection structure are defined and validated.

**Depends on**: Phase 1

**Requirements**: DM-01, DM-02, DM-03, DM-04, DM-05, DM-06

**Success Criteria** (what must be TRUE):
1. All TypeScript interfaces from SPECS.md §5 compile without errors in both client and Cloud Functions
2. Zod schemas validate report submission payloads correctly and reject invalid data with clear messages
3. State machine `VALID_TRANSITIONS` map correctly allows and blocks all documented transitions
4. Three-layer status mapping (WorkflowState → OwnerStatus → PublicStatus) produces correct labels for every state
5. Firestore security rules are deployed to the emulator and pass baseline validation
6. Municipality and barangay catalog documents exist in the emulator Firestore with all 12 municipalities
7. Municipality GeoJSON loads from `/public/data/municipalities.geojson` and renders correctly on a test map

**Plans**: 5 plans
- [x] 02-01-PLAN.md — Types & Schemas (user, report, contact, announcement types + Zod)
- [x] 02-02-PLAN.md — Workflow State Machine (VALID_TRANSITIONS, WORKFLOW_TO_OWNER_STATUS)
- [x] 02-03-PLAN.md — Firestore Structure (collections, rules skeleton, municipality catalog)
- [x] 02-04-PLAN.md — GeoJSON & Municipality Data (barangay data, geo utilities)

---

### Phase 3: Auth & Role Model

**Goal**: Users can register, authenticate, and receive role-based custom claims enforced server-side.

**Depends on**: Phase 2

**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, AUTH-06, AUTH-07, AUTH-08, SEC-01, SEC-02, SEC-03, SEC-04, SEC-05, SEC-06, SEC-07

**Success Criteria** (what must be TRUE):
1. User can create an account with email and password and is immediately logged in after verification
2. User can sign in with Google OAuth and the account is created with correct default role
3. User receives an email verification link after registration and the account is unusable until verified
4. Authenticated user session persists across browser refresh without re-login
5. Superadmin can assign roles (citizen, municipal_admin, provincial_superadmin) to any user via the setUserRole callable
6. Firebase Auth custom claims (role, municipalityCode, provinceCode) are present in ID tokens and verified in Firestore security rules
7. Unauthenticated users attempting to access any app route are redirected to the login page
8. User can update their own display name and notification preferences in Profile
9. Firebase App Check is integrated and in audit/logging mode (not yet blocking traffic)
10. All Firestore security rules enforce RBAC and municipality scope — 60+ rules tests pass
11. Storage security rules restrict file uploads to images (jpeg/png/webp) under 10MB with correct path ownership
12. Cloud Functions validate role and municipality scope before processing any write
13. Input sanitization strips HTML from all text fields on write
14. Per-user rate limits are enforced on report creation (configurable surge mode available to admins)

**Plans**: 5 plans
- [x] 03-01-PLAN.md — Firebase Auth Setup (providers, persistence, AuthProvider)
- [x] 03-02-PLAN.md — Auth UI (Login/Register/Profile pages, route guards)
- [x] 03-03-PLAN.md — Custom Claims & setUserRole CF (callable + auth trigger)
- [x] 03-04-PLAN.md — Firestore & Storage Rules Tests (60+ rule tests)
- [x] 03-05-PLAN.md — App Check + Input Sanitization + Rate Limiting

---

### Phase 4: Desktop & Mobile Shell

**Goal**: The app shell renders correctly on desktop (map-first) and mobile (feed-first) with persistent map stability.

**Depends on**: Phase 3

**Requirements**: DSK-01, DSK-02, DSK-03, DSK-04, DSK-05, DSK-06, DSK-07, MOB-01, MOB-02, MOB-03, MOB-04, MOB-05, MOB-06, MOB-07, FM-09

**Success Criteria** (what must be TRUE):
1. Desktop viewport (≥1280px) renders a left navigation rail, persistent Leaflet map, and a 480px right workspace drawer
2. Navigation rail shows correct role-appropriate items (citizen: Map/Feed/Alerts/Profile/Report; admin adds Dashboard/Contacts/Analytics/Audit)
3. Workspace drawer slides in from the right when a panel route is active; map compresses to fill remaining width
4. Workspace drawer slides out on close; map returns to full width; Leaflet `invalidateSize()` is called after CSS transition completes
5. Leaflet MapContainer never remounts or resets viewport when drawer opens/closes — the DOM element is preserved
6. React 18 Strict Mode does not cause Leaflet initialization errors — the ref guard prevents double-mount
7. Mobile viewport (≤768px) renders a bottom tab bar with Feed/Map/Report/Alerts/Profile tabs
8. Mobile map tab preserves the Leaflet instance when switching tabs (CSS `display: none/block`, not conditional render)
9. Report submission opens as a full-screen modal on mobile
10. Tapping a report card navigates to a full-screen detail view with a back button
11. Admin functions are accessible via Profile tab → Admin Panel section on mobile
12. Pull-to-refresh on Feed tab triggers a fresh query; infinite scroll loads additional pages
13. Focus trapping in drawers and modals works correctly; pressing Escape closes active overlay and returns focus

**Plans**: 3 plans
- [x] 04-01-PLAN.md — Shell Scaffold (DesktopShell, MobileShell, WorkspaceDrawer, Zustand uiStore)
- [x] 04-02-PLAN.md — Navigation (DesktopNavRail, MobileBottomTabs, role-aware nav items)
- [x] 04-03-PLAN.md — Map Stability + Focus/Keyboard (ref guard, invalidateSize, focus trapping)

**UI hint**: yes

---

### Phase 5: Report Submission

**Goal**: Citizens can submit emergency reports with type, severity, location, description, and optional media.

**Depends on**: Phase 4

**Requirements**: RPT-01, RPT-02, RPT-03, RPT-04, RPT-05, RPT-06, RPT-07, RPT-08, RPT-09, RPT-10, RPT-11

**Success Criteria** (what must be TRUE):
1. Citizen can complete a multi-step report form: incident type → severity → description → location → media → review and submit
2. Location picker shows a Leaflet map with pin drop and GPS auto-detect; selected coordinates are validated within Camarines Norte bounds
3. Municipality and barangay selectors are populated from catalog data and correctly associate the selected location
4. Media upload accepts up to 5 images, compresses each client-side to max 1MB / 1920px, and uploads to Firebase Storage
5. Cloud Function creates three report documents (reports, report_private, report_ops) atomically on submission
6. Public report document uses approximate location (reduced precision geohash); exact coordinates are stored only in report_private
7. Unverified reports are hidden from public feed and map — only the submitting citizen sees their own pending report in Profile
8. Submitting citizen sees their own report immediately via a report_private listener
9. Submitting citizen receives owner-facing status labels (Submitted, Under Review, Verified, etc.) that reflect the three-layer status mapping
10. Report form draft is auto-saved to IndexedDB if the citizen abandons the form mid-submission

**Plans**: 5 plans
- [x] 05-00-PLAN.md — Test Infrastructure (vitest.config.ts, unit/integration/e2e test stubs)
- [x] 05-01-PLAN.md — Infrastructure + Cloud Function (submitReport CF, ReportFormSchema, /app/report route)
- [x] 05-02-PLAN.md — LocationPickerMap + Draft Hook + Media Upload
- [x] 05-03-PLAN.md — Multi-step ReportForm Wizard (4 step components)
- [x] 05-04-PLAN.md — Desktop/Mobile Shell Integration + Track Page

---

### Phase 6: Real-time Map & Feed

**Goal**: Citizens and admins see verified reports as real-time map pins and paginated feed cards.

**Depends on**: Phase 5

**Requirements**: FM-01, FM-02, FM-03, FM-04, FM-05, FM-06, FM-07, FM-08

**Success Criteria** (what must be TRUE):
1. Verified reports appear on the map as severity-colored pins within seconds of verification
2. Map marker clustering (supercluster) groups dense pins; declustering occurs on zoom
3. Municipality boundary GeoJSON overlays the map from the static asset
4. Filter bar (type, severity, municipality, date range) simultaneously filters map pins and feed results
5. Paginated feed shows verified report cards sorted by createdAt DESC with severity badge, type icon, location, time, and public status
6. Clicking a map pin opens the report detail modal (desktop) or bottom sheet (mobile)
7. Map viewport (center, zoom, selected markers) is preserved when the workspace drawer opens or closes
8. Real-time Firestore listener delivers new verified reports to both map and feed without a full refetch

**Plans**: 5 plans
- [x] 06-01-PLAN.md — Foundation core: filterStore, useVerifiedReportsListener, reportToGeoJSON, uiStore selectedReportId
- [x] 06-01b-PLAN.md — Supercluster infrastructure: useSupercluster, useMapViewport, firestore composite index
- [x] 06-02-PLAN.md — Map layer: ReportMarkers (Supercluster), MunicipalityBoundaries, FilterBar integration with map
- [x] 06-03-PLAN.md — Feed layer: ReportFeedCard, ReportFeed, useReportFeed pagination, DesktopShell 60/40 split
- [x] 06-04-PLAN.md — Report detail: ReportDetailPanel (shared), desktop drawer wiring, mobile /app/report/:id bottom sheet

**UI hint**: yes

---

### Phase 7: Profile & Report Tracker

**Goal**: Users can view their profile information and track all their submitted reports through to resolution.

**Depends on**: Phase 6

**Requirements**: TRK-01, TRK-02, TRK-03, TRK-04

**Success Criteria** (what must be TRUE):
1. Profile view displays the user's name, email, role, and notification preferences
2. "My Reports" list shows all reports submitted by the current user from report_private, with current owner status and latest update time
3. Clicking a tracked report opens the report detail view showing full history and current status
4. Activity timeline displays state transitions (submitted, verified, responders notified, resolved) visible to the reporter
5. Pending and rejected reports are visible to the owner but hidden from the public
6. User can update their notification preferences from the Profile view

**Plans**: 2 plans
- [x] 07-01-PLAN.md — My Reports list (useMyReports hook + MyReportsList component + Profile integration)
- [x] 07-02-PLAN.md — Owner report detail (ReportDetailOwner with activity timeline + owner-aware /app/report/:id view)

---

### Phase 8: Contacts Management

**Goal**: Municipal admins can manage a responder contacts directory scoped to their municipality.

**Depends on**: Phase 7

**Requirements**: CON-01, CON-02, CON-03, CON-04, CON-05, CON-06

**Success Criteria** (what must be TRUE):
1. Admin can create a responder contact with name, agency, type, phones, email, capabilities, and municipality
2. Admin can edit existing contacts and the changes are reflected immediately in the contacts list
3. Admin can deactivate and reactivate contacts; deactivated contacts do not appear in dispatch selection
4. Contact list is searchable by name and filterable by contact type and municipality
5. Municipal scope is enforced — a municipal admin can only view and manage contacts within their own municipality
6. When a report is dispatched to a contact, the contact's details are snapshotted into the routing event and preserved even if the contact is later edited

**Plans**: 4 plans
- [x] 08-01-PLAN.md — Contact CRUD Cloud Functions (createContact, updateContact, deactivateContact, getContacts)
- [x] 08-02-PLAN.md — Contacts UI Components (useContacts hook, ContactCard, ContactForm, ContactsList)
- [x] 08-03-PLAN.md — Contacts Search & Filter (ContactsFilterBar, ContactsPage, filter store)
- [x] 08-04-PLAN.md — Contacts Integration (router, nav, /app/contacts route)

---

### Phase 9: Admin Triage

**Goal**: Municipal admins can triage reports through all workflow states within their municipality boundary.

**Depends on**: Phase 8

**Requirements**: TRI-01, TRI-02, TRI-03, TRI-04, TRI-05, TRI-06, TRI-07, TRI-08, TRI-09, TRI-10, TRI-11, TRI-12, TRI-13, TRI-14, TRI-15, TRI-16

**Success Criteria** (what must be TRUE):
1. Municipal admin sees a scoped queue of pending, verified, and dispatched reports for their municipality only
2. Admin can verify a pending report (pending → verified) and the report becomes publicly visible
3. Admin can reject a pending report with a reason (pending → rejected); the reason is visible to the reporter
4. Admin can dispatch a verified report to a responder contact (verified → dispatched) with a routing destination
5. Admin can acknowledge a dispatched report (dispatched → acknowledged)
6. Admin can mark an acknowledged report as in_progress (acknowledged → in_progress)
7. Admin can resolve any non-terminal report with a summary (any → resolved)
8. Admin can reroute a dispatched or in_progress report to a different contact
9. Admin can set priority (1-5) and classification on any report
10. Admin can add internal notes that are visible only to admins
11. All triage actions are validated against the VALID_TRANSITIONS state machine — invalid transitions are rejected with a clear error
12. Optimistic concurrency (version field) prevents two admins from applying conflicting actions simultaneously
13. Every triage action creates an entry in the report_ops/activity subcollection and the global audit collection
14. Municipal scope is enforced server-side — admin can only triage reports belonging to their municipality
15. Provincial superadmin can view and triage pending reports across all 12 municipalities
16. Public and owner status documents are updated correctly by Cloud Function triggers after every triage action

**Plans**: 7 plans
- [ ] 09-01-PLAN.md — submitReport Fix (add municipalityCode + version: 1 to report_ops)
- [ ] 09-02-PLAN.md — Core Triage CFs Part 1 (triageVerify, triageReject, triageDispatch, triageAcknowledge + shared helpers)
- [ ] 09-03-PLAN.md — Core Triage CFs Part 2 (triageInProgress, triageResolve, triageReroute, triageUpdatePriority, triageUpdateNotes)
- [ ] 09-04-PLAN.md — Admin Queue UI Foundation (useAdminQueueListener, AdminQueueCard, PriorityStars, AdminQueueFeed)
- [ ] 09-05-PLAN.md — Admin Detail Panel & ContactPicker (AdminReportDetailPanel, ContactPickerModal, WorkspaceDrawer wiring)
- [ ] 09-06-PLAN.md — Routes & Navigation (router, DesktopShell, MobileShell admin nav)
- [ ] 09-07-PLAN.md — CF Exports (functions/src/index.ts exports for all 9 triage CFs)

---

### Phase 10: Announcements, Push & Alerts

**Goal**: Admins can issue municipality-scoped announcements with push notification delivery.

**Depends on**: Phase 9

**Requirements**: ALR-01, ALR-02, ALR-03, ALR-04, ALR-05, ALR-06, ALR-07

**Success Criteria** (what must be TRUE):
1. Admin can create an announcement with title, body, type (alert/advisory/update/all_clear), severity (info/warning/critical), and target scope
2. Municipal admin can only target their own municipality; provincial superadmin can target any scope (municipality, multi-municipality, province-wide)
3. Announcement transitions through draft → published → cancelled states; only published announcements are delivered
4. Published announcements appear in the Alerts tab for citizens and admins whose municipality matches the target
5. Push notifications are delivered via FCM to all users in the target scope who have push enabled
6. Delivery status is tracked per recipient in the notification subcollection (pending/delivered/failed/read)
7. Citizens see only alerts targeting their specific municipality or province-wide announcements

**Plans**: 5 plans
- [x] 10-01-PLAN.md — Announcement type extension + Firestore rules + composite indexes + env var
- [x] 10-02-PLAN.md — Cloud Functions (create, publish, cancel, getAnnouncements, sendAnnouncementPush)
- [x] 10-03-PLAN.md — Client FCM integration (service worker, messaging.ts, useFcmToken, useMunicipalityTopics, useAnnouncements)
- [x] 10-04-PLAN.md — Alerts UI (AlertCard, AlertsFeed, CreateAlertForm, /app/alerts route)
- [x] 10-05-PLAN.md — Alerts integration (DesktopShell, MobileShell, auth provider FCM wiring)

---

### Phase 11: Analytics & Disaster Mapping

**Goal**: Admins can view pre-aggregated analytics dashboards scoped to their boundary; raw reports are never scanned by clients.

**Depends on**: Phase 10

**Requirements**: ANL-01, ANL-02, ANL-03, ANL-04, ANL-05, ANL-06

**Success Criteria** (what must be TRUE):
1. Dashboard shows summary cards: total reports, pending, verified, resolved, rejected — accurate and real-time
2. Charts render correctly: reports by type (bar), severity (donut), over time (line), average resolution time
3. Municipal admin sees only their own municipality's analytics data
4. Provincial superadmin sees province-wide data with breakdown by municipality
5. All analytics are powered by pre-aggregated Firestore documents maintained by Cloud Functions — clients never scan raw report documents
6. Audit log viewer displays paginated entries with filters by action, entity, and user

**Plans**: TBD

---

### Phase 12: Hardening, PWA, SEO & Release

**Goal**: Platform meets the 90+/100 quality scorecard, is fully accessible, and is production-ready.

**Depends on**: Phase 11

**Requirements**: PWA-03, PWA-04, SEO-01, SEO-02, SEO-03, SEO-04, SEO-05, SEO-06, SEC-01

**Success Criteria** (what must be TRUE):
1. Offline report draft saved to IndexedDB submits automatically when connectivity is restored
2. Visible connection status indicator shows when the device is offline with clear messaging
3. Landing page serves with full meta tags, OG tags, and canonical URL for social sharing
4. Public map and alerts pages are indexed and accessible to search engines
5. robots.txt allows public routes and disallows /app/, /auth/, and /admin/
6. sitemap.xml includes landing, public/map, and public/alerts pages
7. Private app routes carry a noindex meta tag to prevent indexing
8. Dynamic OG tags are served on shared public alert pages via Cloud Function rewrite
9. Firebase App Check is moved from audit mode to enforcement after the 2-week burn-in period
10. Lighthouse performance scores meet targets: mobile ≥85, desktop ≥95, LCP ≤2.5s, CLS ≤0.1
11. Accessibility audit passes: semantic landmarks, keyboard navigation, focus trapping, ARIA labels, WCAG AA contrast
12. Service worker uses NetworkFirst for API/Firestore reads and CacheFirst for tile images; offline fallback page is served when fully offline

**Plans**: TBD

---

## Progress Table

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Project Foundation & Tooling | 7/8 | In Progress | |
| 2. Domain Model & Backend Contracts | 4/4 | Complete | 2026-04-03 |
| 3. Auth & Role Model | 5/5 | Complete | 2026-04-03 |
| 4. Desktop & Mobile Shell | 3/3 | Complete | 2026-04-03 |
| 5. Report Submission | 4/5 | In Progress | |
| 6. Real-time Map & Feed | 5/5 | Complete   | 2026-04-03 |
| 7. Profile & Report Tracker | 1/2 | In Progress | |
| 8. Contacts Management | 4/4 | Complete   | 2026-04-04 |
| 9. Admin Triage | 0/7 | Not started | |
| 10. Announcements, Push & Alerts | 5/5 | Complete    | 2026-04-04 |
| 11. Analytics & Disaster Mapping | 0/6 | Not started | |
| 12. Hardening, PWA, SEO & Release | 0/12 | Not started | |

---

## Phase Ordering Note

**Research flag applied:** Phase 8 (Contacts Management) has been reordered to come BEFORE Phase 9 (Admin Triage). The dispatch action in Admin Triage (TRI-04) requires an existing contact to dispatch to. Creating contacts first establishes the foundation for dispatch workflows. The SPECS document had Contacts after Triage; this roadmap corrects the ordering.

**Final phase order:** 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10 → 11 → 12

---

*Roadmap created: 2026-04-03*
*Derived from: REQUIREMENTS.md, SPECS.md, research/SUMMARY.md*
