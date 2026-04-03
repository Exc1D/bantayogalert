---
phase: 06-real-time-map-feed
plan: "06-01"
subsystem: infra
tags: [zustand, firestore, geojson, tanstack-query, react-leaflet]

requires:
  - phase: "03-auth-role-model"
    provides: Firebase Auth + RBAC custom claims (municipalityCode, role)
  - phase: "05-reporting-workflow"
    provides: Report type definitions (Report, IncidentType, Severity, WorkflowState)

provides:
  - Zustand filter state store (type, severity, municipalityCode, dateRange) with clearFilters action
  - selectedReportId in uiStore for report detail panel tracking
  - reportToGeoJSON utility converting Report Firestore docs to GeoJSON Feature<Point>
  - useVerifiedReportsListener Firestore onSnapshot hook writing to TanStack Query ['reports', 'verified'] key

affects:
  - 06-02 (Supercluster integration for marker clustering)
  - 06-03 (ReportMarkers map component consuming GeoJSON layer)
  - 06-04 (ReportFeed component consuming TanStack Query cache)

tech-stack:
  added: []
  patterns:
    - "Zustand store pattern: create<Interface>((set) => ({ ...initialState, actions }))"
    - "Firestore onSnapshot in React useEffect, writing to TanStack Query cache"
    - "GeoJSON Feature<Point> conversion for Leaflet marker rendering"

key-files:
  created:
    - src/stores/filterStore.ts
    - src/lib/geo/reportToGeoJSON.ts
    - src/hooks/useVerifiedReportsListener.ts
  modified:
    - src/stores/uiStore.ts

key-decisions:
  - "selectedReportId added to uiStore (not filterStore) since it is UI state, not filter criteria"

requirements-completed: [FM-01, FM-02, FM-03]

duration: 5min
completed: 2026-04-04
---

# Phase 06 Plan 01: Real-Time Map Feed Foundation Summary

**Filter state in Zustand, GeoJSON conversion utility, and Firestore onSnapshot listener feeding TanStack Query cache for verified reports**

## Performance

- **Duration:** ~5 min
- **Tasks:** 3/3
- **Files created:** 3
- **Files modified:** 1

## Task Commits

1. **Task 1: filterStore.ts + uiStore selectedReportId** - `3ab07c9` (feat)
2. **Task 2: reportToGeoJSON.ts utility** - `80d19da` (feat)
3. **Task 3: useVerifiedReportsListener.ts hook** - `347e9cd` (feat)

## Files Created/Modified

- `src/stores/filterStore.ts` - Zustand store with type, severity, municipalityCode, dateRange state and clearFilters action
- `src/stores/uiStore.ts` - Added selectedReportId and setSelectedReportId to UIState interface and implementation
- `src/lib/geo/reportToGeoJSON.ts` - Converts Report Firestore doc to GeoJSON Feature<Point> with id, type, severity, createdAt properties
- `src/hooks/useVerifiedReportsListener.ts` - Firestore onSnapshot on reports/ filtered by workflowState==verified, writes Report[] to ['reports', 'verified'] TanStack Query key

## Decisions Made

- selectedReportId placed in uiStore (not filterStore) since it represents active UI selection, not filter criteria
- Followed existing uiStore pattern exactly (create<UIState>((set) => ({...})) with typed setters)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## Next Phase Readiness

- useVerifiedReportsListener ready for mounting at DesktopShell/MobileShell level
- filterStore ready for ReportFeed and ReportMarkers filter controls
- reportToGeoJSON ready for Supercluster index population

---
*Phase: 06-01*
*Completed: 2026-04-04*
