# 10-01 Summary: Announcement Schema and Access Foundation

## Completed: 2026-04-04

## Changes Made

### src/types/announcement.ts
- Added `AnnouncementTargetScope` as a discriminated union for `province`, `municipality`, and `multi_municipality`
- Replaced single `municipalityCode` targeting with `municipalityCodes`
- Added `cancelledAt` to the shared announcement model
- Updated the Zod schema to enforce scope-specific municipality count constraints

### firestore.rules
- Updated announcement writes to enforce municipal-admin scope from `targetScope.municipalityCodes[0]`
- Preserved province-wide access for provincial superadmins
- Added `users/{userId}/fcmTokens/{tokenId}` rules so authenticated clients can register browser push tokens

### firestore.indexes.json
- Added composite indexes for published announcement queries by `status`, `publishedAt`, `type`, and `targetScope.municipalityCodes`

### .env.example
- Declared `VITE_FCM_VAPID_KEY` for web push setup

## Verification
- Shared announcement schema now supports province-wide, single-municipality, and multi-municipality targeting
- Firestore rules enforce municipality-scoped writes for municipal admins and allow province-wide targeting only for superadmins
- Required announcement query indexes and FCM VAPID environment variable are present
