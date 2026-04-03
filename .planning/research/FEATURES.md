# Feature Research

**Domain:** Disaster Reporting, Alerting, and Coordination Platform
**Researched:** 2026-04-03
**Confidence:** LOW (web search tools unavailable; findings based on training data)

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels broken. These are non-negotiable for launch.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Report submission (type, location, description, media) | Core value proposition - citizens need to report incidents | MEDIUM | SPECS covers well via multi-step form (Phase 5). Location picker + media upload are standard. |
| Map visualization of verified incidents | Visual situational awareness is primary UX for disaster response | MEDIUM | SPECS covers via Leaflet + marker clustering (Phase 6). Municipality boundaries as GeoJSON overlay is solid. |
| Status tracking for reporters | Citizens need to know what happened with their report | LOW | SPECS covers via three-layer status (owner/public/internal) - well designed. Owner sees granular status. |
| Official alerts/notifications | Government-issued emergency information is primary trust signal | MEDIUM | SPECS covers via Announcements + FCM push (Phase 10). Municipality-scoped targeting is good. |
| User authentication (citizen + admin roles) | Access control and identity are foundational | MEDIUM | SPECS covers via Firebase Auth + custom claims (Phase 3). Three roles clearly defined. |
| Paginated report feed | Mobile-first users scroll; desktop users browse | LOW | SPECS covers via React Query + cursor pagination (Phase 6). |
| Basic search/filter (by type, severity, municipality) | Users need to find relevant incidents | LOW | SPECS covers in map filter bar (Phase 6). |
| Mobile-responsive experience | Citizens use phones; admins use desktops | MEDIUM | SPECS covers via Desktop Shell + Mobile Shell (Phase 4). Bottom tabs for mobile, nav rail for desktop. |

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required, but valuable. Bantayog Alert's design decisions here are strong.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Municipality scope as server-side security boundary | Prevents data leaks between municipalities; critical for government trust | HIGH | Unique among peer platforms. Most platforms do client-side filtering only. SPECS enforces at Firestore rules + Cloud Functions layers. |
| Three-tier report data model (public/private/ops) | Protects reporter privacy (exact location, contact) while enabling admin operations | HIGH | Well-designed. `reports` = citizen-visible, `report_private` = owner+admin, `report_ops` = admin-only. |
| Optimistic concurrency for admin triage | Prevents conflicting admin actions on same report | MEDIUM | SPECS implements via `version` field in `report_ops`. Prevents two admins from simultaneously verifying/rejecting. |
| Offline-capable PWA with draft autosave | Disaster networks go down; citizens may lose connectivity | MEDIUM | SPECS covers via vite-plugin-pwa + IndexedDB draft (Phase 5). Critical for rural Camarines Norte. |
| Feed + map dual-canvas (desktop map never unmounts) | Map state preserved across navigation; no jarring remounts | MEDIUM | SPECS architectural decision (MapContainer as sibling, not child). Essential for admin UX. |
| Append-only activity subcollections with snapshots | Full audit trail + contact snapshots preserved after edits | LOW | SPECS covers contact snapshot at dispatch time. Edits don't rewrite history. |
| Push notification delivery with logging | Announcements reach citizens even when app is closed | MEDIUM | SPECS covers via FCM fan-out + notification subcollection logs. Delivery tracking per recipient. |
| Pre-aggregated analytics (no raw scan) | Dashboard performant at scale; analytics don't degrade as reports grow | MEDIUM | SPECS covers via scheduled + trigger-based aggregation. Client never scans raw reports. |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Real-time citizen-visible WebSocket updates | "Wouldn't it be great if citizens saw reports appear instantly?" | Firebase real-time listeners are already near-real-time (sub-second). Adding WebSocket/SSE adds massive infrastructure complexity for imperceptible improvement. Firebase listeners + React Query staleTime handle this. | Use Firestore `onSnapshot` with reasonable `staleTime`. Citizen feed refreshes via standard listener. |
| Excessive incident type categories | "We should distinguish ALL disaster types" | 12 incident types in SPECS is already near the upper limit. More types = citizens confused about which bucket, admin overhead, analytics fragmentation. | Keep 12 types. Adding subtypes via classification field (Phase 8) is better. |
| Exact coordinates visible to all verified users | "Responding agencies need precise locations" | Privacy risk for reporters. Locations can be misused. Exact coords are in `report_private` (admin+owner only). | Keep approximate public coords. Admin/responder access via `report_private` tier. |
| Public admin notes and internal comments | "Citizens should see the response process" | Admin notes may contain sensitive info (suspect descriptions, vulnerabilities). Breaks separation of concerns. | Public activity feed shows citizen-friendly status transitions only. Admin notes stay in `report_ops`. |
| Citizen-to-citizen messaging or comments | "Affected people should be able to coordinate" | Misinformation risk. Spam/abuse. Moderation burden. Not core to disaster response mandate. | Focus on agency-citizen communication via official announcements. Two-way messaging (see Gaps) is a v2+ consideration. |
| Real-time "dispatcher wall" with all active incidents | "Control room needs to see everything at once" | Cognitive overload. Province-wide wall = chaos. Municipal scoping is correct. | Admin queue scoped to municipality + filtered states (pending/verified/dispatched). |
| Auto-routing/auto-assignment of reports to responders | "Speed up response by automating dispatch" | Risky without validated contact info and capabilities. Can misroute to wrong agency. Requires deep integration with responder systems. | Manual dispatch (Phase 8) with contact snapshots. Auto-routing is v2+ if responder APIs become available. |

## Feature Dependencies

```
REPORT SUBMISSION (Phase 5)
    └──requires──> AUTH & ROLES (Phase 3)
    └──requires──> DESKTOP/MOBILE SHELL (Phase 4)
    └──requires──> DOMAIN MODEL (Phase 2 - types, schemas, state machine)

ADMIN TRIAGE (Phase 8)
    └──requires──> REPORT SUBMISSION (Phase 5)
    └──requires──> AUTH & ROLES (Phase 3)
    └──requires──> CONTACTS MANAGEMENT (Phase 9)

ANNOUNCEMENTS & ALERTS (Phase 10)
    └──requires──> AUTH & ROLES (Phase 3)
    └──requires──> ADMIN TRIAGE (Phase 8) [optional but contextual - admins create announcements based on incoming reports]

CONTACTS MANAGEMENT (Phase 9)
    └──requires──> AUTH & ROLES (Phase 3)

ANALYTICS (Phase 11)
    └──requires──> ADMIN TRIAGE (Phase 8) [needs report state changes to aggregate]

MAP & FEED (Phase 6)
    └──requires──> DOMAIN MODEL (Phase 2)
    └──requires──> DESKTOP/MOBILE SHELL (Phase 4)

PROFILE & REPORT TRACKER (Phase 7)
    └──requires──> REPORT SUBMISSION (Phase 5)
```

### Dependency Notes

- **Report Submission requires Auth/Shell/Domain Model:** Phase 5 cannot start until Phases 2, 3, and 4 are complete. This is correctly sequenced in SPECS.
- **Admin Triage requires Contacts:** Phase 9 (Contacts) should arguably come before or alongside Phase 8 (Triage), since dispatching requires contacts. However SPECS has Triage before Contacts. Flag for review.
- **Analytics requires triage state changes:** The aggregation triggers depend on `report_ops` state transitions, so Phase 11 must come after Phase 8.
- **Map/Feed requires Shell:** Phase 6 depends on Phase 4 (Shell). Correctly sequenced.

## MVP Definition

### Launch With (v1)

Minimum viable product - what's needed to validate the concept. Be ruthless.

- [x] Report submission (type, location, description, media) - Phase 5
- [x] Map of verified incidents (Leaflet, clustered) - Phase 6
- [x] Report status tracking (owner view in Profile) - Phase 7
- [x] Admin triage workflow (verify, reject, dispatch, resolve) - Phase 8
- [x] Municipality-scoped announcements (push notifications) - Phase 10
- [x] Basic authentication (citizen + admin roles) - Phase 3
- [x] Contacts directory (CRUD, scoped) - Phase 9

### Add After Validation (v1.x)

Features to add once core is working.

- [ ] Analytics dashboard (charts, aggregates) - Phase 11
- [ ] Full audit log viewer - Phase 11
- [ ] Bulk report operations (bulk verify, bulk reject for spam)
- [ ] Report duplication detection (suggest existing report vs. new)
- [ ] Scheduled announcement delivery (pre-schedule for typhoon season)
- [ ] SMS fallback (see Gaps section)

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- [ ] Two-way messaging (admin can send update to reporter)
- [ ] Volunteer coordination module
- [ ] Integration with OCD/NDRRMC national systems
- [ ] Auto-routing to responder agencies with validated APIs
- [ ] Infrastructure damage assessment forms
- [ ] Multi-language support (Bikol, Filipino)
- [ ] Data export for citizens (GDPR-equivalent PH DPA rights)

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Report submission (multi-step form) | HIGH | MEDIUM | P1 |
| Map + feed of verified incidents | HIGH | MEDIUM | P1 |
| Admin triage workflow | HIGH | HIGH | P1 |
| Authentication + roles | HIGH | MEDIUM | P1 |
| Municipality-scoped announcements | HIGH | MEDIUM | P1 |
| Contacts CRUD | MEDIUM | LOW | P1 |
| Three-tier report separation | HIGH | HIGH | P1 (architectural) |
| Push notifications | MEDIUM | MEDIUM | P1 |
| Analytics dashboard | MEDIUM | MEDIUM | P2 |
| Audit log viewer | MEDIUM | LOW | P2 |
| Offline PWA + draft autosave | MEDIUM | MEDIUM | P2 |
| SMS fallback | MEDIUM | HIGH | P2 |
| Two-way messaging | MEDIUM | HIGH | P3 |
| Volunteer coordination | LOW | HIGH | P3 |
| Auto-routing | LOW | VERY HIGH | P3 |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

## Competitor Feature Analysis

| Feature | Ushahidi (crowdmapping) | Google Crisis Response (SOS) | Bantayog Alert Approach |
|---------|------------------------|------------------------------|------------------------|
| Citizen report submission | SMS, web, Twitter, email | Limited (government-sourced) | App-first (web + PWA) |
| Map visualization | Yes, OpenStreetMap | Yes, Google Maps | Yes, Leaflet + OSM tiles |
| Status tracking | Ticket-based, public | No individual tracking | Three-layer status (owner/public/internal) |
| Admin triage | Workflow states + roles | Not applicable (gov-managed) | Full state machine with optimistic concurrency |
| Municipality/geographic scoping | Organization-based | No | Server-side security boundary (unique) |
| Push notifications | Email + SMS | Android only (governments) | FCM cross-platform (citizen + admin) |
| Offline capability | No | No | PWA with IndexedDB draft (strong) |
| Three-tier data separation | No | No | Yes - public/private/ops (unique) |
| Analytics | Basic | Basic | Pre-aggregated, no raw scan |
| SMS fallback | Yes (core) | No | Not in v1 (gap) |
| Announcements | Broadcast only | SOS alerts | Municipality-scoped, typed alerts |
| Accessibility | Basic | Good | Designed for (WCAG AA target) |

## Potential Gaps in SPECS.md

### Gap 1: SMS Fallback (Critical for Philippines Context)

**Missing:** No mechanism for citizens without smartphones to submit reports via SMS.

**Why it matters:** Rural Camarines Norte has significant feature phone penetration. Typhoons knock out data before power. SMS often works when internet does not.

**Recommendation:** Add to Phase 10 or as a separate v1.x milestone:
- Twilio or similar SMS gateway integration
- Incoming SMS parsed and routed to `submitReport` equivalent
- Outgoing status updates via SMS to reporter's phone
- Twilio webhooks → Cloud Function

**Confidence:** LOW (own assessment based on PH disaster context)

### Gap 2: Two-Way Messaging (Minor, v2+)

**Missing:** No way for admins to send updates directly to reporters.

**Why it matters:** "Your report was dispatched to Labo Fire Station" is more reassuring than generic status. Also enables follow-up questions.

**Recommendation:** Defer to v2. Append-only message thread in `report_private`. Admin composes from triage panel. Citizen sees in Profile.

**Confidence:** LOW

### Gap 3: Official Integration Points

**Missing:** No specification for integrating with OCD (Office of the Civil Defense), NDRRMC, or municipal disaster offices.

**Why it matters:** Provincial platform must feed into national RDRRM systems for consolidated response.

**Recommendation:** Add v2 milestone for API endpoints or data export formats required by OCD. Currently out of scope.

**Confidence:** LOW

### Gap 4: Disaster Type Subcategories

**Current:** 12 broad incident types.

**Gap:** No way to specify subtypes (e.g., "flood" + "river overflow" vs "flash flood").

**Recommendation:** SPECS mentions `classification` field in `report_ops`. This should be implemented in Phase 8 to allow subtypes without complicating the citizen-facing submission form.

**Confidence:** MEDIUM

### Gap 5: Media Verification / Provenance

**Missing:** No mechanism to verify photos are from the claimed location/time.

**Why it matters:** Misinformation during disasters is common. Unverified photos can cause panic.

**Recommendation:** Not a v1 gap - this is a future enhancement. Consider adding EXIF metadata validation, reverse image search integration, or manual fact-checking workflow.

**Confidence:** LOW

## Sources

- Ushahidi platform documentation and feature set (training data - current through ~2024)
- Google Crisis Response / SOS alerts capabilities (training data)
- Philippines disaster management context (training data - NDRRMC, Project AGAP, RDRRMC)
- General disaster reporting platform patterns (training data)
- SPECS.md internal consistency analysis

**Note:** Web search tools were unavailable during this research session. All findings are based on training data with LOW confidence. Verification against current platform documentation (Ushahidi, Google Crisis Response, PH government disaster platforms) is strongly recommended before finalizing feature priorities.

---

*Feature research for: Bantayog Alert - Disaster Reporting Platform*
*Researched: 2026-04-03*
