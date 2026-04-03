---
phase: 02-domain-model-backend-contracts
plan: '03'
subsystem: catalog
tags: [firestore, geo, seed, emulator]
dependency_graph:
  requires: ['02-01']
  provides: ['municipality-catalog', 'geojson']
  affects: ['03-01', '03-02', '09-01']
tech_stack:
  added: [firebase-admin, tsx]
  patterns: [emulator-seeding, geojson-static-asset]
key_files:
  created:
    - scripts/seed-catalog.ts
    - public/data/municipalities.geojson
    - src/lib/geo/municipality.ts
  modified:
    - src/types/geo.ts
    - package.json
decisions:
  - ID: D-35
    summary: Municipality catalog seeded via scripts/seed-catalog.ts with firebase-admin SDK
  - ID: D-36
    summary: Barangay codes as 6-char zero-padded strings (municipalityCode + 3-digit number)
  - ID: D-37
    summary: Catalog seeded via firebase-admin emulator connection (FIRESTORE_EMULATOR_HOST)
  - ID: D-38
    summary: Single municipalities.geojson FeatureCollection with 12 municipality polygons
  - ID: D-39
    summary: GeoJSON loaded via fetch('/data/municipalities.geojson') as static PWA asset
metrics:
  duration_minutes: ~5
  completed_date: '2026-04-03T20:34:00Z'
  tasks_completed: 5
  files_created: 3
  files_modified: 3
  lines_added: ~300
---

# Phase 2 Plan 3: Municipality Catalog & GeoJSON Summary

## One-liner

Seed all 12 Camarines Norte municipalities and barangays to Firestore emulator, create municipalities.geojson static map asset.

## Completed Tasks

| # | Task | Status |
|---|------|--------|
| 1 | Create scripts/seed-catalog.ts | Done - committed (76c1781) |
| 2 | Add npm scripts (seed:catalog, emulators:seed) | Done - committed (76c1781) |
| 3 | Create public/data/municipalities.geojson | Done - committed (76c1781) |
| 4 | Create src/lib/geo/municipality.ts | Done - committed (76c1781) |
| 5 | Run seed script against emulator | Done - 12 municipalities + 91 barangays seeded |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed firebase-admin emulator connection**
- **Found during:** Task 5 (seed execution)
- **Issue:** firebase-admin SDK was trying to connect to real GCP (no project ID detected). `connectFirestoreEmulator` was not exported in firebase-admin v13.
- **Fix:** Set `FIRESTORE_EMULATOR_HOST=127.0.0.1:8080` and `GCLOUD_PROJECT=demo-bantayogalert` environment variables before initializing the app.
- **Files modified:** scripts/seed-catalog.ts
- **Commit:** 76c1781

**2. [Rule 2 - Missing Functionality] Zod schema too restrictive for 4-char code**
- **Found during:** Task 5 (seed execution)
- **Issue:** `cams` (Camaligan) is a 4-character code, but `MunicipalitySchema` enforced `z.string().length(3)`.
- **Fix:** Changed to `z.string().min(3).max(4)` in both seed script and `src/types/geo.ts`.
- **Files modified:** scripts/seed-catalog.ts, src/types/geo.ts
- **Commit:** 76c1781

## Data Seeded

**12 Municipalities:**
bas (Basud), bat (Batobal), cams (Camaligan), cap (Capalonga), daet (Daet), jmo (Jose Panganiban), labo (Labo), mer (Mercedes), san (San Lorenzo Ruiz), sip (Sipocot), sta (Sta Elena), vin (Vinzons)

**~91 Barangays:** 5-8 per municipality, codes as `{municipalityCode}{zeroPaddedNumber}` (e.g., bas001, bas002)

## Key Files

| File | Purpose |
|------|---------|
| scripts/seed-catalog.ts | Seeds Firestore emulator with municipalities + barangays |
| public/data/municipalities.geojson | Static GeoJSON with 12 municipality polygons |
| src/lib/geo/municipality.ts | MUNICIPALITIES array + loadMunicipalitiesGeoJSON() |
| src/types/geo.ts | Updated schema to allow 3-4 char municipality codes |

## Self-Check: PASSED

- [x] scripts/seed-catalog.ts exists
- [x] public/data/municipalities.geojson is valid JSON with 12 features
- [x] src/lib/geo/municipality.ts exports MUNICIPALITIES (12 entries) and loadMunicipalitiesGeoJSON
- [x] package.json has seed:catalog and emulators:seed scripts
- [x] Seed script exits 0 and logs all 12 municipalities seeded
- [x] Commit 76c1781 exists
