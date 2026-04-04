# Phase 9: Admin Triage - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-04
**Phase:** 09-admin-triage
**Areas discussed:** All auto-resolved via --auto flag

---

## Admin Queue Layout

| Option | Description | Selected |
|--------|-------------|----------|
| Tabbed (pending/verified/dispatched) | Three tabs mirroring workflow states | ✓ |
| Unified list with status filter | Single list with dropdown filter | |

**Decision:** Tabbed queue with badges showing counts per tab — mirrors workflow state structure and provides clear separation for admin workflow.

## Action Interface

| Option | Description | Selected |
|--------|-------------|----------|
| Detail panel with actions | Click card → drawer with full triage panel + action buttons | ✓ |
| Inline action buttons on cards | Quick actions directly on list cards | |

**Decision:** Detail panel approach — keeps queue clean and consistent with Phase 6's detail panel pattern.

## Rejection UX

| Option | Description | Selected |
|--------|-------------|----------|
| Reason text (required) + category dropdown | Structured rejection with category options | ✓ |
| Just reason text | Free-form rejection reason only | |

**Decision:** Structured rejection with reason + category — better for reporter feedback and analytics.

## Dispatch Flow

| Option | Description | Selected |
|--------|-------------|----------|
| Contact picker modal | Searchable modal list of contacts | ✓ |
| Inline dropdown | Dropdown in the action panel | |

**Decision:** Modal picker — contacts are complex objects, modal provides better UX for selection with search.

## Concurrency Conflict UI

| Option | Description | Selected |
|--------|-------------|----------|
| Modal retry | Modal saying "another admin acted" with refresh button | ✓ |
| Toast notification | Non-blocking toast + auto-refresh | |

**Decision:** Modal retry — conflicts need explicit resolution, modal is clearer for admins.

## Version Field Placement

| Option | Description | Selected |
|--------|-------------|----------|
| report_ops.version | Version field on the existing report_ops document | ✓ |
| Separate concurrency collection | Dedicated document tracking version per report | |

**Decision:** report_ops.version — simplest approach, leverages existing document.

---

## Deferred Ideas

None — all gray areas resolved within phase scope.
