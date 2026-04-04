# 10-03 Summary: Client FCM Setup and Announcement Data Hooks

## Completed: 2026-04-04

## Changes Made

### public/firebase-messaging-sw.js
- Added a standalone FCM service worker that reads Firebase config from IndexedDB at runtime

### src/lib/firebase/messaging.ts
- Added service-worker registration, IndexedDB config persistence, browser support detection, token acquisition, and foreground message subscription helpers

### src/hooks/useFcmToken.ts
- Added browser token registration to `users/{uid}/fcmTokens`

### src/hooks/useMunicipalityTopics.ts
- Added municipality/province topic subscription via the new `subscribeAnnouncementTopics` callable

### src/hooks/useAnnouncements.ts
- Added the announcements query hook and exported `ANNOUNCEMENTS_QUERY_KEY` for cache invalidation

## Verification
- Web push config is delivered to the service worker without hardcoded Firebase placeholders
- Authenticated users can register FCM tokens and subscribe those tokens to scoped announcement topics
- Alerts UI and foreground notifications can refetch announcement data through the shared announcements query key
