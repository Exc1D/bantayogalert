# Phase 9: Admin Triage - Research

**Researched:** 2026-04-04
**Domain:** Firebase Cloud Functions triage actions + React admin UI + Firestore real-time listeners
**Confidence:** HIGH

## Summary

Phase 9 builds a complete municipal admin triage system. Municipal admins see a tabbed queue (Pending/Verified/Dispatched) scoped to their municipality, take state-transition actions via dedicated Cloud Functions, and manage priority/classification/notes. All actions enforce the `VALID_TRANSITIONS` state machine with optimistic concurrency (version field), create dual activity log entries, and propagate status updates to the public and owner documents via CF side-effects.

**Primary recommendation:** Implement 7 separate named Cloud Functions (D-177) rather than a single unified triage CF with an action-type parameter. Separate functions are more testable, have clearer Firestore security rule coverage, and allow per-action rate limiting.

## User Constraints (from CONTEXT.md)

### Locked Decisions
- D-158 through D-198: Full implementation decisions already made (tabbed queue layout, action interface, dispatch flow, state machine enforcement, optimistic concurrency, activity audit, CF triggers, priority/classification, internal notes, superadmin cross-municipality, admin report detail panel, Firebase collection access)
- All 16 requirements (TRI-01 through TRI-16) are locked scope

### Claude's Discretion
- Exact component file structure (components vs features organization) — follow Phase 05/06 pattern
- Animation/transition details for tab switching and drawer opening
- Error toast wording for specific error conditions
- Loading skeleton designs for queue cards

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.

---

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| TRI-01 | Admin queue scoped to municipality (pending/verified/dispatched tabs) | onSnapshot on report_ops + municipalityCode filter; tab counts via query snapshots |
| TRI-02 | Verify pending report (pending → verified) | triageVerify CF, VALID_TRANSITIONS['pending'] includes 'verified' |
| TRI-03 | Reject with reason (pending → rejected) | triageReject CF, rejectionReason stored in activityLog details |
| TRI-04 | Dispatch to responder (verified → dispatched) | triageDispatch CF + ContactSnapshot capture from Phase 08 CON-06 |
| TRI-05 | Acknowledge (dispatched → acknowledged) | triageAcknowledge CF |
| TRI-06 | In progress (acknowledged → in_progress) | triageInProgress CF |
| TRI-07 | Resolve any non-terminal | triageResolve CF, accepts any non-terminal state |
| TRI-08 | Reroute to different contact | triageReroute CF updates assignedContactSnapshot |
| TRI-09 | Priority (1-5) and classification | triageUpdatePriority CF updates report_private.priority; classification in report_ops |
| TRI-10 | Internal notes (admin-only) | triageUpdateNotes CF updates report_private.internalNotes |
| TRI-11 | State machine enforcement | canTransition() check in every CF, failed-precondition on invalid |
| TRI-12 | Optimistic concurrency (version field) | report_ops.version, expectedVersion param, transaction validation |
| TRI-13 | Activity log in report_ops/activity subcollection | FieldValue.arrayUnion with ActivityLogEntry |
| TRI-14 | Audit log entries | Dual write: report_private.activityLog + report_ops.activity |
| TRI-15 | Superadmin cross-municipality access | validateSuperadmin bypasses municipalityCode check |
| TRI-16 | Municipal scope enforced server-side | validateMunicipalAdmin in every CF |

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| firebase-functions | 7.2.2 | Callable CF runtime | Project standard (Phase 03) |
| firebase-admin | 13.7.0 | Firestore transactions + admin SDK | Project standard (Phase 03) |
| zod | ^3.0 | Input validation in CFs | Already in use (Phase 05 submitReport) |
| @tanstack/query | 5.96.2 | React data fetching | Project standard (Phase 06) |
| zustand | 5.0.12 | UI state (activePanel, selectedReportId) | Project standard (Phase 04) |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| firebase/firestore | 12.11.0 | onSnapshot listeners | Real-time admin queue |
| @tanstack/query (onSnapshot cache sync) | 5.96.2 | Bridge Firestore listener to TanStack Query | Phase 06 established pattern |
| firebase/functions (httpsCallable) | 12.11.0 | Invoke triage CFs from React | Standard callable pattern from Phase 05/08 |

**No new packages required.** All dependencies are already in the project.

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── components/report/
│   ├── AdminReportDetailPanel.tsx   # Admin-only detail view (triage actions, routing, notes)
│   ├── AdminQueueCard.tsx            # Compact card with priority dot overlay
│   ├── AdminQueueFeed.tsx            # Tabbed queue (Pending/Verified/Dispatched)
│   ├── ContactPickerModal.tsx        # Dispatch contact selection modal
│   └── PriorityStars.tsx             # Clickable 1-5 priority stars
├── hooks/
│   └── useAdminQueueListener.ts      # onSnapshot on report_ops, joins with reports
functions/src/
├── triage/
│   ├── triageVerify.ts
│   ├── triageReject.ts
│   ├── triageDispatch.ts
│   ├── triageAcknowledge.ts
│   ├── triageInProgress.ts
│   ├── triageResolve.ts
│   ├── triageReroute.ts
│   ├── triageUpdatePriority.ts
│   ├── triageUpdateNotes.ts
│   └── shared.ts                     # Shared triage logic (validateAdmin, buildActivityEntry, updateDocs)
```

### Pattern 1: Named Triage Cloud Functions (D-177)

**What:** Seven separate callable CFs, one per action type. Each is a named export in `functions/src/index.ts`.

**When to use:** Every triage action from TRI-02 through TRI-10.

**Example (triageVerify):**
```typescript
// functions/src/triage/triageVerify.ts
export const triageVerify = functions.https.onCall(async (data, context) => {
  validateAuthenticated(context)
  const claims = context.auth!.token
  const { reportId, expectedVersion } = data

  const db = getFirestore()
  const reportOpsRef = db.collection('report_ops').doc(reportId)
  const reportRef = db.collection('reports').doc(reportId)
  const reportPrivateRef = db.collection('report_private').doc(reportId)

  await db.runTransaction(async (tx) => {
    const opsDoc = await tx.get(reportOpsRef)
    if (!opsDoc.exists) throw new functions.https.HttpsError('not-found', 'Report not found')

    // Optimistic concurrency check
    const currentVersion = opsDoc.data()?.version ?? 1
    if (currentVersion !== expectedVersion) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'Version conflict — another admin acted on this report. Please refresh and try again.'
      )
    }

    // Read current state
    const reportDoc = await tx.get(reportRef)
    const currentState = reportDoc.data()?.workflowState

    // Validate state machine transition
    if (!canTransition(currentState, 'verified')) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        `Cannot verify a report in '${currentState}' state.`
      )
    }

    // Validate municipal scope
    const municipalityCode = reportDoc.data()?.municipalityCode
    if (!isSuperadmin(claims) && !isMunicipalAdmin(claims, municipalityCode)) {
      throw new functions.https.HttpsError('permission-denied', 'Not your municipality')
    }

    const now = new Date().toISOString()
    const activityEntry = buildActivityEntry('verified', claims.uid, now)

    // Update all three documents + increment version
    tx.update(reportRef, { workflowState: 'verified', updatedAt: now })
    tx.update(reportPrivateRef, {
      ownerStatus: WORKFLOW_TO_OWNER_STATUS['verified'],
      activityLog: FieldValue.arrayUnion(activityEntry),
    })
    tx.update(reportOpsRef, {
      version: currentVersion + 1,
      activity: FieldValue.arrayUnion(activityEntry),
    })
  })

  return { success: true }
})
```

**Source:** submitReport.ts transaction pattern (Phase 05), validateMunicipalAdmin from Phase 03

### Pattern 2: Optimistic Concurrency (D-178-D-180)

**What:** `report_ops.version` starts at 1. Every triage action receives `expectedVersion` from the client (extracted from the current displayed version). The transaction reads the current version and only proceeds if they match.

**When to use:** Every triage action CF that modifies report_ops.

**Client handling of conflict (D-179):**
```typescript
// In the React mutation handler
try {
  await triageVerify({ reportId, expectedVersion })
} catch (error: unknown) {
  if (error instanceof functions.https.HttpsError && error.code === 'failed-precondition') {
    // Show conflict dialog with [Refresh] button
    showConflictDialog()
    return
  }
  throw error
}
```

**Source:** Concurrency control via Firestore transactions (submitReport pattern)

### Pattern 3: Dual Activity Log Write (D-182-D-183)

**What:** Every triage action pushes an `ActivityLogEntry` to both `report_private.activityLog[]` (visible to owner) and `report_ops/activity` subcollection (admin-only timeline).

**Implementation detail:** Use `FieldValue.arrayUnion()` in the transaction to atomically append, rather than reading the array, pushing, and writing back (which would cause concurrent-write conflicts).

```typescript
// Shared helper in functions/src/triage/shared.ts
export function buildActivityEntry(
  action: string,
  performedBy: string,
  details?: Record<string, unknown>
): ActivityLogEntry {
  return {
    action,
    performedBy,
    performedAt: new Date().toISOString(),
    details: details ? JSON.stringify(details) : undefined,
  }
}
```

### Pattern 4: Admin Queue Real-Time Listener (D-197-D-198)

**What:** `onSnapshot` listener on `report_ops` collection, filtered by `municipalityCode` (client-side filter for superadmin's cross-municipality view).

```typescript
// src/hooks/useAdminQueueListener.ts
export function useAdminQueueListener(municipalityCode: string | null) {
  const queryClient = useQueryClient()

  useEffect(() => {
    let q = query(collection(db, 'report_ops'))
    if (municipalityCode) {
      q = query(q, where('municipalityCode', '==', municipalityCode))
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      // Join with reports collection for display data
      const reportIds = snapshot.docs.map(d => d.id)
      // Fetch report metadata from TanStack Query cache or Firestore
      queryClient.setQueryData(['admin-queue', municipalityCode], snapshot.docs.map(d => ({ id: d.id, ...d.data() })))
    })

    return unsubscribe
  }, [queryClient, municipalityCode])
}
```

**Source:** useVerifiedReportsListener.ts (Phase 06) — identical onSnapshot pattern

### Pattern 5: Superadmin Municipality Filter (D-192-D-194)

**What:** Superadmin default view is "All Municipalities" (municipalityCode filter = null). Municipal admins are always scoped to their own municipality.

```typescript
// In AdminQueueFeed
const { customClaims } = useAuth()
const isSuperadmin = customClaims?.role === 'provincial_superadmin'
const [filterMunicipality, setFilterMunicipality] = useState<string | null>(
  isSuperadmin ? null : customClaims?.municipalityCode ?? null
)
```

### Pattern 6: Contact Picker for Dispatch (D-169-D-173)

**What:** Dispatch action opens `ContactPickerModal` showing active contacts filtered by report's municipalityCode. On selection, the contact's details are snapshotted into `report_ops.assignedContactSnapshot`.

```typescript
// triageDispatch input schema
const TriageDispatchDataSchema = z.object({
  reportId: z.string(),
  expectedVersion: z.number(),
  contactId: z.string(),
  routingDestination: z.string().optional(),
  dispatchNotes: z.string().optional(),
})
```

**Contact snapshot is already defined** as `ContactSnapshot` in `functions/src/types/contact.ts` (Phase 08 CON-06).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| State machine validation | Custom transition checks | `canTransition()` from `src/types/workflow.ts` | Already implemented, tested, shared with client |
| Version conflict detection | Read-then-write with manual version check | Firestore transaction with version guard | Prevents race conditions atomically |
| Activity log appending | Read array, push, write back | `FieldValue.arrayUnion()` | Atomic, no concurrent-write conflicts |
| Admin auth guard | Ad-hoc role checks in every CF | `validateMunicipalAdmin(context, municipalityCode)` | Already implemented, covers superadmin bypass |
| Municipal scope enforcement | Client-side filtering only | `validateMunicipalAdmin` in every CF | Server-side enforcement required for TRI-16 |

---

## Runtime State Inventory

> Not a rename/refactor/migration phase — no runtime state inventory required.

## Common Pitfalls

### Pitfall 1: State Machine Transition Bypass
**What goes wrong:** Admin actions bypass `canTransition()` check, allowing invalid transitions (e.g., pending → in_progress).
**Why it happens:** Developer adds new CF without checking VALID_TRANSITIONS.
**How to avoid:** Every triage CF calls `canTransition(currentState, targetState)` and throws `failed-precondition` on false. Centralize in `shared.ts`.
**Warning signs:** TRI-11 unit tests fail, or `failed-precondition` errors appear unexpectedly in production.

### Pitfall 2: Optimistic Concurrency Stale Reads
**What goes wrong:** Version field not incremented after a CF completes successfully, allowing the same action to be retried.
**Why it happens:** Transaction updates one field but not the version field, or version increment in a separate non-atomic write.
**How to avoid:** Version increment is in the same Firestore transaction as the state update. All 7 CFs share a `shared.ts` helper that does both atomically.
**Warning signs:** TRI-12 concurrency test fails, duplicate notifications sent to same contact.

### Pitfall 3: Superadmin Bypass Missing
**What goes wrong:** `validateMunicipalAdmin` is called without also checking for superadmin, causing superadmins to be denied access to their own municipality's reports.
**Why it happens:** `validateMunicipalAdmin` already contains superadmin bypass internally (Phase 03), but new developers may not realize this.
**How to avoid:** Document clearly in `shared.ts` that `validateMunicipalAdmin` accepts superadmin as valid for any municipality. Write a test that dispatches a superadmin action across a different municipality and asserts it succeeds.

### Pitfall 4: Client-Side Only Municipality Filtering
**What goes wrong:** Superadmin's "All Municipalities" filter works on the client but an improperly scoped Firestore rule allows cross-municipality reads.
**Why it happens:** Firestore rules are correctly set (Phase 03), but if a future developer adds a new collection query without the filter, it would be blocked by rules. However, existing `report_ops` read rules allow municipal_admin and provincial_superadmin to read all.
**How to avoid:** Confirm in Firestore rules that `report_ops` allows provincial_superadmin to read all municipalities without filter. D-198 confirms "onSnapshot listener on report_ops collection filtered by municipalityCode (client-side filter for superadmin's all-municipality view)" — this means client-side filtering only, relying on server-side auth claims.

### Pitfall 5: Activity Log Written Before Transaction Commits
**What goes wrong:** Activity log entry appears in `report_private` but not in `report_ops` (or vice versa) due to partial transaction failure.
**Why it happens:** Activity log writes are in the transaction but a later field write in the same transaction throws, rolling back the log entries.
**How to avoid:** All log writes and state writes happen in the same `runTransaction` block. Test by deliberately throwing after the activity log write but before the final `tx.update()` call.

---

## Code Examples

### ActivityLogEntry (already defined)
```typescript
// src/types/report.ts
export interface ActivityLogEntry {
  action: string
  performedBy: string
  performedAt: string
  details?: string // JSON string with action-specific data
}
```

### ContactSnapshot (already defined)
```typescript
// functions/src/types/contact.ts
export interface ContactSnapshot {
  contactId: string
  name: string
  agency: string
  type: ContactType
  phones: string[]
  email?: string
  municipalityCode: string
}
```

### VALID_TRANSITIONS check (already implemented)
```typescript
// src/types/workflow.ts
export const VALID_TRANSITIONS: Record<WorkflowState, WorkflowState[]> = {
  [WorkflowState.Pending]: [WorkflowState.Verified, WorkflowState.Rejected],
  [WorkflowState.Verified]: [WorkflowState.Dispatched, WorkflowState.Rejected],
  [WorkflowState.Dispatched]: [WorkflowState.Acknowledged, WorkflowState.Dispatched],
  [WorkflowState.Acknowledged]: [WorkflowState.InProgress],
  [WorkflowState.InProgress]: [WorkflowState.Resolved],
  [WorkflowState.Rejected]: [],
  [WorkflowState.Resolved]: [],
}
```

### Superadmin bypass in claims (already implemented)
```typescript
// functions/src/auth/claims.ts
export function isSuperadmin(claims: { role: string }): boolean {
  return claims.role === UserRole.ProvincialSuperadmin
}

export function isMunicipalAdmin(claims, municipalityCode): boolean {
  return claims.role === UserRole.MunicipalAdmin && claims.municipalityCode === municipalityCode
}

// validateMunicipalAdmin checks: isSuperadmin(claims) || isMunicipalAdmin(claims, municipalityCode)
```

### useAuth customClaims (already implemented)
```typescript
// src/lib/auth/AuthProvider.tsx
export interface CustomClaims {
  role: UserRole
  municipalityCode: string | null
  provinceCode: string
}
```

### Existing callable CF pattern (Phase 05)
```typescript
// functions/src/reports/submitReport.ts
export const submitReport = functions.https.onCall(async (data, context) => {
  validateAuthenticated(context)
  const parsedData = SubmitReportDataSchema.safeParse(data)
  if (!parsedData.success) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid report data', { errors: parsedData.error.issues })
  }
  // ...transaction logic
})
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Single unified triage CF with action parameter | 7 named separate CFs | D-177 (this phase) | More testable, clearer security rules, per-action rate limiting possible |
| Client-side state transition validation | Server-side `canTransition()` check in every CF | Phase 02 | TRI-11 compliance |
| No concurrency control | Version field in report_ops + transaction guard | D-178 (this phase) | TRI-12 compliance |
| Activity log in report_private only | Dual log: report_private + report_ops.activity | D-182 (this phase) | Full audit trail for admins, limited view for reporters |

**Deprecated/outdated:**
- None identified for this phase.

---

## Open Questions

1. **Does `report_ops` need a `municipalityCode` field for server-side filtering?**
   - What we know: The current `report_ops` document schema does not include `municipalityCode`. The queue listener (D-197) says "onSnapshot on report_ops collection filtered by municipalityCode" — but filtering requires a field to filter on.
   - What's unclear: Is `municipalityCode` already in `report_ops` or does it need to be added? The `submitReport` CF creates `report_ops` with only `{ id: reportId }` (line 170-172 of submitReport.ts). The filter might need to join through `reports/{id}`.
   - Recommendation: Add `municipalityCode: string` to `report_ops` at creation time in `submitReport` CF. This enables efficient server-side Firestore query filtering and is consistent with the three-tier model.

2. **Should `report_ops` store a `version` field on initial creation?**
   - What we know: D-178 says version starts at 1, but `submitReport` (Phase 05) creates `report_ops` with only `{ id: reportId }`.
   - What's unclear: Should `submitReport` initialize `version: 1` to avoid null checks in every triage CF?
   - Recommendation: Yes — initialize `version: 1` in `submitReport` transaction. Simplifies all triage CFs.

3. **Does the activity subcollection use the same document ID as the parent report?**
   - What we know: D-183 describes "report_ops/activity subcollection" — subcollection under `report_ops/{reportId}/activity`.
   - What's unclear: Whether to use `add()` (auto-ID) or `doc(activityId).set()` for each entry.
   - Recommendation: Use `add()` for fire-and-forget log entries (no concurrency concern for append-only log), and store the resulting ID in the entry.

---

## Environment Availability

> Step 2.6: SKIPPED (no external dependencies identified beyond existing Firebase/React stack).

All required tools are already part of the project's established Firebase + React + TypeScript stack.

**Existing Firebase emulators:** Auth=9099, Firestore=8080, Storage=9199, Functions=5001 (confirmed from CLAUDE.md).

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 2.x + @firebase/rules-unit-testing |
| Config file | `vitest.config.ts` (Phase 05-00) |
| Quick run command | `npm run test` |
| Full suite command | `npm run test -- --run` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TRI-02 | triageVerify transitions pending->verified | unit | `vitest functions/src/triage/triageVerify.test.ts` | NO |
| TRI-03 | triageReject requires reason, transitions pending->rejected | unit | `vitest functions/src/triage/triageReject.test.ts` | NO |
| TRI-04 | triageDispatch captures ContactSnapshot, transitions verified->dispatched | unit | `vitest functions/src/triage/triageDispatch.test.ts` | NO |
| TRI-05 | triageAcknowledge transitions dispatched->acknowledged | unit | `vitest functions/src/triage/triageAcknowledge.test.ts` | NO |
| TRI-06 | triageInProgress transitions acknowledged->in_progress | unit | `vitest functions/src/triage/triageInProgress.test.ts` | NO |
| TRI-07 | triageResolve accepts any non-terminal state | unit | `vitest functions/src/triage/triageResolve.test.ts` | NO |
| TRI-08 | triageReroute updates assignedContactSnapshot, transitions dispatched->dispatched | unit | `vitest functions/src/triage/triageReroute.test.ts` | NO |
| TRI-09 | triageUpdatePriority sets priority 1-5 on report_private | unit | `vitest functions/src/triage/triageUpdatePriority.test.ts` | NO |
| TRI-10 | triageUpdateNotes saves internalNotes to report_private | unit | `vitest functions/src/triage/triageUpdateNotes.test.ts` | NO |
| TRI-11 | Invalid transitions throw failed-precondition | unit | `vitest functions/src/triage/shared.test.ts` (state machine tests) | NO |
| TRI-12 | Version mismatch throws failed-precondition | unit | `vitest functions/src/triage/concurrency.test.ts` | NO |
| TRI-14 | Activity entries in both report_private and report_ops/activity | unit | `vitest functions/src/triage/shared.test.ts` (dual-write tests) | NO |
| TRI-16 | Municipal admin cannot triage other municipality's reports | unit | `vitest functions/src/triage/auth.test.ts` | NO |

### Sampling Rate
- **Per task commit:** `npm run test -- --run functions/src/triage/`
- **Per wave merge:** `npm run test -- --run` (full suite)
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- `functions/src/triage/` — no test directory yet (Phase 05 test infrastructure is in `tests/integration/` and `tests/rules/`)
- `functions/src/triage/triageVerify.test.ts` — covers TRI-02
- `functions/src/triage/triageReject.test.ts` — covers TRI-03
- `functions/src/triage/triageDispatch.test.ts` — covers TRI-04, CON-06
- `functions/src/triage/triageAcknowledge.test.ts` — covers TRI-05
- `functions/src/triage/triageInProgress.test.ts` — covers TRI-06
- `functions/src/triage/triageResolve.test.ts` — covers TRI-07
- `functions/src/triage/triageReroute.test.ts` — covers TRI-08
- `functions/src/triage/triageUpdatePriority.test.ts` — covers TRI-09
- `functions/src/triage/triageUpdateNotes.test.ts` — covers TRI-10
- `functions/src/triage/concurrency.test.ts` — covers TRI-12
- `functions/src/triage/auth.test.ts` — covers TRI-16
- `src/components/report/AdminQueueFeed.test.tsx` — UI component tests
- `src/hooks/useAdminQueueListener.test.ts` — listener hook tests
- Framework install: Already installed (vitest 2.x in package.json)

---

## Sources

### Primary (HIGH confidence)
- `functions/src/reports/submitReport.ts` — Callable CF pattern, transaction structure, Zod validation (Phase 05)
- `functions/src/contacts/createContact.ts` — CF callable pattern with Zod + validateMunicipalAdmin
- `functions/src/auth/claims.ts` — isSuperadmin, isMunicipalAdmin, setCustomClaims
- `functions/src/security/validateAuth.ts` — validateSuperadmin, validateMunicipalAdmin, validateAuthenticated
- `src/types/workflow.ts` — VALID_TRANSITIONS, canTransition()
- `src/types/report.ts` — Report, ReportPrivate, ReportOps, ActivityLogEntry interfaces
- `src/types/status.ts` — WORKFLOW_TO_OWNER_STATUS mapping
- `functions/src/types/contact.ts` — ContactSnapshot (Phase 08)
- `src/hooks/useVerifiedReportsListener.ts` — onSnapshot pattern (Phase 06)
- `src/hooks/useContacts.ts` — TanStack Query + httpsCallable pattern (Phase 08)

### Secondary (MEDIUM confidence)
- `src/app/shell/WorkspaceDrawer.tsx` — Panel architecture with ActivePanel enum (Phase 04)
- `src/stores/uiStore.ts` — Zustand store for activePanel, selectedReportId (Phase 04)
- `src/components/report/ReportFeedCard.tsx` — Card design to extend (Phase 06)
- `src/components/report/ReportDetailPanel.tsx` — Citizen detail panel (Phase 07 reference)

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all dependencies already in project (firebase-functions 7.x, zod, tanstack-query 5.x, zustand 5.x)
- Architecture: HIGH — patterns established in Phase 05/08 are directly applicable
- Pitfalls: MEDIUM — concurrency and dual-write pitfalls are identified but not validated against existing test coverage

**Research date:** 2026-04-04
**Valid until:** 2026-05-04 (30 days — standard stack is stable)
