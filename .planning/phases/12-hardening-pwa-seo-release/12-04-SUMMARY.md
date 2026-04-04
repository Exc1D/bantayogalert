# 12-04 Summary: Offline Submission Queue and Connectivity Recovery

## Completed: 2026-04-04

## Changes Made

### IndexedDB persistence
- Extended [src/features/report/useReportDraft.ts](/home/exxeed/dev/projects/bantayogalert/src/features/report/useReportDraft.ts) with a `pending-submissions` object store alongside the existing `drafts` store
- Added [src/features/report/usePendingReportSubmission.ts](/home/exxeed/dev/projects/bantayogalert/src/features/report/usePendingReportSubmission.ts) for queued submission persistence, loading, removal, and retry bookkeeping

### Submission orchestration
- Added [src/features/report/reportSubmission.ts](/home/exxeed/dev/projects/bantayogalert/src/features/report/reportSubmission.ts) for deterministic submission IDs, payload building, queued retry execution, and retriable error classification
- Updated [src/app/report/ReportForm.tsx](/home/exxeed/dev/projects/bantayogalert/src/app/report/ReportForm.tsx) so offline/network failures queue submissions instead of silently failing
- Updated [src/app/report/ReportFormDesktopWrapper.tsx](/home/exxeed/dev/projects/bantayogalert/src/app/report/ReportFormDesktopWrapper.tsx) and [src/app/report/ReportFormMobileWrapper.tsx](/home/exxeed/dev/projects/bantayogalert/src/app/report/ReportFormMobileWrapper.tsx) to use the shared submission executor and queued retry path

### Connectivity state
- Added [src/hooks/useConnectionStatus.ts](/home/exxeed/dev/projects/bantayogalert/src/hooks/useConnectionStatus.ts) and used it in the report flow for offline messaging and reconnect-triggered retries
- Updated [src/features/report/mediaUpload.ts](/home/exxeed/dev/projects/bantayogalert/src/features/report/mediaUpload.ts) to use deterministic per-report filenames so retries do not create unbounded duplicate upload paths

## Verification
- Offline and network-failed submissions can now be stored separately from drafts
- Report form UI displays explicit queue/retry messaging through an `aria-live` region
- Reconnect-driven retries run through the same media-upload and callable-submit path as live submissions
