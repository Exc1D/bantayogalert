# Bantayog Alert — Technical Specification
**Version:** 1.0
**Date:** 2026-04-01
**Status:** Pre-implementation

---

## 1. Executive Summary

Bantayog Alert is a dual-surface disaster reporting and emergency coordination platform for Camarines Norte, Philippines. It serves three distinct roles — **citizen**, **municipal_admin**, and **provincial_superadmin** — through a desktop command-center interface and a mobile citizen-facing app.

**Desktop** is map-first: a persistent Leaflet canvas occupies the full viewport, with a minimal left navigation rail and a reusable right-side modal used as the workspace surface for every section (feed, profile, alerts, admin, report detail). The map never remounts during navigation.

**Mobile** is feed-first: a bottom-tab interface for Feed, Map, Alerts, and Profile, paired with a fast report submission flow and a persistent but collapsible map view.

**Core value chain:** citizen-submitted reports → admin triage (verify/reject/route/acknowledge/dispatch/in_progress/resolve) → official announcements → push notification delivery.

**Scope boundary:** Municipality is a hard security perimeter. `municipal_admin` can never touch data outside their assigned municipality. `provincial_superadmin` can operate province-wide.

**Announcement boundary:** `municipal_admin` sends to their municipality only. `provincial_superadmin` sends province-wide or to selected municipalities. Citizens see municipality-scoped alerts plus province-wide alerts.

**Stack:** React 18 + Vite + Tailwind CSS + Firebase (Auth, Firestore, Storage, Cloud Functions, Cloud Messaging, Hosting) + React-Leaflet + PWA + Vitest + React Testing Library + Playwright.

**Release gate:** 90/100 on the Bantayog Alert Quality Scorecard. No release with broken municipality scope, broken provincial permissions, map remount on modal toggle, or critical security flaws.

---

## 2. Architecture Recommendation

### 2.1 Monorepo Structure

```
/
├── public/                  # Static assets, manifest, sitemap, robots
├── src/
│   ├── assets/              # Icons, images, fonts
│   ├── components/
│   │   ├── common/          # Button, Modal, Card, Input, Badge, Spinner, Toast
│   │   ├── layout/          # DesktopShell, MobileShell, NavRail, BottomTab, RightModal
│   │   ├── map/             # MapCanvas, ReportMarker, MarkerCluster, MapFilters
│   │   ├── feed/            # FeedList, FeedCard, FeedFilters
│   │   ├── report/          # ReportForm, ReportDetail, ReportActions
│   │   ├── profile/         # ProfileView, ReportTracker, Preferences
│   │   ├── alerts/          # AlertCard, AlertDetail, AnnouncementForm
│   │   ├── admin/           # TriagePanel, RoutingPanel, ContactSelect, AnalyticsPanel
│   │   ├── contacts/        # ContactList, ContactCard, ContactForm
│   │   └── auth/            # SignIn, RoleGate, ProtectedRoute
│   ├── contexts/
│   │   ├── AuthContext.tsx          # Firebase Auth + role/municipality resolution
│   │   ├── MapContext.tsx           # Leaflet instance, viewport, selected pin, filters
│   │   ├── ModalContext.tsx         # Right-side modal state (open/close/section)
│   │   └── ReportsContext.tsx      # Report subscriptions scoped by role + municipality
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useReports.ts
│   │   ├── useRealtimeReport.ts
│   │   ├── useMapViewport.ts
│   │   ├── useModal.ts
│   │   ├── useAnnouncements.ts
│   │   ├── useContacts.ts
│   │   └── useAnalytics.ts
│   ├── lib/
│   │   ├── firebase.ts              # Firebase app init
│   │   ├── firestore.ts            # Firestore app init
│   │   ├── storage.ts              # Storage init
│   │   ├── messaging.ts            # FCM init + notification handling
│   │   └── maps.ts                 # Leaflet tile layer + config
│   ├── services/
│   │   ├── reportService.ts        # Submit, list, get, update report
│   │   ├── announcementService.ts  # Create, send, list announcements
│   │   ├── contactService.ts       # CRUD contacts
│   │   ├── analyticsService.ts     # Aggregates
│   │   └── auditService.ts         # Append-only audit logging
│   ├── rules/
│   │   ├── firestore.rules         # Municipality scoping, role permissions
│   │   └── storage.rules           # Upload path + type + size validation
│   ├── types/
│   │   ├── user.ts
│   │   ├── report.ts
│   │   ├── announcement.ts
│   │   ├── contact.ts
│   │   ├── activity.ts
│   │   └── analytics.ts
│   └── utils/
│       ├── sanitize.ts             # DOMPurify wrappers for user content
│       ├── validators.ts           # Zod schemas for all write payloads
│       ├── constants.ts           # Report types, categories, severities, municipalities
│       └── format.ts              # Date, location, status-label formatters
├── functions/               # Firebase Cloud Functions (TypeScript)
│   ├── src/
│   │   ├── reportWorkflow.ts      # State machine transitions + validation
│   │   ├── announcementSend.ts   # FCM dispatch + delivery log writer
│   │   ├── announcementExpiry.ts # Scheduled — auto-expires published announcements
│   │   ├── pendingReportAutoReject.ts # Scheduled — auto-rejects pending > 72h
│   │   ├── analyticsAggregator.ts # Scheduled aggregation
│   │   └── auditLogger.ts         # Centralized audit trail writer
│   └── firestore.rules
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── docs/                   # Product and system documentation
├── principles/             # Architecture and coding standards
└── errors/                 # Recurring failures and root causes
```

### 2.2 Key Architectural Decisions

**Separation of concerns:**
- `MapContext` owns the Leaflet instance — no component outside `src/components/map/` directly manipulates the map.
- `ModalContext` owns right-modal state — any section (feed, profile, alerts, admin) can open the modal without coupling to the map.
- Report mutations go through `reportService` + Cloud Functions — never directly from the client.
- `ReportsContext` provides role-scoped subscriptions — callers never manually scope queries.

**Desktop modal reuse pattern:**
The `RightModal` component accepts a `section` prop: `'feed' | 'profile' | 'alerts' | 'admin' | 'report-detail' | 'contacts'`. The modal renders the appropriate panel based on this prop. Opening a new section while the modal is open does NOT unmount the Leaflet map — the map lives in `DesktopShell` outside the modal layer entirely.

**Map persistence guarantee:**
`DesktopShell` renders:
```tsx
<div className="flex h-screen">
  <NavRail />           {/* fixed left, ~64px */}
  <main className="flex-1 relative">
    <MapCanvas />        {/* full-bleed, z-0, always mounted */}
    <RightModal />       {/* absolute overlay, z-10, does NOT affect map DOM */}
  </main>
</div>
```
Closing the modal removes the overlay; the map's DOM and viewport state are never touched.

**Firestore as the primary backend:** All business logic, permissions, and workflow enforcement live in Firestore security rules + Cloud Functions. The client is a thin, role-aware interface.

---

## 3. Desktop Information Architecture

### 3.1 Layout Structure

```
┌─────────────────────────────────────────────────────────────────────┐
│  [Logo]  │                                          [User Avatar ▾] │
│          │                                                        │
│   🏠     │              MAP CANVAS (always mounted)               │
│   Feed   │                                                        │
│   📍     │         [pins, clusters, viewport persisted]           │
│   Map    │                                                        │
│   🔔     │                                                        │
│   Alerts │                                                        │
│   👤     │                                                        │
│   Profile│                    ┌──────────────────────┐             │
│   ⚙️     │                    │    RIGHT MODAL        │             │
│   Admin* │                    │  (section-aware panel)│             │
│          │                    │  feed / profile /     │             │
│          │                    │  alerts / admin /     │             │
│          │                    │  report-detail        │             │
│          │                    └──────────────────────┘             │
└─────────────────────────────────────────────────────────────────────┘
* Admin tab visible only to municipal_admin and provincial_superadmin
```

### 3.2 Navigation Rail (Left)

Width: **64px** collapsed, **200px** expanded on hover. Contains:
- Logo (top)
- Feed — opens feed panel in right modal
- Map — centers viewport on user's municipality (no modal)
- Alerts — opens alerts panel in right modal
- Profile — opens profile panel in right modal
- Admin — opens admin dashboard in right modal (role-gated)
- Contacts — opens contacts panel in right modal (admin only)
- Settings (bottom)

### 3.3 Right Modal Sections

| Section | Trigger | Content |
|---|---|---|
| `feed` | Nav Rail → Feed | Paginated report stream, filters, sort |
| `report-detail` | Click pin or feed card | Full report detail, action buttons, activity timeline |
| `profile` | Nav Rail → Profile | Account info, preferences, report tracker |
| `alerts` | Nav Rail → Alerts | Announcement list, create form (admin) |
| `admin` | Nav Rail → Admin | Triage queue, analytics, contacts |
| `contacts` | Nav Rail → Contacts | Contact directory CRUD (admin) |
| `announcement-create` | Alerts → New | Announcement form with scope selector |

### 3.4 Map Interactions

- **Pin click** → opens `report-detail` in right modal; map viewport unchanged
- **Cluster click** → zoom in or show cluster-busting fly-to
- **Filter change** → markers update without map remount
- **Viewport change** → stored in `MapContext`; restored on modal close
- **"Center on my location"** → fly to user coordinates; no modal, no state reset

---

## 4. Mobile Information Architecture

### 4.1 Bottom Tab Navigation

```
┌─────────────────────────────────────────────────────────────────┐
│                        STATUS BAR                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│                     CONTENT AREA                                │
│              (Feed / Map / Alerts / Profile)                    │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  [Feed]      [Map]      [Alerts]      [Profile]                 │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Tab Definitions

**Feed Tab:**
- Paginated report stream (newest first by default)
- Pull-to-refresh
- FAB for new report (+)
- Each card: type icon, category, severity badge, municipality, time, truncated description, media thumbnail

**Map Tab:**
- Full-bleed Leaflet map
- Floating filter chips at top (type, severity, status)
- Current location button (bottom right)
- FAB for new report (+)

**Alerts Tab:**
- Chronological announcement feed
- Scope badge (municipality vs. province)
- Unread indicator
- Create button (admin only)

**Profile Tab:**
- Avatar, name, email, role badge
- Report tracker (active + recent)
- Preferences (notifications on/off, municipality)
- Sign out

### 4.3 Report Submission Flow (Mobile)

```
Step 1: Type Selection  →  Step 2: Location  →  Step 3: Details  →  Step 4: Media  →  Submit
 (emergency type)        (map pin or auto)    (category, severity,    (camera/gallery)
                                                  description)
```
- Step 2 auto-detects location; user can drag pin to adjust
- Media is optional; max 3 images; compressed to 1024px before upload
- Progress indicator during upload
- Success → navigate to report tracker with new report at top

---

## 5. Domain Model

### 5.1 Entities

**User**
```
uid: string
email: string
displayName: string
role: 'citizen' | 'municipal_admin' | 'provincial_superadmin'
municipality: MunicipalityCode | null   # null for provincial_superadmin
barangay: string | null
createdAt: Timestamp
notificationPreferences: {
  pushEnabled: boolean
  municipalityAlerts: boolean
  provinceAlerts: boolean
}
```

**Report**
```
id: string
type: ReportType          # 'flood' | 'landslide' | 'fire' | 'earthquake' | 'medical' | 'crime' | 'infrastructure' | 'other'
category: ReportCategory  # e.g., 'water_level', 'fire_size', 'injuries_reported'
severity: SeverityLevel    # 'low' | 'medium' | 'high' | 'critical'
status: WorkflowStatus     # internal workflow state
publicStatus: PublicStatusLabel  # citizen-facing label mapped from status

description: string        # sanitized, max 1000 chars
location: {
  lat: number
  lng: number
  barangay: string
  municipality: MunicipalityCode
  address?: string
}

mediaUrls: string[]        # max 3, stored in Firebase Storage
mediaThumbnails: string[]
mediaUploadStatus: 'pending' | 'uploading' | 'complete' | 'failed'  # upload state tracker

submitterUid: string
submitterName: string
submitterAnonymous: boolean

assignedMunicipality: MunicipalityCode  # always present, used for scoping

createdAt: Timestamp
updatedAt: Timestamp

# Admin-only fields (null for citizens)
verifiedBy: string | null
verifiedAt: Timestamp | null
rejectedBy: string | null
rejectedAt: Timestamp | null
rejectedReason: string | null
dispatchedTo: DispatchedTarget | null
acknowledgedBy: string | null
acknowledgedAt: Timestamp | null
inProgressBy: string | null
inProgressAt: Timestamp | null
resolvedBy: string | null
resolvedAt: Timestamp | null
resolvedNotes: string | null
```

**DispatchedTarget** *(snapshot stored on Report at `dispatchedTo` — immutable after routing)*
```
contactId: string
agencyName: string
contactPerson: string
phone: string
type: ContactType    # 'barangay' | 'municipal' | 'provincial' | 'ngo' | 'media' | 'other'
municipality: MunicipalityCode
dispatchedAt: Timestamp
dispatchedBy: string  # uid of admin who performed the dispatch
```

**Activity (subcollection on Report)**
```
id: string
reportId: string
actorUid: string
actorRole: Role
actorMunicipality: MunicipalityCode | null
action: ActivityAction   # 'submitted' | 'verified' | 'rejected' | 'auto_rejected' | 'dispatched' | 'acknowledged' | 'in_progress' | 'resolved' | 'routed' | 'commented'
previousState: WorkflowStatus | null
newState: WorkflowStatus | null
notes: string | null
createdAt: Timestamp
```

**Contact**
```
id: string
municipality: MunicipalityCode
agencyName: string
contactPerson: string
phone: string
email: string | null
type: 'barangay' | 'municipal' | 'provincial' | 'ngo' | 'media' | 'other'
active: boolean
createdBy: string
createdAt: Timestamp
updatedAt: Timestamp
```

**Announcement**
```
id: string
title: string
body: string              # sanitized, max 2000 chars
scope: 'municipality' | 'multi_municipality' | 'province'
targetMunicipalities: MunicipalityCode[]  # empty for province-wide
severity: 'info' | 'warning' | 'critical'
creatorUid: string
creatorRole: Role
creatorMunicipality: MunicipalityCode | null
createdAt: Timestamp
publishedAt: Timestamp | null
expiresAt: Timestamp | null
active: boolean
```

**Notification (subcollection on Announcement)**
```
id: string
announcementId: string
userUid: string
municipality: MunicipalityCode | null  # null = province-wide
channel: 'push' | 'in_app'
status: 'sent' | 'delivered' | 'failed' | 'read'
sentAt: Timestamp
deliveredAt: Timestamp | null
readAt: Timestamp | null
error: string | null
```

**AuditLog (top-level collection, append-only)**
```
id: string
actorUid: string
actorRole: Role
actorMunicipality: MunicipalityCode | null
action: AuditAction      # 'report_state_change' | 'announcement_created' | 'announcement_sent' | 'contact_modified' | 'user_role_changed'
resourceType: 'report' | 'announcement' | 'contact' | 'user'
resourceId: string
municipalityScope: MunicipalityCode | 'province' | null
payload: Record<string, any>   # snapshot of before/after
ipAddress: string | null
userAgent: string | null
createdAt: Timestamp
```

### 5.2 Status Mapping (Internal → Public)

| Internal `status` | Public `publicStatus` Label |
|---|---|
| `pending` | "Pending Review" |
| `verified` | "Verified" |
| `rejected` | "Rejected" |
| `dispatched` | "Responder Dispatched" |
| `acknowledged` | "Responder En Route" |
| `in_progress` | "Situation Being Addressed" |
| `resolved` | "Resolved" |

---

## 6. Firestore Schema Proposal

### 6.1 Top-Level Collections

```
users/{uid}
reports/{reportId}
reports/{reportId}/activity/{activityId}
contacts/{contactId}
announcements/{announcementId}
announcements/{announcementId}/notifications/{notificationId}
audit/{auditId}
analytics/municipality/{muniCode}/daily/{dateDoc}
analytics/municipality/{muniCode}/weekly/{weekDoc}
analytics/province/daily/{dateDoc}
analytics/province/weekly/{weekDoc}
```

> **Note:** `analytics` documents are written exclusively by scheduled Cloud Functions and are not writable by clients. The `muniCode` path segment is the municipality code (e.g., `basud`, `daet`). The `dateDoc` and `weekDoc` path segments are ISO-date strings (e.g., `2026-04-01`)

### 6.2 Collection Rules Summary

**`users/{uid}`**
- Read: own doc, or municipal_admin can read users in same municipality, or provincial_superadmin can read all
- Write: own doc (limited fields), only provincial_superadmin can write role/municipality fields

**`reports/{reportId}`**
- Read: public fields always readable; admin fields only if requester role permits + municipality matches
- Create: authenticated users (citizen or admin)
- Update: municipal_admin (own municipality only), provincial_superadmin (any)
- Delete: provincial_superadmin only

**`reports/{reportId}/activity/{activityId}`**
- Read: same municipality scope as parent report
- Create: system or admin only (no direct client writes)

**`contacts/{contactId}`**
- Read: municipal_admin (own municipality), provincial_superadmin (all)
- Write: municipal_admin (own municipality), provincial_superadmin (all)

**`announcements/{announcementId}`**
- Read: visible if — (scope == 'province') OR (scope == 'municipality' AND user's municipality == targetMunicipalities[0]) OR (scope == 'multi_municipality' AND user's municipality IN targetMunicipalities). Citizens only see `active == true`. Admins see all active/draft.
- Create: municipal_admin (own municipality only), provincial_superadmin (any scope)
- Update/delete: creator or provincial_superadmin

**`announcements/{announcementId}/notifications/{notificationId}`**
- Read: creator or provincial_superadmin only
- Write: system only (Cloud Function writes)

**`audit/{auditId}`**
- Read: municipal_admin (own municipality), provincial_superadmin (all)
- Write: system only (Cloud Function)

**`analytics/municipality/{muniCode}/daily/{dateDoc}`**
- Read: municipal_admin (own municipality), provincial_superadmin (all)
- Write: system only (Cloud Function `analyticsAggregator`)

**`analytics/municipality/{muniCode}/weekly/{weekDoc}`**
- Read/Write: same as daily

**`analytics/province/daily/{dateDoc}`**
- Read: provincial_superadmin only
- Write: system only (Cloud Function `analyticsAggregator`)

---

## 7. Workflow / State Machine Design

### 7.1 Report State Machine

```
                    ┌──────────────┐
                    │   pending    │  ← Initial state on submit
                    └──────┬───────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
        ┌──────────┐  ┌──────────┐  (auto-reject after 72h —
        │ verified │  │ rejected │   see §7.3)
        └────┬─────┘  └──────────┘
             │
             ▼
        ┌───────────┐
        │dispatched│  (contact assigned, responder notified)
        │ "Responder Dispatched"
        └─────┬─────┘
              │
              ▼
        ┌──────────────┐
        │acknowledged │  (responder confirms receipt)
        │ "Responder En Route"
        └──────┬───────┘
               │
               ▼
        ┌─────────────┐
        │ in_progress │  (responder is on scene / acting)
        │"Situation Being Addressed"
        └──────┬──────┘
               │
               ▼
        ┌──────────┐
        │ resolved │  ← Terminal state
        │ "Resolved"
        └──────────┘
```

### 7.2 Valid State Transitions

| From | To | Who Can Invoke |
|---|---|---|
| `pending` | `verified` | municipal_admin (same municipality), provincial_superadmin |
| `pending` | `rejected` | municipal_admin (same municipality), provincial_superadmin |
| `verified` | `dispatched` | municipal_admin (same municipality), provincial_superadmin |
| `dispatched` | `acknowledged` | municipal_admin (same municipality), provincial_superadmin |
| `acknowledged` | `in_progress` | municipal_admin (same municipality), provincial_superadmin |
| `in_progress` | `resolved` | municipal_admin (same municipality), provincial_superadmin |

**Invalid transitions are blocked by Cloud Function validation — never by UI alone.**

### 7.3 Auto-Reject Scheduled Function

A **daily scheduled Cloud Function** (`pendingReportAutoReject`) runs at 03:00 PHT:

```
Hourly cron (60-minute window for robustness)
For each report where:
  - status == 'pending'
  - createdAt < (now - 72 hours)
Do (in a batched transaction):
  1. Set status = 'rejected'
  2. Set rejectedBy = null              # system actor, not an admin
  3. Set rejectedAt = Timestamp.now()
  4. Set rejectedReason = 'Auto-rejected: no admin action within 72 hours'
  5. Append Activity doc with action='auto_rejected', actorUid='SYSTEM', actorRole='system'
```

- The `actorUid = 'SYSTEM'` sentinel distinguishes auto-rejections from human admin actions in the audit trail.
- The batch size is limited to 100 reports per function invocation to avoid execution timeouts.
- `provincial_superadmin` reports are excluded — only `pending` reports submitted by citizens or admins within a specific municipality are eligible.
- If the report is already transitioning (a human admin picks it up at hour 71), the transaction detects the stale state and aborts the auto-reject for that document.

### 7.4 Activity Logging

Every transition appends an `Activity` document to `reports/{reportId}/activity/`:
- actorUid, actorRole, action, previousState, newState, notes, timestamp
- This is append-only; parent report document does NOT accumulate history arrays.

### 7.5 Routing

When transitioning to `dispatched`:
1. Admin selects a `Contact` from the contacts directory
2. System stores a **snapshot** of the contact (not a reference) on the report: `{ contactId, agencyName, phone, type, municipality }`
3. This ensures routing history remains accurate even if the contact is later edited or deleted

### 7.6 Announcement State Machine

```
draft → published → expired
              ↓
         [delivery to push + in-app]
```

**Transitions:**

| From | To | Trigger | Who Can Invoke |
|---|---|---|---|
| `draft` | `published` | Admin clicks Publish | creator (municipal_admin or provincial_superadmin) |
| `published` | `expired` | Cloud Function checks `expiresAt` ≤ now | system (`announcementExpiry` function) |

**Transition rules:**
- `draft`: announcement is saved but not visible to citizens. Can be edited freely until published.
- `published`: visible in the Alerts tab to all qualifying users. **Can NOT be edited after publish** — only `provincial_superadmin` can unpublish (revert to draft) or delete. This prevents mid-incident message drift.
- `expired`: automatically transitioned by `announcementExpiry` scheduled function running every 15 minutes. Documents remain readable but are marked `active: false`.
- `draft` can be deleted by creator or `provincial_superadmin` at any time.
- Published announcements with no `expiresAt` remain active indefinitely until manually unpublished by `provincial_superadmin`.

**Multi-municipality visibility for citizens:**
- Citizens see `multi_municipality` announcements if their `user.municipality` is present in `announcement.targetMunicipalities`.
- Citizens see `province` announcements regardless of municipality.
- Citizens see `municipality` announcements only if their `user.municipality` matches `targetMunicipalities[0]`.

---

## 8. Permissions and Municipality Scoping Model

### 8.1 Role Definitions

| Role | Municipality Scope | Report Access | Contact Access | Announcement Scope | Audit Access |
|---|---|---|---|---|---|
| `citizen` | N/A | Own reports + all public reports (province-wide feed) | None | Receive municipality + province-wide alerts | None |
| `municipal_admin` | Single assigned | Own municipality reports (all statuses) | Own municipality only | Own municipality only | Own municipality only |
| `provincial_superadmin` | All | All reports (all statuses) | All | Any scope | All |

> **Citizen report visibility:** "public reports" means all submitted reports regardless of which municipality they belong to, with `publicStatus` shown (not internal `status`). Citizens never see admin-only fields (`verifiedBy`, `rejectedReason`, `dispatchedTo`, etc.).

### 8.2 Firestore Security Rules — Municipality Enforcement

All `municipal_admin` operations MUST include:

```
match /reports/{reportId} {
  allow read, update: if isAuthenticated()
    && (resource.data.assignedMunicipality == request.auth.token.municipality
        || request.auth.token.role == 'provincial_superadmin');
}
```

**Every single document-level rule must include the municipality check.** There are no exceptions — scope enforcement is not optional.

### 8.3 Announcement Scope Enforcement

Firestore rules (pseudo-code, `request.resource.data` is the incoming document):

```
allow create: if isAuthenticated()
  && (
    (request.auth.token.role == 'municipal_admin'
      && request.resource.data.scope == 'municipality'
      && request.resource.data.targetMunicipalities[0] == request.auth.token.municipality)
    || (request.auth.token.role == 'provincial_superadmin')
  );
```

### 8.4 Server-Side Scope Validation (Cloud Function Gate)

All Cloud Functions that read reports must:
1. Decode `request.auth.token.municipality` and `request.auth.token.role`
2. If role is `municipal_admin`, add `.where('assignedMunicipality', '==', token.municipality)` to the query
3. If role is `citizen`, add `.where('submitterUid', '==', uid)` for their own reports
4. If role is `provincial_superadmin`, no additional scope filter

This validation exists in **addition to** Firestore rules — defense in depth.

### 8.5 Pushing Notifications

- Topic naming: `municipality_{code}` for municipality-level, `province_wide` for provincial
- `municipal_admin` can only publish to their `municipality_{code}` topic
- `provincial_superadmin` can publish to any topic
- Client subscribes to both its municipality topic and `province_wide`

---

## 9. Security Design

### 9.1 Authentication
- Firebase Auth (email/password)
- Custom claims set on user record: `role`, `municipality`
- Claims are set/updated only by a privileged Cloud Function (not client)
- Session persistence: long-lived on mobile, session on shared desktop

### 9.2 Authorization Layers

| Layer | Mechanism | What It Enforces |
|---|---|---|
| Firestore rules | Document-level | Read/write permission by role + municipality |
| Cloud Functions | Application logic | Valid state transitions, scope enforcement, payload validation |
| Storage rules | Path + MIME + size | Only uploads within authenticated user path |
| Client routing | React Router + RoleGate | UI element visibility by role |
| Zod validators | Payload validation | All write payloads validated before submission |

### 9.3 Content Sanitization
- All user-generated text fields (description, title, body) sanitized with DOMPurify before storage
- Rendered text is always sanitized — never trust stored HTML
- Media filenames are sanitized; actual file content validated by Storage rules

### 9.4 Upload Security
- Path pattern: `media/{userId}/{reportId}/{uuid}.{ext}`
- Allowed MIME: image/jpeg, image/png, image/webp, video/mp4
- Max file size: 5MB per file, 10MB total per report
- Client-side pre-upload: type check + size check
- Server-side (Storage rules): MIME match, size cap, path ownership

### 9.5 Input Validation (Zod Schemas)

Every service method that writes to Firestore validates its input:
- `createReport`: type enum, category enum, severity enum, coordinates bounds, description length, media count
- `updateReportStatus`: valid state transition per state machine
- `createAnnouncement`: scope consistency (municipal_admin cannot create province-wide), title length, body length
- `createContact`: required fields, phone format

---

## 10. Performance and Robustness Strategy

### 10.1 Realtime Listeners — Scoping Rules

**Allowed:**
- My reports (citizen): `where('submitterUid', '==', uid).limit(20)`
- Municipal feed (admin): `where('assignedMunicipality', '==', myMuni).limit(50)`
- Province-wide alerts (all): `where('scope', 'in', ['province', 'myMuni']).limit(30)`

**Forbidden:**
- Province-wide report listener
- All reports without pagination
- Broad listeners on admin-only collections from citizen clients

### 10.2 Map Performance

- **Marker clustering** kicks in when > 50 visible pins (React-Leaflet marker cluster)
- **Viewport-based culling:** only query reports within map bounds + 1km buffer. **Implementation:** use `geofirestore` library (GeoFirestore) to attach geo-queries to Firestore — this translates bounding-box queries into efficient Firestore `where('geohash', '>=', '...').where('geohash', '<=', '...')` queries. Falls back to client-side filtering if geohash index is not yet created.
- **Debounced viewport changes:** 300ms debounce before re-querying
- **Marker data shape:** only `{ id, lat, lng, type, severity, status }` — never load full report for a pin
- **Modal does not touch map:** guaranteed by architecture (see Section 2)

### 10.3 Feed Performance

- **Pagination:** 20 items per page, cursor-based (`createdAt` descending)
- **No full history in memory:** `useReports` hook manages pagination state
- **Stale-while-revalidate:** show cached feed immediately, refresh in background

### 10.4 Image Compression

- Client-side: Canvas API compresses to 1024px max dimension, 0.7 JPEG quality before upload
- Thumbnail: 256px max dimension for feed cards
- Full resolution: preserved in Storage for admin detail view

### 10.5 Offline / Reconnect Strategy

- **Firestore offline persistence:** enabled on mobile
- **Report submission offline:** writes go to IndexedDB queue, auto-retry on reconnect
- **Optimistic UI:** local state updated immediately; rolled back on failure with toast
- **Reconnect detection:** `useEffect` on `navigator.onLine` + Firestore `enableIndexedDbPersistence`

### 10.6 Robustness

- **Idempotent Cloud Functions:** report state transitions use `runTransaction` to prevent race conditions
- **Failed side-effects:** if FCM push fails, notification doc is marked `failed`; retry scheduled
- **Missing media:** reports render without media thumbnails if Storage URL is broken
- **Malformed docs:** all reads use `try/catch` with fallback empty states
- **Audit on critical actions:** all state changes, announcement sends, and role changes are audit-logged

### 10.7 Analytics — Pre-Aggregation

- Scheduled Cloud Function (daily at 02:00 PHT) computes:
  - `analytics/municipality/{muniCode}/daily` — report counts by type, severity, status
  - `analytics/municipality/{muniCode}/weekly`
  - `analytics/province/daily`
- These are **incremental** — only yesterday's new data is added
- Analytics screens read pre-aggregated docs, never scan raw reports

---

## 11. SEO Strategy for Public Surfaces

### 11.1 Public vs. Admin Route Separation

Public routes (indexed):
- `/` — landing/map overview (if public report viewing is enabled)
- `/report/:id` — public report detail (no admin fields)

**No-index routes (configured in React Router + meta tags):**
- All `/admin/*` routes
- `/profile/*`
- `/alerts/*`
- `/auth/*`
- Any route behind authentication

### 11.2 Public Route Requirements

Each public page must have:
```html
<title>Bantayog Alert | [Page-specific title]</title>
<meta name="description" content="[Relevant description]">
<link rel="canonical" href="[canonical URL]">
<meta property="og:title" content="[Social title]">
<meta property="og:description" content="[Social description]">
<meta property="og:type" content="website">
```

### 11.3 sitemap.xml and robots.txt

- `sitemap.xml` includes only public routes
- `robots.txt` disallows: `/admin/`, `/profile/`, `/alerts/`, `/auth/`
- Sitemap auto-generated at build time

---

## 12. Testing Strategy

### 12.1 Unit Tests (Vitest + React Testing Library)

**Scope:** Pure functions, hooks, validators, state machine logic, formatters.

Priority areas:
- `reportWorkflow.ts` — all valid and invalid state transitions
- `firestore.rules` — permission matrix test cases
- `sanitize.ts` — XSS prevention
- `validators.ts` — all Zod schemas, boundary conditions
- `constants.ts` — municipality list completeness
- Role-gating logic in contexts

### 12.2 Integration Tests (Vitest + Testing Library + Firebase Emulator)

**Scope:** Service layer → Firestore.

Priority areas:
- Report submission end-to-end
- State transitions via service layer
- Announcement creation + delivery log
- Municipality scoping queries
- Contact CRUD with scope enforcement

### 12.3 E2E Tests (Playwright)

**Scope:** Full user journeys in real browser.

Critical paths:
- Citizen: sign up → submit report → view in feed → receive alert
- Municipal admin: sign in → verify report → route to contact → dispatch → resolve
- Provincial superadmin: view all municipalities → send province-wide alert
- Desktop: open feed modal → click map pin → verify modal changes but map stays mounted
- Mobile: switch tabs → open map → submit report → verify report in tracker
- Map persistence: open right modal → close → verify map viewport unchanged

### 12.4 Permission / Scope Tests

Explicit test suites proving:
- `municipal_admin` cannot read/write reports outside assigned municipality
- `municipal_admin` cannot create province-wide announcements
- `provincial_superadmin` can access all municipalities
- `citizen` cannot access admin fields on report documents
- Scope filters on queries return correct result sets

### 12.5 Push Notification Tests

- Simulator test: announcement created → correct topic message published
- Delivery log completeness: every target user has a Notification doc (sent or failed)
- Scope correctness: municipal admin announcement reaches only municipality subscribers

### 12.6 Regression Tests — Map Persistence

Playwright test:
1. Open desktop
2. Pan/zoom map to specific viewport
3. Open feed modal
4. Close feed modal
5. Assert: map viewport coordinates unchanged (±0.001 precision)
6. Assert: Leaflet instance is the same object (not re-initialized)

---

## 13. Quality Scorecard

| Category | Weight | Score | Evidence |
|---|---|---|---|
| **Performance** | **25** | **/** | |
| Mobile Lighthouse Performance ≥ 85 on public route | 8 | — | Not yet measured |
| Desktop Lighthouse Performance ≥ 95 on public route | 4 | — | Not yet measured |
| LCP on main public route ≤ 2.5s | 4 | — | Not yet measured |
| CLS on main public route ≤ 0.1 | 2 | — | Not yet measured |
| Desktop map stays mounted on modal open/close | 4 | — | Architecture guarantees this (see §2) |
| Feed and map subscriptions are scoped and paginated | 3 | — | Architecture guarantees this (see §10.1) |
| **Performance Subtotal** | **25** | **TBD** | |
| **Security** | **25** | **/** | |
| Zero critical security flaws | 8 | — | Not yet audited |
| Zero high-severity auth/data-leak flaws | 5 | — | Not yet audited |
| 100% pass on role, rules, and RBAC tests | 6 | — | Not yet tested |
| Municipality scoping enforced server-side for municipal_admin | 3 | — | Rules + Cloud Function gate (see §8) |
| Upload validation, sanitization, admin data protection | 3 | — | Storage rules + DOMPurify + Zod (see §9) |
| **Security Subtotal** | **25** | **TBD** | |
| **Design** | **20** | **/** | |
| Desktop usable at 1280px+, map context preserved | 5 | — | Not yet implemented |
| Mobile usable at 360px | 5 | — | Not yet implemented |
| Accessibility score ≥ 95 on key flows | 4 | — | Not yet audited |
| Right modal consistent across all sections | 3 | — | ModalContext enforces (see §2) |
| No overflow, clipping, broken states in tested layouts | 3 | — | Not yet tested |
| **Design Subtotal** | **20** | **TBD** | |
| **SEO** | **10** | **/** | |
| Lighthouse SEO ≥ 90 on public routes | 4 | — | Not yet implemented |
| Public pages have correct title, meta, canonical, social | 3 | — | Spec defined (see §11) |
| sitemap and robots rules correct | 2 | — | Spec defined (see §11) |
| Admin/private surfaces excluded from indexing | 1 | — | Spec defined (see §11) |
| **SEO Subtotal** | **10** | **TBD** | |
| **Overall Quality** | **20** | **/** | |
| 100% pass on required unit, integration, E2E suites | 7 | — | Not yet implemented |
| No blocker bugs in core workflows | 5 | — | Not yet tested |
| No uncaught console errors in primary journeys | 3 | — | Not yet tested |
| Observability, audit logging, failure handling in place | 3 | — | Audit + error handling spec defined (see §9, §10) |
| Core documentation sufficient for another engineer | 2 | — | This SPEC + CLAUDE.md |
| **Overall Quality Subtotal** | **20** | **TBD** | |
| **TOTAL** | **100** | **TBD / 100** | |

**Release gate:** 90/100 minimum. Performance ≥ 20/25. Security ≥ 23/25. Design ≥ 16/20. SEO ≥ 8/10. Overall Quality ≥ 17/20.

**Automatic blockers (pre-implementation):**
- Any broken municipality-scope rule → must fix before PR merge
- Any broken provincial_superadmin permission path → must fix before PR merge
- Any map reset or remount caused by right-modal navigation → must fix before PR merge
- Any critical security flaw → must fix before PR merge

---

## 14. Phased Delivery Plan

### Phase 1: Foundation (Weeks 1–3)
**Goal:** Project scaffold, tooling, auth, Firestore schema, basic shell

Deliverables:
- Vite + React 18 + Tailwind + TypeScript project
- Firebase project setup (Auth, Firestore, Storage) + Firebase Emulator Suite configured
- Firestore security rules (initial)
- AuthContext with role loading and custom claims
- Basic DesktopShell (NavRail, MapCanvas placeholder, RightModal placeholder)
- Basic MobileShell (BottomTab, placeholder screens)
- Auth screens (SignIn)
- Zod validators for auth payloads
- **Playwright configured** with base test files + CI configuration (pre-requisite for all later E2E tests)
- Vitest configured with base test utilities

### Phase 2: Auth & Role Model (Weeks 4–5)
**Goal:** Complete auth flows, role enforcement, municipality scoping basics

Deliverables:
- Sign-up, sign-in, sign-out flows
- RoleGate component and ProtectedRoute
- Firebase Auth custom claims set via privileged Cloud Function
- Initial Firestore rules covering user, report read
- Project documentation: auth flow diagram

### Phase 3: Reporting Domain (Weeks 6–8)
**Goal:** Report submission, media uploads, basic feed

Deliverables:
- ReportForm (desktop modal + mobile flow)
- Image compression + Storage upload
- Firestore report document creation
- Public feed (paginated, scoped by municipality)
- FeedCard, FeedList components
- Report service layer with Zod validation
- Report submission E2E tests
- Unit tests for reportWorkflow state machine

### Phase 4: Desktop Map + Modal Architecture (Weeks 9–11)
**Goal:** Full Leaflet integration, marker management, right-modal reuse

Deliverables:
- MapCanvas with React-Leaflet
- ReportMarker + MarkerCluster
- MapContext (viewport persistence)
- ModalContext (section-aware right modal)
- Feed panel in right modal
- Report-detail panel in right modal
- Map viewport persistence test (E2E)
- Filter state → marker update without map remount

### Phase 5: Mobile Shell + Navigation (Weeks 12–13)
**Goal:** Complete mobile layout, tab navigation, mobile-specific report flow

Deliverables:
- Full BottomTab implementation
- Mobile Feed tab
- Mobile Map tab
- Mobile Alerts tab
- Mobile Profile tab
- Mobile report submission flow
- Mobile viewport and layout testing (360px)
- PWA manifest and service worker (basic)

### Phase 6: Admin Triage + Workflow (Weeks 14–16)
**Goal:** Admin verification, routing, state transitions, activity logging

Deliverables:
- TriagePanel (verify/reject/route)
- RoutingPanel with contact selection
- State transition Cloud Functions with runTransaction
- Activity subcollection logging
- Admin feed view (municipality-scoped)
- Routing history in report detail
- Workflow E2E tests (verify → route → dispatch → resolve)
- Permission tests (municipal_admin scope)

### Phase 7: Contacts Directory (Week 17)
**Goal:** Contact CRUD, routing snapshots

Deliverables:
- ContactService (CRUD)
- ContactList, ContactForm components
- Admin-only contacts panel
- Contact snapshot on report routing
- Contacts integration tests

### Phase 8: Announcements + Push Notifications (Weeks 18–20)
**Goal:** Announcement creation, FCM integration, delivery logs, Alerts tab

Deliverables:
- AnnouncementService (create, publish)
- AnnouncementForm with scope selector
- FCM Cloud Function (fan-out to topic)
- Notification subcollection writing
- AlertCard, AlertList, AlertDetail
- Mobile Alerts tab (full)
- Desktop Alerts panel in right modal
- Notification delivery log tests
- Scope enforcement tests for announcements

### Phase 9: Profile + Report Tracker (Week 21)
**Goal:** Citizen-facing report history, preferences, notification settings

Deliverables:
- ProfileView (desktop + mobile)
- ReportTracker (active + recent)
- Notification preferences
- Profile integration tests

### Phase 10: Analytics + Disaster Mapping (Weeks 22–24)
**Goal:** Pre-aggregated analytics, admin dashboard

Deliverables:
- Scheduled analytics Cloud Function
- Municipality analytics panel
- Province analytics panel
- AnalyticsChart components
- Pre-aggregation tests

### Phase 11: PWA + Accessibility + Hardening (Weeks 25–26)
**Goal:** Offline support, accessibility audit, performance tuning, SEO

Deliverables:
- Full PWA (service worker, offline report queue)
- Accessibility audit and fixes (keyboard nav, ARIA, contrast)
- SEO: meta tags, sitemap, robots
- Performance optimization (clustering, viewport culling, debounce)
- Full E2E test suite
- Production Firebase security rules review

### Phase 12: Release Verification (Week 27)
**Goal:** Scorecard evaluation, bug fixes, release

Deliverables:
- Full test suite pass
- Scorecard evaluation against rubric
- Security audit
- Performance audit
- Penetration test (basic)
- Fix all release blockers
- Deploy to production

---

## Key Assumptions

1. **Firebase project already provisioned** — Auth, Firestore, Storage, Cloud Functions, Cloud Messaging, and Hosting are all under the same Firebase project.
2. **Municipality codes are stable** — All 12 municipalities in Camarines Norte have agreed-upon codes (e.g., `basud`, `daet`, `josenunez`, `labo`, `mercedes`, `paracale`, `sanlorenzo`, `sanvicente`, `talisay`, `vinzales`, `capalonga`, `jomalig`) used consistently in all data models.
3. **FCM is configured** — Firebase Cloud Messaging is set up and VAPID key is available for web push.
4. **Offline persistence is acceptable** — Firestore offline persistence is enabled; this is appropriate for a disaster context where connectivity may be intermittent.
5. **Map tiles are free-tier compatible** — OpenStreetMap tiles are used; no paid tile provider required for initial deployment.
6. **Single Firebase environment** — No separate dev/staging Firebase project is required for initial build; security rules differentiate environments.
7. **Users have one role at a time** — No multi-role users; role is singular on the auth token.
8. **Anonymous report submission is not required** — All report submitters must have an account; anonymous flags a report for follow-up rather than allowing unauthenticated submission.
9. **All 12 municipalities have reliable-enough internet for Firestore realtime** — If not, Phase 11 offline queue is critical.

---

## Biggest Risks

### R1: Municipality Scope Enforcement Gaps (Critical)
**Risk:** Developers bypass Firestore rules by writing Cloud Functions that don't enforce scope, or add direct client-side writes that skip rules.
**Mitigation:** Mandatory scope tests in CI; every PR requires passing scope-permission test suite before merge. Cloud Function code review checklist includes scope enforcement.

### R2: Map Remount Regression (Critical)
**Risk:** A future developer accidentally nests `<MapCanvas>` inside the modal or adds a key that forces remount.
**Mitigation:** E2E test for map persistence is in the required test suite. Architectural guard: MapContext is defined at DesktopShell level, outside the modal layer. This is documented in CLAUDE.md as a hard architectural rule.

### R3: Firestore Query Scope Creep (High)
**Risk:** As features grow, queries lose their `.where('municipality', '==', ...)` filter, creating province-wide listeners that burn through read quotas and violate scope.
**Mitigation:** Query builder utility (`buildScopedQuery`) always injects scope filter. Linting rule flags unbounded report queries. Monthly quota alert on Firestore.

### R4: Announcement Fan-Out Performance (High)
**Risk:** Province-wide announcement to all 12 municipalities + province topic creates a thundering herd on Firestore writes when writing Notification subdocs.
**Mitigation:** FCM topic message (single write) instead of individual notification docs per user for push. In-app notifications use a bounded query on the announcement doc, not per-user notification docs.

### R5: Image Upload Failures on Slow Connections (Medium)
**Risk:** Disaster scenario = slow/spotty internet; large compressed images fail upload, leaving report in broken state.
**Mitigation:** Chunked upload with resumability consideration; upload state stored in Firestore doc with `mediaUploadStatus` field; retry queue in service worker.

### R6: State Machine Integrity Under Concurrent Edits (Medium)
**Risk:** Two admins simultaneously process the same report (one verifies, one rejects) using optimistic UI.
**Mitigation:** All state transitions use Firestore `runTransaction` with optimistic locking. Invalid transitions (e.g., already dispatched) fail the transaction.

### R7: Accessibility Gaps at Release (Medium)
**Risk:** Keyboard navigation and screen reader support are deferred, leading to < 95 accessibility score.
**Mitigation:** Accessibility is Phase 11, not deferred further. WCAG 2.1 AA is the baseline. Automated axe-core tests in E2E suite.

---

## Recommended Implementation Order

1. **Phase 1 (Foundation)** — sets up tooling, Firebase, shell. Cannot start anything else without this.
2. **Phase 2 (Auth + Roles)** — auth is prerequisite for every other feature. Do before touching reports or admin features.
3. **Phase 3 (Reporting Domain)** — core citizen value proposition. First tangible feature users interact with.
4. **Phase 4 (Desktop Map + Modal)** — this is the hardest architectural challenge. Do while report domain is still fresh to have realistic test data. The map persistence guarantee must be proven before Phase 6.
5. **Phase 5 (Mobile Shell)** — depends on Phase 3 (report submission) and Phase 4 (modal pattern). Can be tested against the same report data.
6. **Phase 6 (Admin Triage)** — admin workflow is the second major value proposition. Needs Phase 3 (reports) and Phase 4 (modal) complete.
7. **Phase 7 (Contacts)** — relatively small domain. Can be done in parallel with Phase 6 if team capacity allows.
8. **Phase 8 (Announcements + Push)** — depends on Phase 2 (auth) for scope enforcement. Can begin after Phase 6 is stable.
9. **Phase 9 (Profile + Tracker)** — citizen-facing polish. Relatively independent.
10. **Phase 10 (Analytics)** — depends on Phases 3 and 6 producing real report data. Late in the roadmap for a reason.
11. **Phase 11 (PWA + A11y + Hardening)** — must not be rushed. Sets the release quality bar.
12. **Phase 12 (Release Verification)** — scorecard evaluation gates the release.

---

## Current Projected Score (Pre-Implementation)

| Category | Projected (Build to Target) | Notes |
|---|---|---|
| Performance | 22–25 / 25 | Map persistence is architecture-guaranteed; pagination and scoping spec'd in §10 |
| Security | 23–25 / 25 | Firestore rules + Cloud Function gating + Zod + DOMPurify spec'd; final score depends on audit |
| Design | 18–20 / 20 | Responsive spec'd; accessibility in Phase 11; modal reuse in §2 |
| SEO | 9–10 / 10 | Public/private separation spec'd; sitemap/robots defined |
| Overall Quality | 18–20 / 20 | Full test suite spec'd; documentation spec'd |
| **TOTAL** | **90–100 / 100** | **Target: 90+ to release** |

The projected range reflects that some scores (performance, security, design) are architecture-guaranteed through this spec and the CLAUDE.md guardrails, while others (zero security flaws, actual Lighthouse scores) require implementation and auditing. The **minimum 90/100 release gate is achievable** if every phase delivers on its spec and Phase 11 hardening is thorough.

---

*This specification is the implementation contract. Before writing code in any phase, engineers must read the relevant sections of this spec and the corresponding CLAUDE.md section. Architectural decisions in §2 (map/modal separation, context boundaries) are binding and must not be violated by subsequent implementation.*
