# Phase 05 Plan 02: Report Submission - Building Blocks Summary

**Phase:** 05-report-submission
**Plan:** 02
**Completed:** 2026-04-03
**Duration:** ~15 minutes

## One-Liner

Leaflet location picker, GPS detector, IndexedDB draft persistence, image compression, and Firebase Storage upload utilities for the report form.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | LocationPickerMap component | c840673 | src/components/map/LocationPickerMap.tsx |
| 2 | useLocationDetector hook | c5d663d | src/features/report/useLocationDetector.ts |
| 3 | useReportDraft IndexedDB | ddc96b5 | src/features/report/useReportDraft.ts |
| 4 | mediaUpload utilities | 0eeb053 | src/features/report/mediaUpload.ts |
| 5 | submitReport callable | 05f9b51 | src/features/report/submitReport.ts |

## Key Files Created

- `src/components/map/LocationPickerMap.tsx` — Dedicated Leaflet map with draggable marker, `onLocationChange(lat, lng)` callback, React 18 Strict Mode guard
- `src/features/report/useLocationDetector.ts` — `detectLocation()` with CN bounds validation (lat 13.8-14.8, lng 122.3-123.3), `findMunicipalityByCoords()` with ray-casting polygon lookup
- `src/features/report/useReportDraft.ts` — IndexedDB via `idb`, key `report-draft-{userId}`, saveDraft/loadDraft/clearDraft
- `src/features/report/mediaUpload.ts` — `compressImage` (1MB/1920px via browser-image-compression), `uploadMediaFiles` (Firebase Storage SDK)
- `src/features/report/submitReport.ts` — Callable wrapper for `submitReport` CF

## TypeScript

- `npm run build` exits 0 with no errors in created files
- Pre-existing test file errors are out of scope

## Deviations from Plan

- `submitReport.ts`: Import changed from `firebase/app` to `firebase/functions` for `getFunctions` and `httpsCallable`
- `mediaUpload.ts`: Added `file.arrayBuffer()` conversion for `uploadBytes` compatibility with File type
- `useLocationDetector.ts`: Added non-null assertions (`!`) in polygon loop for TypeScript strict null checks

## Commits

- `c840673` feat(05-02): add LocationPickerMap with draggable marker
- `c5d663d` feat(05-02): add useLocationDetector hook with GPS and bounds validation
- `ddc96b5` feat(05-02): add useReportDraft IndexedDB persistence
- `0eeb053` feat(05-02): add mediaUpload utilities with compression and Firebase Storage
- `05f9b51` feat(05-02): add submitReport callable wrapper

## Self-Check

- [x] LocationPickerMap.tsx exists with draggable marker + onLocationChange
- [x] useLocationDetector.ts exists with detectLocation + findMunicipalityByCoords
- [x] useReportDraft.ts exists with saveDraft/loadDraft/clearDraft
- [x] mediaUpload.ts exists with compressImage + uploadMediaFiles
- [x] submitReport.ts exists with submitReport callable wrapper
- [x] All 5 commits created
- [x] No TypeScript errors in created files
