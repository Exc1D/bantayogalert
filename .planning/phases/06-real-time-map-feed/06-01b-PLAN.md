---
phase: 06-real-time-map-feed
plan: "06-01b"
type: execute
wave: 1
depends_on: ["06-01"]
requirements:
  - FM-01
  - FM-02
  - FM-03
  - FM-04
  - FM-05
  - FM-06
  - FM-07
  - FM-08
files_modified:
  - src/hooks/useSupercluster.ts
  - src/hooks/useMapViewport.ts
  - firestore.indexes.json
autonomous: true
must_haves:
  truths:
    - "Supercluster index can be queried with bounds and zoom to return clusters and points"
    - "Map viewport (center, zoom, selectedMarkerId) is persisted in Zustand"
    - "Firestore composite index supports workflowState==verified + orderBy createdAt DESC"
  artifacts:
    - path: src/hooks/useSupercluster.ts
      provides: Supercluster index management with getClusters(bounds, zoom) interface
    - path: src/hooks/useMapViewport.ts
      provides: Zustand-backed mapViewport state with setViewport, setSelectedMarkerId actions
    - path: firestore.indexes.json
      provides: Composite index: reports(workflowState ASC, createdAt DESC)
  key_links:
    - from: useVerifiedReportsListener.ts (06-01)
      to: TanStack Query cache
      via: queryClient.setQueryData(['reports', 'verified'], reports)
    - from: useSupercluster.ts
      to: filterStore state
      via: features derived via useMemo from TanStack Query cache filtered by filterStore state
---

<objective>
Supercluster infrastructure for Phase 6: useSupercluster hook, useMapViewport Zustand store, and Firestore composite index. This plan completes Wave 1 infrastructure. It depends on 06-01 (filterStore, reportToGeoJSON, useVerifiedReportsListener) since useSupercluster consumes the GeoJSON conversion and the listener populates the cache that features are derived from.
</objective>

<context>
@src/lib/geo/reportToGeoJSON.ts -- reportToGeoJSON(report) -> Feature<Point> (created in 06-01)
@src/hooks/useVerifiedReportsListener.ts -- REPORTS_QUERY_KEY = ['reports', 'verified'] (created in 06-01)
@src/stores/filterStore.ts -- useFilterStore() provides type, severity, municipalityCode state (created in 06-01)
@firestore.indexes.json -- currently has empty indexes array; add composite index for reports query
</context>

<interfaces>
From src/types/report.ts:
```typescript
enum IncidentType { Flood='flood', Landslide='landslide', Fire='fire', Earthquake='earthquake', Medical='medical', VehicleAccident='vehicle_accident', Crime='crime', Other='other' }
enum Severity { Critical='critical', High='high', Medium='medium', Low='low' }

interface Report {
  id: string; type: IncidentType; severity: Severity; description: string
  location: GeoLocation; municipalityCode: string; barangayCode: string
  mediaUrls: string[]; createdAt: string; updatedAt: string
  reporterId: string; workflowState: WorkflowState
}
```

From src/stores/uiStore.ts:
```typescript
export const useUIStore = create<UIState>((set) => ({
  drawerOpen: false, setDrawerOpen: (open) => set({ drawerOpen: open }),
  activePanel: null, setActivePanel: (panel) => set({ activePanel: panel, drawerOpen: panel !== null }),
  activeTab: 'feed', setActiveTab: (tab) => set({ activeTab: tab }),
}))
```
</interfaces>

<read_first>
- src/lib/geo/reportToGeoJSON.ts (created in 06-01)
- src/hooks/useVerifiedReportsListener.ts (created in 06-01)
- src/stores/filterStore.ts (created in 06-01)
</read_first>

<tasks>

<task type="auto">
  <name>Task 1: Create useSupercluster.ts hook</name>
  <files>src/hooks/useSupercluster.ts</files>
  <action>
Create `src/hooks/useSupercluster.ts`:

```typescript
import { useMemo, useState, useRef } from 'react'
import Supercluster from 'supercluster'
import type { Feature, Point, BBox } from 'geojson'

interface UseSuperclusterOptions {
  features: Feature<Point>[]
  bounds: BBox | null
  zoom: number
}

interface UseSuperclusterResult {
  clusters: ReturnType<Supercluster['getClusters']>
  supercluster: Supercluster | null
}

export function useSupercluster({ features, bounds, zoom }: UseSuperclusterOptions): UseSuperclusterResult {
  const [version, setVersion] = useState(0)
  const indexRef = useRef<Supercluster | null>(null)

  const index = useMemo(() => {
    const idx = new Supercluster<Feature<Point>, Supercluster.AnyProps>({
      radius: 60,
      maxZoom: 16,
    })
    if (features.length > 0) {
      idx.load(features)
      setVersion((v) => v + 1)
    }
    indexRef.current = idx
    return idx
  }, [features])

  const clusters = useMemo(() => {
    if (!bounds) return []
    return index.getClusters(bounds, Math.floor(zoom))
  }, [index, bounds, zoom, version])

  return { clusters, supercluster: indexRef.current }
}
```

Features are passed in from the consuming component (derived from TanStack Query cache via useMemo). The hook rebuilds the index when features change, and re-queries clusters when bounds or zoom changes.
  </action>
  <verify>
grep -r "useSupercluster" src/hooks/useSupercluster.ts && grep -r "getClusters" src/hooks/useSupercluster.ts</verify>
  <done>useSupercluster returns { clusters, supercluster } with getClusters called against bounds and floor(zoom)</done>
</task>

<task type="auto">
  <name>Task 2: Create useMapViewport.ts -- Zustand map viewport state</name>
  <files>src/hooks/useMapViewport.ts</files>
  <action>
Create `src/hooks/useMapViewport.ts`:

```typescript
import { create } from 'zustand'

export interface MapViewport {
  center: [number, number]  // [lat, lng]
  zoom: number
}

interface MapViewportState {
  mapViewport: MapViewport
  selectedMarkerId: string | null
  setViewport: (viewport: MapViewport) => void
  setSelectedMarkerId: (id: string | null) => void
}

const DEFAULT_VIEWPORT: MapViewport = {
  center: [14.15, 122.9],  // Camarines Norte center
  zoom: 10,
}

export const useMapViewportStore = create<MapViewportState>((set) => ({
  mapViewport: DEFAULT_VIEWPORT,
  selectedMarkerId: null,
  setViewport: (mapViewport) => set({ mapViewport }),
  setSelectedMarkerId: (selectedMarkerId) => set({ selectedMarkerId }),
}))
```

The map component (Wave 2 ReportMarkers) will call `setViewport` on `moveend`/`zoomend` events to persist viewport. `setSelectedMarkerId` is called when a marker is clicked. This store is separate from uiStore to keep map-specific state isolated.
  </action>
  <verify>
grep -r "useMapViewportStore" src/hooks/useMapViewport.ts && grep -r "mapViewport" src/hooks/useMapViewport.ts</verify>
  <done>useMapViewportStore has mapViewport {center, zoom}, selectedMarkerId, setViewport, setSelectedMarkerId</done>
</task>

<task type="auto">
  <name>Task 3: Add Firestore composite index for reports query</name>
  <files>firestore.indexes.json</files>
  <action>
Update `firestore.indexes.json`:

```json
{
  "indexes": [
    {
      "collectionGroup": "reports",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "workflowState", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    }
  ],
  "fieldOverrides": []
}
```

This composite index is required for the query `where('workflowState', '==', 'verified')` + `orderBy('createdAt', 'desc')` which is used by the paginated feed (Wave 3 useReportFeed) and the real-time listener (Wave 1 useVerifiedReportsListener).
  </action>
  <verify>
grep -r "workflowState" firestore.indexes.json && grep -r "createdAt" firestore.indexes.json</verify>
  <done>firestore.indexes.json has composite index for reports(workflowState ASC, createdAt DESC)</done>
</task>

</tasks>

<verification>
- `npm run build` -- TypeScript compiles without errors
- `grep -r "useSupercluster" src/hooks/useSupercluster.ts` -- supercluster hook exists
- `grep -r "useMapViewportStore" src/hooks/useMapViewport.ts` -- viewport store exists
- `grep -r "workflowState.*ASCENDING" firestore.indexes.json` -- composite index exists
</verification>

<success_criteria>
- src/hooks/useSupercluster.ts accepts features/bounds/zoom, returns { clusters, supercluster }
- src/hooks/useMapViewport.ts exports useMapViewportStore with mapViewport and selectedMarkerId
- firestore.indexes.json has composite index for reports(workflowState ASC, createdAt DESC)
</success_criteria>

<output>
After completion, create `.planning/phases/06-real-time-map-feed/06-01b-SUMMARY.md`
</output>
