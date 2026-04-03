# Phase 6: Real-time Map & Feed - Research

**Researched:** 2026-04-04
**Domain:** Real-time map rendering + Firestore listener + clustering + paginated feed
**Confidence:** HIGH

## Summary

Phase 6 delivers verified reports as real-time map pins (with Supercluster clustering) and a paginated feed. The core architecture is: a single Firestore `onSnapshot` listener feeds both the map and feed via a shared TanStack Query cache. Supercluster 8.0.1 (already in package.json) provides marker clustering using raw Leaflet layer groups (not react-leaflet components) for maximum control. The map viewport is preserved via sibling layout (MapContainer never remounts) and Zustand-stored viewport state.

## User Constraints (from CONTEXT.md)

### Locked Decisions
All decisions D-108 through D-151 are locked and must not be re-researched as alternatives:

- **D-108:** Firestore `onSnapshot` on `reports` collection, `workflowState == 'verified'` filter
- **D-109:** `queryClient.setQueryData` to sync `onSnapshot` into TanStack Query cache
- **D-110:** Single shared listener at shell level
- **D-111:** Custom `L.divIcon` per marker (severity-colored circle + incident type icon)
- **D-112:** Marker click → `setActivePanel('report-detail')` + `setDrawerOpen(true)` (desktop), route navigate (mobile)
- **D-113:** Selected marker: larger scale + white border ring
- **D-114:** GeoJSON Feature from report: `geometry: { type: 'Point', coordinates: [lng, lat] }`, properties: `{ id, type, severity, createdAt }`
- **D-115:** Supercluster index rebuilt on reports cache update
- **D-116:** `moveend`/`zoomend` → recalculate clusters
- **D-117:** Cluster markers as `L.circleMarker` with count; click → `map.fitBounds`
- **D-118-120:** Municipality boundaries via `loadMunicipalitiesGeoJSON()` → `L.geoJSON`, transparent fill, non-interactive
- **D-121-125:** Filter state in Zustand, client-side filtering, dismissible chips
- **D-126-130:** Feed card design + `startAfter(doc)` pagination + IntersectionObserver
- **D-131-137:** Desktop drawer + mobile bottom sheet, shared `ReportDetailPanel`
- **D-138-140:** Desktop 60/40 split map/feed
- **D-143:** Zustand `mapViewport` state (center, zoom, selectedMarkerId)
- **D-145-147:** Firestore query structure
- **D-148-150:** Empty/loading states
- **D-151:** Severity → Tailwind color mapping

### Deferred Ideas (OUT OF SCOPE)
- Map-feed toggle (implement split view first)
- Resizable split (fixed 60/40 for v1)
- Report thumbnails in feed cards (deferred)
- "View on Map" shortcut from feed card

---

## Standard Stack

### Already Installed (verify versions)
| Library | Version | Purpose |
|---------|---------|---------|
| `supercluster` | 8.0.1 | Marker clustering — **already in package.json** |
| `react-leaflet` | 4.2.1 | React bindings for Leaflet |
| `leaflet` | 1.9.4 | Core map library |
| `zustand` | 5.0.12 | UI state (filters, viewport) |
| `@tanstack/react-query` | 5.96.2 | Async cache + real-time sync |
| `firebase` (web) | 12.11.0 | Firestore listeners |

**No new npm packages required** — `supercluster` is already a dependency.

---

## Research Area 1: Supercluster + React-Leaflet 4.x Integration

### Findings

**Supercluster with react-leaflet requires raw Leaflet manipulation**, not react-leaflet components. The pattern:

1. Use `useMap()` to get the `L.Map` instance (via `MapRefContext`)
2. Store Leaflet layer groups as `useRef<L.LayerGroup[]>` — imperatively managed
3. On cluster recalculation: clear old layers, add new `L.circleMarker` or `L.divIcon` markers
4. Listen to `moveend`/`zoomend` on the map instance to trigger recalculation

**Critical for react-leaflet 4.x:** You cannot use `<Marker>` or `<CircleMarker>` react components for clustered markers because you need full control over when they're created/destroyed. Use `L.circleMarker` / `L.divIcon` via raw Leaflet API inside `useEffect`.

**Supercluster API (v8):**
```typescript
// Setup
const index = new Supercluster({ radius: 60, maxZoom: 16 })
index.load(geojsonFeatures) // GeoJSON Feature[]

// Query at viewport
const clusters = index.getClusters(bounds, zoom) // bounds = [west, south, east, north]
// Returns cluster points with special cluster:true property
```

**Bounds from Leaflet:**
```typescript
const bounds = map.getBounds()
const bbox: BBox = [
  bounds.getWest(),  // west
  bounds.getSouth(), // south
  bounds.getEast(),  // east
  bounds.getNorth()  // north
]
```

### Implications for Implementation

- **New file:** `src/hooks/useSupercluster.ts` — accepts `features` (GeoJSON), `bounds`, `zoom`, returns `clusters`
- **New file:** `src/components/map/ReportMarkers.tsx` — uses `useMap()` + `useSupercluster`, manages Leaflet layer groups imperatively
- Layer group refs cleared/regenerated on every cluster recalculation
- Must handle the case where `mapReady` is false (MapContainerWrapper sets this after init)

---

## Research Area 2: Real-time Firestore → Map/Feed Sync

### Findings

**Firestore `onSnapshot` pattern:**
```typescript
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'

const REPORTS_QUERY_KEY = ['reports', 'verified']

function useVerifiedReportsListener() {
  const queryClient = useQueryClient()

  useEffect(() => {
    const q = query(
      collection(db, 'reports'),
      where('workflowState', '==', 'verified')
    )
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reports = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      queryClient.setQueryData(REPORTS_QUERY_KEY, reports)
    })
    return unsubscribe
  }, [queryClient])
}
```

**Converting Report to GeoJSON Feature:**
```typescript
function reportToGeoJSON(report: Report): GeoJSON.Feature<GeoJSON.Point> {
  return {
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [report.location.lng, report.location.lat]
    },
    properties: {
      id: report.id,
      type: report.type,
      severity: report.severity,
      createdAt: report.createdAt,
    }
  }
}
```

**Single listener at shell level:** `useVerifiedReportsListener` is called once inside `DesktopShell` (or `MapContainerWrapper`), and both `ReportMarkers` (map) and `ReportFeed` (feed) consume via `useQuery(REPORTS_QUERY_KEY)`.

**The listener delivers all verified reports** — client-side filtering (type, severity, date) is applied in the components via filtered derivations of the cached data. Municipality filter may require a Firestore re-query if scoped to a specific municipality.

### Implications for Implementation

- **New file:** `src/hooks/useVerifiedReportsListener.ts` — sets up `onSnapshot`, writes to TanStack Query cache
- `Report` type is already defined in `src/types/report.ts` — no new types needed
- Filtered reports derived with `useMemo` from the query data in each consuming component
- Query key `['reports', 'verified']` used consistently across map and feed

---

## Research Area 3: Filter State Management

### Findings

**New Zustand store:** `src/stores/filterStore.ts`

```typescript
import { create } from 'zustand'
import { IncidentType, Severity } from '@/types/report'

interface DateRange {
  from: Date | null
  to: Date | null
}

interface FilterState {
  type: IncidentType | null
  severity: Severity | null
  municipalityCode: string | null
  dateRange: DateRange
  // Actions
  setType: (type: IncidentType | null) => void
  setSeverity: (severity: Severity | null) => void
  setMunicipality: (code: string | null) => void
  setDateRange: (range: DateRange) => void
  clearFilters: () => void
}

const initialState = {
  type: null,
  severity: null,
  municipalityCode: null,
  dateRange: { from: null, to: null },
}

export const useFilterStore = create<FilterState>((set) => ({
  ...initialState,
  setType: (type) => set({ type }),
  setSeverity: (severity) => set({ severity }),
  setMunicipality: (municipalityCode) => set({ municipalityCode }),
  setDateRange: (dateRange) => set({ dateRange }),
  clearFilters: () => set(initialState),
}))
```

**Client-side filtering logic:**
```typescript
function filterReports(reports: Report[], filters: FilterState): Report[] {
  return reports.filter(r => {
    if (filters.type && r.type !== filters.type) return false
    if (filters.severity && r.severity !== filters.severity) return false
    if (filters.municipalityCode && r.municipalityCode !== filters.municipalityCode) return false
    if (filters.dateRange.from) {
      const created = new Date(r.createdAt)
      if (created < filters.dateRange.from) return false
    }
    if (filters.dateRange.to) {
      const created = new Date(r.createdAt)
      if (created > filters.dateRange.to) return false
    }
    return true
  })
}
```

**Active filter chips:** Computed as array of `{ label, onDismiss }` from non-null filter values. Dismissing calls the respective setter with `null`.

### Implications for Implementation

- `filterStore.ts` in `src/stores/` alongside `uiStore.ts`
- Filter components: `FilterBar.tsx`, `FilterChip.tsx`, `MunicipalityFilter.tsx`
- Desktop: `FilterBar` is sticky below nav rail, above the feed panel
- Mobile: `FilterBar` at top of feed tab, collapses to "Filters" button that expands a bottom sheet

---

## Research Area 4: Feed Pagination with Firestore

### Findings

**Cursor-based pagination:**
```typescript
import { collection, query, where, orderBy, startAfter, limit, getDocs } from 'firebase/firestore'

const PAGE_SIZE = 20

async function fetchReportPage(lastDoc: DocumentSnapshot | null): Promise<{
  reports: Report[]
  lastDoc: DocumentSnapshot | null
  hasMore: boolean
}> {
  let q = query(
    collection(db, 'reports'),
    where('workflowState', '==', 'verified'),
    orderBy('createdAt', 'desc'),
    limit(PAGE_SIZE)
  )
  if (lastDoc) {
    q = query(q, startAfter(lastDoc))
  }
  const snapshot = await getDocs(q)
  const reports = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Report))
  const newLastDoc = snapshot.docs[snapshot.docs.length - 1] ?? null
  return { reports, lastDoc: newLastDoc, hasMore: snapshot.docs.length === PAGE_SIZE }
}
```

**IntersectionObserver for infinite scroll:**
```typescript
function useInfiniteScroll(onLoadMore: () => void, hasMore: boolean) {
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect()
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore) onLoadMore()
      },
      { threshold: 0.1 }
    )
    if (loadMoreRef.current) observerRef.current.observe(loadMoreRef.current)
    return () => observerRef.current?.disconnect()
  }, [onLoadMore, hasMore])

  return { loadMoreRef }
}
```

**TanStack Query integration for paginated feed:**
```typescript
// useReports.ts — manages paginated feed with TanStack Query
function useReportFeed() {
  const [pages, setPages] = useState<Report[][]>([])
  const [hasMore, setHasMore] = useState(true)
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot | null>(null)

  // Fetch next page
  const loadMore = useCallback(async () => {
    if (!hasMore) return
    const { reports, lastDoc: newLastDoc, hasMore: hm } = await fetchReportPage(lastDoc)
    setPages(prev => [...prev, reports])
    setLastDoc(newLastDoc)
    setHasMore(hm)
  }, [lastDoc, hasMore])

  // Reset on filter change (new Zustand store subscription)
  // useEffect watches filter changes → setPages([]), setLastDoc(null)

  return { pages, hasMore, loadMore, loadMoreRef }
}
```

### Implications for Implementation

- **New file:** `src/hooks/useReportFeed.ts` — handles paginated feed with TanStack Query state
- Feed panel renders `pages.flat()` for display; `loadMoreRef` attaches to bottom sentinel div
- **Key behavior:** When filter state changes (Zustand subscription), `pages` resets to `[]` and pagination restarts
- Note: Real-time `onSnapshot` populates the cache, but the **feed pagination uses `getDocs`** (not real-time) to maintain stable cursor positions during scroll. The real-time listener on the shell keeps map pins current.

---

## Research Area 5: Report Detail Panel (Desktop vs Mobile)

### Findings

**Desktop: WorkspaceDrawer `report-detail` panel**

The existing `WorkspaceDrawer` already handles `activePanel === 'report-detail'` (defined in `PANEL_LABELS`). The `DrawerContent` switch needs a new branch:
```typescript
// In DrawerContent, add:
if (panel === 'report-detail') {
  return <ReportDetailPanel reportId={/* get from route or UI store */} />
}
```

However, the current `DrawerContent` only gets the `panel` string, not the `reportId`. The `reportId` should be stored in Zustand (e.g., `selectedReportId: string | null` in `uiStore`).

**Mobile: Bottom sheet navigation**

Current routing: `ShellRouter` renders `MobileShell > Outlet`. A new route `/app/report/:id` needs to be added for the mobile detail view:
```typescript
// In router.tsx under ShellRouter children:
{ path: 'report/:id', element: <ReportDetailSheet /> }
// ReportDetailSheet renders the same <ReportDetailPanel> in a full-screen bottom sheet
```

Mobile bottom sheet behavior (D-135-136):
- Draggable handle, snaps to 40%/90% height
- Full-screen scrim overlay on map
- `useMap()` still available since MobileShell uses `display: none/block` for tab switching

**Shared component:**
```typescript
// src/components/report/ReportDetailPanel.tsx
interface ReportDetailPanelProps {
  reportId: string
  // Reads from cache: useQuery(['reports', 'verified', reportId])
  // Or: queryClient.getQueryData(['reports', 'verified']) and find by id
}
```

### Implications for Implementation

- Add `selectedReportId: string | null` to `uiStore` — set when marker/card is clicked
- Update `DrawerContent` in `WorkspaceDrawer.tsx` to handle `report-detail` with `ReportDetailPanel`
- Mobile route `/app/report/:id` added to `ShellRouter`'s child routes
- `ReportDetailSheet` in mobile shell renders `ReportDetailPanel` in a bottom sheet overlay
- Both desktop drawer and mobile sheet use the same `ReportDetailPanel` component

---

## Research Area 6: Map Overlay Rendering (Municipality Boundaries)

### Findings

The municipality GeoJSON is already loadable via `loadMunicipalitiesGeoJSON()` from `src/lib/geo/municipality.ts`. This function fetches `/data/municipalities.geojson` and returns a `GeoJSON.FeatureCollection`.

**Adding boundary layer to the map (imperative Leaflet):**
```typescript
// In MapContainerWrapper useEffect, after map init:
const boundaryLayer = L.geoJSON(geojsonData, {
  style: {
    fillColor: '#6b7280',
    fillOpacity: 0.05,
    color: '#6b7280',
    weight: 1.5,
  },
  interactive: false, // D-120: non-interactive
})
boundaryLayer.addTo(map)
```

**Important:** `L.geoJSON` with `interactive: false` prevents click events from propagating through the boundaries. This is already the D-120 decision.

**Loading the GeoJSON:**
```typescript
useEffect(() => {
  let mounted = true
  loadMunicipalitiesGeoJSON().then(data => {
    if (mounted && mapRef.current) {
      L.geoJSON(data, {
        style: { fillOpacity: 0.05, color: '#6b7280', weight: 1.5 },
        interactive: false,
      }).addTo(mapRef.current)
    }
  })
  return () => { mounted = false }
}, []) // Only load once on mount
```

### Implications for Implementation

- Boundary GeoJSON loading happens in `MapContainerWrapper.tsx` (or a new `useMapSetup` hook)
- GeoJSON loads asynchronously — map renders immediately with tiles, boundaries appear once loaded
- `loadMunicipalitiesGeoJSON()` already exists; no new data fetching needed
- Boundaries added once on map init, never removed or updated (static reference data)

---

## Research Area 7: Desktop Map-Feed Split Layout

### Findings

**D-138:** Desktop >=1280px: left ~60% map, right ~40% feed panel.

Current `DesktopShell` structure:
```tsx
<div className="flex h-screen w-screen overflow-hidden">
  <NavRail />  {/* w-16 */}
  <div className="flex-1 relative overflow-hidden">
    <MapContainerWrapper>
      <WorkspaceDrawer />
    </MapContainerWrapper>
    {children} {/* Outlet for child routes */}
  </div>
</div>
```

**New split layout** replaces the current single-map design:
```tsx
<div className="flex h-screen w-screen overflow-hidden">
  <NavRail />
  <div className="flex-1 relative overflow-hidden flex">
    {/* Map panel — ~60% */}
    <div className="flex-[3] relative overflow-hidden">
      <MapContainerWrapper>
        <WorkspaceDrawer />
      </MapContainerWrapper>
    </div>
    {/* Feed panel — ~40% */}
    <div className="flex-[2] flex flex-col border-l border-gray-200 bg-white overflow-hidden">
      <FilterBar />
      <ReportFeed />
    </div>
  </div>
</div>
```

**Map viewport preservation:** The `MapContainerWrapper` div is always mounted. `WorkspaceDrawer` overlays on top (via `position: absolute`). No map remount occurs.

**FilterBar shared:** The same `FilterBar` component is rendered at the top of the feed panel for desktop.

### Implications for Implementation

- `DesktopShell.tsx` refactored to implement the 60/40 split
- `ReportFeed` component added to the feed panel
- `FilterBar` added above the feed
- `{children}` outlet overlay approach from current shell is replaced with the split (map-feed toggle is deferred)

---

## Architecture Patterns

### Recommended Project Structure (new files)
```
src/
├── components/
│   ├── map/
│   │   ├── ReportMarkers.tsx       # Supercluster layer management
│   │   ├── MunicipalityBoundaries.tsx  # Boundary overlay
│   │   └── FilterBar.tsx           # Desktop/mobile shared filter UI
│   └── report/
│       ├── ReportDetailPanel.tsx   # Shared detail view
│       ├── ReportFeed.tsx           # Paginated feed list
│       ├── ReportFeedCard.tsx       # Single feed card
│       └── ReportDetailSheet.tsx    # Mobile bottom sheet
├── hooks/
│   ├── useSupercluster.ts           # Supercluster index management
│   ├── useVerifiedReportsListener.ts # Firestore onSnapshot
│   ├── useReportFeed.ts             # Paginated feed + IntersectionObserver
│   └── useMapViewport.ts            # Zustand map viewport sync
├── stores/
│   └── filterStore.ts               # Filter state (new)
```

### Key Pattern: Imperative Leaflet in React
react-leaflet 4.x components are declarative wrappers around Leaflet. For Supercluster (which requires imperatively creating/destroying marker layers on map events), use raw Leaflet API inside `useEffect` + `useMap()`:

```typescript
// DON'T use <Marker> react components for cluster markers
// DO use L.circleMarker / L.divIcon imperatively

const { mapRef, mapReady } = useMap()
const layerGroupRef = useRef<L.LayerGroup>(null)

useEffect(() => {
  if (!mapReady || !mapRef.current) return
  const layerGroup = L.layerGroup().addTo(mapRef.current)
  layerGroupRef.current = layerGroup

  return () => {
    layerGroup.remove()
    layerGroupRef.current = null
  }
}, [mapReady])

// When clusters change: layerGroupRef.current?.clearLayers() then add new markers
```

### Anti-Patterns to Avoid
- **Don't use react-leaflet `<Marker>` for clustered markers** — use raw Leaflet `L.circleMarker` / `L.divIcon` via layer groups for full control
- **Don't create a new Supercluster index on every render** — keep index in a `useRef` and only call `.load()` when features change
- **Don't run `invalidateSize()` on every map event** — only on drawer transition end (already in D-61)
- **Don't mix Firestore real-time and pagination** — use `onSnapshot` for map pins (always fresh), `getDocs` for feed pagination (stable cursors)

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Marker clustering | Custom clustering logic | `supercluster` 8.0.1 | Handles quadtree, zoom, point aggregation correctly |
| Pagination cursors | offset-based pagination | Firestore `startAfter(doc)` | Stable under concurrent writes, Firestore-optimized |
| Infinite scroll trigger | scroll event listeners | `IntersectionObserver` | Native, performant, no debouncing needed |
| Map viewport sync | localStorage or URL params | Zustand `mapViewport` slice | Already using Zustand for UI state |
| Filter persistence | URL search params | Zustand `filterStore` | Simple, no routing changes needed for Phase 6 |

---

## Common Pitfalls

### Pitfall 1: Supercluster index not updated when reports change
**What goes wrong:** Map pins don't appear or are stale after new reports are verified.
**Why it happens:** Supercluster index created once on mount; `onSnapshot` updates TanStack Query but doesn't rebuild the cluster index.
**How to avoid:** `useSupercluster` hook must re-run `index.load(features)` inside a `useEffect` that watches the `features` array (derived from TanStack Query data).
```typescript
useEffect(() => {
  if (features.length > 0) {
    indexRef.current.load(features)
    // Force re-render by updating a state trigger
    setVersion(v => v + 1)
  }
}, [features])
```

### Pitfall 2: MapContainer remounts when drawer opens
**What goes wrong:** Map flashes/reinitializes when drawer opens; marker positions reset.
**Why it happens:** If MapContainer is inside the same div as the drawer (as a child), React Strict Mode or state changes may cause remount.
**How to avoid:** MapContainerWrapper and WorkspaceDrawer are already siblings (D-56). Ensure any new components added to DesktopShell don't nest MapContainer as a child of a conditional-render parent.

### Pitfall 3: Firestore query missing composite index
**What goes wrong:** `workflowState == 'verified'` + `orderBy('createdAt')` fails without composite index.
**How to avoid:** Create composite index in Firestore: `reports` collection, fields: `workflowState` (Asc), `createdAt` (Desc). Add to `firestore.indexes.json`.

### Pitfall 4: Feed pagination resets on real-time update
**What goes wrong:** New verified report arrives via `onSnapshot`, feed page state resets.
**Why it happens:** `useEffect` watching filter store for changes resets pagination; new real-time data might also trigger resets.
**How to avoid:** Feed pagination state is independent of the real-time map cache. The `useReportFeed` hook maintains its own `pages` array and `lastDoc` cursor. Only filter changes (not new real-time data) should reset pagination.

### Pitfall 5: Memory leak from listener + layer groups not cleaned up
**What goes wrong:** After navigating away, `onSnapshot` continues and Leaflet layers persist.
**Why it happens:** `useEffect` cleanup for `onSnapshot` or Leaflet layer groups missing or incomplete.
**How to avoid:** Always return unsubscribe function from `useEffect(() => { const unsub = onSnapshot(...); return unsub }, [...])`. Layer groups removed in cleanup.

---

## Code Examples

### Report → GeoJSON Feature conversion
```typescript
// src/lib/geo/reportToGeoJSON.ts
import type { Report } from '@/types/report'
import type { Feature, Point } from 'geojson'

export function reportToGeoJSON(report: Report): Feature<Point> {
  return {
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [report.location.lng, report.location.lat],
    },
    properties: {
      id: report.id,
      type: report.type,
      severity: report.severity,
      createdAt: report.createdAt,
    },
  }
}
```

### Supercluster hook
```typescript
// src/hooks/useSupercluster.ts
import { useMemo, useState } from 'react'
import Supercluster from 'supercluster'
import type { Feature, Point, BBox } from 'geojson'

interface UseSuperclusterOptions {
  features: Feature<Point>[]
  bounds: BBox | null
  zoom: number
}

export function useSupercluster({ features, bounds, zoom }: UseSuperclusterOptions) {
  const [version, setVersion] = useState(0)

  const index = useMemo(() => {
    const idx = new Supercluster({ radius: 60, maxZoom: 16 })
    if (features.length > 0) {
      idx.load(features)
      setVersion(v => v + 1)
    }
    return idx
  }, [features])

  // Use version to force re-render when index loads new features
  const clusters = useMemo(() => {
    if (!bounds) return []
    return index.getClusters(bounds, Math.floor(zoom))
  }, [index, bounds, zoom, version])

  return { clusters, index }
}
```

### Firestore real-time listener hook
```typescript
// src/hooks/useVerifiedReportsListener.ts
import { useEffect } from 'react'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { useQueryClient } from '@tanstack/react-query'
import { db } from '@/lib/firebase/config'
import type { Report } from '@/types/report'

const REPORTS_QUERY_KEY = ['reports', 'verified']

export function useVerifiedReportsListener() {
  const queryClient = useQueryClient()

  useEffect(() => {
    const q = query(
      collection(db, 'reports'),
      where('workflowState', '==', 'verified')
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reports: Report[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Report
      queryClient.setQueryData<Report[]>(REPORTS_QUERY_KEY, reports)
    })

    return unsubscribe
  }, [queryClient])
}
```

### Cluster marker creation
```typescript
import L from 'leaflet'

function createClusterIcon(count: number): L.DivIcon {
  return L.divIcon({
    html: `<div class="cluster-marker">${count}</div>`,
    className: 'custom-cluster-icon',
    iconSize: L.point(40, 40),
  })
}

function createReportIcon(severity: string, type: string): L.DivIcon {
  const color = { critical: '#dc2626', high: '#f97316', medium: '#eab308', low: '#22c55e' }[severity] ?? '#6b7280'
  return L.divIcon({
    html: `<div class="report-marker" style="background:${color}"><span>${type[0].toUpperCase()}</span></div>`,
    className: 'custom-report-icon',
    iconSize: L.point(32, 32),
    iconAnchor: L.point(16, 16),
  })
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Polling Firestore | `onSnapshot` real-time listener | Phase 6 | Reports appear within seconds of verification |
| No clustering | Supercluster client-side clustering | Phase 6 | Handles 1000+ pins without performance degradation |
| Filter via Firestore queries | Client-side filter on cached data | Phase 6 | Instant filter response, no network round-trips |
| Offset pagination | Cursor-based `startAfter(doc)` | Phase 6 | Stable pagination under concurrent writes |

---

## Open Questions

1. **Composite Firestore index for reports query**
   - What we know: `workflowState == 'verified'` + `orderBy('createdAt', 'desc')` needs a composite index
   - What's unclear: Whether the index is already created or needs to be added to `firestore.indexes.json`
   - Recommendation: Add explicit composite index entry in `firestore.indexes.json` to avoid runtime errors

2. **Barangay-level granularity in feed/map**
   - What we know: `reports` documents have `barangayCode` field; no barangay boundary GeoJSON available yet
   - What's unclear: Whether barangay boundaries will ever be needed (DM-06 mentions municipality GeoJSON only)
   - Recommendation: Municipality-code filter only for Phase 6; barangay GeoJSON deferred

3. **Photo/media thumbnails in feed cards**
   - What we know: Reports can have `mediaUrls`; D-126 compact card design doesn't include thumbnails
   - What's unclear: Whether this is a Phase 12 enhancement or needs planning now
   - Recommendation: Compact cards without thumbnails per D-126; thumbnail support as deferred enhancement

---

## Environment Availability

> Step 2.6: SKIPPED (no external dependencies beyond project codebase)

No external tools, services, or runtimes are required for this phase. All dependencies are already in package.json:
- `supercluster`: 8.0.1 (already installed)
- `firebase`, `leaflet`, `react-leaflet`, `zustand`, `@tanstack/react-query`: all installed

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.2 |
| Config file | `vitest.config.ts` (in project root) |
| Quick run command | `npm test -- --run` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FM-01 | Verified reports appear as pins | unit | `vitest run src/**/*.test.ts*` (component tests with mocked map) | Wave 0 |
| FM-02 | Supercluster groups dense pins | unit | `vitest run src/**/*.test.ts*` | Wave 0 |
| FM-03 | Municipality boundary overlay | unit | Mock Leaflet map, verify L.geoJSON called | Wave 0 |
| FM-04 | Filter bar filters map+feed | unit | `vitest run src/stores/filterStore.test.ts` | Wave 0 |
| FM-05 | Paginated feed sorted by createdAt DESC | unit | `vitest run src/hooks/useReportFeed.test.ts` | Wave 0 |
| FM-06 | Feed cards show severity/type/time/status | unit | `vitest run src/components/report/ReportFeedCard.test.tsx` | Wave 0 |
| FM-07 | Report detail panel on pin/card click | unit | `vitest run src/**/ReportDetailPanel.test.tsx` | Wave 0 |
| FM-08 | Map viewport preserved on drawer open | integration | Emulator test: open drawer, verify map center unchanged | Wave 0 |
| FM-09 | MapContainer never remounts | unit | `vitest run src/app/shell/DesktopShell.test.tsx` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test -- --run` (unit tests only)
- **Per wave merge:** `npm test` (full suite)
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/stores/filterStore.test.ts` — tests filter state actions + selectors
- [ ] `src/hooks/useSupercluster.test.ts` — tests cluster index loading + getClusters
- [ ] `src/hooks/useReportFeed.test.ts` — tests pagination state machine
- [ ] `src/components/report/ReportFeedCard.test.tsx` — tests card rendering with mock data
- [ ] `src/components/report/ReportDetailPanel.test.tsx` — tests detail panel rendering
- [ ] `src/components/map/ReportMarkers.test.tsx` — tests marker creation logic (mocked Leaflet)
- [ ] `src/app/shell/DesktopShell.test.tsx` — tests shell renders without remounting map
- [ ] `firestore.indexes.json` — add composite index for `reports(workflowState ASC, createdAt DESC)`

---

## Sources

### Primary (HIGH confidence)
- `src/types/report.ts` — IncidentType, Severity, Report, GeoLocation interfaces
- `src/types/status.ts` — WORKFLOW_TO_PUBLIC_STATUS, OWNER_STATUS_LABELS
- `src/stores/uiStore.ts` — Zustand UI state pattern
- `src/lib/geo/municipality.ts` — loadMunicipalitiesGeoJSON() implementation
- `src/lib/firebase/config.ts` — Firestore `db` export
- `package.json` — supercluster 8.0.1 confirmed present
- Context7: `supercluster` — Supercluster v8 API (getClusters, load, radius, maxZoom)
- Context7: `react-leaflet` v4 — useMap() hook, MapContainer API

### Secondary (MEDIUM confidence)
- Firestore documentation: cursor-based pagination with `startAfter`
- IntersectionObserver MDN: browser-native infinite scroll triggering

### Tertiary (LOW confidence)
- Tailwind color class mappings for severity (D-151 used as ground truth)

---

## Metadata

**Confidence breakdown:**
- Supercluster integration: HIGH — API stable, package already in project
- Real-time Firestore sync: HIGH — standard onSnapshot + queryClient.setQueryData pattern
- Feed pagination: HIGH — standard Firestore cursor pagination
- Map/Feed split layout: HIGH — CSS flexbox, no new libraries
- Municipality boundaries: HIGH — loadMunicipalitiesGeoJSON already exists

**Research date:** 2026-04-04
**Valid until:** 2026-05-04 (30 days — Firestore + react-leaflet APIs are stable)
