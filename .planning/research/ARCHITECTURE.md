# Architecture Research

**Domain:** Disaster Reporting, Alerting, and Coordination Platform
**Project:** Bantayog Alert — Camarines Norte, Philippines
**Researched:** 2026-04-03
**Confidence:** MEDIUM (training knowledge; Firebase documentation is authoritative but WebSearch/WebFetch were blocked in this environment)

---

## Validation of SPECS-Defined Architecture

The SPECS defines a well-reasoned architecture. The findings below validate, clarify, and provide implementation nuance for each of the five research focus areas.

---

## 1. Three-Tier Firestore Document Pattern

### Verdict: STILL CORRECT in 2026

### Why the Pattern Holds

Firestore has no field-level read permissions. The three-tier split (`reports` / `report_private` / `report_ops`) is the correct approach because:

| Tier | Collection | Privacy Guarantee |
|------|-----------|-------------------|
| Public | `reports` | Approximate location, sanitized text, no admin fields |
| Owner+Admin | `report_private` | Exact location, raw media, reporter contact |
| Admin-only | `report_ops` | Internal state, priority, routing, contact snapshots |

### Nuances for 2026

- **Alternative considered:** Firestore per-document security with large documents. Rejected because subcollection activity logs would be awkward, and per-document rules cannot hide individual fields from the same read.
- **Alternative considered:** Three separate databases (one per tier). Rejected because cross-tier consistency in a single transaction is impossible across database boundaries.
- **The three-collection approach remains optimal.** It enables atomic batch writes across all three tiers within a single Firestore transaction, which the SPECS correctly leverages.

### Cross-Tier Consistency Risk

**Critical implementation detail:** All three documents for a single report must be written atomically using a Firestore batch, not sequential writes. If `submitReport` Cloud Function writes them sequentially and the function times out after step 2, the system enters an inconsistent state.

```typescript
// CORRECT: Atomic batch
const batch = writeBatch(db);
batch.set(doc(db, 'reports', reportId), publicDoc);
batch.set(doc(db, 'report_private', reportId), privateDoc);
batch.set(doc(db, 'report_ops', reportId), opsDoc);
await batch.commit();

// WRONG: Sequential (risks partial writes)
await setDoc(doc(db, 'reports', reportId), publicDoc);
await setDoc(doc(db, 'report_private', reportId), privateDoc); // If this fails, reports exists without private
await setDoc(doc(db, 'report_ops', reportId), opsDoc);
```

### Subcollection Activity Logs

The SPECS correctly places activity in subcollections (`reports/{id}/activity` and `report_ops/{id}/activity`). This is the right pattern because:

- Immutable append-only log does not bloat the parent document
- Subcollection reads can be secured independently from parent
- Firestore query constraints (max 1000 docs per query) are not a concern at expected event volumes

---

## 2. Firebase Cloud Functions v2

### Verdict: CORRECT CHOICE; v2 is production-stable and recommended

### Key v2 Architectural Differences from v1

| Aspect | v1 | v2 |
|--------|----|----|
| Trigger API | `functions.firestore.document()` | `onDocumentWritten()`, `onDocumentCreated()`, etc. |
| HTTPS | `functions.https.onRequest` | Same, but v2 supports response streaming |
| Event types | Limited | More granular (e.g., `onDocumentWritten` with `mask`) |
| Node.js | 10, 12, 14, 16 | **18, 20, 22** (v1 functions no longer support Node 16+ by default) |
| Cold start | Slower | Improved with minInstances setting |
| Logging | `console.log` | Structured logging via `functions.logger` |

### Backend-Triggered Functions Pattern (Correctly Specified)

The SPECS uses `onReportOpsWrite` Firestore trigger. This is the right pattern because:

```typescript
// functions/src/reports/opsSync.ts
export const onReportOpsWrite = onDocumentWritten(
  'report_ops/{reportId}',
  async (event) => {
    // event.data.exists() — document exists after write
    // event.data.before — previous state
    // event.data.after — new state
    const { before, after } = event.data;
    const stateChanged = before?.internalState !== after?.internalState;

    if (!stateChanged) return; // Skip non-state changes

    // Sync public visibility, owner status, public status
    // Increment/decrement analytics counters
    // These are fire-and-forget to not block the trigger
    await syncPublicMirror(reportId, after);
    await syncOwnerStatus(reportId, after);
  }
);
```

### Callable Functions (Correctly Specified)

The SPECS correctly routes all sensitive writes through callables. v2 callables support:

```typescript
// v2 callable with full context typing
export const triageReport = onCall<{reportId: string, newState: WorkflowState, expectedVersion: number}, async (request) => {
  // request.auth — authenticated user
  // request.auth.token — custom claims (role, municipalityCode)
  // request.data — typed input
});
```

### Scheduled Functions

v2 uses `onScheduled` with Pub/Sub:

```typescript
// CORRECT v2 syntax
import { onSchedule } from '@google-cloud/functions-framework';

export const scheduledAggregation = onSchedule({
  schedule: 'every 24 hours',
  timezone: 'Asia/Manila',
  // Note: Firebase scheduled functions use Pub/Sub under the hood
}, async () => {
  // Run aggregation logic
});
```

### Migration Note

If any existing v1 Cloud Functions are being migrated: the trigger syntax changes but the function body logic largely stays the same. The `@google-cloud/functions-framework` v2 is required.

---

## 3. React Query + Zustand with Firestore

### Verdict: CORRECT COMBINATION; separation of concerns must be strict

### The Critical Rule: Different State Types, Different Tools

| State Type | Tool | Example |
|-----------|------|---------|
| Server/async state (Firestore) | **React Query** | Report list, user profile, announcements |
| Synchronous UI state | **Zustand** | Drawer open/close, active filters, selected marker, map viewport |

**The anti-pattern to avoid:** Using Zustand to store Firestore data that is also managed by React Query listeners. This creates two sources of truth.

### React Query with Firestore Real-Time Listeners

The correct pattern uses React Query's `useQuery` for one-time reads and `useQuery` with `refetchInterval` OR `useSubscribedQuery` pattern for real-time. However, Firestore's native `onSnapshot` is more efficient for real-time.

**Recommended: Bridge Firestore onSnapshot into React Query**

```typescript
// shared/hooks/useFirestoreQuery.ts
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { onSnapshot, Query, QueryConstraint } from 'firebase/firestore';
import { useEffect, useState } from 'react';

export function useFirestoreQuery<T>(key: string[], query: Query, constraints?: QueryConstraint[]) {
  const [data, setData] = useState<T[]>([]);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let q = query;
    if (constraints) {
      constraints.forEach(c => { q = q.where(c.field, c.op, c.value); });
    }

    const unsubscribe = onSnapshot(q,
      (snapshot) => {
        const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
        setData(docs);
      },
      (err) => setError(err)
    );

    return unsubscribe;
  }, [query, key.join('/')]);

  return { data, error, isLoading: false }; // Real-time, never "loading" after first snapshot
}
```

**For React Query caching with Firestore listeners:**

```typescript
// React Query wraps the listener. React Query provides:
// - Stale time management (don't refetch from Firestore too often)
// - Background refetch on window focus
// - deduping (multiple components subscribing to same query use one listener)

const { data: reports } = useQuery({
  queryKey: ['reports', 'public', filters],
  queryFn: () => fetchReports(filters),
  staleTime: 30_000, // 30s — Firestore listener handles real-time anyway
  gcTime: 5 * 60_000, // 5min cache
});
```

### Zustand for Map/UI State (Correctly Specified)

The SPECS correctly uses Zustand for:

```typescript
// stores/uiStore.ts
import { create } from 'zustand';

interface UIState {
  // Workspace drawer
  workspaceOpen: boolean;
  workspacePanel: string | null;
  openPanel: (panel: string) => void;
  closePanel: () => void;

  // Map viewport (persisted across drawer changes)
  mapViewport: { lat: number; lng: number; zoom: number };
  setMapViewport: (v: { lat: number; lng: number; zoom: number }) => void;

  // Selected marker
  selectedReportId: string | null;
  selectReport: (id: string | null) => void;

  // Active filters
  activeFilters: {
    type: string[];
    severity: string[];
    municipality: string | null;
    dateRange: [Date, Date] | null;
  };
  setFilters: (f: Partial<UIState['activeFilters']>) => void;
}
```

**Map stability with Zustand:** Since Zustand stores the map viewport and marker selection separately from data, changing the drawer panel does not trigger map re-renders. The map reads from the store; the store does not depend on React component lifecycle.

---

## 4. Leaflet + React-Leaflet Sibling-Map Architecture

### Verdict: CORRECT AND WELL-REASONED; the sibling pattern is the industry standard

### The Problem This Solves

React-Leaflet's `MapContainer` uses Leaflet's internal state. If `MapContainer` is unmounted and remounted (e.g., when a parent component conditionally renders), Leaflet's internal map instance is destroyed and recreated. This causes:

- Map viewport reset to default
- All tile layers reload
- User loses pan/zoom position
- Broken user experience on drawer/modal open

### Why Sibling Layout Works

```
DesktopLayout (renders once, never unmounts)
├── MapContainer (sibling to drawer, never unmounted)
├── WorkspaceDrawer (slides in/out, never affects map)
└── ReportDetailModal (overlay, never affects map)
```

**The CSS transition approach correctly described in SPECS:**

```css
/* Desktop layout */
.app-desktop {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

.nav-rail {
  width: 64px;
  flex-shrink: 0;
}

.map-container {
  flex: 1;
  /* Map fills remaining space; CSS transition handles resize */
  transition: width 300ms ease;
}

.map-container.expanded {
  width: calc(100vw - 64px);
}

.map-container.drawer-open {
  width: calc(100vw - 64px - 480px);
}

.workspace-drawer {
  position: fixed;
  right: 0;
  top: 0;
  width: 480px;
  height: 100vh;
  transform: translateX(100%);
  transition: transform 300ms ease;
  z-index: 1000;
}

.workspace-drawer.open {
  transform: translateX(0);
}
```

### React 18 Strict Mode and Double-Mount

**This is a real concern.** React 18 Strict Mode double-invokes effects in development:

```tsx
// CORRECT: Guard the map initialization
const mapRef = useRef<L.Map | null>(null);
const mapReadyRef = useRef(false);

useEffect(() => {
  if (mapReadyRef.current) return; // Guard against double-mount in Strict Mode
  mapReadyRef.current = true;
  // Initialize map...
}, []);
```

Or use a ref guard at the component level:

```tsx
const isFirstRender = useRef(true);
useEffect(() => {
  if (!isFirstRender.current) return;
  isFirstRender.current = false;
  // Actual initialization
}, []);
```

### invalidateSize() Timing

The SPECS calls `invalidateSize()` on `transitionend`. This is correct but ensure the CSS transition event name is correct:

```typescript
// Listen for the exact CSS transition end event
const handleTransitionEnd = () => {
  mapRef.current?.invalidateSize({ animate: false });
};

// In React: attach to the map container div
<div onTransitionEnd={handleTransitionEnd} />
```

Note: React's synthetic events may not capture `transitionend` from CSS transitions on child elements reliably. A more robust approach:

```typescript
// CSS on the map container itself
.map-wrapper {
  transition: width 300ms ease;
  width: 100%;
}

// After drawer animation, invalidate
setTimeout(() => {
  mapRef.current?.invalidateSize();
}, 350); // Slightly longer than CSS transition duration
```

### Mobile Map Tab (CSS display: none/block)

The SPECS correctly uses `display: none` / `display: block` to preserve the Leaflet instance across tab switches on mobile:

```tsx
// Mobile: preserve Leaflet instance
<div style={{ display: tab === 'map' ? 'block' : 'none', height: '100%' }}>
  <MapContainer />
</div>
```

Leaflet's own guidance confirms this approach. `display: none` removes the element from the layout but does not destroy the Leaflet map instance. However, `invalidateSize()` must be called when the map becomes visible again.

### Marker Clustering

`supercluster` is the right choice for React-Leaflet:

```typescript
import Supercluster from 'supercluster';

const cluster = useMemo(() => {
  const s = new Supercluster({
    radius: 60,
    maxZoom: 16,
    minZoom: 0,
  });
  s.load(markers); // markers must be GeoJSON features
  return s;
}, [markers]);

// Get clusters for current viewport
const clusters = cluster.getClusters(bounds, zoom);
```

### Disaster App-Specific: Handling High Marker Volume

During a disaster (typhoon, flood), report volume spikes dramatically. The architecture should:

1. **Cap map pins at 200** (as SPECS specifies) — use Firestore query `LIMIT 200` with `orderBy('createdAt', 'desc')` to get most recent reports
2. **Cluster aggressively** at low zoom levels (radius: 75, maxZoom: 12)
3. **Filter server-side** — don't fetch all reports then filter client-side; use composite Firestore queries
4. **Viewport debouncing** — debounce viewport change handlers (500ms as SPECS specifies)

---

## 5. Firebase Security Rules — Multi-Tenant Municipality Scoping

### Verdict: CORRECTLY SPECIFIED; double-layer enforcement is the right approach

### The Two-Layer Model

| Layer | What It Enforces | Limitation |
|-------|-----------------|------------|
| Firestore Rules | Server-side read/write authorization | Cannot validate business logic |
| Cloud Functions | Server-side business logic + authorization | Cannot enforce real-time read access |

The SPECS correctly uses both. Firestore rules alone are insufficient because they cannot enforce state transition validation, version concurrency, or cross-document consistency.

### Security Rules Validation for the Specified Pattern

The rules in SPECS Section 8.2 are well-structured. A few validation notes:

**1. The `get()` call pattern is correct for cross-collection reads:**

```javascript
// In report_private rules — accessing report_ops to check municipality
allow read: if isMunicipalAdmin() &&
  get(/databases/$(database)/documents/report_ops/$(reportId)).data.municipalityCode == getMunicipality();
```

This `get()` call reads the `report_ops` document to verify the admin's municipality scope matches the report's municipality. This is the correct pattern for cross-collection authorization.

**2. Citizen can only read their own `report_private` documents:**

```javascript
allow read: if resource.data.reporterUid == request.auth.uid;
```

This is correct — `reporterUid` is set server-side in the Cloud Function, not by the client.

**3. Announcement rules use `targetMunicipalities` for citizen-level filtering:**

```javascript
(isCitizen() && resource.data.status == 'published' && (
  resource.data.scopeType == 'province' ||
  getMunicipality() in resource.data.targetMunicipalities
))
```

This correctly scopes citizen access to only announcements targeting their municipality.

### Custom Claims in Rules

The SPECS custom claims structure is correct:

```javascript
// In firestore.rules
function getRole() { return request.auth.token.role; }
function getMunicipality() { return request.auth.token.municipalityCode; }
function isInMunicipality(muni) {
  return isSuperAdmin() || getMunicipality() == muni;
}
```

**Important:** Custom claims are set server-side only (via Admin SDK in `setUserRole` Cloud Function). Clients cannot set their own custom claims. This is enforced by Firebase — the `setCustomClaims()` API requires Admin SDK credentials.

**Token refresh requirement:** After a user's custom claims change, their current session token does not automatically reflect the new claims. The client must force a token refresh:

```typescript
// After role change by superadmin
await auth.currentUser.getIdToken(true); // Force refresh
window.location.reload(); // Or re-check permissions
```

### Best Practices for Multi-Tenant Rules in 2026

1. **Never trust client-supplied `municipalityCode`** — always read from the document's stored `municipalityCode` field in rules
2. **Use `resource.data`** for the current document state, `request.resource.data` for the proposed write
3. **Validate all writes with `request.resource.data`** to prevent clients from writing invalid data
4. **Deny all writes at collection level, then selectively allow** — `allow write: if false` at collection level, then `allow create/update: if <condition>` at document level
5. **Use `hasAny()` for role arrays** — `request.auth.token.role in ['municipal_admin', 'provincial_superadmin']`
6. **Index design matters for rules** — rules cannot filter by subcollection fields efficiently; if a rule calls `get()` on a subcollection document, ensure proper indexes exist

### Firestore Rules Performance Concern

The citizen report rule has a nested `get()` call:

```javascript
(isCitizen() && exists(/databases/$(database)/documents/report_private/$(reportId))
  && get(/databases/$(database)/documents/report_private/$(reportId)).data.reporterUid == request.auth.uid)
```

This is acceptable for this use case because it only executes for the citizen's own reports (a narrow scope). However, for high-volume reads, excessive `get()` calls in rules add latency. Monitor this as the report volume grows.

---

## Project Structure

### Adopted from SPECS (No Changes)

The SPECS Section 2.4 project structure is correct and adopted:

```
bantayog-alert/
├── src/
│   ├── app/                        # App shell, routing, providers
│   ├── domains/                    # Domain-bounded modules
│   │   ├── auth/
│   │   ├── reports/
│   │   ├── map/
│   │   ├── feed/
│   │   ├── profile/
│   │   ├── contacts/
│   │   ├── alerts/
│   │   ├── analytics/
│   │   └── audit/
│   ├── shared/
│   │   ├── ui/
│   │   ├── lib/
│   │   ├── hooks/
│   │   └── contracts/             # TypeScript + Zod schemas
│   └── main.tsx
├── functions/
│   ├── src/
│   │   ├── reports/
│   │   ├── auth/
│   │   ├── announcements/
│   │   ├── contacts/
│   │   ├── analytics/
│   │   ├── media/
│   │   └── shared/
│   └── index.ts
├── firestore.rules
├── storage.rules
├── firestore.indexes.json
└── public/
    └── data/
        └── municipalities.geojson
```

### Rationale

- **Domain-bounded folders:** Each domain (reports, map, alerts) owns its types, hooks, and components. This matches the SPECS domain model and keeps related code co-located.
- **Shared contracts:** TypeScript types and Zod schemas in `shared/contracts/` are the single source of truth for both client and Cloud Functions. Cloud Functions import from here directly.
- **`functions/` at root:** Firebase convention; keeps Cloud Functions in the same repo as the client.

---

## Data Flow

### Report Submission Flow

```
User fills form
    ↓
submitReport callable (validated, sanitized)
    ↓
Cloud Function: Zod validation → coordinate bounds check
    ↓
writeBatch: reports + report_private + report_ops + activity (atomic)
    ↓
onReportOpsWrite trigger fires (async, non-blocking)
    ↓
Storage trigger: onFinalize → sharp thumbnail → update report doc
```

### Triage Flow

```
Admin clicks triage action
    ↓
triageReport callable (role check, muni scope check, version check)
    ↓
Cloud Function: validateTransition() → batch write report_ops + activity
    ↓
onReportOpsWrite trigger (syncs public mirror + owner status)
    ↓
Audit log written (same callable, same batch if possible)
```

### State Management Flow

```
Firestore onSnapshot (real-time)
    ↓
useFirestoreQuery hook → React Query cache
    ↓
React Query provides data to components
    ↓
Zustand stores map viewport, drawer state, selected marker
    ↓
Components subscribe to both independently
    ↓
No cross-contamination: React Query never writes to Zustand and vice versa
```

---

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-100 users | No changes needed; Firestore free tier handles this |
| 100-1K users | Add Firestore compound indexes for common queries; ensure composite index definitions in `firestore.indexes.json` are deployed |
| 1K-10K users | Consider read connection limits; monitor Firestore usage dashboard; consider `minInstances: 1` on Cloud Functions to reduce cold starts |
| 10K-100K users | Analytics aggregation becomes critical; may need to paginate admin queues more aggressively; rate limiting on report submissions |
| Province-wide disaster surge | Per-user rate limits (not global); surge mode toggle in admin; pre-warm Cloud Functions |

### Scaling Priorities

1. **First bottleneck: Admin queue queries** — `report_ops` queries with `municipalityCode + internalState` will scale linearly with report volume. Composite indexes are critical.
2. **Second bottleneck: Map pin queries** — Firestore query `LIMIT 200` with geospatial filtering is sufficient for a province the size of Camarines Norte, even at high event density.
3. **Third bottleneck: Cloud Function cold starts during surge** — Set `minInstances: 1` on `submitReport` and `triageReport` to keep them warm during a disaster surge.

---

## Anti-Patterns

### Anti-Pattern 1: Client-Side Municipality Filtering

**What people do:** Filter reports in the React component using `data.filter(r => r.municipalityCode === user.municipalityCode)`.

**Why it's wrong:** This fetches ALL public reports from Firestore, then filters client-side. Exposes data from other municipalities in the client bundle. Wasteful on reads and bandwidth.

**Do this instead:** Use Firestore query `where('municipalityCode', '==', user.municipalityCode)` — server-side filtering.

### Anti-Pattern 2: Storing Firestore Data in Zustand

**What people do:** `const store = create({ reports: [] });` then populate it from Firestore and use Zustand as the primary data store.

**Why it's wrong:** Zustand is not designed for async data. It has no built-in caching, no background refetching, and no stale-while-revalidate behavior. React Query is purpose-built for this.

**Do this instead:** React Query for Firestore data. Zustand only for synchronous UI state (drawer, viewport, selected marker).

### Anti-Pattern 3: Sequential Firestore Writes Instead of Batch

**What people do:** `await setDoc(report); await setDoc(private); await setDoc(ops);` in sequence.

**Why it's wrong:** If the function times out after step 1, you have a partial report. No transaction rollback. Data inconsistency.

**Do this instead:** Always use `writeBatch` for multi-document writes that must be atomic.

### Anti-Pattern 4: Ignoring Firestore Security Rules in Testing

**What people do:** Only test Cloud Function authorization, not Firestore rules directly.

**Why it's wrong:** Rules are the first line of defense. If rules have a bug, malicious clients can bypass Cloud Functions entirely by writing directly to Firestore (using Firebase REST API or Admin SDK with a stolen token).

**Do this instead:** Write comprehensive Firestore rules tests using `@firebase/rules-unit-testing`. Test every permission matrix entry in SPECS Section 8.2.

### Anti-Pattern 5: Direct Image URLs in report_private

**What people do:** Storing raw uploaded image URLs in `report_private`.

**Why it's wrong:** Users could share direct Storage URLs, bypassing the visibility model.

**Do this instead:** Store media URLs with Access Control Lists in Storage (Storage rules enforce authentication). Thumbnails in `reports` for public display. Original media only in `report_private` for owner/admin.

---

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| OpenStreetMap (tiles) | Tile layer in Leaflet | Free, no API key; preload Camarines Norte bounding box tiles |
| Google OAuth | Firebase Auth provider | No additional integration beyond Firebase Auth config |
| FCM (Push) | Firebase Cloud Messaging | Topic-based (`municipality:{code}`) for targeted alerts |
| Sharp (thumbnails) | Cloud Functions Node.js | Runs server-side only; `sharp` is already in SPECS dependencies |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Client app → Firestore | Firebase SDK + React Query hooks | Real-time listeners for live data |
| Client app → Cloud Functions | HTTPS Callable SDK | All sensitive writes |
| Cloud Functions → Firestore | Admin SDK | Full privileged access |
| Cloud Functions → Storage | Admin SDK | Write thumbnails, manage media |
| Cloud Functions → FCM | Admin SDK | Push notification fan-out |

---

## Key Implementation Notes

### Firestore Indexes (from SPECS Section 6.5)

All composite indexes must be deployed before running the application:

```json
// firestore.indexes.json
{
  "indexes": [
    {
      "collectionGroup": "reports",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "visibility", "order": "ASCENDING" },
        { "fieldPath": "municipalityCode", "order": "ASCENDING" },
        { "fieldPath": "updatedAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "reports",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "visibility", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "report_ops",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "municipalityCode", "order": "ASCENDING" },
        { "fieldPath": "internalState", "order": "ASCENDING" },
        { "fieldPath": "updatedAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "announcements",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "targetKeys", "arrayConfig": "CONTAINS" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "publishedAt", "order": "DESCENDING" }
      ]
    }
  ]
}
```

Deploy with: `firebase deploy --only firestore:indexes`

### Cloud Functions Environment

- **Node.js:** 20 (LTS, supported by Cloud Functions v2)
- **Runtime:** `nodejs20`
- **Region:** `asia-east2` (Hong Kong — closest Firebase region to Philippines with full feature support)
- **Memory:** 256MB (default for most functions), 512MB for image processing
- **Timeout:** 60s (default), 10s for simple validations, 300s for image processing

### React-Leaflet Sibling Implementation Detail

The sibling layout described in SPECS requires the map container to be a sibling, not a child, of the drawer/modal in the DOM tree:

```tsx
// WRONG: Map inside a conditional panel
{panel === 'map' && <MapContainer />}  // Map unmounts when panel changes

// CORRECT: Map always rendered as sibling
<div className="app-layout">
  <NavRail />
  <div className="map-area">
    <MapContainer />  {/* Always mounted */}
  </div>
  <WorkspaceDrawer />  {/* Slides in, never affects MapContainer */}
</div>
```

---

## Sources

- [Firebase Cloud Functions v2 Documentation](https://firebase.google.com/docs/functions/v2) — v2 SDK, trigger types, scheduled functions
- [Firestore Security Rules Documentation](https://firebase.google.com/docs/firestore/security/overview) — custom claims, cross-collection access, get() function
- [Firestore Data Model Documentation](https://firebase.google.com/docs/firestore/data-model) — subcollections, batch writes, transactions
- [TanStack Query (React Query) Documentation](https://tanstack.com/query/latest) — useQuery, caching, background refetch
- [Zustand Documentation](https://zustand.docs.pmnd.rs) — lightweight state, no boilerplate
- [React-Leaflet Documentation](https://react-leaflet.js.org) — MapContainer, marker clustering
- [Leaflet Documentation](https://leafletjs.com/reference.html) — invalidateSize, map instance management
- [Firebase Firestore Best Practices](https://firebase.google.com/docs/firestore/best-practices) — indexing, query optimization, scaling

---

*Architecture research for: Bantayog Alert — Disaster Coordination Platform*
*Researched: 2026-04-03*
