# Phase 11 Validation — Analytics & Disaster Mapping

**Phase:** 11-analytics-disaster-mapping
**Created:** 2026-04-04
**Requirements:** ANL-01, ANL-02, ANL-03, ANL-04, ANL-05, ANL-06

---

## Validation Architecture

```
functions/src/
├── analytics/
│   ├── aggregateReportMetrics.test.ts     # aggregate reducers + scope behavior
│   └── getAnalyticsSnapshot.test.ts       # scoped analytics query behavior
├── audit/
│   ├── writeAuditEntry.test.ts            # immutable audit entry helper
│   └── getAuditEntries.test.ts            # filter parsing + scope validation
src/
├── hooks/
│   └── useAnalytics.test.ts               # aggregate query key and scope handling
├── components/analytics/
│   ├── AnalyticsDashboard.test.tsx        # KPI cards + chart rendering
│   └── HeatmapToggle.test.tsx             # overlay control behavior
└── components/audit/
    └── AuditLogTable.test.tsx             # filters, empty state, row expansion
```

---

## Automated Coverage Map

| Requirement | Test Target | Type | Command |
|-------------|-------------|------|---------|
| ANL-01 | KPI cards render total/pending/verified/resolved/rejected | component | `npx vitest run src/components/analytics/AnalyticsDashboard.test.tsx` |
| ANL-02 | Type/severity/time charts and average timing metrics render from aggregate data | component | `npx vitest run src/components/analytics/AnalyticsDashboard.test.tsx` |
| ANL-03 | Municipal analytics reads are scope-limited | unit/integration | `npx vitest run functions/src/analytics/getAnalyticsSnapshot.test.ts` |
| ANL-04 | Province analytics expose municipality breakdowns for superadmin | unit/integration | `npx vitest run functions/src/analytics/getAnalyticsSnapshot.test.ts` |
| ANL-05 | Aggregates maintained by functions; client avoids raw-report scans | unit/build | `npx vitest run functions/src/analytics && rg -n \"collection\\(db, 'reports'|collection\\(db, 'report_ops'\" src/components src/hooks` |
| ANL-06 | Audit log filtering by action/entity/user works | component/integration | `npx vitest run src/components/audit/AuditLogTable.test.tsx functions/src/audit/getAuditEntries.test.ts` |

---

## Wave 0 Requirements

- [ ] `functions/src/analytics/*.test.ts` — reducer, bucket, and scoped snapshot tests
- [ ] `functions/src/audit/*.test.ts` — audit helper and query tests
- [ ] `src/components/analytics/*.test.tsx` — KPI and chart rendering tests
- [ ] `src/components/audit/*.test.tsx` — audit table/filter tests
- [ ] `src/hooks/useAnalytics.test.ts` — query-key and scope-state tests

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Desktop analytics route keeps map mounted while right panel changes | ANL-01, ANL-02 | Requires visual confirmation of persistent map shell | Open desktop app, switch between `/app/admin`, `/app/admin/analytics`, and `/app/admin/audit`, confirm map stays mounted and visible |
| Heatmap overlay toggles over the existing map without replacing report markers | ANL-02, ANL-05 | Requires real map rendering and overlay interaction | Open analytics, enable heatmap, confirm aggregate overlay appears and map interaction remains stable |
| Municipal vs superadmin scope differences in live UI | ANL-03, ANL-04 | Requires authenticated role-specific sessions | Log in as municipal admin and superadmin, compare visible scope controls and resulting dashboard content |
| Audit viewer rows expand with meaningful event details | ANL-06 | Requires seeded audit data and interactive table checks | Seed or create audit-generating actions, then open audit viewer and inspect filtered rows |

---

## Validation Sign-Off

- [ ] All plans include automated verification or explicit Wave 0 test setup
- [ ] Analytics plans keep clients off raw `reports` and `report_ops` scans
- [ ] Audit viewer plans include both data generation and data browsing
- [ ] Heatmap work is aggregate-driven, not raw-report driven
- [ ] `nyquist_compliant: true` can be set once Phase 11 tests exist

**Approval:** pending
