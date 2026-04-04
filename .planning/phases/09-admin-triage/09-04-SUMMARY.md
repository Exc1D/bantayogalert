# 09-04 Summary: Admin Queue Hook + UI Components

## Completed: 2026-04-04

## Changes Made

### src/hooks/useAdminQueueListener.ts
- Created `AdminQueueReport` interface extending report ops + reports data
- `useAdminQueueListener(municipalityCode)` — onSnapshot listener on report_ops
- Filters by municipalityCode if provided (null = superadmin sees all)
- Joins report_ops with reports/{id} for full display data
- Uses TanStack Query cache with queryKey `['admin-queue', municipalityCode]`

### src/components/report/PriorityStars.tsx
- Clickable 1-5 star rating component
- Filled stars for priority 1 through N, empty for N+1 through 5
- Readonly mode for card display, edit mode for detail panel
- Sizes: sm (16px) and md (20px)

### src/components/report/AdminQueueCard.tsx
- Compact ~80px card layout
- Left: type icon emoji + severity dot
- Center: type label + municipality + barangay + workflowState badge
- Right: relative time + priority dot (color-coded by priority level)
- Priority dot colors: red(1), orange(2), yellow(3), blue(4), gray(5)
- Sorted: priority (1=highest), then createdAt DESC

### src/components/report/AdminQueueFeed.tsx
- 3 tabs: Pending, Verified, Active (dispatched/acknowledged/in_progress)
- Tab counts as badges
- Superadmin: municipality filter dropdown (default: all municipalities)
- Municipal admin: auto-scoped to own municipality, no dropdown
- Real-time data via useAdminQueueListener + TanStack Query cache
- Card click: sets selectedReportId + activePanel to 'admin-report-detail'

## Verification
- useAdminQueueListener uses onSnapshot and joins report_ops with reports
- AdminQueueFeed has 3 tabs with counts
- Superadmin sees municipality dropdown, municipal admin is auto-scoped
- Priority dot visible on cards when priority is set
