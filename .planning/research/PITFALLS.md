# Bantayog Alert — Pitfalls Research

**Domain:** Disaster Reporting, Alerting & Coordination Platform (Firebase/React PWA)
**Researched:** 2026-04-03
**Confidence:** MEDIUM

*Note: Web search tools were unavailable during research. Findings are based on training data knowledge of Firebase, React, and PWA patterns. Some findings should be verified via official documentation when available.*

---

## Critical Pitfalls

### Pitfall 1: Firestore Security Rules — Missing Municipality Scope on Cross-Collection Reads

**What goes wrong:**
A municipal admin can read `report_private` or `report_ops` documents for reports outside their municipality. The `report_private` rules check `report_ops.municipalityCode` via a `get()` call, but if that document does not exist or the `get()` call fails silently in rules evaluation, access is granted anyway.

**Why it happens:**
Firestore rules use short-circuit evaluation. When `isMunicipalAdmin()` is true, the rule evaluates `get(/databases/$(database)/documents/report_ops/$(reportId)).data.municipalityCode == getMunicipality()`. If `report_ops` does not exist (e.g., orphan `report_private` document), `get()` returns null and the comparison `null == "DAET"` evaluates to `false` — which seems safe. However, the opposite direction is dangerous: if the `report_ops` document exists but was not properly joined, or if the rule uses `resource.data.municipalityCode` directly on `report_private` which does not have that field, the rule silently grants access.

**How to avoid:**
- Always use `get()` to cross-reference the authoritative document for the `municipalityCode` field. Never assume `resource.data` on a child collection has the same fields as the parent.
- Add explicit existence checks: `get(/databases/$(database)/documents/report_ops/$(reportId)).data.municipalityCode == getMunicipality()` will throw if `report_ops` does not exist. Use `getAfter exists()` or validate existence explicitly.
- Write security rules tests that cover the orphan document case (e.g., `report_private` exists but corresponding `report_ops` does not).

**Warning signs:**
- Security rules tests passing only for the "happy path"
- Missing composite index for `report_ops.municipalityCode` queries used in rules
- Admin users able to see reports from other municipalities in dev tools

**Phase to address:** Phase 3 (Auth & Role Model) — security rules must be written and tested alongside the role model

---

### Pitfall 2: React-Leaflet Double-Mount in React 18 Strict Mode Causes Map Corruption

**What goes wrong:**
In development with React 18 Strict Mode enabled, components mount twice. React-Leaflet's `MapContainer` initializes Leaflet's internal state on the first mount and again on the second (simulated unmount/remount). This causes Leaflet's map instance to become corrupted: duplicate tile layers, broken marker references, and `MapContainer is already initialized` errors thrown by Leaflet itself.

**Why it happens:**
React 18 Strict Mode deliberately invokes mount → unmount → remount in development to surface side-effect bugs. React-Leaflet's `MapContainer` calls `new L.Map()` in its mount lifecycle hook. On the second mount, Leaflet throws because the map DOM container already has a Leaflet instance attached.

**How to avoid:**
- Wrap `MapContainer` in a guard component that uses a ref to ensure Leaflet initialization happens at most once:

```tsx
function MapGuard({ children }: { children: React.ReactNode }) {
  const initialized = useRef(false);
  if (initialized.current) return <>{children}</>;
  initialized.current = true;
  return <>{children}</>;
}
```

- Alternative: use a custom `useMap()` hook with a ref guard that stores the map instance and returns the same instance on subsequent renders.
- Ensure `MapContainer` is rendered exactly once in the component tree — never conditionally rendered or unmounted.
- The SPECS.md architecture correctly positions `MapContainer` as a persistent sibling that never unmounts. Strict Mode violations occur when developers accidentally make the map a child of a component that can unmount.

**Warning signs:**
- `MapContainer is already initialized` errors in browser console during development
- Duplicate tile layers visible on the map
- Markers appearing at wrong coordinates or duplicated
- Map works in production build (no Strict Mode) but breaks in development

**Phase to address:** Phase 4 (Desktop Shell & Mobile Shell) — must be implemented before any map integration work begins

---

### Pitfall 3: Cloud Functions State Machine — Non-Atomic Batch Writes Allow Inconsistent State

**What goes wrong:**
The `triageReport` Cloud Function updates `report_ops` (state change), `reports` (public status + visibility sync), and `report_private` (owner status sync) in a Firestore batch. If the function times out or crashes after the first write but before the others complete, the three tiers become inconsistent: `report_ops` shows `dispatched` but `reports.visibility` is still `hidden` and `report_private.ownerStatus` is still `verified`. The `onReportOpsWrite` trigger also fires on the same write, creating race conditions where the trigger and the caller both try to update the same fields.

**Why it happens:**
Firebase Firestore batch writes are atomic across all documents in the batch — they either all succeed or all fail. However, Cloud Functions has a 60-second timeout (540 seconds for background functions). If the function exceeds this limit, it is killed and the batch may be rolled back depending on when the timeout occurs relative to the write. More critically, `onReportOpsWrite` triggers fire asynchronously after the committed write and can overwrite fields that the calling function just set, especially `visibility` and `publicStatus`.

**How to avoid:**
- Use a Firestore Transaction (not just a batch) within the function to read-modify-write with optimistic locking.
- Design the trigger to only update fields it owns (e.g., analytics counters), not fields that the callable function sets (status, visibility).
- Separate concerns: `triageReport` callable handles status transitions. `onReportOpsWrite` trigger handles side effects (analytics, notifications) only.
- Add a `version` field increment in the transaction. If the trigger fires before the transaction commits, it will see a stale version and should abort its update.
- Implement idempotency keys on the trigger to prevent duplicate analytics increments.

**Warning signs:**
- `report_ops` state does not match `reports.visibility` when queried
- Analytics counters incrementing unexpectedly or double-counting
- `onReportOpsWrite` trigger errors in Cloud Logging
- Inconsistent `ownerStatus` vs `publicStatus` for the same report

**Phase to address:** Phase 8 (Admin Verification & Routing) — state machine implementation is the core of this phase

---

### Pitfall 4: Disaster Surge Traffic — Per-User Rate Limits Too Restrictive for Real Events

**What goes wrong:**
During a typhoon or flooding event, hundreds of legitimate citizens try to submit reports simultaneously. The per-user rate limit of "max 10 reports per hour" (as specified in SPECS.md §9.7) is appropriate for abuse prevention but becomes catastrophic during a real disaster when a household of 5 people each submit 3 reports in 30 minutes. Legitimate users get rate-limited and cannot report emergencies. Admins are also unable to respond because the queue is artificially throttled.

**Why it happens:**
Rate limits designed for anti-abuse assume a steady-state user population. During a disaster, the assumption breaks: a 12-municipality province with normal traffic of ~50 reports/day might see 5,000+ reports in a 2-hour window from a single typhoon. The rate limiter treats this as abuse because it exceeds per-user thresholds, not because it's actually abusive behavior.

**How to avoid:**
- Implement a **surge mode** flag stored in Firestore (e.g., `systemConfig/surge.active == true`) that raises per-user limits by 5-10x.
- Allow municipal admins to activate surge mode manually, or auto-activate based on a threshold of report volume increase (e.g., >50 reports in 10 minutes province-wide).
- In surge mode, apply **reputation-weighted rate limits**: verified older accounts get higher limits than brand-new accounts with no previous reports.
- Track per-user report counts per disaster event (not per rolling hour) — a new user submitting 3 reports in one day during an active typhoon is likely legitimate.
- Add a "disaster mode" override for municipal admins so they can manually approve pending reports even if the submitter hit a rate limit.

**Warning signs:**
- Rate limit errors spike during or immediately after a weather event
- Citizen complaints of being unable to submit during an emergency
- High volume of "pending" reports from different users all describing the same event

**Phase to address:** Phase 8 (Admin Verification & Routing) — rate limiting and surge detection should be built into the triage system, but ideally addressed in Phase 5 (Report Submission) with a simpler initial limit

---

### Pitfall 5: PWA Offline-First — Service Worker Serves Stale Verified Report as "Public"

**What goes wrong:**
A citizen submits a report while offline. The service worker caches the draft and queues a background sync. When connectivity returns, the report is submitted and transitions from `pending` to `verified`. The service worker's runtime cache, however, still holds the old version of the public report feed showing the report as invisible (`visibility: 'hidden'`). A subsequent read of the public feed served from cache shows the report is not visible, even though it is now verified. Alternatively, the user goes offline after their report is verified; they see it on the map, but the map data in the cache becomes stale — showing the old `publicStatus` or an incorrect `severity`.

**Why it happens:**
The SPECS.md specifies runtime caching strategies: "NetworkFirst for API/Firestore, CacheFirst for tile images." NetworkFirst is correct for dynamic data, but if the service worker serves a stale cached response while a fetch is in-flight, or if the cache is updated but the app's in-memory state is not, the user sees inconsistent data. For disaster reporting, serving stale data that makes a verified incident appear unverified is a serious issue.

**How to avoid:**
- Use **NetworkFirst with cache fallback** for report feeds and map data, with a short cache lifetime (e.g., 5 minutes) to reduce stale data risk.
- Implement cache versioning: store a cache timestamp and invalidate the cache when the user's own report status changes.
- For the draft submission queue, use IndexedDB with a sync timestamp. When the app comes online and syncs, explicitly invalidate the relevant cached feed entries.
- Add a visible "last synced" timestamp to the feed and map views so users know if data might be stale.
- Never serve cached report status data for the reporting user's own reports — always fetch `report_private` directly for the owner's "My Reports" view, bypassing the public feed cache.

**Warning signs:**
- Users reporting their verified report does not appear on the public map
- Feed showing inconsistent status compared to the report detail view
- "Last synced" timestamp showing minutes or hours old without user awareness

**Phase to address:** Phase 12 (Hardening, PWA finalization) — offline behavior must be thoroughly tested with actual network disruption scenarios

---

### Pitfall 6: Firebase App Check — Token Validation Failures on Callable Functions Block Legitimate Users

**What goes wrong:**
After deploying App Check enforcement to Cloud Functions, some users suddenly cannot submit reports, triaging reports, or creating announcements. The App Check token attached to their requests is deemed invalid. Errors show `Firebase App Check token is invalid` in Cloud Logging. This affects a small but persistent percentage of users — particularly users on older Android WebViews, some custom ROM devices, or users who have blocked Google Play Services.

**Why it happens:**
Firebase App Check validates tokens through Play Integrity API (Android), SafetyNet (deprecated Android), or reCAPTCHA Enterprise (Web/iOS). If a device cannot reach Google's App Check attestation services (network blocked, VPN interference, restricted device), the token is unsigned or invalid. App Check in enforcement mode rejects these requests. The problem is intermittent and device-dependent, making it hard to reproduce in testing.

**How to avoid:**
- Implement App Check in **audit mode first** (log and выпускай passes) for 2-4 weeks before full enforcement to catch legitimate users being rejected.
- Provide a **fallback mechanism**: for callable functions that are critical (e.g., `submitReport`), if App Check validation fails, the function should log the attempt and allow the request to proceed if it passes other security checks (valid auth token, valid payload, rate limit not exceeded). This is a risk trade-off but ensures emergency reporting is never blocked by App Check failures.
- Add a user-facing error message for App Check failures that distinguishes "please update your OS" from "please check your internet connection."
- For mobile, ensure the Firebase App Check SDK is properly initialized before any callable function is invoked. Use lazy initialization.
- Consider App Check only for public/unauthenticated surfaces initially, and enforce on authenticated callables after audit mode reveals the scope of device issues.

**Warning signs:**
- App Check enforcement errors in Cloud Functions logs after deployment
- User complaints of "submit button not working" that correlate with specific device types
- reCAPTCHA/SafetyNet network requests failing in browser dev tools

**Phase to address:** Phase 12 (Hardening, Security finalization) — App Check should be in audit mode throughout development and only fully enforced after extensive real-user testing

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Skipping `version` field on report_ops documents | Simpler triage function code | Two admins can simultaneously triage the same report, causing state corruption with no detection | Never — this is a core architectural requirement |
| Client-side municipality filtering only | Faster initial development | Security boundary completely bypassed by any user who modifies the URL or API payload | Never — client filtering is UX only |
| Storing exact coordinates in `reports` public tier | Simpler geospatial queries | Philippines Data Privacy Act RA 10173 violation; reporter location exposed to all citizens | Never |
| Using `Date.now()` instead of Firestore `Timestamp` | Simpler date comparisons | Timestamp drift between client and server; analytics aggregation breaks; inconsistent ordering | Only in local-only test data |
| Direct client writes to `report_ops` for status changes | Bypasses Cloud Function validation | Any authenticated user could change any report's state; breaks audit trail; breaks three-tier sync | Never |
| Single `reports` collection without three-tier split | Simpler schema | Impossible to hide exact location from citizens while showing it to admins; operational metadata visible to public | Never |
| Skipping `activity` subcollection on report submit | One less document to create | No audit trail for state transitions visible to report owner; poor UX | Only in absolute MVP proof-of-concept |
| Using a single Firestore document for all report status | Simpler document structure | Cannot separate public/owner/ops concerns; must rewrite entire document on every state change | Never for production |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| **Firebase Auth + Custom Claims** | Calling `setCustomClaims()` inside a callable function that is itself called by the user whose claims are being changed | Custom claims changes must be in an admin-only callable (`setUserRole`) that has `resource.auth == null` or validates the caller is a superadmin; claims changes take effect only after token refresh |
| **FCM + Topic Subscription** | Subscribing users to FCM topics based on `municipalityCode` without validating the user actually belongs to that municipality | Subscription must be validated server-side: verify the user's custom claim matches the topic they are subscribing to |
| **Cloud Functions + Firestore Triggers** | Both a callable and a trigger updating the same fields (e.g., `publicStatus` on `reports`) | Triggers handle only side effects (analytics, notifications). Callable functions own all primary field updates |
| **Storage + Security Rules** | Storage rules checking `request.auth.uid` without validating the user owns the `reportId` in the path | Storage path should be `/reports/{uid}/{reportId}/{filename}`. Rules should verify `uid` matches auth AND `reportId` exists and belongs to that uid in `report_private` |
| **React Query + Firestore Listeners** | Using React Query `useQuery` with Firestore `onSnapshot` listener, causing double-fetching (React Query cache + Firestore listener) | Use React Query's `useQuery` for one-time reads and `useSubscription` or React Query's `queryClient.setQueryData` pattern for real-time updates; never mix `getDoc`/`getDocs` with `onSnapshot` on the same query key |
| **Leaflet + React State** | Storing marker data in React state, causing full re-render and map redraw on every data change | Store marker data in Zustand. Map component reads from Zustand. Use `useMemo` or `useEffect` to update Leaflet layers directly without triggering React re-renders of the `MapContainer` |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| **Unbounded `report_ops` listener province-wide** | Firestore reads spike to thousands per minute; billing alerts | Always add `LIMIT` to listeners. Provincial superadmin queue uses `LIMIT 50` with pagination. No full-collection listeners ever. | Province-wide listener on any collection with >500 docs |
| **Loading all `activity` subcollection documents in the UI** | Report detail modal loads 30+ activity entries on open; slow initial render | Activity subcollection uses separate paginated query with `LIMIT 10`; "show more" for full history | Any report with >20 state transitions |
| **Fetching `report_private` in the map marker popup** | Each marker click triggers a Firestore read for exact coordinates; fan-out query problem | Map popups show only `reports` public tier data. Exact location is admin-only and shown in the detail modal, not the popup. | >20 simultaneous marker clicks |
| **Marker clustering without viewport culling** | supercluster processes all visible and invisible markers; UI thread freeze on low-end devices | Cluster index rebuilt only on map viewport change; only markers in current viewport bounds processed | >500 total markers province-wide |
| **React-Leaflet re-rendering on every Zustand store change** | Map flickers or redraws when drawer opens/closes (unrelated state change) | Map component subscribes only to the specific Zustand slices it needs (e.g., `selectedMarkerId`, `mapViewport`). Drawer state in separate Zustand slice. | Any UI interaction that updates Zustand |
| **Firestore `onSnapshot` without `includeMetadataChanges: false`** | Listeners receive metadata-only updates (e.g., `updateTime` change) causing unnecessary re-renders | Explicitly set `includeMetadataChanges: false` on all production listeners | All real-time listeners |
| **Scheduling `scheduledAggregation` at peak hours** | Aggregation function competing with user traffic for Firestore reads/writes | Schedule at 02:00 PHT (early morning, minimal traffic). Set `minInstances: 0` to avoid idle billing. | Daily during any disaster response |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| **Allowing citizens to write directly to `reports` collection** | Any authenticated user could mark any report as verified, change severity, or expose hidden reports | All writes to `reports` go through `submitReport` callable. Firestore rules explicitly set `allow write: if false` on `reports`, `report_private`, and `report_ops`. |
| **Using `request.auth.token.email` as the authority for admin checks** | If Firebase Auth email enumeration is possible, attackers could test which emails have admin roles | Use custom claims (`role`, `municipalityCode`) for all authorization decisions. Custom claims cannot be set by clients. |
| **Storing reporter phone/email in `reports` public tier** | Citizens can see other citizens' contact information via report data | Phone and email stored only in `report_private`, readable only by the owner and admins. `reports` has no PII. |
| **Allowing municipal admins to create province-wide announcements** | Admin from Basud could send alerts to all of Camarines Norte | `createAnnouncement` CF validates that `municipal_admin` can only set `scopeType: 'municipality'` with `targetMunicipalities` containing only their own municipality. CF throws on scope violations. |
| **Not validating coordinate bounds on report submission** | Malicious user submits reports with coordinates in Manila or Antarctica, corrupting province analytics | Zod validation in `submitReport` CF enforces bounding box: `lat: 14.0-14.5`, `lng: 122.5-123.0`. Reject and audit. |
| **Exposing `internalState` or `priority` in public report documents** | Citizens can see how urgent a report is before it is verified; admins see internal priority | `internalState` and `priority` are only in `report_ops`. `reports` public tier has `publicStatus` and `visibility` only. |
| **Not rate-limiting announcement creation** | A compromised municipal admin account could spam all citizens with fake critical alerts | Rate limit: max 10 announcements per municipality per hour. Monitor in Cloud Logging. |
| **Storing `reportId` as a sequential integer** | Attackers can enumerate all reports by incrementing IDs | Use Firestore document IDs (UUIDs) for all internal references. Human-readable `reportNumber` (e.g., `BNT-2026-00001`) is display-only and generated server-side. |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| **No offline indicator during report submission** | User submits a report on poor mobile connection; thinks submission succeeded; discovers days later it never went through | Show clear "offline — draft saved" banner. Store draft in IndexedDB. Provide explicit "retry" action when online. |
| **Pending reports hidden from owner's feed with no explanation** | User submits report; checks Profile; sees nothing; thinks submission failed; submits again | Show pending reports in "My Reports" with "Awaiting Verification" status badge immediately after submission. Add a toast: "Report submitted successfully. It will appear publicly once verified." |
| **Map viewport resetting when drawer opens** | User pans/zooms to find their location; opens drawer to read details; map snaps back to default center; user loses context | Map and drawer are sibling components. Zustand stores map viewport. Drawer state changes do not trigger map re-render. `invalidateSize()` only adjusts rendering dimensions, not geographic center. |
| **Admin triage queue not sorted by priority or age** | Admin sees a list of reports in arbitrary order; high-severity incidents buried below old low-severity ones | Default sort: `priority ASC, createdAt ASC` (priority 1 = highest). Admin can re-sort. |
| **Rejection without reason field** | Reporter sees "Rejected" status with no explanation; cannot resubmit with corrections; assumes system is broken | Require `rejectionReason` in the triage action. Reporter sees the reason in their "My Reports" detail view. |
| **No "last updated" on report cards** | User sees a report from 3 days ago with no context; cannot tell if it is still active or resolved | Show `updatedAt` timestamp on all report cards. Use relative time ("2 hours ago") as primary, absolute time on hover. |
| **Alert list showing all severities with same visual weight** | Critical emergency alert buried among info-level advisories | Sort by severity (critical first), then by `publishedAt`. Critical alerts get prominent header treatment. |

---

## "Looks Done But Isn't" Checklist

- [ ] **Security Rules:** Rules have `allow write: if false` on all three report tiers — but did you test that a municipal admin CANNOT read `report_ops` from another municipality?
- [ ] **State Machine:** Triage function validates transitions — but did you test that `pending → resolved` (skipping verify) is correctly rejected?
- [ ] **Map Stability:** Map does not remount on drawer toggle in dev — but did you verify this in Strict Mode with double-remount?
- [ ] **Offline Draft:** Draft saves to IndexedDB — but did you verify the draft survives a full browser restart before submission?
- [ ] **Three-Tier Sync:** When `triageReport` changes state, all three tiers update — but did you test the case where the function times out mid-write?
- [ ] **App Check:** App Check is in audit mode — but did you verify that legitimate traffic is not being silently rejected?
- [ ] **Visibility:** Verified reports appear on map — but did you verify that a PENDING report from user A is NOT visible to user B (even if both are logged in as citizens)?
- [ ] **Municipality Scope:** Municipal admin can only see their own reports — but did you test URL manipulation (direct access of another municipality's report by ID)?
- [ ] **Activity Log:** State transitions create activity entries — but did you verify that the owner sees "Responders Notified" in their timeline (not just the internal ops activity)?
- [ ] **Contact Snapshot:** Contact details are snapshotted at dispatch — but did you verify that editing the contact AFTER dispatch does NOT update the report's stored snapshot?
- [ ] **Surge Mode:** Rate limiter exists — but did you test what happens when 100 users submit reports in the same minute?
- [ ] **FCM Delivery:** Notifications are sent — but did you verify that users who opted out of push notifications do not receive them?

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Security rules allow cross-municipality read | HIGH | Immediately disable Firebase Hosting (blocks all access). Deploy corrected rules. Re-enable. Audit Cloud Logging for any accesses during the window. |
| Map double-mount causes data corruption in production | MEDIUM | Hotfix: disable React Strict Mode in production build (not a proper fix but stops the immediate symptom). Proper fix: implement MapGuard wrapper. Redeploy. |
| State machine inconsistent after function timeout | HIGH | Identify affected report IDs from Cloud Logging. Write a repair Cloud Function that reconciles all three tiers based on `report_ops` as the source of truth. Run repair. Verify all three tiers match. |
| Rate limiter blocking legitimate disaster reports | LOW | Activate surge mode via Firestore config. Or: use Firebase Console to temporarily raise the limit. Or: manually approve specific users via admin panel. |
| App Check blocking legitimate users | MEDIUM | Switch App Check to audit mode (log only, do not block). Investigate affected device types from logs. Add device-specific workarounds. Re-enforce after 2-week audit. |
| Stale PWA cache showing wrong report status | LOW | User clears browser cache (or force-refresh). For critical cases: push a cache-busting version update. Add "pull to refresh" in the UI to force network fetch. |
| Contact snapshot not captured correctly | MEDIUM | Run repair query: for all `report_ops` with `assignedContactId` set but `assignedContactSnapshot` empty, re-populate from current `contacts` document. Document the bug for Phase 9 post-mortem. |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Firestore cross-collection scope leak | Phase 3 (Auth & Role Model) | 60+ security rules tests; E2E scope manipulation tests |
| React-Leaflet double-mount | Phase 4 (Desktop Shell & Mobile Shell) | Map stability E2E test; Strict Mode enabled in dev; console clean of `MapContainer is already initialized` |
| State machine non-atomic writes | Phase 8 (Admin Verification & Routing) | Integration test for function timeout mid-write; trigger idempotency tests |
| Rate limits too restrictive for surges | Phase 5 (Report Submission) initial + Phase 8 surge mode | Load test with 100 concurrent submissions; disaster scenario simulation |
| PWA stale cache / offline data | Phase 12 (Hardening, PWA finalization) | Manual offline testing; service worker debug mode; cache audit |
| App Check blocking legitimate users | Phase 12 (Audit mode throughout development) | 2-week audit mode; logs reviewed daily; user feedback channel |
| Three-tier sync inconsistency | Phase 8 (Admin Verification & Routing) | Integration tests verifying all three tiers match after every transition |
| Contact snapshot not persisting | Phase 9 (Contacts Management) | Integration test: dispatch report → edit contact → verify snapshot unchanged |
| Visibility filter bypass | Phase 6 (Realtime Map & Feed) | E2E test: citizen A submits pending report; citizen B logs in; report not visible to B |
| Municipality scope on announcements | Phase 10 (Announcements) | E2E test: municipal admin creates announcement; verify `targetKeys` matches their municipality; superadmin can create province-wide |

---

## Sources

- Firebase Firestore Security Rules documentation — official rule patterns for multi-collection references
- React-Leaflet GitHub issues — Strict Mode double-mount problem (known issue, various workarounds documented)
- Firebase Cloud Functions best practices — timeout handling, transaction patterns, idempotency
- Google Cloud PWA best practices — offline-first architecture for critical services
- Firebase App Check documentation — enforcement mode guidance, audit mode recommendation
- OWASP Mobile Application Security — location privacy considerations for disaster reporting
- Philippines RA 10173 Data Privacy Act — public location data minimization requirements
- Community post-mortems from similar disaster reporting platforms (Ushahidi, Humanitarian OpenStreetMap)
- Firebase Cloud Functions + Firestore trigger race condition discussions on Stack Overflow / Firebase community

---

*Pitfalls research for: Bantayog Alert — Disaster Reporting Platform*
*Researched: 2026-04-03*
