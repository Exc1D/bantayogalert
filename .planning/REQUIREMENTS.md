# Requirements: Bantayog Alert

**Defined:** 2026-04-03
**Core Value:** Verified incidents are visible and actionable within seconds of confirmation — citizens see real-time verified reports on map and feed; admins dispatch responders without delay; push alerts reach affected municipalities immediately.

## v1 Requirements

### Authentication

- [x] **AUTH-01**: User can sign up with email and password
- [x] **AUTH-02**: User can sign in with Google OAuth
- [x] **AUTH-03**: User receives email verification after signup
- [x] **AUTH-04**: User session persists across browser refresh
- [ ] **AUTH-05**: Superadmin can assign roles (citizen, municipal_admin, provincial_superadmin) via setUserRole callable
- [x] **AUTH-06**: Custom claims (role, municipalityCode, provinceCode) are enforced server-side
- [x] **AUTH-07**: User can update own display name and notification preferences
- [x] **AUTH-08**: Unauthenticated users are redirected to login

### Domain Model

- [x] **DM-01**: All report entities defined with TypeScript types matching SPECS.md §5
- [x] **DM-02**: Zod validation schemas shared between client and Cloud Functions
- [ ] **DM-03**: Workflow state machine with VALID_TRANSITIONS map enforced server-side
- [ ] **DM-04**: Three-layer status mapping (WorkflowState → OwnerStatus → PublicStatus) computed by Cloud Functions
- [ ] **DM-05**: Municipality and barangay catalog data seeded in Firestore
- [ ] **DM-06**: Municipality GeoJSON bundled as static asset in /public/data/

### Report Submission

- [ ] **RPT-01**: Citizen can submit report with type, severity, description, location, and optional media
- [ ] **RPT-02**: Location picker with Leaflet map pin drop + GPS auto-detect
- [ ] **RPT-03**: Municipality and barangay selectors driven by catalog data
- [ ] **RPT-04**: Coordinate validation within Camarines Norte bounds (~14.0°–14.5°N, 122.5°–123.0°E)
- [ ] **RPT-05**: Media upload with client-side compression (max 1MB, 1920px, JPEG/WebP)
- [ ] **RPT-06**: Cloud Function creates three-tier report docs (reports + report_private + report_ops) atomically
- [ ] **RPT-07**: Public report uses approximate location (reduced precision); exact location in report_private
- [ ] **RPT-08**: Unverified reports are hidden from public feed and map
- [ ] **RPT-09**: Reporter can track own pending/rejected reports in Profile
- [ ] **RPT-10**: Submitting citizen sees own report immediately via report_private listener
- [ ] **RPT-11**: Submitting citizen receives owner-facing status labels (Submitted, Under Review, Verified, etc.)

### Report Feed & Map

- [ ] **FM-01**: Verified reports appear in real-time on map as severity-colored pins
- [ ] **FM-02**: Map uses marker clustering (supercluster) for areas with many reports
- [ ] **FM-03**: Municipality boundary GeoJSON overlay on map
- [ ] **FM-04**: Filter bar filters map pins and feed simultaneously (type, severity, municipality, date range)
- [ ] **FM-05**: Paginated feed of verified report cards sorted by createdAt DESC
- [ ] **FM-06**: Report cards show severity badge, type icon, location, time, public status
- [ ] **FM-07**: Clicking map pin opens report detail modal (desktop) or bottom sheet (mobile)
- [ ] **FM-08**: Map viewport and selected markers preserved when workspace drawer opens/closes
- [ ] **FM-09**: Leaflet MapContainer never remounts due to drawer/modal state changes

### Report Tracking

- [ ] **TRK-01**: Citizen sees "My Reports" list in Profile from report_private
- [ ] **TRK-02**: Each tracked report shows owner status, latest update time, and outcome
- [ ] **TRK-03**: Clicking tracked report opens report detail with full history
- [ ] **TRK-04**: Activity timeline shows state transitions visible to the reporter

### Admin Triage

- [ ] **TRI-01**: Municipal admin sees scoped queue of pending/verified/dispatched reports
- [ ] **TRI-02**: Admin can verify a pending report (pending → verified)
- [ ] **TRI-03**: Admin can reject a pending report with reason (pending → rejected)
- [ ] **TRI-04**: Admin can dispatch a verified report to a responder contact (verified → dispatched)
- [ ] **TRI-05**: Admin can acknowledge a dispatched report (dispatched → acknowledged)
- [ ] **TRI-06**: Admin can mark acknowledged report as in_progress (acknowledged → in_progress)
- [ ] **TRI-07**: Admin can resolve a report with summary (any non-terminal state → resolved)
- [ ] **TRI-08**: Admin can reroute a dispatched/in_progress report to a different contact
- [ ] **TRI-09**: Admin can add classification and priority to reports
- [ ] **TRI-10**: Admin can add internal notes to reports
- [ ] **TRI-11**: All triage actions validate against VALID_TRANSITIONS state machine
- [ ] **TRI-12**: Optimistic concurrency (version field) prevents conflicting simultaneous admin actions
- [ ] **TRI-13**: Triage actions log to report_ops/activity subcollection
- [ ] **TRI-14**: Triage actions create audit log entries
- [ ] **TRI-15**: Province-wide pending queue visible to provincial_superadmin
- [ ] **TRI-16**: Municipal scope enforced server-side — admin can only triage own municipality's reports

### Contacts Management

- [ ] **CON-01**: Admin can create responder contact with name, agency, type, phones, email, capabilities
- [ ] **CON-02**: Admin can edit existing contacts
- [ ] **CON-03**: Admin can deactivate/reactivate contacts
- [ ] **CON-04**: Contact list is searchable and filterable by type and municipality
- [ ] **CON-05**: Municipal scope enforced — admin manages only own municipality's contacts
- [ ] **CON-06**: At dispatch, contact details are snapshotted into the report routing event

### Announcements & Alerts

- [ ] **ALR-01**: Admin can create announcement with title, body, type, severity, scope, target municipalities
- [ ] **ALR-02**: Municipal admin can only target own municipality (province_admin can target any scope)
- [ ] **ALR-03**: Announcement status: draft → published → cancelled
- [ ] **ALR-04**: Published announcements visible in Alerts tab scoped by targetKeys
- [ ] **ALR-05**: Push notification delivery via FCM to targeted users
- [ ] **ALR-06**: Delivery status tracked per recipient in notifications subcollection
- [ ] **ALR-07**: Citizens see only alerts targeting their municipality or province-wide

### Desktop Shell

- [ ] **DSK-01**: Desktop layout (≥1280px) renders persistent Leaflet map + left navigation rail + right workspace drawer
- [ ] **DSK-02**: Navigation rail shows role-appropriate items (citizen sees Map/Feed/Alerts/Profile/Report; admin adds Dashboard/Contacts/Analytics/Audit)
- [ ] **DSK-03**: Workspace drawer (480px) slides in from right when panel route is active
- [ ] **DSK-04**: Map compresses to fill remaining width when drawer is open
- [ ] **DSK-05**: Report detail modal is centered overlay, independent of drawer
- [ ] **DSK-06**: Closing drawer returns to full map view; map state preserved
- [ ] **DSK-07**: Leaflet invalidateSize() called after drawer CSS transition completes

### Mobile Shell

- [ ] **MOB-01**: Mobile layout (≤768px) renders bottom tab bar with Feed/Map/Report/Alerts/Profile
- [ ] **MOB-02**: Map tab is full-screen Leaflet with clustered pins
- [ ] **MOB-03**: Map instance preserved via CSS display:none/block on tab switch
- [ ] **MOB-04**: Report submission opens as full-screen modal
- [ ] **MOB-05**: Tapping report card navigates to full-screen detail view
- [ ] **MOB-06**: Admin functions accessible via Profile → Admin Panel section
- [ ] **MOB-07**: Pull-to-refresh on Feed tab; infinite scroll for pagination

### Analytics & Monitoring

- [ ] **ANL-01**: Dashboard shows summary cards: total reports, pending, verified, resolved, rejected
- [ ] **ANL-02**: Charts: reports by type (bar), severity (donut), over time (line), avg resolution time
- [ ] **ANL-03**: Municipal admin sees only own municipality data
- [ ] **ANL-04**: Provincial superadmin sees province-wide data
- [ ] **ANL-05**: Analytics pre-aggregated via Cloud Functions triggers + scheduled jobs — clients never scan raw reports
- [ ] **ANL-06**: Audit log viewer with filters by action/entity/user and paginated results

### Infrastructure & Security

- [ ] **SEC-01**: Firebase App Check integrated (audit mode initially, enforcement after 2-week burn-in)
- [x] **SEC-02**: Firestore security rules enforce RBAC and municipality scope at all layers
- [x] **SEC-03**: Storage security rules restrict file types (image/jpeg, image/png, image/webp), size (10MB), and path ownership
- [ ] **SEC-04**: Cloud Function authorization checks role + municipality scope before any write
- [ ] **SEC-05**: Input sanitization on all text fields (HTML stripping, XSS prevention)
- [ ] **SEC-06**: Rate limiting on report creation (surge mode configurable by admin)
- [ ] **SEC-07**: Per-user rate limits prevent abuse during legitimate disaster spikes

### PWA & Offline

- [x] **PWA-01**: Service worker (Workbox via vite-plugin-pwa) with NetworkFirst for API, CacheFirst for tiles
- [x] **PWA-02**: App shell, critical CSS/JS, and municipality GeoJSON pre-cached
- [ ] **PWA-03**: Offline report draft saved to IndexedDB; submit when online
- [ ] **PWA-04**: Visible connection status indicator with offline messaging
- [x] **PWA-05**: Custom install prompt for home-screen installation
- [x] **PWA-06**: App manifest with proper icons and theme colors

### SEO & Public Surfaces

- [ ] **SEO-01**: Landing page with full meta tags, OG tags, canonical URL
- [ ] **SEO-02**: Public map and alerts pages are indexed
- [ ] **SEO-03**: robots.txt allows public routes, disallows app/auth/admin
- [ ] **SEO-04**: sitemap.xml includes landing, public/map, public/alerts
- [ ] **SEO-05**: Private app routes have noindex meta tag
- [ ] **SEO-06**: Dynamic OG tags for shared public alert pages via Cloud Function rewrite

## v2 Requirements

These are acknowledged but deferred to a future release.

### Communications

- **SMS-01**: SMS fallback via Twilio for feature phones and data-network outages during disasters
- **MSG-01**: Two-way messaging between reporter and assigned responder (post-dispatch)
- **MSG-02**: In-app notification center with read/unread state

### Integration

- **INT-01**: NDRRMC/OCD integration for province-wide emergency broadcast
- **INT-02**: Auto-routing to responder agency dispatch systems (depends on agency API availability)

### Advanced Features

- **ADV-01**: Volunteer coordination module
- **ADV-02**: Disaster hotspot prediction using historical data
- **ADV-03**: Damage assessment survey tool post-incident
- **ADV-04**: Multi-language support (Bikol, Filipino)

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Video upload | Storage/bandwidth costs; image-only for v1 |
| OAuth beyond Google | Email/password + Google sufficient for v1 |
| Cross-province scope | Camarines Norte only for v1 |
| Native mobile app | PWA web app for v1; mobile app deferred |
| Real-time citizen-to-responder chat | Structured triage workflow is coordination mechanism |
| Public admin notes visibility | Admin-only notes stay private |
| User profile photos for citizens | Avatar upload out of scope for v1 |

## Traceability

Requirement-to-phase mapping populated during roadmap creation.
Note: Phase 8 (Contacts) and Phase 9 (Admin Triage) were reordered per research — dispatch requires existing contacts.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 through AUTH-08 | Phase 3 | Pending |
| DM-01 through DM-06 | Phase 2 | Pending |
| RPT-01 through RPT-11 | Phase 5 | Pending |
| FM-01 through FM-09 | Phase 6 | Pending |
| TRK-01 through TRK-04 | Phase 7 | Pending |
| CON-01 through CON-06 | Phase 8 | Pending |
| TRI-01 through TRI-16 | Phase 9 | Pending |
| ALR-01 through ALR-07 | Phase 10 | Pending |
| DSK-01 through DSK-07 | Phase 4 | Pending |
| MOB-01 through MOB-07 | Phase 4 | Pending |
| ANL-01 through ANL-06 | Phase 11 | Pending |
| SEC-01 through SEC-07 | Phase 3 + Phase 12 | Pending |
| PWA-01 through PWA-06 | Phase 1 + Phase 12 | Pending |
| SEO-01 through SEO-06 | Phase 12 | Pending |

**Coverage:**
- v1 requirements: 73 total
- Mapped to phases: 73
- Unmapped: 0

---
*Requirements defined: 2026-04-03*
*Last updated: 2026-04-03 after roadmap creation — phase order corrected (Contacts before Triage)*
