# Phase 11: Analytics & Disaster Mapping - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-04
**Phase:** 11-analytics-disaster-mapping
**Areas discussed:** Analytics surface and navigation, aggregation model, dashboard composition, disaster mapping, audit log strategy

---

## Analytics Surface & Navigation

| Option | Description | Selected |
|--------|-------------|----------|
| Route-backed admin workspaces | Extend the current shell with `/app/admin/analytics` and `/app/admin/audit`, keeping the persistent map and existing admin navigation model | ✓ |
| Drawer-only panels | Reuse panel state inside the workspace drawer without adding route-backed pages | |
| Separate full-screen admin pages | Move analytics/audit outside the current shell layout into standalone pages | |

**User's choice:** Auto mode selected the recommended default: route-backed admin workspaces.
**Notes:** This matches the current `DesktopShell`/`MobileShell` implementation better than the older query-param shell described in SPECS.

## Aggregation Model

| Option | Description | Selected |
|--------|-------------|----------|
| Dedicated aggregate documents + scheduled/incremental CF updates | Store analytics in `analytics_municipality/*` and `analytics_province/*`; update from Cloud Functions only | ✓ |
| Client-side raw scans | Query `reports`/`report_ops` directly and derive analytics in the browser | |
| On-demand callable analytics queries | Compute aggregates per request inside a callable without stored summary docs | |

**User's choice:** Auto mode selected the recommended default: dedicated aggregate documents with server-owned updates.
**Notes:** The roadmap and PROJECT constraints explicitly reject raw client scanning.

## Dashboard Composition

| Option | Description | Selected |
|--------|-------------|----------|
| Summary cards + required core charts + trend/date controls | KPI cards first, then type/severity/time charts, with avg timing stats and scoped drill-downs | ✓ |
| Full kitchen-sink analytics board | Add every possible chart from SPECS at once, including gauges and extra comparison views | |
| Minimal stats-only surface | Deliver only cards/tables now and postpone richer charts | |

**User's choice:** Auto mode selected the recommended default: summary cards plus the required core charts.
**Notes:** This satisfies the roadmap success criteria while keeping the first analytics surface readable.

## Disaster Mapping

| Option | Description | Selected |
|--------|-------------|----------|
| Toggleable heatmap overlay on the existing persistent map | Use aggregate hotspot counts to drive a desktop-first overlay on the current Leaflet map | ✓ |
| Separate analytics map page | Build a distinct map route/product for disaster mapping | |
| No map work in Phase 11 | Restrict the phase to charts and postpone disaster mapping | |

**User's choice:** Auto mode selected the recommended default: heatmap overlay on the existing persistent map.
**Notes:** This preserves map continuity and keeps "disaster mapping" inside the current shell architecture.

## Audit Log Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Dedicated global `audit` collection + viewer | Add immutable audit entries for sensitive writes and build the filtered viewer on top of that collection | ✓ |
| Reuse `report_ops.activity` only | Treat report-level activity history as the entire audit system | |
| Postpone audit until a later phase | Ship analytics now and defer the audit viewer | |

**User's choice:** Auto mode selected the recommended default: dedicated global audit collection plus viewer.
**Notes:** `report_ops.activity` is report-local and cannot support cross-entity filtering by action/entity/user without a true global audit stream.

## the agent's Discretion

- Exact chart palette and motion
- Tooltip wording and legend layout
- Loading skeletons and empty-state messaging

## Deferred Ideas

None
