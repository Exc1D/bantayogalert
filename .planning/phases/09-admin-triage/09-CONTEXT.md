# Phase 9: Admin Triage - Context

**Gathered:** 2026-04-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Municipal admins triage reports through all workflow states within their municipality boundary. Admins see a scoped queue, take actions (verify/reject/dispatch/acknowledge/in_progress/resolve/reroute), set priority/classification, and add internal notes. All actions are validated against the state machine, use optimistic concurrency, and create audit entries.

**Delivers:**
- Admin queue view (pending/verified/dispatched tabs) scoped to municipality
- Verify/reject/dispatch/acknowledge/in_progress/resolve/reroute actions via Cloud Functions
- Priority (1-5) and classification on any report
- Internal notes (admin-only, visible in report_ops)
- State machine enforcement in CF (invalid transitions rejected with `failed-precondition`)
- Optimistic concurrency via `version` field in `report_ops`
- Activity log entries in `report_ops/activity` subcollection
- CF triggers update `reports/workflowState` and `report_private/ownerStatus` after each action
- Provincial superadmin sees queue across all 12 municipalities

**Constraints (non-negotiable from prior phases):**
- React 18.3.1, react-leaflet 4.2.1, Tailwind CSS 3.4.17
- WorkspaceDrawer pattern (src/app/shell/WorkspaceDrawer.tsx) — drawer panels via ActivePanel enum
- useUIStore (Zustand) for activePanel, drawerOpen, selectedReportId
- useAuth() provides customClaims (role, municipalityCode)
- VALID_TRANSITIONS already defined (src/types/workflow.ts)
- WorkflowState enum already defined (src/types/report.ts)
- ReportPrivate/ReportOps already typed (src/types/report.ts)
- Contacts already exist (Phase 08) — dispatch selects from contacts list
- TanStack Query 5.x + Firebase onSnapshot for real-time data
- Three-tier report split: reports/ (public), report_private/ (owner+admin), report_ops/ (admin-only)
</domain>

<decisions>
## Implementation Decisions

### Admin Queue Layout
- **D-158:** Tabbed queue with three tabs: "Pending", "Verified", "Dispatched" — mirrors workflow state groupings
- **D-159:** Each tab shows a scrollable list of report cards filtered by that specific workflowState
- **D-160:** Cards show: severity badge + type icon + municipality + barangay + relative time + priority dot (if set) — same compact ~80px card from Phase 6
- **D-161:** Tab counts shown as badges: "Pending (12)", "Verified (5)", "Dispatched (3)"
- **D-162:** Superadmin sees all municipalities — additional "Municipality" filter dropdown above tabs
- **D-163:** Cards sorted by: priority (if set, 1=highest), then createdAt DESC

### Action Interface
- **D-164:** Click card → opens detail panel in WorkspaceDrawer (activePanel='admin-report-detail')
- **D-165:** Detail panel header: severity badge + type + current status badge + priority stars (if set)
- **D-166:** Detail panel body sections:
  - Report info: description, location (barangay + municipality), media thumbnails
  - Triage Actions: row of action buttons (depends on current state)
  - Routing Info: assigned contact snapshot + dispatch notes (if dispatched)
  - Internal Notes: textarea + save button (admin-only)
  - Activity Timeline: chronological list of all triage actions with actor + timestamp
- **D-167:** Rejection requires reason (text, required) + optional category dropdown (insufficient_info/duplicate/out_of_area/false_report/other)
- **D-168:** Dispatch opens ContactPicker modal — searchable list of active contacts filtered by municipality (from Phase 08)

### Dispatch Flow
- **D-169:** ContactPicker modal: searchable list of contacts from contacts collection, filtered by report's municipalityCode
- **D-170:** Each contact item shows: name, role, organization, municipality
- **D-171:** On contact selection: contact snapshot (name, role, phone, organization) is saved to report_ops.assignedContactSnapshot at dispatch time
- **D-172:** Dispatch also captures: routingDestination (free text — address/location), dispatchNotes (free text — instructions)
- **D-173:** Snapshot preservation: later edits to the contact do NOT update historical routing entries (already decided in Phase 08, CON-06)

### State Machine Enforcement
- **D-174:** All triage actions go through Cloud Functions (never direct Firestore writes from client)
- **D-175:** CF validates: user is municipal_admin or provincial_superadmin, user's municipalityCode matches report's municipalityCode (or superadmin bypasses)
- **D-176:** CF checks VALID_TRANSITIONS — if transition is invalid, returns `failed-precondition` with message
- **D-177:** Transition function names: triageVerify, triageReject, triageDispatch, triageAcknowledge, triageInProgress, triageResolve, triageReroute

### Optimistic Concurrency
- **D-178:** report_ops document has a `version: number` field starting at 1
- **D-179:** Every triage action CF receives expectedVersion: number — if doc.version !== expectedVersion, reject with `failed-precondition: 'Version conflict — another admin acted on this report'`
- **D-180:** On conflict, client shows: "This report was updated by another admin. Please refresh and try again." with a [Refresh] button
- **D-181:** On successful action, CF increments version: version + 1

### Activity Audit Trail
- **D-182:** Every triage action creates an ActivityLogEntry in report_private.activityLog[] AND in report_ops.activity subcollection
- **D-183:** Entry fields: action (string), performedBy (user uid), performedAt (ISO timestamp), details (JSON string with action-specific data)
- **D-184:** Activity timeline in detail panel reads from report_ops.activity (chronological, newest first)

### Status Updates via CF Triggers
- **D-185:** After every successful triage action, CF updates:
  - reports/{id}.workflowState → new state
  - report_private.ownerStatus → WORKFLOW_TO_OWNER_STATUS[newState]
  - report_private.activityLog → push new entry
  - report_private.priority → if priority was set
  - report_private.internalNotes → if notes were saved
  - report_ops.dispatchNotes/routingDestination/assignedContactSnapshot → if dispatch/reroute

### Priority & Classification
- **D-186:** Priority stars (1-5) shown on cards and in detail panel — click to set/update
- **D-187:** Priority stored in report_private.priority
- **D-188:** Classification: free-text tag field in report_ops.classification (e.g., "food_shortage", "infrastructure_damage")

### Internal Notes
- **D-189:** Internal notes textarea in detail panel — only visible to municipal_admin and provincial_superadmin
- **D-190:** Notes saved via triageUpdateNotes CF (separate from state transitions)
- **D-191:** Notes stored in report_private.internalNotes — never sent to reporter

### Superadmin Cross-Municipality Access
- **D-192:** Superadmin sees all 12 municipalities — municipality filter dropdown above queue tabs
- **D-193:** Superadmin can triage any report from any municipality — CF validates role=provincial_superadmin bypasses municipalityCode check
- **D-194:** Superadmin default view: "All Municipalities" (no filter applied)

### Report Detail Panel (Admin)
- **D-195:** admin-report-detail panel is distinct from citizen report-detail — shows triage-specific sections (actions, routing, notes, activity)
- **D-196:** Shared layout pattern: same WorkspaceDrawer, different panel component rendered based on activePanel

### Firebase Collection Access
- **D-197:** Admin queue: onSnapshot listener on report_ops collection filtered by municipalityCode (client-side filter for superadmin's all-municipality view)
- **D-198:** Real-time updates: queue auto-refreshes when any report in the municipality changes workflowState

### Claude's Discretion
- Exact component file structure (components vs features organization) — follow Phase 05/06 pattern
- Animation/transition details for tab switching and drawer opening
- Error toast wording for specific error conditions
- Loading skeleton designs for queue cards
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Types & Schemas
- `src/types/report.ts` — Report, ReportPrivate, ReportOps, WorkflowState, IncidentType, Severity, VALID_TRANSITIONS
- `src/types/status.ts` — WORKFLOW_TO_OWNER_STATUS, WORKFLOW_TO_PUBLIC_STATUS mappings
- `src/types/contact.ts` — ContactSnapshot (from Phase 08)
- `functions/src/types/report.ts` — Cloud Function report types

### State Machine
- `src/types/workflow.ts` — canTransition(), VALID_TRANSITIONS map

### Auth & Claims
- `src/lib/auth/AuthProvider.tsx` — useAuth() hook with customClaims
- `functions/src/auth/claims.ts` — validateMunicipalAdmin, validateSuperadmin guards (from Phase 03)

### Existing UI Architecture
- `src/app/shell/WorkspaceDrawer.tsx` — drawer panel architecture with ActivePanel enum
- `src/stores/uiStore.ts` — Zustand store for activePanel, drawerOpen, selectedReportId
- `src/app/shell/DesktopShell.tsx` — desktop layout with map + drawer
- `src/app/shell/MobileShell.tsx` — mobile layout with bottom tabs
- `src/components/report/ReportDetailPanel.tsx` — existing citizen report detail (reference for admin variant)

### Real-time Patterns
- `src/hooks/useVerifiedReportsListener.ts` — onSnapshot listener pattern (Phase 06)
- `src/hooks/useReportFeed.ts` — report feed hook (Phase 06)

### Contacts (Phase 08)
- `src/lib/contact.ts` — Contact type and utilities
- `src/hooks/useContacts.ts` — contacts query hook
- `functions/src/contacts/` — Contact CRUD Cloud Functions

### Existing Report Components
- `src/components/report/ReportFeedCard.tsx` — Phase 06 card design
- `src/components/report/FilterBar.tsx` — Phase 06 filter bar

### Firebase Structure
- `firestore.rules` — security rules (Phase 03)
- `firestore.indexes.json` — composite indexes
</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `ReportFeedCard` (src/components/report/ReportFeedCard.tsx): Compact card design (~80px) already designed for Phase 06 — reuse with priority dot overlay
- `WorkspaceDrawer` + `ActivePanel` enum: Panel architecture already handles switching between report-form, report-detail, contact-detail
- `useAuth()`: Already provides role + municipalityCode custom claims
- `VALID_TRANSITIONS` + `canTransition()`: State machine logic already implemented
- `ContactSnapshot` type (Phase 08): Already defined for dispatch snapshot capture

### Established Patterns
- TanStack Query `useQuery` + `onSnapshot` cache sync pattern (Phase 06)
- Zustand `useUIStore` for panel/drawer state management
- Cloud Function callable pattern with Zod validation (submitReport from Phase 05, createContact from Phase 08)
- Drawer `transitionend` → `invalidateSize()` pattern for map stability
- Priority display: colored dot badges (severity) already in use — extend with numeric priority indicator

### Integration Points
- Route: `/app/admin` or `/app/triage` for admin queue (new route in ShellRouter)
- ActivePanel: add 'admin-report-detail' to ActivePanel enum
- WorkspaceDrawer: add AdminReportDetailPanel component
- Contacts: dispatch reads from contacts collection (Phase 08)
- Status updates: CF triggers update reports/ and report_private/ after transitions
</code_context>

<specifics>
## Specific Ideas

No external references or "like X" moments — open to standard approaches for admin queue patterns.
</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.
</deferred>
