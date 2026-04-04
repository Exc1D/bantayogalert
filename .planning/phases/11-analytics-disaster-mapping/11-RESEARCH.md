# Phase 11: Analytics & Disaster Mapping - Research

**Researched:** 2026-04-04
**Domain:** Pre-aggregated analytics, admin dashboards, audit logging, and aggregate-driven map overlays
**Confidence:** MEDIUM

## Summary

Phase 11 needs to solve two missing backend capabilities before the dashboard can exist: a durable analytics aggregation pipeline and a true global audit stream. The codebase already has the operational ingredients for both. `report_ops` carries municipality-scoped workflow data, triage Cloud Functions are the write chokepoints for report lifecycle changes, and the shell already supports route-backed admin panels while keeping the Leaflet map mounted. The main implementation work is to formalize aggregate documents and audit entries so the client can read prepared analytics instead of scanning raw collections.

The recommended architecture is:
1. **Server-owned aggregate documents** in `analytics_municipality/*` and `analytics_province/*`
2. **Incremental updates** on triage/report lifecycle writes, plus a **daily rollup** for stable historical buckets
3. **Dedicated global `audit/{auditId}` entries** for cross-entity browsing, separate from `report_ops.activity`
4. **Route-backed analytics/audit pages** inside the existing admin shell
5. **Desktop-first heatmap overlay** driven by aggregate hotspot counts, not raw incident queries

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ANL-01 | Dashboard shows summary cards: total reports, pending, verified, resolved, rejected | `report_ops` + workflow transitions give the raw signals; `summary/current` docs can expose exact counters |
| ANL-02 | Charts: reports by type, severity, time, avg resolution time | Daily aggregates and summary metrics support bar/donut/line + timing metrics without client scans |
| ANL-03 | Municipal admin sees only own municipality data | Existing custom claims + Firestore rules + scoped aggregate collections map directly |
| ANL-04 | Provincial superadmin sees province-wide data | Province aggregate doc plus municipality breakdown data fits existing superadmin role model |
| ANL-05 | Analytics maintained by Cloud Functions; clients never scan raw reports | Existing sensitive-write CF model is already the project standard |
| ANL-06 | Audit log viewer with filters by action/entity/user | Requires a dedicated global `audit` collection; `report_ops.activity` alone is too narrow |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| firebase-admin | ^13.7.0 | Aggregate writes, scheduled jobs, audit writes | Already present in functions |
| firebase-functions | 4.9.0 | Firestore triggers / scheduled functions / callables | Already aligned to current functions code |
| @tanstack/react-query | 5.96.2 | Cached reads for analytics/audit data | Existing app standard |
| react-router-dom | 6.5.0 | Route-backed analytics/audit panels | Existing shell standard |

### New Dependency Likely Required
| Library | Version | Purpose | Recommendation |
|---------|---------|---------|----------------|
| Recharts | latest compatible | Analytics charts in React | Recommended over Chart.js for declarative React composition and responsive panel layouts |

### Supporting
| Asset | Purpose | Why Reuse |
|-------|---------|-----------|
| `MapContainerWrapper` + map components | Existing persistent Leaflet integration | Needed for heatmap overlay without remounting the map |
| `AdminQueueFeed` + shell routes | Existing admin panel structure | Analytics/audit should follow the same route-backed admin workspace pattern |

## Architecture Patterns

### Pattern 1: Summary + Time-Bucket Aggregate Documents

**What:** Maintain `summary/current` docs for live KPIs and `daily`/`weekly`/`monthly` bucket docs for charting.

**Why:** This matches the `SPECS.md` Firestore model and lets the client fetch a small number of documents per scope/date range instead of scanning `reports` or `report_ops`.

**Recommended shape:**

```text
analytics_municipality/{municipalityCode}/summary/current
analytics_municipality/{municipalityCode}/daily/{yyyy-mm-dd}
analytics_municipality/{municipalityCode}/weekly/{yyyy-ww}
analytics_municipality/{municipalityCode}/monthly/{yyyy-mm}

analytics_province/CMN/summary/current
analytics_province/CMN/daily/{yyyy-mm-dd}
analytics_province/CMN/weekly/{yyyy-ww}
analytics_province/CMN/monthly/{yyyy-mm}
```

**Suggested fields:**
- `counts.total`, `counts.pending`, `counts.verified`, `counts.resolved`, `counts.rejected`
- `byType.{incidentType}`
- `bySeverity.{severity}`
- `avgVerificationMinutes`
- `avgResolutionMinutes`
- `hotspots.barangays[]` with `{ barangayCode, municipalityCode, count }`
- `municipalityBreakdown[]` for province views

### Pattern 2: Incremental Analytics Updates at Write Chokepoints

**What:** Update aggregates where report state changes already happen, primarily triage Cloud Functions and report submission.

**Why:** The current codebase already centralizes lifecycle changes in Cloud Functions, so analytics writes belong in those same transactions or immediate follow-up server logic.

**Best fit mutation points:**
- `functions/src/reports/submitReport.ts`
- `functions/src/triage/triageVerify.ts`
- `functions/src/triage/triageReject.ts`
- `functions/src/triage/triageDispatch.ts`
- `functions/src/triage/triageAcknowledge.ts`
- `functions/src/triage/triageInProgress.ts`
- `functions/src/triage/triageResolve.ts`
- `functions/src/triage/triageReroute.ts`

**Daily rollup role:** normalize or backfill longer-range bucket docs and derived timing metrics, rather than making the client or ad hoc jobs recompute them.

### Pattern 3: Global Audit Collection Separate From Operational Activity

**What:** Write immutable audit entries to `audit/{auditId}` for cross-entity browsing.

**Why not reuse `report_ops.activity`:**
- it is report-scoped, not global
- contacts and announcements are outside `report_ops`
- filtering by action/entity/user across the whole system is awkward or impossible without fan-out queries

**Suggested audit entry shape:**

```typescript
interface AuditEntry {
  id: string
  entityType: 'report' | 'contact' | 'announcement' | 'user'
  entityId: string
  action: string
  actorUid: string
  actorRole: string
  municipalityCode: string | null
  provinceCode: string
  createdAt: string
  details: Record<string, unknown>
}
```

### Pattern 4: Route-Backed Analytics Panels, Not a Separate Admin Shell

**What:** Extend the current admin route family with analytics and audit pages rendered in the right content panel while the map stays mounted.

**Why:** `DesktopShell.tsx` and `MobileShell.tsx` already use route-backed content for admin tools and alerts. This is the current architecture, even if `SPECS.md` still references older `?panel=` behavior.

**Candidate routes:**
- `/app/admin/analytics`
- `/app/admin/audit`

### Pattern 5: Aggregate-Driven Disaster Overlay

**What:** Render a heatmap or intensity overlay using aggregated hotspot data keyed by barangay/municipality.

**Why:** The phase title explicitly includes disaster mapping, but the project constraint still forbids raw-report client scans for analytics. Aggregate-driven hotspots satisfy both.

**Desktop-first recommendation:** expose overlay controls in desktop analytics while keeping mobile Phase 11 lighter with hotspot rankings and counts first.

## Codebase Fit

### Reusable Assets
- `src/app/shell/DesktopShell.tsx` — right-panel route content with persistent left map
- `src/app/shell/MobileShell.tsx` — admin entry point and route-backed mobile content
- `src/hooks/useAdminQueueListener.ts` — scoped Firestore -> React Query sync pattern
- `src/components/report/AdminQueueFeed.tsx` — admin workspace interaction pattern
- `src/components/map/MunicipalityBoundaries.tsx` and `src/components/map/ReportMarkers.tsx` — map overlay examples
- `src/stores/uiStore.ts` — place to coordinate analytics panel UI state and overlay toggles if needed

### Constraints Discovered in Code
- No charting library is currently installed
- No analytics feature files exist yet under `src/features/analytics/` or equivalent
- No global `audit` write helper exists yet
- Desktop navigation has some stale placeholder code in `src/app/shell/DesktopNavRail.tsx`; the active shell behavior now lives in `DesktopShell.tsx`

## Implementation Order Recommendation

1. **Foundation:** analytics/audit types, rules, indexes, route placeholders, and data contracts
2. **Backend analytics:** aggregate docs, trigger/scheduled functions, timing metric computation
3. **Backend audit:** audit helper + retrofits to sensitive Cloud Functions + scoped query/read path
4. **Client data layer:** analytics hooks, audit hooks, route wiring, filter/date-range state
5. **Dashboard UI:** cards + charts + superadmin drill-down
6. **Audit viewer + heatmap:** filtered audit table and aggregate-driven overlay

## Risks & Mitigations

1. **Audit viewer with no data**
   - Risk: building a UI before sensitive writes emit audit entries
   - Mitigation: Phase 11 must include audit-write retrofits, not just a read view

2. **Accidental raw client scans**
   - Risk: dashboard hooks may query `reports` or `report_ops` directly for convenience
   - Mitigation: enforce aggregate-only reads in plan tasks and rules/contracts

3. **Overly heavy map overlay**
   - Risk: reintroducing large client-side computations on the map
   - Mitigation: use precomputed hotspot counts, not per-report clustering math for analytics

4. **UI scope creep**
   - Risk: trying to ship every possible chart from SPECS
   - Mitigation: keep ANL-01..06 as the must-have baseline and treat extra visuals as secondary if still within plan capacity

## Open Questions

All major product decisions for Phase 11 were resolved in `11-CONTEXT.md`. Remaining choices are technical/planning level:
- Exact aggregate document schema details
- Recharts vs another React charting library if research finds a blocker
- Whether export ships in Phase 11 or is deferred within planner discretion

## Environment Availability

> Step 2.6: No external services beyond existing Firebase project infrastructure.

**Existing infrastructure already available:**
- Firestore
- Cloud Functions
- Auth custom claims
- Existing admin shell and map integration

**New package likely needed:**
- Recharts (or equivalent chart lib) in the root app package

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.2 + existing build/lint tooling |
| Config file | `vitest.config.ts` |
| Quick run command | `npx vitest run src/App.test.tsx` |
| Full suite command | `npx vitest run && npm run build && (cd functions && npm run build)` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|--------------|
| ANL-01 | Summary cards render scoped KPI counts | component | `npx vitest run src/components/analytics` | NO |
| ANL-02 | Type/severity/time charts and timing stats render from aggregate docs | component | `npx vitest run src/components/analytics src/hooks/useAnalytics.ts` | NO |
| ANL-03 | Municipal admin only sees own municipality analytics | unit/integration | `npx vitest run functions/src/analytics src/hooks/useAnalytics.ts` | NO |
| ANL-04 | Superadmin sees province-wide + municipality breakdown | unit/integration | `npx vitest run functions/src/analytics src/components/analytics` | NO |
| ANL-05 | Aggregates maintained server-side; no raw client scans | unit/build | `npx vitest run functions/src/analytics && rg -n \"collection\\(db, 'reports'|collection\\(db, 'report_ops'\" src/components src/hooks` | NO |
| ANL-06 | Audit viewer filters by action/entity/user | component/integration | `npx vitest run src/components/audit functions/src/audit` | NO |

### Wave 0 Gaps
- [ ] `functions/src/analytics/*.test.ts` — aggregate reducer and scoped-read coverage
- [ ] `functions/src/audit/*.test.ts` — audit entry helper + filter query coverage
- [ ] `src/hooks/useAnalytics*.test.ts` — aggregate query hook coverage
- [ ] `src/components/analytics/*.test.tsx` — summary cards and chart rendering coverage
- [ ] `src/components/audit/*.test.tsx` — audit table filtering and empty/error states

## Sources

### Primary (HIGH confidence)
- `SPECS.md` §3.2-3.5, §6.1, and §Phase 11 — navigation, panel content, Firestore collections, and phase deliverables
- `.planning/phases/11-analytics-disaster-mapping/11-CONTEXT.md` — locked product decisions for this phase
- `src/app/shell/DesktopShell.tsx` and `src/app/shell/MobileShell.tsx` — current route-backed shell behavior
- `functions/src/triage/*.ts` and `functions/src/reports/submitReport.ts` — existing server-side write chokepoints

### Secondary (MEDIUM confidence)
- `.planning/phases/09-admin-triage/09-CONTEXT.md` — current admin workflow and operational activity model
- `.planning/phases/06-real-time-map-feed/06-CONTEXT.md` — persistent map and overlay patterns
- `.planning/PROJECT.md` and `.planning/REQUIREMENTS.md` — scope and constraints

## Metadata

**Confidence breakdown:**
- Aggregation architecture: MEDIUM-HIGH
- Audit strategy: MEDIUM
- Frontend composition: MEDIUM-HIGH
- Heatmap overlay approach: MEDIUM

**Research date:** 2026-04-04
**Valid until:** 2026-05-04
