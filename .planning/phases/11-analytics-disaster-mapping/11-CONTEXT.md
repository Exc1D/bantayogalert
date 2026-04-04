# Phase 11: Analytics & Disaster Mapping - Context

**Gathered:** 2026-04-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 11 delivers admin-only analytics and audit surfaces powered by pre-aggregated Firestore documents, plus a disaster-mapping overlay derived from those aggregates. Municipal admins see municipality-scoped dashboards and audit entries. Provincial superadmins see province-wide analytics, municipality breakdowns, and cross-municipality audit filtering. Clients must never scan raw `reports` or `report_ops` collections to render analytics.

**Delivers:**
- Analytics workspace surface inside the existing admin shell
- Summary cards for total reports, pending, verified, resolved, and rejected counts
- Charts for reports by type, severity, and time
- Average verification and resolution timing metrics
- Municipality/barangay hotspot analytics that also drive a disaster-map overlay
- Dedicated audit log viewer with filters by action, entity, user, municipality, and date range
- Municipality-scoped analytics for `municipal_admin`
- Province-wide analytics and municipality drill-down for `provincial_superadmin`

**Constraints (non-negotiable from prior phases):**
- Analytics reads must come from dedicated aggregate docs only, never raw client scans
- Municipality scope enforcement stays server-side in Cloud Functions and Firestore rules
- The Leaflet map remains mounted via the existing sibling layout and route-backed shell pattern
- Phase 9 triage activity history in `report_ops` remains the operational timeline; cross-entity audit browsing needs its own global log surface
</domain>

<decisions>
## Implementation Decisions

### Analytics Surface & Navigation
- **D-199:** Analytics and Audit are route-backed admin workspaces, not new modal/drawer-only panels. Desktop uses dedicated right-panel routes under `/app/admin/analytics` and `/app/admin/audit`, preserving the persistent map on the left.
- **D-200:** Mobile uses a simplified admin analytics screen reachable from the existing Admin Panel flow, rather than adding new bottom tabs for analytics or audit.
- **D-201:** The current route-backed `DesktopShell`/`MobileShell` pattern is canonical for this phase; Phase 11 should extend that pattern instead of reviving older `?panel=` query-param behavior.

### Aggregation Model
- **D-202:** Analytics are stored in dedicated Firestore aggregates under `analytics_municipality/{municipalityCode}` and `analytics_province/{provinceCode}` with `summary/current` plus time-bucketed docs.
- **D-203:** Cloud Functions own all analytics writes. Incremental aggregation updates run on report lifecycle changes, and a scheduled daily rollup at `02:00 PHT` maintains daily/weekly/monthly aggregate series for longer-range reporting.
- **D-204:** Dashboard KPIs, time-series points, hotspot counts, and average verification/resolution durations are all precomputed server-side and read directly by the client.
- **D-205:** Barangay hotspot aggregates are first-class analytics outputs so the dashboard tables and disaster-map overlay share the same data source.

### Dashboard Composition
- **D-206:** Top-row summary cards are fixed to the roadmap metrics: total reports, pending, verified, resolved, and rejected for the active scope/date range.
- **D-207:** Primary visualizations are:
  - reports by type as a bar chart
  - reports by severity as a donut chart
  - reports over time as a line chart
- **D-208:** Average verification time and average resolution time are shown as compact metric cards or stat blocks, not separate charts.
- **D-209:** Default date range is the last 30 days, with `7d`, `30d`, `90d`, and custom-range controls. Municipal admins stay locked to their municipality; provincial superadmins default to province-wide and can drill into a municipality without leaving analytics.
- **D-210:** Province-only secondary views include municipality breakdowns; municipality views emphasize barangay hotspots and local trend lines rather than province comparison charts.

### Disaster Mapping
- **D-211:** "Disaster mapping" in this phase means a toggleable heatmap-style overlay on the existing Leaflet map, driven by aggregate hotspot counts rather than raw report point scans.
- **D-212:** The overlay is admin-only and controlled from analytics UI state, so users can compare the persistent verified-report map with aggregate hotspot intensity without navigating to a separate map product.
- **D-213:** Desktop gets the full overlay control on the persistent map. Mobile remains summary-first for Phase 11; hotspot rankings and municipality/barangay counts are required there, while full heatmap interaction is desktop-priority.

### Audit Log Strategy
- **D-214:** The Phase 11 audit viewer reads from a dedicated global immutable `audit/{auditId}` collection, not from `report_ops.activity`. The `report_ops` activity trail remains report-local operational history.
- **D-215:** Because the current codebase does not yet populate a global audit collection, Phase 11 includes wiring audit writes into sensitive Cloud Functions that already mutate core state: triage actions, contacts management, announcements flows, and role/admin actions.
- **D-216:** Audit viewer filters are date range, entity type, action, actor/user, and municipality. Expanded rows show the structured details payload for the event.
- **D-217:** Municipal admins only see audit entries for their municipality. Provincial superadmins can query province-wide across municipalities.

### Library & Data-Fetching Defaults
- **D-218:** Use a React-native charting approach such as Recharts rather than an imperative Chart.js wrapper. The planner should treat declarative React composition and responsive layout as the default unless research finds a blocker.
- **D-219:** Analytics and audit reads use TanStack Query with explicit scope/date-range query keys, matching the existing app pattern for async server state.

### the agent's Discretion
- Exact chart color palette and tooltip styling
- Empty-state copy, loading skeletons, and no-data illustrations
- Whether export lands as CSV-only or CSV+JSON, as long as it stays aggregate-backed and does not expand the phase beyond analytics/audit
</decisions>

<specifics>
## Specific Ideas

- No user-supplied visual references or product comparisons were provided for Phase 11.
- Auto mode selected standard admin-dashboard defaults grounded in the current shell, existing admin queue patterns, and the analytics/audit requirements in `SPECS.md`.
</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Scope & Requirements
- `.planning/ROADMAP.md` §Phase 11 — Phase goal, success criteria, and admin scope boundary
- `.planning/REQUIREMENTS.md` §Analytics & Monitoring — `ANL-01` through `ANL-06`
- `.planning/PROJECT.md` — Core value plus constraints around pre-aggregated analytics, municipality scope, and persistent map architecture

### Product Spec
- `SPECS.md` §3.2-3.5 — Desktop navigation, workspace content matrix, and role-based analytics/audit visibility
- `SPECS.md` §6.1 — Canonical Firestore collections for `audit`, `analytics_municipality`, and `analytics_province`
- `SPECS.md` §Phase 11: Analytics & Disaster Mapping — deliverables including scheduled aggregation, chart set, scope model, and heatmap overlay

### Prior Phase Context
- `.planning/phases/04-desktop-mobile-shell/04-CONTEXT.md` — Shell layout, route behavior, persistent map, and mobile admin entry patterns
- `.planning/phases/06-real-time-map-feed/06-CONTEXT.md` — Map overlay conventions, filter state patterns, and persistent Leaflet integration
- `.planning/phases/09-admin-triage/09-CONTEXT.md` — `report_ops`, triage activity history, municipality scoping, and admin queue patterns
- `.planning/phases/10-announcements-push-alerts/10-VERIFICATION.md` — Current route-backed admin shell state after Phase 10 completion

### Existing Code to Reuse or Extend
- `src/app/shell/DesktopShell.tsx` — Current desktop route-backed panel layout with persistent map
- `src/app/shell/MobileShell.tsx` — Current mobile admin entry and route-content pattern
- `src/components/report/AdminQueueFeed.tsx` — Existing admin panel composition and municipality filter interaction
- `src/hooks/useAdminQueueListener.ts` — Real-time admin data + TanStack Query synchronization pattern
- `src/stores/uiStore.ts` — Shared UI state model for tabs, drawer state, and route-adjacent shell behavior
- `src/types/report.ts` — Report, `ReportOps`, workflow fields, and activity structures
- `src/types/status.ts` — Owner/public status mappings already used across the app
- `functions/src/triage/*.ts` — Current workflow mutation sources that will need analytics and audit side effects
- `firestore.rules` — Existing RBAC and municipality-scope enforcement baseline
- `src/features/README.md` — Feature-organization target including the planned `analytics/` area
</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `DesktopShell` / `MobileShell`: already handle route-backed admin content while preserving the map and mobile tab model
- `AdminQueueFeed`: existing admin-facing panel composition, filter controls, and right-panel UX baseline
- `useAdminQueueListener`: reference pattern for scoped Firestore reads synchronized into TanStack Query cache
- `useUIStore`: established place for shell-adjacent UI state that may coordinate analytics panel behavior and map overlay toggles
- `MapContainerWrapper`, `MunicipalityBoundaries`, and map-phase hooks/components: existing Leaflet integration points for the disaster overlay

### Established Patterns
- TanStack Query for async reads and cache invalidation
- Route-backed content in the shell for admin tools and alerts
- Firebase callable/trigger pattern for sensitive server-owned writes
- Municipality scoping through custom claims and server-side enforcement
- Three-tier report model with `report_ops` as the operational source for workflow-side metrics

### Integration Points
- Add new admin analytics/audit routes into the existing `/app/admin` route family rather than building a parallel navigation model
- Extend Cloud Functions around triage/report lifecycle to publish aggregate updates and audit entries
- Connect desktop analytics controls to the already-mounted Leaflet map instead of creating a second map container
- Treat `DesktopNavRail.tsx` as legacy/reference only; the active shell navigation currently lives in `DesktopShell.tsx`
- No chart library is currently installed, so planner/research must choose and add one deliberately
</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within the Phase 11 boundary.
</deferred>

---

*Phase: 11-analytics-disaster-mapping*
*Context gathered: 2026-04-04*
