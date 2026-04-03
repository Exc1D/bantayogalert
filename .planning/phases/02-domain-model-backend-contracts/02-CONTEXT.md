# Phase 2: Domain Model & Backend Contracts - Context

**Gathered:** 2026-04-03
**Status:** Ready for planning

<domain>
## Phase Boundary

All TypeScript types, Zod schemas, enums, Firestore collection/collection-group structure, and validation logic are defined and validated. This phase produces the type layer and data contracts that every subsequent phase depends on — no business logic, no UI, no auth.

**Delivers:**
- TypeScript interfaces for all entities (Report, User, Contact, Announcement, Municipality, Barangay, AuditEntry)
- Zod schemas for all write operations (report submission, contact CRUD, announcement creation)
- Workflow state machine: VALID_TRANSITIONS map and transition validator
- Three-layer status mapping: WorkflowState → OwnerStatus → PublicStatus with labels
- Firestore collection structure: top-level collections and subcollections
- Security rules baseline (passes emulator validation)
- Municipality catalog seeded in emulator (all 12 municipalities)
- Barangay catalog seeded in emulator (barangays per municipality)
- Municipality GeoJSON at `/public/data/municipalities.geojson`

**Constraints (non-negotiable from prior phases):**
- Firebase SDK 12.x, TypeScript strict mode, Zod 4.x
- Three-tier report split: `reports` / `report_private` / `report_ops`
- Municipality scope enforced server-side in Firestore rules
- Approximate public locations (geohash) in `reports`; exact coords only in `report_private`
</domain>

<decisions>
## Implementation Decisions

### TypeScript Type Organization — Flat with namespace grouping
- **D-21:** All domain types in `src/types/` organized by entity (report.ts, user.ts, contact.ts, announcement.ts, geo.ts). NOT a single monolithic types.ts. Cloud Functions types mirrored in `functions/src/types/`.
- **D-22:** Type exports barrel from `src/types/index.ts`. Downstream imports from `@/types/report` (not `../../types/report`).

### Zod Schema Strategy — Shared schemas
- **D-23:** Zod schemas co-located with their TypeScript interfaces in `src/types/`. Schema and type share the file (e.g., `report.ts` has both `Report` interface and `ReportSchema`).
- **D-24:** Cloud Functions import schemas from shared `functions/src/types/` — single source of truth.
- **D-25:** `zod` is a production dependency (not dev), since schemas are used at runtime in CF.

### Firestore Collection Structure
- **D-26:** Collection hierarchy:
  ```
  /municipalities/{municipalityCode}        — static catalog
  /municipalities/{municipalityCode}/barangays/{barangayCode}
  /users/{userId}
  /reports/{reportId}                      — public (verified only)
  /report_private/{reportId}                — owner + admin (all states)
  /report_ops/{reportId}                    — admin-only operational
  /contacts/{contactId}                    — municipal_admin scoped
  /announcements/{announcementId}
  /analytics/{municipalityCode}/daily/{date}
  /audit/{auditId}                         — global append-only log
  ```
- **D-27:** Collection groups used for: `reports`, `report_private`, `report_ops`, `contacts`, `announcements` (for cross-municipality admin queries).
- **D-28:** Document IDs are Firestore auto-IDs (not user-provided).

### State Machine
- **D-29:** `VALID_TRANSITIONS` defined as `Record<WorkflowState, WorkflowState[]>` in `src/types/workflow.ts`. Phase 9 (Admin Triage) uses this map.
- **D-30:** Transition validation function `canTransition(from: WorkflowState, to: WorkflowState): boolean` exported from same file.
- **D-31:** States: `pending → verified → dispatched → acknowledged → in_progress → resolved`, plus `pending → rejected` (terminal from pending only).

### Three-Layer Status Mapping
- **D-32:** `WorkflowState → OwnerStatus` mapping: defined in `src/types/status.ts`. Labels: "Submitted", "Under Review", "Verified", "Dispatched", "Responder Acknowledged", "In Progress", "Resolved", "Rejected".
- **D-33:** `WorkflowState → PublicStatus` mapping: defined in same file. Labels: "Pending Verification", "Verified", "Resolved".
- **D-34:** Both mappings are arrays indexed by WorkflowState enum ordinal — O(1) lookup, no switch statements.

### Municipality/Barangay Catalog
- **D-35:** Municipality data: 12 municipalities of Camarines Norte with name, code (3-letter), bounded GeoJSON polygon, center point, population (optional).
- **D-36:** Barangay data: all barangays per municipality with name, code (3-letter municipality + 3-digit barangay), municipalityCode reference.
- **D-37:** Catalog seeded via `firebase emulators:exec` with a setup script at `scripts/seed-catalog.ts`. Runs automatically on `npm run emulators`.

### GeoJSON Structure
- **D-38:** Single `municipalities.geojson` FeatureCollection with 12 FeaturePolygons, one per municipality. Properties: `municipalityCode`, `name`.
- **D-39:** Loaded via `fetch('/data/municipalities.geojson')` in any map component. No tile fetching — static asset baked into the PWA precache.

### Firestore Security Rules Baseline
- **D-40:** `firestore.rules` currently stub. Phase 2 deploys functional rules that: allow authenticated reads of `municipalities`; deny all writes to `municipalities` (catalog is write-once); allow `users` read to own doc only; allow authenticated read of `reports` (verified only) and `report_private` (owner or admin).
- **D-41:** Phase 3 will extend rules with RBAC custom claims enforcement.

### Claude's Discretion
- GeoJSON precision: 6 decimal places (~0.1mm) — adequate for boundary visualization
- Population fields: optional, defaulted to null
- Barangay codes: 6-char string (3-char municipality + 3-digit barangay, zero-padded)
- Firestore batch writes: use `writeBatch` for catalog seeding (atomic per municipality)
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Definition
- `.planning/CLAUDE.md` — Stack locked: Firebase 12.x, React 18.3.28, Zod 4.x, TypeScript strict
- `.planning/PROJECT.md` — Core value, three-tier report split, map stability, server-side municipality scope
- `.planning/REQUIREMENTS.md` §Domain Model — DM-01 through DM-06

### Phase-Internal
- `.planning/ROADMAP.md` §Phase 2 — Success criteria (7 must-be-TRUE statements)

### Prior Phase Context
- `.planning/phases/01-project-foundation-tooling/01-CONTEXT.md` — D-01 through D-20 (infrastructure decisions)
</canonical_refs>

<specifics>
## Specific Ideas

No user-facing specifics — Phase 2 is pure type/schema infrastructure. All decisions are technical.
</specifics>

<deferred>
## Deferred Ideas

None — Phase 2 scope stayed well-bounded as pure data modeling.
</deferred>
