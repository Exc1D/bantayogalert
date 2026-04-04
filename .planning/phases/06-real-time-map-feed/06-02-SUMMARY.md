---
phase: 06-real-time-map-feed
plan: "06-02"
subsystem: ui
tags: [supercluster, leaflet, zustand, tanstack-query]

requires:
  - phase: "06-01"
    provides: filterStore, reportToGeoJSON, useVerifiedReportsListener
  - phase: "06-01b"
    provides: useSupercluster, useMapViewport, Firestore composite index

provides:
  - MapClusterIcon.tsx: createClusterIcon(count) and createReportIcon(severity, type, isSelected) L.DivIcon factories
  - MunicipalityBoundaries.tsx: imperatively managed L.geoJSON layer with transparent fill and non-interactive boundaries
  - FilterBar.tsx: dual-axis filter UI (type/severity/municipality selects + dismissible chips)
  - ReportMarkers.tsx: Supercluster-powered marker clustering with imperative L.layerGroup management
  - Leaflet cluster CSS in index.html

affects:
  - 06-03 (ReportMarkers → ReportFeed integration, municipality scope selector)
  - 06-04 (FilterBar mobile collapsible behavior)

tech-stack:
  added:
    - "@types/supercluster" (dev, v7.1.3)
  patterns:
    - "Imperative Leaflet layer management via useRef + useEffect"
    - "Supercluster index rebuilt on features change; clusters recalculated on viewport change"
    - "Side-effect components return null"

key-files:
  created:
    - src/components/map/MapClusterIcon.tsx
    - src/components/map/MunicipalityBoundaries.tsx
    - src/components/map/FilterBar.tsx
    - src/components/map/ReportMarkers.tsx
  modified:
    - src/app/shell/MapContainerWrapper.tsx (added MunicipalityBoundaries + ReportMarkers)
    - index.html (cluster/marker CSS styles)
    - src/hooks/useSupercluster.ts (relaxed any types to fix build)

key-decisions:
  - "Cluster icon: blue (#3b82f6) circular bubble with white border"
  - "Report icon: severity-colored circle with emoji, selected = scale(1.2) + white ring"
  - "MunicipalityBoundaries: interactive:false prevents boundary clicks from interfering with markers"
  - "uploadAsPromise helper: Promise.resolve(uploadTask) for Firebase UploadTask → assertSucceeds/assertFails compatibility"

requirements-completed: [FM-01, FM-02, FM-03, FM-04, FM-08]

duration: 8min
completed: 2026-04-04
---

# Phase 06 Plan 06-02: Real-Time Map Layer — Clustered Markers, Boundaries, FilterBar

**Wave 2 of Phase 06: Supercluster marker clustering, municipality GeoJSON overlay, shared filter UI**

## Performance

- **Duration:** ~8 min
- **Tasks:** 5/5
- **Files created:** 4
- **Files modified:** 3 (MapContainerWrapper, useSupercluster, index.html)
- **Build:** EXIT=0 ✓

## Task Commits

1. **Task 1: MapClusterIcon.tsx + index.html CSS** — cluster + report marker divIcons
2. **Task 2: MunicipalityBoundaries.tsx** — L.geoJSON overlay, transparent gray, non-interactive
3. **Task 3: FilterBar.tsx** — type/severity/municipality selects + dismissible FilterChips
4. **Task 4: ReportMarkers.tsx** — Supercluster layer group, marker click → setActivePanel
5. **Task 5: MapContainerWrapper integration** — MunicipalityBoundaries + ReportMarkers mounted

## Artifacts Produced

### src/components/map/MapClusterIcon.tsx
- `createClusterIcon(count: number): L.DivIcon` — blue (#3b82f6) circular bubble
- `createReportIcon(severity, type, isSelected): L.DivIcon` — severity color + emoji, selected = scale(1.2)

### src/components/map/MunicipalityBoundaries.tsx
- Loads `/data/municipalities.geojson` via `loadMunicipalitiesGeoJSON()`
- Imperatively adds L.geoJSON with `fillOpacity: 0.05`, `interactive: false`
- Cleanup on unmount via useRef

### src/components/map/FilterBar.tsx
- Reads from `useFilterStore` (type, severity, municipalityCode, clearFilters)
- Shows dismissible FilterChips for active filters
- `formatLabel()` helper for human-readable enum formatting

### src/components/map/ReportMarkers.tsx
- `useQuery<Report[]>({ queryKey: REPORTS_QUERY_KEY })` reads from TanStack Query cache
- `useMemo` derives filtered GeoJSON features from reports + filter state
- `useSupercluster({ features, bounds, zoom })` returns clusters
- `useEffect` on `clusters` → L.layerGroup.addLayer/remove for each cluster/report
- Cluster click → `mapRef.current.setView()` zoom-in; report click → `setSelectedMarkerId + setActivePanel('report-detail')`
- Viewport sync on `moveend`/`zoomend` → `useMapViewportStore.setViewport`

### index.html
- `.custom-cluster-icon`, `.cluster-marker-inner`, `.custom-report-icon` CSS styles

## Decisions Made

- `@types/supercluster@7.1.3` installed (supercluster@8.0.1) — version mismatch noted but functional
- `useSupercluster.ts` updated to use `any` types to resolve Supercluster v7/v8 type incompatibility
- `ReportMarkers` coordinates: `const coords = cluster.geometry.coordinates as [number, number]` to satisfy strict TypeScript
- `uploadAsPromise(uploadTask)` in storage.rules.test.ts: `Promise.resolve(uploadTask)` to adapt Firebase UploadTask thenable to Promise

## Deviations from Plan

- `index.html <style>` block added for cluster/marker CSS instead of separate CSS file (per project convention)
- `@types/supercluster` needed to be installed; not pre-existing

## Pre-existing Test Fixes (Unrelated to 06-02)

Fixed TypeScript errors in pre-existing test files to unblock `tsc -b`:
- `tests/storage.rules.test.ts`: Added `uploadAsPromise` helper; wrapped all `ref.put()` calls
- `tests/unit/image-compression.test.ts`: Used `maxBytes`/`maxDim` in expect assertions
- `tests/e2e/my-reports.spec.ts`: Removed unused `page` param from stub test
- `tests/e2e/report-submission.spec.ts`: Removed unused `page` param from stub tests
- `tests/integration/submit-report.test.ts`: Removed unused Firebase imports
- `tests/firestore.rules.test.ts`: Removed unused `ADMIN_DAET` const declarations

## Issues Encountered

- `Supercluster.AnyProps` type error: fixed by using `any` generics in useSupercluster.ts
- `@types/supercluster` v7 incompatible with supercluster v8 — used `any` types to bridge
- Pre-existing test TypeScript errors blocked `tsc -b` — fixed all to achieve clean build

## Next Phase Readiness

- FilterBar ready for placement in DesktopShell (sticky) and MobileShell (collapsible)
- ReportMarkers needs `useVerifiedReportsListener()` mounted in parent component (DesktopShell/MobileShell)
- ReportFeed (06-04) will read from same TanStack Query cache key `['reports', 'verified']`

---
*Phase: 06-02*
*Completed: 2026-04-04*
