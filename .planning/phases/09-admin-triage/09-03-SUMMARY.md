# 09-03 Summary: Remaining 5 Triage Cloud Functions

## Completed: 2026-04-04

## Changes Made

### functions/src/triage/triageInProgress.ts
- acknowledged → in_progress transition
- Standard dual collection update with activity entries

### functions/src/triage/triageResolve.ts
- Accepts ANY non-terminal state → resolved
- Terminal states (rejected, resolved) are rejected with failed-precondition
- Resolution notes stored in activity entry details

### functions/src/triage/triageReroute.ts
- Updates assignedContactSnapshot without changing workflowState
- Only allowed on dispatched or in_progress reports
- Does NOT update reports/{id} — unique among triage CFs
- Fetches new contact to build ContactSnapshot

### functions/src/triage/triageUpdatePriority.ts
- Non-state-change mutation (no canTransition validation)
- Updates report_private.priority and report_ops
- Stores previousPriority in activity entry for audit trail

### functions/src/triage/triageUpdateNotes.ts
- Non-state-change mutation
- Stores internalNotes (admin-only, never sent to reporter)
- Updates report_private and report_ops only

## Verification
- All 5 files exist in functions/src/triage/
- triageReroute does NOT change workflowState (unique behavior)
- triageUpdatePriority and triageUpdateNotes do NOT use canTransition
- All CFs use optimistic concurrency via version field
