# 10-04 Summary: Alerts Feed and Admin Alert Creation UI

## Completed: 2026-04-04

## Changes Made

### src/components/alerts/AlertCard.tsx
- Added alert cards with severity styling, announcement type icons, scope labels, and relative timestamps

### src/components/alerts/AlertsFeed.tsx
- Added the scrollable alerts feed with loading, empty, and refresh states powered by `useAnnouncements`

### src/components/alerts/CreateAlertForm.tsx
- Added the admin alert form with municipality-aware targeting, draft creation, immediate publish flow, and cancel behavior

### src/App.tsx and src/app/router.tsx
- Added `/app/alerts` for the alerts feed and `/app/admin/alerts` for admin announcement creation
- Updated routing so the browser router wrapper lives in `src/app/router.tsx` and the route tree stays in `src/App.tsx`

## Verification
- Citizens and admins have a dedicated alerts route in the app shell
- Admins can create drafts or publish alerts immediately from the dedicated alert form
- The alerts feed renders shared alert cards backed by the announcement query hook
