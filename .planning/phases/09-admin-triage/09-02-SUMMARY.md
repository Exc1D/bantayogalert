# 09-02 Summary: Core Triage Cloud Functions

## Completed: 2026-04-04

## Changes Made

### functions/src/triage/shared.ts
- Created `buildActivityEntry()` — creates ActivityLogEntry with action, performedBy, performedAt, details
- Created `validateVersion()` — throws failed-precondition on version mismatch
- Created `validateTransition()` — throws failed-precondition on invalid state transition

### functions/src/triage/triageVerify.ts
- pending → verified transition
- Uses buildActivityEntry, validateVersion, validateTransition
- Updates reports, report_private, report_ops with dual activity log writes

### functions/src/triage/triageReject.ts
- pending → rejected transition with reason (required) and category (optional)
- Activity entry details include reason and category

### functions/src/triage/triageDispatch.ts
- verified → dispatched transition
- Fetches contact from contacts/{contactId} and stores ContactSnapshot
- Stores routingDestination and dispatchNotes on report_ops

### functions/src/triage/triageAcknowledge.ts
- dispatched → acknowledged transition
- Standard dual collection update pattern

## Verification
- All 5 files exist in functions/src/triage/
- Each CF uses buildActivityEntry, validateVersion, validateTransition from shared.ts
- Each CF has Zod input schema
- All CFs use db.runTransaction with all 3 document updates
