# Requirements — Bantayog Alert v1

## v1 Requirements

### AUTH — Authentication & Authorization

- [x] **AUTH-01**: User can sign up with email/password and create an account
- [x] **AUTH-02**: User can sign in and maintain a session across page reloads
- [x] **AUTH-03**: User can sign out from any page
- [x] **AUTH-04**: User roles (citizen, municipal_admin, provincial_superadmin) are stored as Firebase Auth custom claims
- [x] **AUTH-05**: RoleGate component restricts UI elements by role; ProtectedRoute redirects unauthenticated users
- [x] **AUTH-06**: municipal_admin custom claim includes assigned municipality code

### REPO — Report Submission

- [ ] **REPO-01**: Citizen can submit a report with type, category, severity, description, location (lat/lng/municipality/barangay), and optional media
- [ ] **REPO-02**: Report submission includes 60-second server-side rate limiting per user
- [ ] **REPO-03**: Media uploads (images) are compressed client-side to max 1024px dimension, 0.7 JPEG quality, stored in Firebase Storage
- [ ] **REPO-04**: All user text content (description, titles, bodies) is sanitized with DOMPurify before storage
- [ ] **REPO-05**: All write payloads are validated with Zod schemas before submission

### FEED — Feed & Map

- [ ] **FEED-01**: Public report feed displays reports newest-first, paginated (20 per page), cursor-based
- [ ] **FEED-02**: Feed queries are scoped by municipality for municipal_admin, province-wide for citizens viewing public reports
- [ ] **FEED-03**: Mobile and desktop map displays report pins with severity color coding
- [ ] **FEED-04**: Marker clustering activates when >50 pins are visible in viewport
- [ ] **FEED-05**: Map viewport changes are debounced 300ms before re-querying

### WORK — Workflow & Triage

- [ ] **WORK-01**: municipal_admin can verify a pending report (pending → verified)
- [ ] **WORK-02**: municipal_admin can reject a pending report with a reason (pending → rejected)
- [ ] **WORK-03**: municipal_admin can route a verified report by selecting a contact (verified → dispatched), storing immutable DispatchedTarget snapshot
- [ ] **WORK-04**: municipal_admin can acknowledge a dispatched report (dispatched → acknowledged)
- [ ] **WORK-05**: municipal_admin can mark an acknowledged report as in_progress (acknowledged → in_progress)
- [ ] **WORK-06**: municipal_admin can resolve an in_progress report with notes and evidence photos (in_progress → resolved)
- [ ] **WORK-07**: All state transitions use Firestore runTransaction to prevent race conditions
- [ ] **WORK-08**: Every state transition appends an Activity document (actorUid, action, previousState, newState, notes, timestamp)
- [ ] **WORK-09**: provincial_superadmin can perform all triage actions across any municipality
- [ ] **WORK-10**: Reports pending >72 hours are auto-rejected by a scheduled Cloud Function (actorUid='SYSTEM')

### CONT — Contacts Directory

- [ ] **CONT-01**: Admin can create contacts with agency name, contact person, phone, email, type (barangay/municipal/provincial/ngo/media/other), and municipality
- [ ] **CONT-02**: Admin can list contacts filtered by municipality
- [ ] **CONT-03**: Admin can edit and deactivate contacts
- [ ] **CONT-04**: Contact snapshots on dispatched reports are immutable (RoutingHistory integrity)

### ALRT — Announcements & Alerts

- [ ] **ALRT-01**: municipal_admin can create and publish an announcement scoped to their municipality only
- [ ] **ALRT-02**: provincial_superadmin can create and publish announcements scoped to any single municipality, multiple municipalities, or the whole province
- [ ] **ALRT-03**: Published announcements are visible in the Alerts tab to qualifying users (municipality + province-wide rules)
- [ ] **ALRT-04**: Citizens see multi_municipality announcements if their municipality is in targetMunicipalities
- [ ] **ALRT-05**: Announcement delivery logs are written to Announcement/notifications subcollection
- [ ] **ALRT-06**: Push notifications are sent via FCM topic (municipality_{code} or province_wide)
- [ ] **ALRT-07**: Published announcements cannot be edited; only provincial_superadmin can unpublish
- [ ] **ALRT-08**: Scheduled Cloud Function auto-expires announcements past expiresAt

### PROF — Profile & Report Tracker

- [ ] **PROF-01**: Citizen profile displays display name, email, role badge, and municipality
- [ ] **PROF-02**: Report tracker shows citizen's own active and recent reports with current publicStatus label
- [ ] **PROF-03**: User can update notification preferences (push on/off, municipality alerts on/off, province alerts on/off)
- [ ] **PROF-04**: Citizen can open any of their tracked reports for full detail

### MAP — Desktop Map Architecture

- [ ] **MAP-01**: Desktop uses AppShell with NavRail (64px, icon + tooltip) on the left
- [ ] **MAP-02**: MapCanvas (Leaflet) is always mounted in DesktopShell and never unmounts during navigation
- [ ] **MAP-03**: RightModal renders as a sibling to MapCanvas in DesktopShell DOM tree
- [ ] **MAP-04**: ModalContext manages modal open/close/section state; MapContext manages viewport/selected pin
- [ ] **MAP-05**: RightModal is section-aware: renders FeedPanel, ReportDetail, ProfilePanel, AlertsPanel, AdminPanel, ContactsPanel, or AnnouncementForm based on context section
- [ ] **MAP-06**: Clicking a map pin opens ReportDetail in RightModal; map viewport is unchanged
- [ ] **MAP-07**: Opening and closing the modal does not remount Leaflet or reset viewport

### MOBI — Mobile Shell

- [ ] **MOBI-01**: Mobile uses BottomTab with 4 tabs: Feed, Map, Alerts, Profile
- [ ] **MOBI-02**: FAB on Feed and Map tabs opens the 4-step report submission flow
- [ ] **MOBI-03**: Report submission flow: Type → Location (auto-detect with adjustable pin) → Details (category, severity, description) → Media (optional) → Submit
- [ ] **MOBI-04**: Mobile map has floating filter chips (type, severity) and current-location FAB
- [ ] **MOBI-05**: PWA manifest configured; service worker caches shell for offline use
- [ ] **MOBI-06**: Offline report submissions are queued in IndexedDB and retried on reconnect

### SEC — Security & Scoping

- [ ] **SEC-01**: Firestore security rules enforce municipality scope for all municipal_admin read/write operations
- [ ] **SEC-02**: municipal_admin can never read or write reports, contacts, announcements, or audit data outside their assigned municipality
- [ ] **SEC-03**: provincial_superadmin has province-wide access to all collections
- [ ] **SEC-04**: Citizens can only see public report fields; admin-only fields (verifiedBy, rejectedReason, dispatchedTo, etc.) are blocked by Firestore rules
- [x] **SEC-05**: Storage rules validate upload path (media/{userId}/{reportId}/{uuid}.{ext}), MIME type (jpeg/png/webp/mp4), and size (5MB/file, 10MB/report total)
- [x] **SEC-06**: Firebase Auth custom claims (role, municipality) are set exclusively by a privileged Cloud Function — never by the client

### A11Y — Accessibility

- [ ] **A11Y-01**: All interactive elements are keyboard navigable
- [ ] **A11Y-02**: Modals manage focus (trap focus on open, restore on close)
- [ ] **A11Y-03**: Color contrast meets WCAG 2.1 AA on both public and admin surfaces
- [ ] **A11Y-04**: Screen reader announces status changes and toast messages
- [ ] **A11Y-05**: Form inputs have associated labels; error messages are programmatically associated

### SEO — Search Engine Optimization

- [ ] **SEO-01**: Public routes (/) have correct title, meta description, canonical URL, and Open Graph tags
- [ ] **SEO-02**: sitemap.xml includes only public routes; robots.txt disallows /admin/, /profile/, /auth/
- [ ] **SEO-03**: Admin, auth, profile, and authenticated routes have noindex meta tags

### OBS — Observability

- [ ] **OBS-01**: All critical workflow mutations are logged to the audit collection (append-only)
- [ ] **OBS-02**: Failed push notification sends are marked failed in delivery log with error reason; retry scheduled
- [ ] **OBS-03**: Client-side error boundary catches and reports uncaught errors

## v2 Requirements (Deferred)

- [ ] Advanced analytics with charts, trend lines, disaster mapping overlays
- [ ] Anonymous/guest report submission (report without account)
- [ ] SMS fallback for push notification delivery
- [ ] WhatsApp integration for citizen alerts
- [ ] Two-factor authentication
- [ ] OAuth sign-in (Google)

## Out of Scope

| Exclusion | Reason |
|-----------|--------|
| Anonymous report submission without account | SPEC §Key Assumptions #9 — anonymous flags for follow-up, not unauthenticated submission |
| Paid map tile providers | OpenStreetMap only per SPEC §Key Assumptions #4 |
| Multi-role users | One role per user per SPEC §Key Assumptions #7 |
| Separate dev/staging Firebase projects | Single project with rules differentiation per SPEC §Key Assumptions #6 |
| Social features (comments, reactions beyond upvotes) | Scope clarity; upvotes are sufficient for citizen engagement signal |
| Real-time chat between citizens and responders | Out of scope for v1; adds complexity without clear requirements |
| Automated report deduplication | Requires ML/AI; manual dedup by admin is sufficient for v1 |

## Traceability

| REQ-ID | Phase | Status |
|--------|-------|--------|
| AUTH-01 | Phase 2 | Complete |
| AUTH-02 | Phase 2 | Complete |
| AUTH-03 | Phase 2 | Complete |
| AUTH-04 | Phase 2 | Complete |
| AUTH-05 | Phase 2 | Complete |
| AUTH-06 | Phase 2 | Complete |
| REPO-01 | Phase 3 | Pending |
| REPO-02 | Phase 3 | Pending |
| REPO-03 | Phase 3 | Pending |
| REPO-04 | Phase 3 | Pending |
| REPO-05 | Phase 3 | Pending |
| FEED-01 | Phase 3 | Pending |
| FEED-02 | Phase 3 | Pending |
| FEED-03 | Phase 4 | Pending |
| FEED-04 | Phase 4 | Pending |
| FEED-05 | Phase 4 | Pending |
| WORK-01 | Phase 6 | Pending |
| WORK-02 | Phase 6 | Pending |
| WORK-03 | Phase 6 | Pending |
| WORK-04 | Phase 6 | Pending |
| WORK-05 | Phase 6 | Pending |
| WORK-06 | Phase 6 | Pending |
| WORK-07 | Phase 6 | Pending |
| WORK-08 | Phase 6 | Pending |
| WORK-09 | Phase 6 | Pending |
| WORK-10 | Phase 6 | Pending |
| CONT-01 | Phase 7 | Pending |
| CONT-02 | Phase 7 | Pending |
| CONT-03 | Phase 7 | Pending |
| CONT-04 | Phase 7 | Pending |
| ALRT-01 | Phase 8 | Pending |
| ALRT-02 | Phase 8 | Pending |
| ALRT-03 | Phase 8 | Pending |
| ALRT-04 | Phase 8 | Pending |
| ALRT-05 | Phase 8 | Pending |
| ALRT-06 | Phase 8 | Pending |
| ALRT-07 | Phase 8 | Pending |
| ALRT-08 | Phase 8 | Pending |
| PROF-01 | Phase 9 | Pending |
| PROF-02 | Phase 9 | Pending |
| PROF-03 | Phase 9 | Pending |
| PROF-04 | Phase 9 | Pending |
| MAP-01 | Phase 4 | Pending |
| MAP-02 | Phase 4 | Pending |
| MAP-03 | Phase 4 | Pending |
| MAP-04 | Phase 4 | Pending |
| MAP-05 | Phase 4 | Pending |
| MAP-06 | Phase 4 | Pending |
| MAP-07 | Phase 4 | Pending |
| MOBI-01 | Phase 5 | Pending |
| MOBI-02 | Phase 5 | Pending |
| MOBI-03 | Phase 5 | Pending |
| MOBI-04 | Phase 5 | Pending |
| MOBI-05 | Phase 5 | Pending |
| MOBI-06 | Phase 5 | Pending |
| SEC-01 | Phase 2 | Pending |
| SEC-02 | Phase 2 | Pending |
| SEC-03 | Phase 2 | Pending |
| SEC-04 | Phase 3 | Pending |
| SEC-05 | Phase 1 | Complete |
| SEC-06 | Phase 1 | Complete |
| A11Y-01 | Phase 11 | Pending |
| A11Y-02 | Phase 11 | Pending |
| A11Y-03 | Phase 11 | Pending |
| A11Y-04 | Phase 11 | Pending |
| A11Y-05 | Phase 11 | Pending |
| SEO-01 | Phase 11 | Pending |
| SEO-02 | Phase 11 | Pending |
| SEO-03 | Phase 11 | Pending |
| OBS-01 | Phase 6 | Pending |
| OBS-02 | Phase 6 | Pending |
| OBS-03 | Phase 6 | Pending |
