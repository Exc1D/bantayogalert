# Project Research Summary

**Project:** Bantayog Alert
**Domain:** Disaster Reporting, Alerting, and Coordination Platform
**Researched:** 2026-04-03
**Confidence:** MEDIUM (STACK is HIGH; Features/Architecture/Pitfalls are MEDIUM due to web search unavailable during research)

## Executive Summary

Bantayog Alert is a production-grade disaster reporting and emergency coordination platform for Camarines Norte, Philippines. It enables citizens to submit geo-tagged emergency reports with media, track report status through a 7-state workflow, receive municipality-scoped push alerts, and coordinate response through municipal admin workflows. The platform uses a Firebase backend (Auth, Firestore, Cloud Functions v2, Storage, FCM) with a React 18 + Vite + Tailwind CSS frontend, Leaflet mapping, and a PWA architecture designed for offline resilience during disasters.

Research validates the SPECS-defined architecture as sound but identifies critical version constraints. React 18 must be used (NOT 19) because react-leaflet 4.x requires React 18. Tailwind CSS 3.4.17 must be used (NOT v4) due to breaking changes in the v3 config approach. The three-tier Firestore document split (`reports` / `report_private` / `report_ops`) is validated as the correct pattern, but atomic batch writes are non-negotiable to prevent state inconsistency during function timeouts.

Key risks requiring proactive mitigation: React-Leaflet double-mount in Strict Mode corrupts map state; Firestore security rules must use `get()` cross-collection references to prevent municipality scope leaks; disaster surge traffic will trigger per-user rate limits designed for steady-state abuse prevention; and PWA service worker caching requires careful invalidation to prevent stale verified reports from appearing hidden.

## Key Findings

### Recommended Stack

React 18.3.28 + Vite 8.0.3 + TypeScript 6.0.3 + Tailwind CSS 3.4.17 (NOT v4) form the stable foundation. Firebase SDK 12.11.0, firebase-functions 7.2.2, and firebase-admin 13.7.0 provide the backend. For mapping: Leaflet 1.9.4 + react-leaflet 4.2.1 (NOT v5, which requires React 19). State management: TanStack Query 5.96.2 (async/server state) + Zustand 5.0.12 (synchronous UI state). React Router stays on 6.5.0 (NOT v7, which has breaking changes).

**Critical constraints:**
- react-leaflet 4.2.1 requires React 18.x — React 19 + react-leaflet 5 has a different API
- Tailwind CSS v4 is incompatible with this project's v3 config approach (no tailwind.config.js in v4)
- vite-plugin-pwa 1.2.0 peer deps list Vite up to 7.x — Vite 8 is untested but likely compatible
- Node 20 LTS required for Cloud Functions v2

### Expected Features

**Must have (table stakes):** Report submission with location/media, map visualization with clustering, status tracking (owner + public views), push notifications for official alerts, authentication with role-based access (citizen/municipal_admin/provincial_superadmin), paginated feed, mobile-responsive experience (desktop map-first command center, mobile feed-first with bottom tabs).

**Should have (differentiators):** Server-side municipality scope enforcement (unique among peer platforms), three-tier report data separation (public/private/ops), optimistic concurrency for admin triage (version field), offline-capable PWA with draft autosave, feed+map dual-canvas where map never unmounts, pre-aggregated analytics (no raw report scanning).

**Defer (v2+):** SMS fallback (critical gap for Philippines disaster context but requires Twilio integration), two-way messaging, volunteer coordination, OCD/NDRRMC national integration, auto-routing with validated responder APIs, multi-language support (Bikol/Filipino).

**Important gap:** Phase 9 (Contacts Management) should come before or alongside Phase 8 (Admin Triage), not after. Dispatching requires contacts. SPECS has Triage before Contacts — flag for phase ordering review.

### Architecture Approach

The three-tier Firestore document split (`reports` / `report_private` / `report_ops`) is validated as correct and necessary. Firestore has no field-level read permissions, so three separate collections with different security rules is the only way to protect reporter privacy while enabling admin operations. All three documents for a single report must be written atomically using a `writeBatch` — sequential writes risk partial state if the function times out.

Cloud Functions v2 is production-stable and recommended. Callable functions own all status transitions and primary field updates. Firestore triggers (`onReportOpsWrite`) handle only side effects (analytics sync, notifications) and must NOT update fields owned by the callable. Scheduled functions use `onSchedule` with Pub/Sub under the hood.

React Query + Zustand separation is strict: React Query for Firestore async data (with `onSnapshot` bridged into React Query cache), Zustand only for synchronous UI state (drawer open/close, map viewport, selected marker). Never mix — no Zustand for Firestore data, no React Query for UI state.

Map architecture: `MapContainer` as a persistent sibling to the drawer, never a child. The sibling CSS layout (flex + width transition) handles drawer open/close without unmounting the map. Mobile uses `display: none/block` (not conditional render) to preserve the Leaflet instance across tab switches. React 18 Strict Mode double-mounts in development — a ref guard is required to prevent `MapContainer is already initialized` errors.

### Critical Pitfalls

1. **Firestore cross-collection scope leak** — The `get()` call in rules must cross-reference `report_ops.municipalityCode` for `report_private` reads. If `report_ops` does not exist, `get()` returns null and the comparison silently fails differently than expected. Must add explicit existence checks and comprehensive security rules tests covering the orphan document case. Phase 3 must include 60+ security rules tests.

2. **React-Leaflet double-mount in Strict Mode** — MapContainer initializes Leaflet on mount; React 18 Strict Mode double-invokes effects in dev. A ref guard is required. Phase 4 (Desktop/Mobile Shell) must implement this before any map integration work begins.

3. **State machine non-atomic batch writes** — If `triageReport` Cloud Function times out mid-batch across the three report tiers, the tiers become inconsistent. Use Firestore transactions with optimistic locking (version field). Triggers must only update fields they own, not fields the callable sets.

4. **Disaster surge rate limiting** — Per-user rate limits designed for abuse prevention become catastrophic during a real disaster (5,000+ reports in 2 hours). Implement a surge mode flag in Firestore that raises limits 5-10x. Allow admins to activate manually or auto-activate on volume thresholds.

5. **PWA service worker stale data** — Verified reports may appear hidden if the service worker serves a cached pre-verification state. Use NetworkFirst with short cache lifetime (5 min) for feeds. Never cache the owner's own report status — always fetch `report_private` directly for "My Reports" view.

## Implications for Roadmap

### Suggested Phase Structure

The SPECS 12-phase plan is broadly correct but two order adjustments are needed based on feature dependencies and pitfall timing.

**Phase 2-4 (Foundation) should be extended:**
- Phase 2: Domain Model & Schemas — define types, state machine, Zod schemas
- Phase 3: Auth & Role Model — custom claims, Firebase Auth, Firestore security rules (rules tests here, not later)
- Phase 4: Desktop/Mobile Shell — app shell, routing, Zustand stores, **MapGuard implementation**, sibling layout CSS

**Phase 5-6 dependency correction:** Phase 5 (Report Submission) depends on Phases 2, 3, and 4 — this is correct. Phase 6 (Map & Feed) depends on Phase 4 — this is correct. However, Phase 9 (Contacts) should be repositioned to come BEFORE Phase 8 (Admin Triage), not after, since the dispatch action requires a contact to dispatch to.

**Phase 8 (Admin Triage) must include:** Atomic batch writes in the triage callable, version-based optimistic locking, trigger separation (trigger only handles analytics/notifications, NOT status fields), and the surge mode rate limit design.

**Phase 12 (Hardening) scope:** App Check in audit mode throughout development (not enforcement until after 2-week real-user audit). PWA offline testing with actual network disruption scenarios. The "looks done but isn't" checklist must be executed before launch.

### Phase Ordering Rationale

1. **Security rules first, then data:** Phase 3 (Auth) writes Firestore rules. These rules must be tested comprehensively BEFORE Phase 5 (Report Submission) allows any writes. Rules tests are not a Phase 12 concern — they must be written alongside the rules in Phase 3.

2. **Map stability before map features:** Phase 4 (Shell) implements the sibling-map architecture with MapGuard. No map feature work (Phase 6) should begin until the map stability pattern is established and tested in Strict Mode.

3. **Contacts before Triage dispatch:** Dispatching a report to a responder requires a contact to exist. Phase 9 (Contacts CRUD) should precede or run alongside Phase 8 (Triage), not follow it. SPECS has Triage before Contacts — this is a process gap to address in roadmap review.

4. **Analytics after triage state changes:** Phase 11 (Analytics) requires the `onReportOpsWrite` trigger to fire on state transitions. It cannot meaningfully aggregate until Phase 8 provides actual state transitions. Correct in SPECS.

### Research Flags

**Phases needing deeper research:**
- **Phase 5 (Report Submission):** Offline draft behavior with IndexedDB needs device-level testing. PWA service worker integration with background sync is complex — consider a dedicated spike.
- **Phase 10 (Announcements):** FCM topic subscription validation server-side. Twilio SMS integration (if added as v1.x) is a separate integration with its own API research.
- **Phase 11 (Analytics):** Scheduled function aggregation at scale — when does the daily aggregation job become too expensive? Monitor Firestore read counts during load testing.

**Phases with standard patterns (skip research-phase):**
- **Phase 3 (Auth):** Firebase Auth + custom claims is well-documented. Follow official Firebase patterns.
- **Phase 6 (Map):** Leaflet + react-leaflet + supercluster is a known pattern. The sibling-map architecture is specified in SPECS and validated by architecture research.
- **Phase 7 (Profile):** Standard authenticated user profile view with React Query.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | npm versions verified 2026-04-03. Firebase SDK is current. React 18 + react-leaflet 4.x compatibility confirmed. Tailwind v3 confirmed. |
| Features | MEDIUM | Web search was unavailable; findings based on training data. SPECS feature set is comprehensive but gaps exist (SMS, two-way messaging). |
| Architecture | MEDIUM | Firebase/React patterns are well-documented and research validates SPECS. No web search available to verify against latest Firebase feature releases. |
| Pitfalls | MEDIUM | Community post-mortems, Firebase documentation, and training data provide strong patterns. React-Leaflet Strict Mode issue is a known issue. Some App Check specifics need verification. |

**Overall confidence:** MEDIUM — Strong structural confidence in stack and architecture. Moderate uncertainty in feature prioritization and some implementation specifics due to web search being unavailable during research.

### Gaps to Address

- **SMS Fallback:** No mechanism for feature phone users to submit via SMS. This is a critical gap for rural Camarines Norte where feature phone penetration is significant. Recommend adding Twilio integration as a v1.x milestone after core validation.

- **Phase ordering:** Phase 9 (Contacts) should precede Phase 8 (Triage). The dispatch action requires a contact to exist. SPECS roadmap needs adjustment.

- **App Check device coverage:** Some older Android WebViews and custom ROM devices may fail App Check attestation. Recommend audit mode throughout development and a fallback mechanism for the `submitReport` callable specifically.

- **Twilio/OCD integration:** Out of scope for v1 but noted as v2+ dependencies. Do not architect in ways that would make these integrations difficult.

## Sources

### Primary (HIGH confidence)
- npm registry version data (verified 2026-04-03)
- Firebase SDK 12.x documentation (official)
- React-Leaflet GitHub — peer dependency declarations
- Tailwind CSS v3.4 vs v4 migration guide

### Secondary (MEDIUM confidence)
- Firebase Cloud Functions v2 documentation — trigger types, callable patterns, scheduled functions
- Firestore Security Rules documentation — custom claims, cross-collection get() patterns
- React-Leaflet documentation — MapContainer lifecycle, Strict Mode behavior
- Architecture patterns for disaster reporting platforms (training data)

### Tertiary (LOW confidence — needs validation)
- Ushahidi platform feature set and patterns (training data through ~2024)
- Google Crisis Response capabilities (training data)
- Philippines disaster management context (NDRRMC, RDRRMC)
- Community post-mortems from similar platforms (Ushahidi, Humanitarian OpenStreetMap)

---

*Research completed: 2026-04-03*
*Ready for roadmap: yes — with phase ordering adjustment recommended*
