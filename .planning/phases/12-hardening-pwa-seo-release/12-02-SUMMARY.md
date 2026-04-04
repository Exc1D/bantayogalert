# 12-02 Summary: Public Landing, Map, and Alerts Surfaces

## Completed: 2026-04-04

## Changes Made

### Public-safe data hooks
- Added [src/hooks/usePublicVerifiedReports.ts](/home/exxeed/dev/projects/bantayogalert/src/hooks/usePublicVerifiedReports.ts) for verified public report reads
- Added [src/hooks/usePublicAnnouncements.ts](/home/exxeed/dev/projects/bantayogalert/src/hooks/usePublicAnnouncements.ts) for published announcement reads and public alert detail lookup
- Updated [firestore.rules](/home/exxeed/dev/projects/bantayogalert/firestore.rules) so `reports/{reportId}` public reads require `workflowState == 'verified'` and public announcement reads require `status == 'published'`

### Public route content
- Replaced the placeholder landing page with a real public hero, CTAs, and summary metrics in [src/app/public/landing/page.tsx](/home/exxeed/dev/projects/bantayogalert/src/app/public/landing/page.tsx)
- Replaced the placeholder public map with a live map surface in [src/app/public/map/page.tsx](/home/exxeed/dev/projects/bantayogalert/src/app/public/map/page.tsx)
- Replaced the placeholder public alerts list/detail with published announcement content in [src/app/public/alerts/page.tsx](/home/exxeed/dev/projects/bantayogalert/src/app/public/alerts/page.tsx) and [src/app/public/alerts/detail/page.tsx](/home/exxeed/dev/projects/bantayogalert/src/app/public/alerts/detail/page.tsx)

### Public map and alert presentation
- Added [src/components/map/PublicReportMarkers.tsx](/home/exxeed/dev/projects/bantayogalert/src/components/map/PublicReportMarkers.tsx) and updated [src/app/shell/MapContainerWrapper.tsx](/home/exxeed/dev/projects/bantayogalert/src/app/shell/MapContainerWrapper.tsx) so public pages can reuse the same map container without private overlays
- Updated [src/components/alerts/AlertCard.tsx](/home/exxeed/dev/projects/bantayogalert/src/components/alerts/AlertCard.tsx) so alerts can render as either app-local buttons or public route links

## Verification
- Unauthenticated users now have indexed landing, map, alerts, and alert-detail surfaces
- Public pages read only published announcements and verified reports through dedicated hooks
- Alert cards no longer assume `/app` navigation targets
