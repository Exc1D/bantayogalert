---
phase: 02-domain-model-backend-contracts
plan: '01'
subsystem: types
tags: [typescript, zod, domain-model]
dependency_graph:
  requires: ['01-01', '01-02', '01-03']
  provides: ['types']
  affects: ['03-01', '04-01', '09-01']
tech_stack:
  added: [zod]
  patterns: [three-tier-report, workflow-state-machine, discriminated-union]
key_files:
  created:
    - src/types/report.ts
    - src/types/user.ts
    - src/types/contact.ts
    - src/types/announcement.ts
    - src/types/geo.ts
    - src/types/workflow.ts
    - src/types/status.ts
    - src/types/index.ts
    - functions/src/types/report.ts
    - functions/src/types/index.ts
decisions:
  - ID: D-21
    summary: Flat namespace grouping by entity in src/types/
  - ID: D-23
    summary: Zod schemas co-located with TypeScript interfaces
  - ID: D-29
    summary: VALID_TRANSITIONS as Record<WorkflowState, WorkflowState[]>
  - ID: D-32
    summary: WorkflowState to OwnerStatus mapping via WORKFLOW_TO_OWNER_STATUS
metrics:
  duration_minutes: ~2
  completed_date: '2026-04-03T20:29:00Z'
  tasks_completed: 6
  files_created: 10
  lines_added: ~483
---

# Phase 2 Plan 1: TypeScript Types and Zod Schemas

## One-liner

TypeScript interfaces and Zod schemas for all domain entities with Camarines Norte coordinate bounds validation and workflow state machine.

## Completed Tasks

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Create src/types/ directory and barrel export | c89c73e | src/types/index.ts |
| 2 | Create Report types and Zod schema | c89c73e | src/types/report.ts |
| 3 | Create User and Contact types and Zod schemas | c89c73e | src/types/user.ts, src/types/contact.ts |
| 4 | Create Announcement, Geo, Workflow, Status types | c89c73e | src/types/announcement.ts, src/types/geo.ts, src/types/workflow.ts, src/types/status.ts |
| 5 | Mirror types to Cloud Functions | c89c73e | functions/src/types/report.ts, functions/src/types/index.ts |
| 6 | Verify TypeScript compilation | c89c73e | npm run build passes |

## What Was Built

**Enums (4):** `IncidentType`, `Severity`, `WorkflowState`, `ReportStatus` for reports; `UserRole` for auth; `ContactType` for responders; `AnnouncementType`, `AnnouncementSeverity`, `AnnouncementStatus` for alerts.

**Interfaces (10):** `Report`, `ReportPrivate`, `ReportOps`, `GeoLocation`, `ReportMedia`, `ActivityLogEntry`, `AppUser`, `NotificationPreferences`, `Contact`, `Announcement`, `Municipality`, `Barangay`.

**Zod Schemas (9):** All with proper bounds for Camarines Norte coordinates (lat: 13.8-14.8, lng: 122.3-123.3). `AnnouncementSchema` uses discriminated union for `targetScope`.

**Workflow State Machine:** `VALID_TRANSITIONS` map covers 7 documented transitions. `canTransition(from, to)` returns correct boolean.

**Status Mappings:** `WORKFLOW_TO_OWNER_STATUS` (O(1) lookup), `WORKFLOW_TO_PUBLIC_STATUS`, `OWNER_STATUS_LABELS` cover all states.

## Deviations from Plan

**Rule 1 - Bug Fix:** Fixed TypeScript compilation error where `import type` was used for enums in `workflow.ts` and `status.ts`. Changed to regular `import` since TypeScript enums are values at runtime.

## Verification

- `npm run build` exits 0 with no errors
- All 10 files committed with 483 insertions
- TypeScript strict mode passes

## Self-Check: PASSED
