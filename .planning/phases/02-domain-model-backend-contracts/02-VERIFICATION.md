---
phase: 02-domain-model-backend-contracts
verified: 2026-04-03T20:50:00Z
status: gaps_found
score: 3/7 criteria fully met
gaps:
  - truth: "TypeScript interfaces compile without errors"
    status: failed
    reason: "municipality.ts line 25 has a TypeScript error preventing build"
    artifacts:
      - path: src/lib/geo/municipality.ts
        issue: "Line 25: Cannot cast Promise<any> to FeatureCollection directly"
    missing:
      - "Fix: return (await res.json()) as unknown as GeoJSON.FeatureCollection"

  - truth: "Zod schemas validate correct data and reject invalid"
    status: partial
    reason: "Multiple schemas have inconsistent constraints for municipality codes"
    artifacts:
      - path: src/types/report.ts
        issue: "ReportSchema.municipalityCode uses z.string().length(3) but 4-char codes exist (cams, daet)"
      - path: src/types/geo.ts
        issue: "BarangaySchema uses z.string().length(3) for municipalityCode and z.string().length(6) for code, but cams001 is 7 chars"
      - path: src/types/announcement.ts
        issue: "AnnouncementSchema uses z.string().length(3) for municipalityCode"
      - path: src/types/contact.ts
        issue: "ContactSchema uses z.string().length(3) for municipalityCode"
      - path: src/types/user.ts
        issue: "UserSchema uses z.string().length(3) for municipalityCode"
    missing:
      - "Align all municipalityCode schemas to z.string().min(3).max(4)"
      - "Align BarangaySchema.code to z.string().min(6).max(7) or similar"

  - truth: "Tests pass"
    status: failed
    reason: "2 of 9 tests fail in municipality.test.ts"
    artifacts:
      - path: src/lib/geo/municipality.test.ts
        issue: "Line 11: expects m.code.toHaveLength(3) but cams/daet are 4 chars"
      - path: src/lib/geo/municipality.test.ts
        issue: "Line 21: uses getMunicipality('dae') but Daet's code is 'daet'"
    missing:
      - "Fix test to check code min/max length instead of exact length"
      - "Fix getMunicipality lookup to use correct code 'daet'"

  - truth: "Firestore security rules deployed and pass baseline validation"
    status: partial
    reason: "Rules are deployed to emulator and syntax is correct, but not fully validated via firebase deploy"
    artifacts:
      - path: firestore.rules
        issue: "Rules syntax confirmed correct via emulator enforcement (PERMISSION_DENIED on unauthenticated read)"
      - path: storage.rules
        issue: "Rules exist and are syntactically correct"
    missing:
      - "Full firebase deploy validation was blocked by project configuration (per 02-02-SUMMARY)"
      - "Emulator confirms rules are loaded and enforcing (PERMISSION_DENIED response confirms)"

  - truth: "Municipality catalog documents exist in emulator with all 12 municipalities"
    status: verified
    reason: "Confirmed via REST API - all 12 municipalities and barangay subcollections seeded"

  - truth: "municipalities.geojson loads and renders on test map"
    status: verified
    reason: "GeoJSON is valid FeatureCollection with 12 municipality polygons; TestMap.tsx imports loadMunicipalitiesGeoJSON"
---

# Phase 02: Domain Model & Backend Contracts Verification Report

**Phase Goal:** Establish TypeScript interfaces, Zod schemas, workflow state machine, Firestore security rules, municipality catalog, and GeoJSON map asset.

**Verified:** 2026-04-03T20:50:00Z
**Status:** gaps_found
**Score:** 3/7 criteria fully met

## Goal Achievement

### Criterion 1: TypeScript Compilation (`npm run build`)

| Check | Status | Details |
|-------|--------|---------|
| TypeScript compiles | **FAILED** | `municipality.ts:25` TypeScript error: `Promise<any>` cannot be cast to `FeatureCollection` directly |
| Vite build | Blocked | Build fails before Vite can run |

**Evidence:**
```
src/lib/geo/municipality.ts(25,10): error TS2352: Conversion of type 'Promise<any>' to type 'FeatureCollection<Geometry, GeoJsonProperties>' may be a mistake...
```

### Criterion 2: Zod Schema Validation

| Schema | File | Status | Issue |
|--------|------|--------|-------|
| `MunicipalitySchema` | `src/types/geo.ts` | **PASSES** | `code: z.string().min(3).max(4)` correctly allows 4-char codes |
| `BarangaySchema` | `src/types/geo.ts` | **FAILS** | `code: z.string().length(6)` rejects 7-char codes like `cams001`; `municipalityCode: z.string().length(3)` rejects 4-char codes |
| `ReportSchema` | `src/types/report.ts` | **INCONSISTENT** | `municipalityCode: z.string().length(3)` rejects 4-char codes |
| `ContactSchema` | `src/types/contact.ts` | **INCONSISTENT** | `municipalityCode: z.string().length(3)` |
| `UserSchema` | `src/types/user.ts` | **INCONSISTENT** | `municipalityCode: z.string().length(3).nullable()` |
| `AnnouncementSchema` | `src/types/announcement.ts` | **INCONSISTENT** | `municipalityCode: z.string().length(3)` |

**Evidence of failure:**
- `BarangaySchema.parse({ code: 'cams001', municipalityCode: 'cams', name: 'test' })` fails with "Too big: expected string to have <=6 characters" and "Too big: expected string to have <=3 characters"
- Seed script successfully writes 7-char barangay codes (`cams001`) and 4-char municipality codes to Firestore, but the Zod schema would reject reading them back

### Criterion 3: VALID_TRANSITIONS Coverage

| Transition | Status |
|------------|--------|
| `pending` → `verified`, `rejected` | VERIFIED |
| `verified` → `dispatched`, `rejected` | VERIFIED |
| `dispatched` → `acknowledged`, `dispatched` (reroute) | VERIFIED |
| `acknowledged` → `in_progress` | VERIFIED |
| `in_progress` → `resolved` | VERIFIED |
| `rejected` → terminal | VERIFIED |
| `resolved` → terminal | VERIFIED |

**Status:** VERIFIED - All documented transitions covered in `VALID_TRANSITIONS` map.

### Criterion 4: Three-Layer Status Mapping

| Layer | Mapping | Status |
|-------|---------|--------|
| `WorkflowState → OwnerStatus` | All 7 states mapped via `WORKFLOW_TO_OWNER_STATUS` | VERIFIED |
| `WorkflowState → PublicStatus` | `WORKFLOW_TO_PUBLIC_STATUS` maps all 7 states | VERIFIED (note: `rejected` maps to 'Resolved' per design decision D-41) |
| `ReportStatus → Labels` | `OWNER_STATUS_LABELS` covers all `ReportStatus` values | VERIFIED |

**Note:** `WORKFLOW_TO_PUBLIC_STATUS[Rejected] = 'Resolved'` - rejected reports display as "Resolved" to public. This is an intentional design decision (D-41) noted in 02-02-SUMMARY.

### Criterion 5: Firestore Security Rules

| Check | Status | Details |
|-------|--------|---------|
| Rules syntax | VERIFIED | `firestore.rules` and `storage.rules` valid |
| Rules deployed to emulator | VERIFIED | Emulator returns `PERMISSION_DENIED` confirming rules are loaded and enforcing |
| `firebase deploy` succeeds | NOT TESTED | Blocked by project configuration (per 02-02-SUMMARY) |
| All collections covered | VERIFIED | municipalities, users, reports, report_private, report_ops, contacts, announcements, analytics, audit |

**Evidence:** `curl http://127.0.0.1:8080/v1/projects/demo-bantayogalert/databases/(default)/documents/municipalities` returns `PERMISSION_DENIED` on L34 (`allow read: if isAuthenticated()`) confirming rules are active.

### Criterion 6: Municipality Catalog in Emulator

| Check | Status | Details |
|-------|--------|---------|
| All 12 municipalities seeded | VERIFIED | `bas, bat, cams, cap, daet, jmo, labo, mer, san, sip, sta, vin` confirmed via REST API |
| Barangay subcollections | VERIFIED | 6-8 barangays per municipality confirmed (e.g., cams has 6) |
| Seed script runs successfully | VERIFIED | `node scripts/seed-catalog.ts` exits 0 with 12 municipalities + ~91 barangays |

### Criterion 7: municipalities.geojson Loadable and Renders

| Check | Status | Details |
|-------|--------|---------|
| GeoJSON valid | VERIFIED | `public/data/municipalities.geojson` is valid FeatureCollection with 12 Polygon features |
| `loadMunicipalitiesGeoJSON` exists | VERIFIED | Exports async function in `src/lib/geo/municipality.ts` |
| TestMap.tsx uses it | VERIFIED | `src/components/map/TestMap.tsx` imports and calls `loadMunicipalitiesGeoJSON` |
| TypeScript error in loadMunicipalitiesGeoJSON | BLOCKER | Build fails before component can be tested |

**GeoJSON Content:** 12 municipalities (Basud, Batobal, Camaligan, Capalonga, Daet, Jose Panganiban, Labo, Mercedes, San Lorenzo Ruiz, Sipocot, Sta Elena, Vinzons) with approximate rectangular polygons.

### Test Results

```
npm run test -- --run

FAIL src/lib/geo/municipality.test.ts
  × each municipality has required fields (expects m.code.toHaveLength(3))
  × getMunicipality returns correct municipality (uses 'dae' but code is 'daet')

8:36:52 PM [vite] warning: deprecated esbuild option
Test Files  1 failed | 2 passed (3)
Tests  2 failed | 7 passed (9)
```

**Root causes:**
1. Test asserts `code.toHaveLength(3)` but `cams` (Camaligan) and `daet` (Daet) are 4 characters. The `MunicipalitySchema` was correctly updated to `min(3).max(4)` but the test was not updated.
2. Test calls `getMunicipality('dae')` but Daet's code is `'daet'`. This is a typo - Daet was not shortened to 3 chars.

### Summary of Gaps

**Critical (blocks compilation):**
1. `municipality.ts:25` TypeScript error - needs `as unknown as` cast
2. Build must pass before any Vite-based verification can occur

**Schema Inconsistencies:**
3. `ReportSchema`, `ContactSchema`, `UserSchema`, `AnnouncementSchema`, `BarangaySchema` all use `z.string().length(3)` for `municipalityCode` but 4-char codes (`cams`, `daet`) exist
4. `BarangaySchema.code` uses `z.string().length(6)` but seeded codes are 7 chars (`cams001`)

**Test Failures:**
5. `municipality.test.ts` line 11: expects 3-char codes but 4-char exist
6. `municipality.test.ts` line 21: uses wrong code `'dae'` instead of `'daet'`

**Deferred (not blocking, per 02-02-SUMMARY):**
7. `firebase deploy --only firestore:rules` full validation - blocked by project config

---

_Verified: 2026-04-03T20:50:00Z_
_Verifier: Claude (gsd-verifier)_
