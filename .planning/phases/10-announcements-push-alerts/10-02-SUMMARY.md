# 10-02 Summary: Announcement Cloud Functions and Delivery Tracking

## Completed: 2026-04-04

## Changes Made

### functions/src/announcements/createAnnouncement.ts
- Added callable draft creation with Zod validation, text sanitization, and role-aware scope enforcement

### functions/src/announcements/publishAnnouncement.ts
- Added draft-to-published transition and push fanout trigger

### functions/src/announcements/cancelAnnouncement.ts
- Added published-to-cancelled transition with immutable cancellation timestamp

### functions/src/announcements/getAnnouncements.ts
- Added scoped callable query for published announcements with municipality and province filtering

### functions/src/announcements/sendAnnouncementPush.ts
- Added FCM multicast delivery with per-user notification records under `announcements/{id}/notifications/{userId}`
- Disabled invalid tokens when FCM reports token-specific delivery failures

### functions/src/announcements/subscribeAnnouncementTopics.ts
- Added a server-side topic subscription callable so the web client can subscribe browser tokens to municipality/province topics

### functions/src/index.ts and supporting types
- Exported all announcement callables from the functions entrypoint
- Added shared announcement/status types and supporting type fixes in auth, contacts, triage, and report modules
- Guarded `admin.initializeApp()` to avoid duplicate initialization

### functions/package.json
- Pinned `firebase-functions` to `4.9.0` to match the repository's existing callable/auth typing model
- Added `zod` for announcement payload validation

## Verification
- All five announcement flows exist: create, publish, cancel, list, and push delivery
- Push delivery uses `sendEachForMulticast` and records recipient delivery state in Firestore
- Functions TypeScript build passes with the new announcement modules exported from `functions/src/index.ts`
