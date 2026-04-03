---
phase: 6
slug: 06-real-time-map-feed
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-04
---

# Phase 6 -- Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.2 |
| **Config file** | `vitest.config.ts` (in project root) |
| **Quick run command** | `npm test -- --run` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --run`
- **After every plan wave:** Run `npm test` (full suite)
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 06-01-01 | 06-01 | 1 | FM-01, FM-04 | unit | `npm test -- --run --filter=filterStore` | :white_check_mark: W0 | :pending: pending |
| 06-01-02 | 06-01 | 1 | FM-02 | unit | `npm test -- --run --filter=reportToGeoJSON` | :white_check_mark: W0 | :pending: pending |
| 06-01-03 | 06-01 | 1 | FM-01 | unit | `npm test -- --run --filter=useVerifiedReportsListener` | :white_check_mark: W0 | :pending: pending |
| 06-01-04 | 06-01 | 1 | FM-02 | unit | `npm test -- --run --filter=useSupercluster` | :white_check_mark: W0 | :pending: pending |
| 06-01-05 | 06-01 | 1 | FM-03, FM-08 | unit | `npm test -- --run --filter=useMapViewport` | :white_check_mark: W0 | :pending: pending |
| 06-01-06 | 06-01 | 1 | FM-01 | unit | `npm test -- --run` | N/A (config) | :pending: pending |
| 06-02-01 | 06-02 | 2 | FM-02 | unit | `npm test -- --run --filter=MapClusterIcon` | :white_check_mark: W0 | :pending: pending |
| 06-02-02 | 06-02 | 2 | FM-03 | unit | `npm test -- --run --filter=MunicipalityBoundaries` | :white_check_mark: W0 | :pending: pending |
| 06-02-03 | 06-02 | 2 | FM-04 | unit | `npm test -- --run --filter=FilterBar` | :white_check_mark: W0 | :pending: pending |
| 06-02-04 | 06-02 | 2 | FM-01, FM-02 | unit | `npm test -- --run --filter=ReportMarkers` | :white_check_mark: W0 | :pending: pending |
| 06-02-05 | 06-02 | 2 | FM-01, FM-03 | unit | `npm test -- --run --filter=MapContainerWrapper` | :white_check_mark: W0 | :pending: pending |
| 06-03-01 | 06-03 | 3 | FM-05 | unit | `npm test -- --run --filter=useReportFeed` | :white_check_mark: W0 | :pending: pending |
| 06-03-02 | 06-03 | 3 | FM-06 | unit | `npm test -- --run --filter=ReportFeedCard` | :white_check_mark: W0 | :pending: pending |
| 06-03-03 | 06-03 | 3 | FM-05 | unit | `npm test -- --run --filter=ReportFeed` | :white_check_mark: W0 | :pending: pending |
| 06-03-04 | 06-03 | 3 | FM-04, FM-05, FM-06 | unit | `npm test -- --run --filter=DesktopShell` | :white_check_mark: W0 | :pending: pending |
| 06-04-01 | 06-04 | 4 | FM-07 | unit | `npm test -- --run --filter=ReportDetailPanel` | :white_check_mark: W0 | :pending: pending |
| 06-04-02 | 06-04 | 4 | FM-07 | unit | `npm test -- --run --filter=WorkspaceDrawer` | :white_check_mark: W0 | :pending: pending |
| 06-04-03 | 06-04 | 4 | FM-07, FM-08 | checkpoint | Human verify desktop report detail flow | N/A | :pending: pending |
| 06-04-04 | 06-04 | 4 | FM-07 | unit | `npm test -- --run --filter=ReportDetailSheet` | :white_check_mark: W0 | :pending: pending |
| 06-04-05 | 06-04 | 4 | FM-07, FM-08 | unit | `npm test -- --run --filter=MobileShell` | :white_check_mark: W0 | :pending: pending |

*Status: :pending: pending -- :white_check_mark: green -- :x: red -- :warning: flaky*

---

## Wave 0 Requirements

- [ ] `src/stores/filterStore.test.ts` -- tests filter state actions + selectors
- [ ] `src/hooks/useSupercluster.test.ts` -- tests cluster index loading + getClusters
- [ ] `src/hooks/useReportFeed.test.ts` -- tests pagination state machine
- [ ] `src/components/report/ReportFeedCard.test.tsx` -- tests card rendering with mock data
- [ ] `src/components/report/ReportDetailPanel.test.tsx` -- tests detail panel rendering
- [ ] `src/components/map/ReportMarkers.test.tsx` -- tests marker creation logic (mocked Leaflet)
- [ ] `src/app/shell/DesktopShell.test.tsx` -- tests shell renders without remounting map
- [ ] `firestore.indexes.json` -- add composite index for `reports(workflowState ASC, createdAt DESC)` (already done in 06-01)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Desktop smoke test -- report detail drawer opens on marker/card click | FM-07, FM-08 | Requires full app + map + Firestore emulators | 1. `npm run dev`, 2. Open desktop viewport, 3. Click map pin -- verify drawer opens, 4. Click feed card -- verify drawer opens, 5. Close drawer -- verify map viewport preserved |
| Mobile bottom sheet on report click | FM-07 | Requires mobile viewport + routing | 1. `npm run dev`, 2. Open mobile viewport, 3. Click map pin -- verify bottom sheet snaps to 90%, 4. Swipe down -- verify sheet closes |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
