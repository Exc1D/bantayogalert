---
phase: 06-real-time-map-feed
verified: 2026-04-04T01:45:00Z
status: gaps_found
score: 3/4 must-haves verified
gaps:
  - truth: "Desktop: clicking map pin or feed card opens WorkspaceDrawer with report-detail panel showing full report info"
    status: partial
    reason: "Feed card click correctly sets selectedReportId. Map pin click does NOT set selectedReportId — only calls setActivePanel('report-detail'). Drawer opens but shows empty ReportDetailPanel."
    artifacts:
      - path: src/components/map/ReportMarkers.tsx
        issue: "Map marker onClick only calls setActivePanel('report-detail'), does not call setSelectedReportId(props.id)"
    missing:
      - "Add setSelectedReportId(props.id) to ReportMarkers.tsx map marker onClick handler (line 110-113)"
  - truth: "Drawer/map viewport preserved when opening/closing (sibling layout already ensures this)"
    status: partial
    reason: "WorkspaceDrawer has transitionend invalidateSize handler, and map/feed are siblings in DesktopShell. However, map pin click doesn't set selectedReportId so drawer opens but shows no content — viewport preservation is moot without content."
---

# Phase 06: Real-Time Map Feed Verification Report

**Phase Goal:** Real-time map feed with verified reports displayed on interactive map with clustered markers, filterable feed panel, infinite scroll, and click-to-detail views for both desktop (drawer) and mobile (bottom sheet).

**Verified:** 2026-04-04
**Status:** gaps_found
**Plans Verified:** 06-03 (ReportFeed), 06-04 (ReportDetail)

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Feed shows verified report cards sorted by createdAt DESC | VERIFIED | `useReportFeed.ts` line 57: `orderBy('createdAt', 'desc')` |
| 2 | Cards display severity badge, incident type icon, municipality name, relative time, public status | VERIFIED | `ReportFeedCard.tsx` renders all 5 elements (lines 63-89) |
| 3 | Infinite scroll loads next 20 items when last card enters viewport | VERIFIED | `ReportFeed.tsx` IntersectionObserver with `rootMargin: '100px'` triggers `loadMore()` |
| 4 | Desktop: clicking map pin or feed card opens WorkspaceDrawer with report-detail panel showing full report info | **FAILED** | Map pin click sets activePanel but NOT selectedReportId. Feed card works correctly. |
| 5 | Mobile: clicking map pin or feed card navigates to /app/report/:id showing bottom sheet with full report info | VERIFIED | `ReportDetailSheet.tsx` useEffect sets selectedReportId from route params |
| 6 | Both desktop drawer and mobile sheet use the same ReportDetailPanel component | VERIFIED | Both WorkspaceDrawer and ReportDetailSheet import and render ReportDetailPanel |
| 7 | Drawer/map viewport preserved when opening/closing (sibling layout already ensures this) | VERIFIED | WorkspaceDrawer calls `mapRef.current?.invalidateSize()` on transitionend; map and drawer are siblings |

**Score:** 5/6 truths verified; 1 FAILED (desktop map pin click)

### Requirements Coverage

| Requirement | Status | Evidence |
|-------------|--------|----------|
| FM-04: Feed shows verified report cards sorted by createdAt DESC | VERIFIED | `useReportFeed.ts` orderBy('createdAt', 'desc') |
| FM-05: Cards display severity badge, incident type icon, municipality name, relative time, public status | VERIFIED | `ReportFeedCard.tsx` lines 63-89 |
| FM-06: Infinite scroll loads next 20 items when last card enters viewport | VERIFIED | `ReportFeed.tsx` IntersectionObserver sentinel + PAGE_SIZE=20 |
| FM-07: Clicking map pin or feed card opens report detail (drawer desktop, sheet mobile) | **PARTIAL** | Feed card works. Map pin does NOT set selectedReportId. Mobile sheet works. |
| FM-08: Map viewport preserved when drawer opens/closes | VERIFIED | transitionend invalidateSize + sibling layout |

---

## Plan 06-03: ReportFeed with Infinite Scroll

### Tasks Verified

| Task | Status | Details |
|------|--------|---------|
| Task 1: Create useReportFeed.ts | VERIFIED | Cursor-based pagination with startAfter, PAGE_SIZE=20, filter-aware reset |
| Task 2: Create ReportFeedCard.tsx | VERIFIED | 80px card with severity dot, type icon, municipality, relative time, public status |
| Task 3: Create ReportFeed.tsx | VERIFIED | IntersectionObserver infinite scroll, skeleton loading, empty/error states |
| Task 4: Integrate feed panel into DesktopShell | VERIFIED | 60/40 split (flex-[3] map, flex-[2] feed), useVerifiedReportsListener at shell level |

### Verification Commands (06-03)

| Command | Result | Details |
|---------|--------|---------|
| `npm run build` | PASS | No TypeScript errors |
| `grep -r "useReportFeed" src/hooks/useReportFeed.ts` | PASS | Export function found at line 33 |
| `grep -r "ReportFeedCard" src/components/report/ReportFeedCard.tsx` | PASS | Component defined and exported |
| `grep -r "ReportFeed" src/components/report/ReportFeed.tsx` | PASS | Component defined and exported |
| `grep -r "useVerifiedReportsListener" src/app/shell/DesktopShell.tsx` | PASS | Called at line 58 |
| `grep -r "flex-\[3\]" src/app/shell/DesktopShell.tsx` | PASS | 60/40 split at lines 42-48 |

---

## Plan 06-04: Report Detail Views

### Tasks Verified

| Task | Status | Details |
|------|--------|---------|
| Task 1: Create ReportDetailPanel.tsx | VERIFIED | Reads from TanStack Query cache, renders header/body with all fields |
| Task 2: Wire report-detail into WorkspaceDrawer | VERIFIED | DrawerContent renders `<ReportDetailPanel reportId={selectedReportId} />` |
| Task 3: Desktop smoke test | NOT PROGRAMMATIC | Human verification required (claimed complete) |
| Task 4: Create ReportDetailSheet.tsx | VERIFIED | Bottom sheet with drag gesture, scrim overlay, uses ReportDetailPanel |
| Task 5: Add /app/report/:id route and update MobileShell | VERIFIED | Route registered, MobileShell has map+feed tabs with listener |

### Verification Commands (06-04)

| Command | Result | Details |
|---------|--------|---------|
| `npm run build` | PASS | No TypeScript errors |
| `grep -r "ReportDetailPanel" src/components/report/ReportDetailPanel.tsx` | PASS | Found |
| `grep -r "ReportDetailSheet" src/components/report/ReportDetailSheet.tsx` | PASS | Found |
| `grep -r "report-detail.*DrawerContent" src/app/shell/WorkspaceDrawer.tsx` | PASS | Line 27: `if (panel === 'report-detail')` |
| `grep -r "/app/report/:id" src/app/router.tsx` | PASS | Line 17: `path: '/app/report/:id'` |
| `grep -r "useVerifiedReportsListener" src/app/shell/MobileShell.tsx` | PASS | Line 58 |

---

## Gap Details: Desktop Map Pin Click Does Not Set selectedReportId

### Root Cause

In `src/components/map/ReportMarkers.tsx` (lines 110-113), the map marker onClick handler is:

```typescript
marker.on('click', () => {
  setSelectedMarkerId(props.id)       // Sets map viewport store marker ID
  setActivePanel('report-detail')      // Opens drawer
  // MISSING: setSelectedReportId(props.id)
})
```

But `selectedReportId` (uiStore) is what ReportDetailPanel uses to look up the report in the TanStack Query cache:

```typescript
// ReportDetailPanel.tsx lines 37-40
const report = useMemo(
  () => reports.find((r) => r.id === reportId),
  [reports, reportId]
)
```

Since `setSelectedReportId` is never called, `reportId` is `null` and `reports.find()` returns `undefined`. The panel shows "Report not found".

### Feed Card Click (Works Correctly)

`ReportFeed.tsx` lines 59-62:
```typescript
const handleCardClick = (report: { id: string }) => {
  setSelectedReportId(report.id)   // CORRECTLY SETS selectedReportId
  setActivePanel('report-detail')
}
```

This is the correct pattern. Map pin click should mirror this.

### Impact

- FM-07 partially broken: Feed card click works. Map pin click opens drawer but shows empty content.
- The drawer header ("Report Detail") renders, but the ReportDetailPanel body shows "Report not found" because `selectedReportId` is null.

### Fix Required

In `src/components/map/ReportMarkers.tsx`, add `setSelectedReportId` to the marker onClick handler:

```typescript
marker.on('click', () => {
  setSelectedMarkerId(props.id)
  setSelectedReportId(props.id)  // ADD THIS LINE
  setActivePanel('report-detail')
})
```

Requires importing `setSelectedReportId` from `@/stores/uiStore`.

---

## Anti-Patterns Found

No anti-patterns found in Phase 06-03 or 06-04 artifacts:
- No TODO/FIXME/PLACEHOLDER comments
- No empty return placeholders (all return null statements are legitimate guards)
- No console.log-only implementations
- No hardcoded empty arrays being rendered

---

## Human Verification Required

### 1. Desktop: Map Pin Click Opens Report Detail Drawer

**Test:** Start dev server, open desktop viewport, click a map pin marker
**Expected:** WorkspaceDrawer slides in from right showing ReportDetailPanel with the report's severity badge, type, description, location, media, and timestamps
**Why human:** Requires running dev server and visual confirmation of drawer content
**Current behavior:** Drawer opens but content area is empty ("Report not found") due to missing `setSelectedReportId`

### 2. Desktop: Feed Card Click Opens Report Detail Drawer

**Test:** Start dev server, open desktop viewport, scroll feed, click a feed card
**Expected:** WorkspaceDrawer slides in showing the correct report detail
**Why human:** Requires running dev server and visual confirmation

### 3. Mobile: Bottom Sheet Opens on /app/report/:id Navigation

**Test:** Start dev server on mobile viewport, tap a report in the feed, verify bottom sheet appears
**Expected:** Bottom sheet at 90% height with drag handle, scrim overlay, report detail content
**Why human:** Requires running dev server, mobile viewport, and touch interaction

---

## Build Status

`npm run build` — **PASSED** (no TypeScript errors)

---

## Gaps Summary

**Phase 06 is 95% complete.** All artifacts exist, are substantive, and are wired. The single gap is:

1. **Desktop map pin click does not set selectedReportId** — The map marker onClick in ReportMarkers.tsx calls `setActivePanel('report-detail')` but does not call `setSelectedReportId(props.id)`. This causes the drawer to open with an empty ReportDetailPanel. Feed card click works correctly. The fix is a single additional function call in the marker onClick handler.

This gap is in Plan 06-04, Task 2 (wired report-detail into WorkspaceDrawer) — the wiring exists but is incomplete for map pin interaction specifically.

---

_Verified: 2026-04-04_
_Verifier: Claude (gsd-verifier)_