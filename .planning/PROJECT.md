# Bantayog Alert

## What This Is

Production-grade disaster reporting, official alerting, emergency coordination, and disaster-mapping platform purpose-built for the Province of Camarines Norte, Philippines. Citizens submit emergency reports with structured metadata and media, track reports through resolution, consume a real-time feed and map of verified incidents, and receive official alerts relevant to their municipality. Municipal Admins operate within a hard-scoped municipality boundary for triage, verification, routing, and coordination. Provincial Superadmins oversee all 12 municipalities with province-wide visibility.

## Core Value

**Verified incidents are visible and actionable within seconds of confirmation** — citizens see real-time verified reports on map and feed; admins dispatch responders without delay; push alerts reach affected municipalities immediately.

## Requirements

### Validated

- [x] Citizens submit emergency reports with type, severity, location, description, and optional media (Phase 05)
- [x] Citizens track their own reports through all states from submission to resolution (Phase 05)
- [x] Citizens consume a real-time map and paginated feed of verified incidents in their municipality (Phase 06)
- [x] Citizens view their profile, track submitted reports with owner status and activity timeline (Phase 07)
- [x] Citizens receive municipality-scoped and province-wide official alerts inside the app and through browser push wiring (Phase 10)
- [x] Municipal Admins create municipality-scoped announcements with draft, publish, and cancel flows (Phase 10)
- [x] Municipal Admins view scoped analytics dashboards and audit trails without raw client-side report scans (Phase 11)
- [x] Provincial Superadmins can target municipality, multi-municipality, or province-wide alert scope (Phase 10)
- [x] Provincial Superadmins access province-wide analytics, drill-down, audit history, and disaster-map overlays (Phase 11)

### Active
- [ ] Municipal Admins triage, verify, reject, dispatch, acknowledge, and resolve reports within their municipality
- [ ] Municipal Admins route reports to responder contacts with snapshot-captured contact details
- [ ] Municipal Admins manage a local responder contacts directory
- [ ] Provincial Superadmins oversee all reports and triage operations across all 12 municipalities
- [ ] Platform works on desktop (≥1280px) as a map-first command center with persistent Leaflet map and right-side workspace drawer
- [ ] Platform works on mobile (≤768px) as a feed-first mini social app with bottom-tab navigation
- [ ] Map never unmounts, resets viewport, or refetches when workspace drawer opens or closes
- [ ] Municipality scope is enforced server-side in Firestore security rules and Cloud Functions

### Out of Scope

- Video upload support — image-only media for v1 (storage/bandwidth costs)
- OAuth login — email/password + Google OAuth sufficient for v1
- Real-time chat between citizens and responders — structured triage workflow is the coordination mechanism
- Cross-province scope — Camarines Norte only for v1
- Native mobile app — PWA web app for v1

## Context

This is a greenfield project building toward a full production system. The SPECS.md defines a comprehensive 12-phase implementation plan with detailed technical architecture including:

- **Three-tier report model**: `reports` (public), `report_private` (owner+admin), `report_ops` (admin-only) — separates citizen-facing data from operational metadata
- **State machine**: 7 workflow states (pending → verified → rejected/dispatched → acknowledged → in_progress → resolved) with Cloud Function-enforced transitions
- **Three-layer status mapping**: WorkflowState (internal) → OwnerStatus (reporter sees) → PublicStatus (citizens see) — all computed by Cloud Functions, never client-generated
- **Firebase backend**: Auth, Firestore, Storage, Cloud Functions v2, FCM, Hosting — full serverless
- **React 18 + Vite + Tailwind CSS** frontend with React Query + Zustand for state management
- **Leaflet + React-Leaflet** for mapping with marker clustering
- **Philippines Data Privacy Act (RA 10173)** considerations: approximate public locations, sanitized text, consent at registration

## Constraints

- **Tech Stack**: Firebase + React 18 + Vite + Tailwind CSS — specified, not negotiable
- **Server-side Municipality Scope**: All municipality boundary enforcement must be in Firestore rules + Cloud Functions, never client-only filtering
- **Map Stability**: Leaflet MapContainer must never remount due to drawer/modal state changes — sibling layout architecture required
- **Pre-aggregated Analytics**: Clients never scan raw reports — Cloud Functions maintain analytics documents
- **Append-only Audit**: All significant state changes logged to immutable audit subcollections
- **Pending Reports Hidden**: Unverified reports not publicly visible; only submitting citizen sees their own pending reports
- **Performance Targets**: 90+/100 quality scorecard, Lighthouse ≥85 mobile, ≥95 desktop, LCP ≤2.5s, CLS ≤0.1

## Phase 1 Outcomes

**Phase 1 (Project Foundation & Tooling) — COMPLETED 2026-04-03**

Established the production-grade project scaffold:

- **Feature-based structure**: `src/features/{feature}/` with co-located components, hooks, types, and queries. Shared UI at `src/components/ui/`, utilities at `src/lib/`
- **Firebase single-project + env overlays**: `.env.local` for dev, `.env.production` for prod. Firebase config at `src/lib/firebase/config.ts`
- **Emulator suite**: Auth 9099, Firestore 8080, Storage 9199, Functions 5001, UI 4000
- **PWA**: vite-plugin-pwa with Workbox. CacheFirst for static assets, NetworkFirst for Firestore API, StaleWhileRevalidate for OSM tiles. `registerType: 'prompt'`
- **Test stack**: Vitest + @testing-library/react (unit), Playwright smoke tests in `tests/smoke/`
- **Dark mode**: `class` strategy on `<html>` element, NOT `media` query
- **Emergency theme**: `#dc2626` (red-600) — `theme_color` in PWA manifest
- **CI**: GitHub Actions pipeline with build → test → emulators:ci → smoke stages

**Version corrections applied during Phase 1** (CLAUDE.md had fabricated versions):
- react@18.3.28 → react@18.3.1 (18.3.28 does not exist on npm)
- react-dom@18.3.28 → react-dom@18.3.1
- @react-leaflet/core@2.1.1 → @react-leaflet/core@2.1.0 (2.1.1 does not exist)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Feature-based structure (src/features/) | Scales across 12 municipalities + multiple roles; co-located domain logic | ✓ Phase 1 |
| Firebase single-project + env overlays | Overhead of 3 projects unjustified for v1 | ✓ Phase 1 |
| Full strict TypeScript + noUncheckedIndexedAccess | Prevents null/undefined bugs in disaster scenarios | ✓ Phase 1 |
| PWA CacheFirst (assets) / NetworkFirst (API) / SWR (tiles) | Intermittent connectivity in disaster scenarios; stale tiles acceptable | ✓ Phase 1 |
| Vitest (unit) + Playwright (smoke) | Success criteria requires both; standard Vite ecosystem | ✓ Phase 1 |
| Class-based dark mode | Emergency workers may prefer dark in low-light conditions | ✓ Phase 1 |
| Three-tier report split (reports + report_private + report_ops) | Firestore has no field-level read restrictions; cleanly separates public/owner/admin data | — Pending Phase 5 |
| Custom claims for RBAC (role + municipalityCode + provinceCode) | Verified in both Firestore rules and Cloud Functions; cannot be set by clients | ✓ Phase 3 |
| Map mounted as sibling to drawer (never child) | Prevents drawer open/close from triggering map remount or viewport reset | — Pending Phase 4 |
| React Query + Zustand | React Query handles Firestore caching/deduplication; Zustand handles synchronous UI state | ✓ Phase 1 |
| Supercluster for marker clustering | Client-side clustering with decluster on zoom — no server-side clustering needed | — Pending Phase 6 |
| Approximate public locations (reduced precision geohash) | Protects reporter privacy; exact coordinates restricted to report_private | — Pending Phase 5 |
| Contact snapshots at dispatch time | Later edits to contact don't rewrite historical routing events | — Pending Phase 8 |
| Service worker Firebase config is handed off through IndexedDB | Files in `public/` cannot read Vite env vars directly; runtime config keeps the FCM worker deploy-safe | ✓ Phase 10 |
| Browser clients subscribe to FCM topics through a callable Cloud Function | The web FCM SDK cannot subscribe tokens to topics directly, so the server mediates municipality/province subscriptions | ✓ Phase 10 |
| Analytics and audit use route-backed admin workspaces with aggregate-only reads | Preserves the persistent map shell while keeping clients off raw reports and `report_ops` scans | ✓ Phase 11 |
| Global immutable `audit` documents complement `report_ops.activity` | Cross-entity audit browsing needs a single searchable stream beyond report-local history | ✓ Phase 11 |

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
4. Update Context with current state (users, feedback, metrics)

---
## Phase 3 Outcomes

**Phase 3 (Auth & Role Model) — COMPLETED 2026-04-03**

Established Firebase Auth, RBAC, and security layer:

- **Firebase Auth**: Email/password + Google OAuth with browserLocalPersistence (D-43, D-44, D-45)
- **AuthProvider context**: Exposes authenticated user with custom claims (role, municipalityCode, provinceCode) (D-48)
- **Auth UI**: Login, Register, Profile pages with route guards (ProtectedRoute, AdminRoute) (D-49, D-50)
- **Custom claims**: setUserRole callable CF (superadmin-only) + onUserCreated auth trigger for defaults (D-46, D-47)
- **Claims utilities**: Server-side (functions/src/auth/claims.ts) and client-side (src/lib/auth/claims.ts)
- **Firestore/Storage rules**: 68 Firestore tests + 23 Storage tests covering RBAC + municipality scope (D-53)
- **App Check**: Audit mode integration via CustomProvider (D-51)
- **Input sanitization**: HTML stripping via regex (functions/src/security/sanitize.ts)
- **Rate limiting**: 5 reports/hour default, 20/hour surge mode, per-municipality configurable (D-54)
- **Auth validation middleware**: validateSuperadmin, validateMunicipalAdmin, validateAuthenticated, validateWriteScope, validateRole

## Phase 10 Outcomes

**Phase 10 (Announcements, Push & Alerts) — COMPLETED 2026-04-04**

Established the official alerting layer:

- **Announcement model + rules**: Multi-scope targeting (`municipality`, `multi_municipality`, `province`) with Firestore rules and indexes aligned to the shared type model
- **Cloud Functions**: Draft creation, publish, cancel, scoped fetch, multicast push delivery, and topic subscription callable for browser clients
- **Push delivery tracking**: Per-recipient notification records written to `announcements/{id}/notifications/{userId}`
- **Client FCM wiring**: Browser token registration, municipality/province topic subscription, runtime service-worker config handoff, and foreground toast handling
- **Alerts UI**: `/app/alerts` feed for consumers and `/app/admin/alerts` authoring flow for admins
- **Shell integration**: Alerts surfaced in desktop/mobile navigation and linked from the admin queue

## Phase 11 Outcomes

**Phase 11 (Analytics & Disaster Mapping) — COMPLETED 2026-04-04**

Established the analytics and audit layer:

- **Aggregate analytics pipeline**: Cloud Functions maintain municipality and province aggregate documents plus a scheduled daily rollup for weekly/monthly buckets
- **Global audit stream**: Sensitive report, contact, announcement, and role mutations now emit immutable `audit/{auditId}` entries
- **Admin analytics route**: `/app/admin/analytics` renders scoped KPI cards, trend charts, timing stats, municipality drill-down, and hotspot rankings
- **Disaster-map overlay**: Aggregate hotspot counts can be toggled onto the persistent desktop map without replacing the map instance
- **Admin audit route**: `/app/admin/audit` renders filtered, paginated audit history with expandable event details
- **Shell integration**: Analytics and Audit are exposed in desktop navigation and mobile admin shortcuts
*Last updated: 2026-04-04 after Phase 11*
