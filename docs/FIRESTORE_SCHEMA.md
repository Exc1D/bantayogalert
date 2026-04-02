# BantayogAlert — Firestore Schema

**Schema Version:** 1
**Last Updated:** 2026-04-02
**Project:** BantayogAlert — Civic Disaster Reporting Platform, Camarines Norte

---

## 1. Collection Overview

| Collection | Doc ID | Purpose |
|---|---|---|
| `users/{uid}` | `uid` (Firebase Auth UID) | User profiles with role + municipality |
| `reports/{reportId}` | Auto (Firestore push ID) | Disaster reports |
| `reports/{reportId}/activity/{activityId}` | Auto | Audit trail per report |
| `contacts/{contactId}` | Auto | Emergency contact directory |
| `announcements/{announcementId}` | Auto | Official announcements |
| `announcements/{announcementId}/notifications/{notifId}` | Auto | Per-user delivery records |
| `analytics/municipality/{muniCode}/daily/{date}` | `YYYY-MM-DD` | Per-muni daily aggregates |
| `analytics/municipality/{muniCode}/weekly/{weekId}` | `YYYY-WWW` | Per-muni weekly aggregates |
| `analytics/province/daily/{date}` | `YYYY-MM-DD` | Province-wide daily aggregates |
| `audit/{auditId}` | Auto | Append-only system audit log |

---

## 2. Document Schemas

---

### `users/{uid}`

User profile. One document per Firebase Auth user.

| Field | Firestore Type | Description | Validation |
|---|---|---|---|
| `uid` | `string` | Firebase Auth UID | Required, primary key |
| `email` | `string` | Email address | Required, from Auth |
| `displayName` | `string` | Display name | Optional |
| `role` | `string` | `citizen` \| `municipal_admin` \| `provincial_superadmin` | Required, custom claim |
| `municipality` | `string` \| `null` | MunicipalityCode or null (provincial) | Nullable for provincial_superadmin |
| `barangay` | `string` \| `null` | Barangay name | Optional |
| `phone` | `string` \| `null` | Phone number | Optional |
| `photoUrl` | `string` \| `null` | Profile photo URL | Optional |
| `notificationPreferences` | `map` | Push/in-app preferences | See below |
| `createdAt` | `Timestamp` | Account creation time | Auto |
| `updatedAt` | `Timestamp` | Last profile update | Auto |

**`notificationPreferences` map:**
```json
{
  "pushEnabled": boolean,
  "municipalityAlerts": boolean,
  "provinceAlerts": boolean
}
```

**Security:** Read by self, municipal_admin (own muni), provincial_superadmin (all). Write by self or provincial_superadmin.

---

### `reports/{reportId}`

Core disaster/emergency report. Municipality is the hard security perimeter.

| Field | Firestore Type | Description | Validation |
|---|---|---|---|
| `SCHEMA_VERSION` | `number` | Always `1` | Required |
| `type` | `string` | Report type enum | `flood`\|`landslide`\|`fire`\|`earthquake`\|`medical`\|`crime`\|`infrastructure`\|`other` |
| `category` | `string` | Report category | e.g. `water_level`, `fire_size` |
| `severity` | `string` | Severity level | `low`\|`medium`\|`high`\|`critical` |
| `status` | `string` | Workflow status | `pending`\|`verified`\|`rejected`\|`dispatched`\|`acknowledged`\|`in_progress`\|`resolved` |
| `publicStatus` | `string` | Citizen-facing label | Mapped from status |
| `title` | `string` | Short title | Max 100 chars, sanitized |
| `description` | `string` | Full description | Max 1000 chars, DOMPurify sanitized |
| `location` | `map` | Geo data | See below |
| `location.lat` | `number` | Latitude | 13.5–15.0 |
| `location.lng` | `number` | Longitude | 121.5–124.0 |
| `location.barangay` | `string` | Barangay name | Required |
| `location.municipality` | `string` | MunicipalityCode | Required |
| `location.address` | `string` \| `null` | Street address | Optional |
| `location.geohash` | `string` | 8-char geohash for geo-queries | Computed from lat/lng |
| `mediaUrls` | `array<string>` | Storage URLs, max 3 | Max 3 URLs |
| `mediaUploadStatus` | `string` | Upload state | `pending`\|`uploading`\|`complete`\|`failed` |
| `submitterUid` | `string` | Reporter's UID | Required |
| `submitterName` | `string` | Reporter's name | Denormalized from Auth |
| `submitterAnonymous` | `boolean` | Anonymous submission flag | Default `false` |
| `assignedMunicipality` | `string` | MunicipalityCode | Required — the scoped perimeter |
| `createdAt` | `Timestamp` | Submission time | Auto |
| `updatedAt` | `Timestamp` | Last update | Auto |
| `verifiedBy` | `string` \| `null` | UID of verifying admin | Admin-only |
| `verifiedAt` | `Timestamp` \| `null` | Verification time | Admin-only |
| `rejectedBy` | `string` \| `null` | UID of rejecting admin | Admin-only |
| `rejectedAt` | `Timestamp` \| `null` | Rejection time | Admin-only |
| `rejectedReason` | `string` \| `null` | Reason for rejection | Admin-only |
| `dispatchedTo` | `map` \| `null` | Dispatch target snapshot | Immutable after set |
| `dispatchedTo.contactId` | `string` | Contact ID | — |
| `dispatchedTo.agencyName` | `string` | Agency name | — |
| `dispatchedTo.contactPerson` | `string` | Contact person | — |
| `dispatchedTo.phone` | `string` | Phone number | — |
| `dispatchedTo.type` | `string` | ContactType | — |
| `dispatchedTo.municipality` | `string` | MunicipalityCode | — |
| `dispatchedTo.dispatchedAt` | `Timestamp` | Dispatch time | — |
| `dispatchedTo.dispatchedBy` | `string` | Admin UID | — |
| `acknowledgedBy` | `string` \| `null` | UID | Admin-only |
| `acknowledgedAt` | `Timestamp` \| `null` | Ack time | Admin-only |
| `inProgressBy` | `string` \| `null` | UID | Admin-only |
| `inProgressAt` | `Timestamp` \| `null` | In-progress time | Admin-only |
| `resolvedBy` | `string` \| `null` | UID | Admin-only |
| `resolvedAt` | `Timestamp` \| `null` | Resolution time | Admin-only |
| `resolvedNotes` | `string` \| `null` | Resolution notes | Admin-only |

**Security Rules Enforced:**
- Citizens: read own reports only
- `municipal_admin`: read/write reports where `assignedMunicipality == token.municipality`
- `provincial_superadmin`: read all, write all

**⚠️ Denormalization:** `submitterName` is stored on the report doc. If the user changes their displayName in Auth, previously submitted reports still show the old name. Acceptable trade-off for query simplicity. The `updatedAt` on the user doc does NOT cascade to reports.

---

### `reports/{reportId}/activity/{activityId}`

Append-only activity log for each report. Cloud Functions only (write: false for clients).

| Field | Firestore Type | Description |
|---|---|---|
| `reportId` | `string` | Parent report ID |
| `actorUid` | `string` | UID of user who performed action |
| `actorRole` | `string` | Role at time of action |
| `actorMunicipality` | `string` \| `null` | Municipality at time of action |
| `action` | `string` | `submitted`\|`verified`\|`rejected`\|`dispatched`\|`acknowledged`\|`in_progress`\|`resolved`\|`routed`\|`commented`\|`auto_rejected` |
| `previousState` | `string` \| `null` | WorkflowStatus before action |
| `newState` | `string` \| `null` | WorkflowStatus after action |
| `notes` | `string` \| `null` | Free-text notes |
| `createdAt` | `Timestamp` | Action timestamp |

**Security:** All authenticated users can read. Only Cloud Functions write.

---

### `contacts/{contactId}`

Emergency contact directory for dispatch.

| Field | Firestore Type | Description | Validation |
|---|---|---|---|
| `municipality` | `string` | MunicipalityCode | Required |
| `agencyName` | `string` | Agency/organization name | Required |
| `contactPerson` | `string` | Primary contact name | Required |
| `phone` | `string` | Primary phone | Required |
| `email` | `string` \| `null` | Email address | Optional |
| `type` | `string` | `barangay`\|`municipal`\|`provincial`\|`ngo`\|`media`\|`other` | Required |
| `active` | `boolean` | Whether contact is active | Default `true` |
| `createdBy` | `string` | Admin UID who created | Required |
| `createdAt` | `Timestamp` | Creation time | Auto |
| `updatedAt` | `Timestamp` | Last update | Auto |

**Security:** Municipal_admin reads/writes own municipality only. Provincial_superadmin reads/writes all.

---

### `announcements/{announcementId}`

Official announcements/alerts.

| Field | Firestore Type | Description | Validation |
|---|---|---|---|
| `SCHEMA_VERSION` | `number` | Always `1` | Required |
| `title` | `string` | Announcement title | Max 100 chars, sanitized |
| `body` | `string` | Announcement body | Max 2000 chars, DOMPurify sanitized |
| `scope` | `string` | `municipality`\|`multi_municipality`\|`province` | Required |
| `targetMunicipalities` | `array<string>` | MunicipalityCode[] | Empty = province-wide |
| `severity` | `string` | `info`\|`warning`\|`critical` | Required |
| `creatorUid` | `string` | Admin UID | Required |
| `creatorRole` | `string` | Role of creator | Required |
| `creatorMunicipality` | `string` \| `null` | Municipality of creator | Required |
| `createdAt` | `Timestamp` | Creation time | Auto |
| `publishedAt` | `Timestamp` \| `null` | When published | Null = draft |
| `expiresAt` | `Timestamp` \| `null` | Expiry time | Optional |
| `active` | `boolean` | Is active | Default `true` |

**Security:**
- `municipal_admin` can only create `scope: municipality` targeting their own municipality
- `provincial_superadmin` can create any scope
- Anyone with read access can read announcements scoped to them

---

### `announcements/{announcementId}/notifications/{notificationId}`

Per-user notification delivery record.

| Field | Firestore Type | Description |
|---|---|---|
| `announcementId` | `string` | Parent announcement ID |
| `userUid` | `string` | Target user UID |
| `municipality` | `string` \| `null` | User's municipality (null = province) |
| `channel` | `string` | `push`\|`in_app` |
| `status` | `string` | `sent`\|`delivered`\|`failed`\|`read` |
| `sentAt` | `Timestamp` | When sent |
| `deliveredAt` | `Timestamp` \| `null` | When delivered |
| `readAt` | `Timestamp` \| `null` | When read |
| `error` | `string` \| `null` | Error message if failed |

**Security:** Users can read their own notifications. Provincial_superadmin can read all. Write: Cloud Functions only.

---

### `analytics/municipality/{muniCode}/daily/{date}`

Daily aggregated stats per municipality. Written by scheduled Cloud Function (02:00 PHT daily).

| Field | Firestore Type | Description |
|---|---|---|
| `muniCode` | `string` | MunicipalityCode |
| `date` | `string` | `YYYY-MM-DD` |
| `totalReports` | `number` | Total reports received |
| `reportsByType` | `map<string,number>` | Count per report type |
| `reportsBySeverity` | `map<string,number>` | Count per severity level |
| `reportsByStatus` | `map<string,number>` | Count per workflow status |
| `avgResponseTimeMinutes` | `number` \| `null` | Avg time from submit to resolved |
| `createdAt` | `Timestamp` | When aggregated |

**Security:** Municipal_admin reads own municipality. Provincial_superadmin reads all. Write: system only.

---

### `analytics/province/daily/{date}`

Province-wide daily aggregates. Same structure as municipal, province-scoped.

---

### `audit/{auditId}`

Append-only audit trail for compliance and debugging.

| Field | Firestore Type | Description |
|---|---|---|
| `actorUid` | `string` | User UID who performed action |
| `actorRole` | `string` | Role at time of action |
| `actorMunicipality` | `string` \| `null` | Municipality at time |
| `action` | `string` | AuditAction type |
| `resourceType` | `string` | `report`\|`announcement`\|`contact`\|`user` |
| `resourceId` | `string` | ID of affected resource |
| `municipalityScope` | `string` \| `null` | MunicipalityCode or `province` or null |
| `payload` | `map` | Before/after snapshot |
| `ipAddress` | `string` \| `null` | Client IP |
| `userAgent` | `string` \| `null` | Client user agent |
| `createdAt` | `Timestamp` | Action timestamp |

**Security:** Municipal_admin reads own municipality only. Provincial_superadmin reads all. Write: Cloud Functions only.

---

## 3. Composite Indexes Required

```json
[
  {
    "collectionGroup": "reports",
    "queryScope": "COLLECTION",
    "fields": [
      { "fieldPath": "assignedMunicipality", "order": "ASCENDING" },
      { "fieldPath": "createdAt", "order": "DESCENDING" }
    ]
  },
  {
    "collectionGroup": "reports",
    "queryScope": "COLLECTION",
    "fields": [
      { "fieldPath": "assignedMunicipality", "order": "ASCENDING" },
      { "fieldPath": "status", "order": "ASCENDING" },
      { "fieldPath": "createdAt", "order": "DESCENDING" }
    ]
  },
  {
    "collectionGroup": "reports",
    "queryScope": "COLLECTION",
    "fields": [
      { "fieldPath": "assignedMunicipality", "order": "ASCENDING" },
      { "fieldPath": "type", "order": "ASCENDING" },
      { "fieldPath": "createdAt", "order": "DESCENDING" }
    ]
  },
  {
    "collectionGroup": "reports",
    "queryScope": "COLLECTION",
    "fields": [
      { "fieldPath": "assignedMunicipality", "order": "ASCENDING" },
      { "fieldPath": "severity", "order": "ASCENDING" },
      { "fieldPath": "createdAt", "order": "DESCENDING" }
    ]
  },
  {
    "collectionGroup": "reports",
    "queryScope": "COLLECTION",
    "fields": [
      { "fieldPath": "submitterUid", "order": "ASCENDING" },
      { "fieldPath": "createdAt", "order": "DESCENDING" }
    ]
  },
  {
    "collectionGroup": "reports",
    "queryScope": "COLLECTION",
    "fields": [
      { "fieldPath": "assignedMunicipality", "order": "ASCENDING" },
      { "fieldPath": "geohash", "order": "ASCENDING" },
      { "fieldPath": "createdAt", "order": "DESCENDING" }
    ]
  },
  {
    "collectionGroup": "announcements",
    "queryScope": "COLLECTION",
    "fields": [
      { "fieldPath": "scope", "order": "ASCENDING" },
      { "fieldPath": "publishedAt", "order": "DESCENDING" }
    ]
  },
  {
    "collectionGroup": "announcements",
    "queryScope": "COLLECTION",
    "fields": [
      { "fieldPath": "targetMunicipalities", "arrayConfig": "CONTAINS" },
      { "fieldPath": "publishedAt", "order": "DESCENDING" }
    ]
  },
  {
    "collectionGroup": "contacts",
    "queryScope": "COLLECTION",
    "fields": [
      { "fieldPath": "municipality", "order": "ASCENDING" },
      { "fieldPath": "active", "order": "ASCENDING" },
      { "fieldPath": "type", "order": "ASCENDING" }
    ]
  },
  {
    "collectionGroup": "audit",
    "queryScope": "COLLECTION",
    "fields": [
      { "fieldPath": "actorMunicipality", "order": "ASCENDING" },
      { "fieldPath": "createdAt", "order": "DESCENDING" }
    ]
  },
  {
    "collectionGroup": "audit",
    "queryScope": "COLLECTION",
    "fields": [
      { "fieldPath": "resourceType", "order": "ASCENDING" },
      { "fieldPath": "resourceId", "order": "ASCENDING" },
      { "fieldPath": "createdAt", "order": "DESCENDING" }
    ]
  }
]
```

---

## 4. Geohash Strategy

### What is Geohash?
Geohash encodes `(lat, lng)` into a variable-length string. Longer prefixes = more precise. An 8-character geohash gives ~19-meter precision — fine enough for municipal-level filtering.

Example: Daet, Camarines Norte ≈ `qd5jrg82`

### How to Compute (Client-side)
Use the `ngeohash` library:
```typescript
import ngeohash from 'ngeohash'
const geohash = ngeohash.encode(lat, lng, 8) // 'qd5jrg82'
```

Install: `npm install ngeohash @types/ngeohash`

### Firestore Geo-Query Pattern
Instead of bounding-box queries on `lat`/`lng` (which Firestore can't index efficiently), use:
```typescript
import ngeohash from 'ngeohash'

// Get geohash prefix for a bounding box
const bounds = ngeohash.bboxes(minLat, minLng, maxLat, maxLng)
const prefix = bounds.substring(0, 6) // 6-char = ~1.2km precision

// Firestore query using prefix
const q = query(
  collection(db, 'reports'),
  where('assignedMunicipality', '==', muni),
  where('geohash', '>=', prefixLo),
  where('geohash', '<=', prefixHi),
  orderBy('geohash'),
  orderBy('createdAt', 'desc'),
  limit(50)
)
```

### Why Geohash Over lat/lng Bounding Box?
- Firestore cannot do range queries on two separate numeric fields simultaneously
- Geohash converts a 2D bounding box into a 1D string range
- Works with Firestore's built-in string indexing
- `qd5jrg80` to `qd5jrg8z` covers the bounding box in one query

### When to Use It
- Map viewport queries (debounced 300ms on viewport change)
- Any "reports near point X within radius R" query
- NOT needed for: admin triage queue, citizen "my reports", sorted feeds (use `createdAt` ordering instead)

### Indexes Required
- `reports`: `[assignedMunicipality, geohash, createdAt]` — see composite indexes above

---

## 5. Discrepancies Found: SPEC vs. Validators

### 1. `submitterAnonymous` is in validators but not in the SPEC
SPEC section 5.1 does not list `submitterAnonymous`. Validators.ts has it. **Action needed:** Add to SPEC.

### 2. `title` field on reports
SPEC section 5.1 lists `title` but it's not in the validators `CreateReportSchema`. Reports can be created without a title. **Action needed:** Add `title` to `CreateReportSchema` or remove from SPEC.

### 3. `publicStatus` field
SPEC section 5.2 documents the mapping but `publicStatus` is a derived/computed field — it should NOT be stored in Firestore (it's always computed from `status` at read time). **Action needed:** Remove `publicStatus` from the report document schema. It's a UI concern, not a storage concern.

### 4. `mediaUploadStatus` field
Present in SPEC but not in validators. **Action needed:** Add to `CreateReportSchema` as an optional enum.

### 5. `MunicipalityCode` is a Zod enum in validators but a Firestore `string`
This is fine — Zod enum validates at write time, Firestore stores as string. No discrepancy.

---

## 6. Schema Versioning

Every document that may need migration should carry a `SCHEMA_VERSION` field (integer, starts at `1`).

When the schema changes:
1. Increment `SCHEMA_VERSION` in the document spec
2. Write a migration Cloud Function that reads `SCHEMA_VERSION < N` docs and upgrades them
3. Run migration once, then deploy new code that writes `SCHEMA_VERSION = N+1`

Currently applies to: `reports`, `announcements`

---

## 7. Offline / Persistence

- **Firestore offline persistence:** Enabled via `enableIndexedDbPersistence(db)` in the Firestore init
- **Offline queue for writes:** Pending report submissions go to IndexedDB via Firestore's built-in persistence. Auto-retries on reconnect.
- **No custom offline queue needed** — Firestore handles atomic writes and retry for all service methods
