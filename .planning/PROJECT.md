# Bantayog Alert

## What This Is

Production-grade disaster reporting, official alerting, emergency coordination, and disaster-mapping platform purpose-built for the Province of Camarines Norte, Philippines. Citizens submit emergency reports with structured metadata and media, track reports through resolution, consume a real-time feed and map of verified incidents, and receive official alerts relevant to their municipality. Municipal Admins operate within a hard-scoped municipality boundary for triage, verification, routing, and coordination. Provincial Superadmins oversee all 12 municipalities with province-wide visibility.

## Core Value

**Verified incidents are visible and actionable within seconds of confirmation** — citizens see real-time verified reports on map and feed; admins dispatch responders without delay; push alerts reach affected municipalities immediately.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Citizens submit emergency reports with type, severity, location, description, and optional media
- [ ] Citizens track their own reports through all states from submission to resolution
- [ ] Citizens consume a real-time map and paginated feed of verified incidents in their municipality
- [ ] Citizens receive push notifications for official alerts targeting their municipality
- [ ] Municipal Admins triage, verify, reject, dispatch, acknowledge, and resolve reports within their municipality
- [ ] Municipal Admins route reports to responder contacts with snapshot-captured contact details
- [ ] Municipal Admins send municipality-scoped announcements with push delivery
- [ ] Municipal Admins manage a local responder contacts directory
- [ ] Municipal Admins view scoped analytics and audit trails
- [ ] Provincial Superadmins oversee all reports and triage operations across all 12 municipalities
- [ ] Provincial Superadmins issue province-wide or multi-municipality announcements
- [ ] Provincial Superadmins access full analytics, audit, and disaster-mapping data
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

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Three-tier report split (reports + report_private + report_ops) | Firestore has no field-level read restrictions; cleanly separates public/owner/admin data | — Pending |
| Custom claims for RBAC (role + municipalityCode + provinceCode) | Verified in both Firestore rules and Cloud Functions; cannot be set by clients | — Pending |
| Map mounted as sibling to drawer (never child) | Prevents drawer open/close from triggering map remount or viewport reset | — Pending |
| React Query + Zustand | React Query handles Firestore caching/deduplication; Zustand handles synchronous UI state (drawer, filters, selected marker) | — Pending |
| Supercluster for marker clustering | Client-side clustering with decluster on zoom — no server-side clustering needed | — Pending |
| Approximate public locations (reduced precision geohash) | Protects reporter privacy; exact coordinates restricted to report_private | — Pending |
| Contact snapshots at dispatch time | Later edits to contact don't rewrite historical routing events | — Pending |

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
*Last updated: 2026-04-03 after initialization*
