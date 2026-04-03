# Bantayog Alert — Stage 1: Technical Specification

---

## 1. Executive Summary

**Bantayog Alert** is a production-grade disaster reporting, official alerting, emergency coordination, and disaster-mapping platform purpose-built for the Province of Camarines Norte, Philippines. It serves three distinct user roles across 12 municipalities:

- **Citizens** submit emergency reports with structured metadata and media, track their reports through resolution, consume a real-time feed and map of verified incidents, and receive official alerts relevant to their municipality.
- **Municipal Admins** operate within a hard-scoped municipality boundary: they triage, verify, prioritize, route, and resolve reports; manage a local responder contacts directory; send municipality-scoped announcements with push delivery; and view scoped analytics and audit trails.
- **Provincial Superadmins** operate across all municipalities: they oversee all reports and triage operations, manage province-wide contacts, issue province-wide or multi-municipality announcements, and access full analytics, audit, and disaster-mapping data.

The platform delivers two distinct, optimized experiences:

| Surface                | Paradigm                   | Primary Canvas                                                                                                |
| ---------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------- |
| **Desktop (≥1280 px)** | Map-first command center   | Persistent Leaflet map with a left navigation rail and a reusable right-side workspace drawer                 |
| **Mobile (≤768 px)**   | Feed-first mini social app | Bottom-tab navigation with dedicated Feed, Map, Alerts, Profile tabs and a prominent report-submission action |

The architecture is anchored in Firebase (Auth, Firestore, Storage, Cloud Functions, FCM, Hosting) with a React 18 + Vite + Tailwind CSS frontend, Leaflet for cartography, and PWA capabilities for offline resilience and home-screen installation.

### Key non-negotiables enforced throughout this specification

1. Municipality scope is a **server-side security boundary** — not merely a UI filter.
2. Internal operational state is **separated from citizen-facing status labels** and data across three distinct document tiers.
3. The desktop map **never unmounts**, resets viewport, or refetches when the workspace drawer opens or closes.
4. Pre-aggregated data powers analytics dashboards — **clients never scan all raw reports**.
5. Append-only activity subcollections preserve **auditable history** for every report.
6. Newly submitted reports are **not publicly visible until verified**; only the reporting citizen can track their own pending reports immediately.
7. Public report data uses **approximate locations** by default; exact coordinates are restricted to private/admin collections.

### Product quality target

The implementation must meet the release gate:

- **90+/100 total**
- Performance ≥ 20/25
- Security ≥ 23/25
- Design ≥ 16/20
- SEO ≥ 8/10
- Overall Quality ≥ 17/20

---

## 2. Architecture Recommendation

### 2.1 Stack Confirmation

The specified stack is adopted without changes:

| Layer                    | Technology                            | Rationale                                                                |
| ------------------------ | ------------------------------------- | ------------------------------------------------------------------------ |
| UI Framework             | React 18                              | Concurrent features, stable ecosystem, strong testing support            |
| Build Tool               | Vite                                  | Fast HMR, native ESM, excellent DX                                       |
| Styling                  | Tailwind CSS                          | Utility-first, strong responsive primitives, small bundles with purging  |
| Authentication           | Firebase Auth                         | Email/password + Google OAuth, custom claims for RBAC                    |
| Database                 | Cloud Firestore                       | Real-time listeners, security rules, offline persistence, subcollections |
| File Storage             | Firebase Storage                      | Integrated with Auth, security rules on paths, CDN-backed                |
| Server Logic             | Firebase Cloud Functions v2 (Node.js) | Triggers, callables, scheduled jobs; co-located with Firestore           |
| Push Notifications       | Firebase Cloud Messaging              | Cross-platform, topic-based and token-based delivery                     |
| Hosting                  | Firebase Hosting                      | CDN, automatic SSL, SPA rewrites, preview channels                       |
| Mapping                  | Leaflet + React-Leaflet               | Open-source, lightweight, tile-provider agnostic                         |
| PWA                      | vite-plugin-pwa (Workbox)             | Service worker generation, precaching, offline fallback                  |
| Unit/Integration Testing | Vitest + React Testing Library        | Vite-native, fast, component-level testing                               |
| E2E Testing              | Playwright                            | Multi-browser, reliable, parallel execution                              |

**Supporting libraries** (not stack changes):

- **TypeScript** — strict type safety across client and functions
- **Zod** — shared schema validation across client and Cloud Functions
- **React Router v6** — client routing
- **react-helmet-async** — SEO metadata injection
- **React Query (TanStack Query)** — async data fetching, caching, and deduplication for Firestore reads
- **Zustand** — lightweight synchronous global state for UI concerns (drawer state, map viewport, active filters)
- **supercluster / react-leaflet-markercluster** — map marker clustering
- **browser-image-compression** — client-side image compression before upload
- **sharp** — server-side thumbnail generation in Cloud Functions
- **Firebase Emulator Suite** — local development and integration testing

### 2.2 High-Level Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                          CLIENT (React SPA)                         │
│                                                                      │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌─────────────────┐  │
│  │ Auth       │ │ Reports    │ │ Map        │ │ Desktop Shell   │  │
│  │ Domain     │ │ Domain     │ │ Domain     │ │ (NavRail + Map  │  │
│  │            │ │            │ │            │ │  + Workspace    │  │
│  │            │ │            │ │            │ │  Drawer)        │  │
│  ├────────────┤ ├────────────┤ ├────────────┤ ├─────────────────┤  │
│  │ Alerts     │ │ Feed       │ │ Profile    │ │ Mobile Shell    │  │
│  │ Domain     │ │ Domain     │ │ Domain     │ │ (Bottom Tabs +  │  │
│  │            │ │            │ │            │ │  Screens)       │  │
│  ├────────────┤ ├────────────┤ ├────────────┤ └─────────────────┘  │
│  │ Contacts   │ │ Analytics  │ │ Audit      │                      │
│  │ Domain     │ │ Domain     │ │ Domain     │                      │
│  └────────────┘ └────────────┘ └────────────┘                      │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                  Shared Infrastructure                       │   │
│  │  Firebase SDK │ React Query │ Zustand │ Custom Hooks         │   │
│  │  Zod Schemas  │ Leaflet    │ Service Worker │ Image Utils    │   │
│  └──────────────────────────────────────────────────────────────┘   │
└──────────────┬──────────────────────────────────────┬────────────────┘
               │ Firestore Listeners / Reads          │ HTTPS Callable
               │ Auth State                           │ FCM
               ▼                                      ▼
┌──────────────────────────────────────────────────────────────────────┐
│                        FIREBASE BACKEND                             │
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────────────┐   │
│  │ Firestore    │  │ Security     │  │ Cloud Functions         │   │
│  │              │  │ Rules        │  │                         │   │
│  │ reports      │  │              │  │ • submitReport          │   │
│  │ report_      │  │ Enforces:    │  │ • triageReport          │   │
│  │   private    │  │ • RBAC       │  │ • createAnnouncement    │   │
│  │ report_ops   │  │ • Muni scope │  │ • setUserRole           │   │
│  │ contacts     │  │ • Field      │  │ • onReportOpsWrite      │   │
│  │ announcements│  │   validation │  │   → sync public mirror  │   │
│  │ audit        │  │ • State      │  │   → update aggregates   │   │
│  │ analytics_*  │  │   transition │  │ • onImageUpload         │   │
│  │ users        │  │              │  │   → generate thumbnail  │   │
│  │ catalog_*    │  │              │  │ • scheduledAggregation   │   │
│  │              │  │              │  │ • onUserCreate           │   │
│  ├──────────────┤  └──────────────┘  └─────────────────────────┘   │
│  │ Storage      │                                                   │
│  │ /reports/    │  ┌──────────────┐  ┌─────────────────────────┐   │
│  │ /thumbnails/ │  │ Firebase     │  │ Firebase Hosting        │   │
│  │ /avatars/    │  │ Auth +       │  │ SPA + CDN + SSL         │   │
│  │              │  │ Custom Claims│  │ Cloud Function rewrites │   │
│  └──────────────┘  └──────────────┘  └─────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────┘
```

### 2.3 Key Architectural Decisions

| Decision                                                                  | Rationale                                                                                                                                                                                                                                                                                                   |
| ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Three-tier report split** (`reports` + `report_private` + `report_ops`) | Firestore has no field-level read restrictions. Three tiers cleanly separate public-facing data, owner-private data, and admin-operational data — each with distinct security rules.                                                                                                                        |
| **Custom claims for RBAC**                                                | Firebase Auth custom claims (`role`, `municipalityCode`) are verified in both Firestore rules and Cloud Functions. Cannot be set by clients.                                                                                                                                                                |
| **Append-only activity subcollections**                                   | `report_ops/{id}/activity` and `reports/{id}/activity` store state transitions and visible events as immutable documents. Full audit without polluting parent documents.                                                                                                                                    |
| **Pre-aggregated analytics**                                              | Scheduled and trigger-based Cloud Functions maintain analytics documents. Dashboards read aggregates, never scan raw reports.                                                                                                                                                                               |
| **Contact snapshots on routing**                                          | When a report is dispatched, the contact's details are snapshotted into the routing event. Later edits to the contact don't rewrite history.                                                                                                                                                                |
| **Map-as-stable-canvas**                                                  | The Leaflet `MapContainer` is mounted once in the React tree as a sibling to the workspace drawer, never as a child. Drawer state changes cannot trigger map re-renders.                                                                                                                                    |
| **React Query + Zustand**                                                 | React Query handles Firestore data caching and deduplication, preventing over-fetching. Zustand manages synchronous UI state (drawer open/close, active filters, selected marker) without prop drilling.                                                                                                    |
| **Pending reports hidden from public**                                    | Unverified reports are not shown publicly to prevent misinformation during disasters. Only the submitting citizen sees their pending report in Profile.                                                                                                                                                     |
| **Approximate public locations**                                          | Public report documents contain approximate lat/lng and geohash. Exact coordinates are restricted to `report_private` and `report_ops` for privacy.                                                                                                                                                         |
| **Static municipality GeoJSON**                                           | Municipality boundary polygons are bundled as static assets, not loaded from Firestore, avoiding unnecessary reads and enabling instant overlay rendering.                                                                                                                                                  |
| **Cloud Functions for all sensitive writes**                              | Report creation, triage, announcements, contacts CRUD, and role assignment all route through Cloud Functions for centralized validation, authorization, and audit logging. Low-risk self-scoped data (user preferences, FCM token registration) may use direct Firestore writes under tight security rules. |

### 2.4 Project Structure

```
bantayog-alert/
├── src/
│   ├── app/                        # App shell, routing, providers
│   │   ├── App.tsx
│   │   ├── router.tsx
│   │   ├── providers.tsx
│   │   ├── DesktopShell.tsx
│   │   └── MobileShell.tsx
│   ├── domains/
│   │   ├── auth/                   # Login, registration, claims, hooks
│   │   ├── reports/                # Submission, detail, tracking
│   │   ├── map/                    # Leaflet canvas, markers, clusters, filters
│   │   ├── feed/                   # Paginated feed, cards
│   │   ├── profile/                # User info, report tracker
│   │   ├── contacts/               # Contacts CRUD
│   │   ├── alerts/                 # Announcements, alerts tab
│   │   ├── analytics/              # Charts, dashboards
│   │   └── audit/                  # Audit log viewer
│   ├── shared/
│   │   ├── ui/                     # Reusable UI components
│   │   ├── lib/                    # Utilities, formatters, geo helpers
│   │   ├── hooks/                  # Shared custom hooks
│   │   └── contracts/              # TypeScript types, Zod schemas, enums
│   └── main.tsx
├── functions/                      # Cloud Functions
│   ├── src/
│   │   ├── reports/
│   │   ├── auth/
│   │   ├── announcements/
│   │   ├── contacts/
│   │   ├── analytics/
│   │   ├── media/
│   │   └── shared/                 # Shared validation, state machine
│   └── index.ts
├── firestore.rules
├── storage.rules
├── firestore.indexes.json
├── public/
│   ├── robots.txt
│   ├── sitemap.xml
│   └── data/
│       └── municipalities.geojson  # Static boundary data
├── tests/
│   ├── unit/
│   ├── integration/
│   ├── e2e/
│   └── rules/                     # Firestore security rules tests
├── firebase.json
├── vite.config.ts
├── tailwind.config.ts
├── playwright.config.ts
└── vitest.config.ts
```

---

## 3. Desktop Information Architecture

### 3.1 Layout Structure

```
┌──────┬────────────────────────────────────┬──────────────────────┐
│      │                                    │                      │
│  N   │                                    │    WORKSPACE         │
│  A   │        PERSISTENT MAP              │    DRAWER            │
│  V   │        (Leaflet Canvas)            │    (Right Side)      │
│      │                                    │                      │
│  R   │  ┌─────────────────────────┐       │  ┌────────────────┐  │
│  A   │  │ Filter Bar (floating)   │       │  │ Header + Close │  │
│  I   │  └─────────────────────────┘       │  ├────────────────┤  │
│  L   │                                    │  │                │  │
│      │        ● Report pins               │  │ Content Area   │  │
│  64  │        ● Cluster markers           │  │ (scrollable)   │  │
│  px  │        ● Municipality boundaries   │  │                │  │
│      │                                    │  │ Feed / Profile │  │
│      │  ┌────────────────┐                │  │ Alerts / Admin │  │
│      │  │ Map controls   │                │  │ Contacts /     │  │
│      │  │ (zoom, locate) │                │  │ Analytics /    │  │
│      │  └────────────────┘                │  │ Audit          │  │
│      │                                    │  │                │  │
│      │                                    │  └────────────────┘  │
└──────┴────────────────────────────────────┴──────────────────────┘
                                             ◄── 480px (default) ──►
```

### 3.2 Navigation Rail Items

| Icon | Label     | Route                  | Role Required | Opens                                   |
| ---- | --------- | ---------------------- | ------------- | --------------------------------------- |
| 🗺️   | Map       | `/app`                 | All           | Closes workspace, full map view         |
| 📋   | Feed      | `/app?panel=feed`      | All           | Workspace: paginated report feed        |
| 🔔   | Alerts    | `/app?panel=alerts`    | All           | Workspace: announcements list           |
| 👤   | Profile   | `/app?panel=profile`   | All           | Workspace: user info + report tracker   |
| ➕   | Report    | `/app?panel=submit`    | citizen       | Workspace: multi-step report form       |
| ─    | ─         | ─                      | ─             | ─                                       |
| 📊   | Dashboard | `/app?panel=dashboard` | Admin         | Workspace: admin triage queue + summary |
| 📇   | Contacts  | `/app?panel=contacts`  | Admin         | Workspace: contacts directory           |
| 📈   | Analytics | `/app?panel=analytics` | Admin         | Workspace: analytics views              |
| 📜   | Audit     | `/app?panel=audit`     | Admin         | Workspace: audit log                    |

### 3.3 Interaction Rules

1. **Workspace drawer** slides in from the right when any panel route parameter is active. The map remains fully visible, compressing to fill remaining width (`calc(100% - 480px)`).
2. **Closing the drawer** clears the panel parameter, returning to map-only view. Map state (viewport, selected markers, applied filters) is preserved.
3. **Clicking a report pin** on the map opens a **Report Detail Modal** (centered overlay), independent of the workspace drawer. Route: `/app?panel=feed&report=RPT123` or `/app?report=RPT123`.
4. **Clicking a report card** in any workspace list also opens the same Report Detail Modal.
5. The **Report Detail Modal** for admins includes triage actions (verify, reject, dispatch, etc.) directly in the modal.
6. **Filter bar** floats above the map and applies to both map pins and feed simultaneously. Filters: type, severity, municipality, date range, status.
7. **Map width** adjusts on drawer open/close. Leaflet's `invalidateSize()` is called on the CSS `transitionend` event after the drawer animation completes.
8. Opening the Report Detail Modal can coexist with the open workspace drawer.

### 3.4 Desktop Workspace Content Matrix

| Workspace Panel | Content                                                         | Key Actions                        |
| --------------- | --------------------------------------------------------------- | ---------------------------------- |
| Feed            | Paginated report cards, filter chips, sort options              | Click → Report Detail Modal        |
| Alerts          | Chronological announcement list, severity badges                | Click → Alert detail expandable    |
| Profile         | User info card, "My Reports" list with status badges            | Click → Report Detail Modal        |
| Submit Report   | Multi-step form: type → location → details → media → confirm    | Submit → success → map             |
| Dashboard       | Summary cards, pending queue, recent activity                   | Click report → Report Detail Modal |
| Contacts        | Searchable/filterable contact table, CRUD actions               | Add / Edit / Delete contacts       |
| Analytics       | Charts: reports by type, severity, time; heatmap overlay option | Date range selector, export        |
| Audit           | Paginated audit log table, filters by action/entity/user        | View details in expandable rows    |

### 3.5 Desktop Role-Based Views

| Role                  | Visible Nav Items                                         | Map Scope                                 | Workspace Panels                   |
| --------------------- | --------------------------------------------------------- | ----------------------------------------- | ---------------------------------- |
| citizen               | Map, Feed, Alerts, Profile, Report                        | All public (verified) reports             | Feed, Alerts, Profile, Submit      |
| municipal_admin       | All citizen items + Dashboard, Contacts, Analytics, Audit | All public + own municipality pending/ops | All panels, scoped to municipality |
| provincial_superadmin | All items                                                 | Province-wide, all states                 | All panels, province-wide scope    |

---

## 4. Mobile Information Architecture

### 4.1 Layout Structure

```
┌──────────────────────────┐
│      Status Bar          │
├──────────────────────────┤
│      App Header          │
│   "Bantayog Alert"  [≡]  │
├──────────────────────────┤
│                          │
│    ACTIVE TAB CONTENT    │
│                          │
│    (Feed / Map /         │
│     Alerts / Profile)    │
│                          │
│                          │
├──────────────────────────┤
│ Feed │ Map │  ＋  │ 🔔 │ 👤│
│      │     │Report│     │   │
└──────────────────────────┘
```

### 4.2 Bottom Tab Bar

| Tab | Icon | Label   | Content                                        |
| --- | ---- | ------- | ---------------------------------------------- |
| 1   | 📋   | Feed    | Scrollable report cards with pull-to-refresh   |
| 2   | 🗺️   | Map     | Full-screen Leaflet map with clustered pins    |
| 3   | ➕   | Report  | Multi-step submission flow (full-screen modal) |
| 4   | 🔔   | Alerts  | Official announcement list                     |
| 5   | 👤   | Profile | User info, My Reports tracker, settings        |

### 4.3 Mobile Interaction Rules

1. **Tab switching** replaces the main content area. The Map tab renders a full-screen Leaflet instance.
2. **Map tab** preserves viewport when switching tabs — implemented via CSS `display: none/block` toggling to avoid Leaflet remount.
3. **Report submission** opens as a full-screen modal overlay.
4. **Tapping a report card** in Feed navigates to a full-screen report detail view with a back button.
5. **Tapping a map pin** opens a bottom sheet with report summary; tapping "View Details" navigates to full-screen detail.
6. **Admin functions** on mobile are accessed through Profile tab → "Admin Panel" section, opening simplified triage, contacts, and dashboard views. Primary admin operations remain optimized for desktop.
7. **Pull-to-refresh** on Feed tab triggers a fresh query.
8. **Infinite scroll** loads additional pages as the user scrolls.

### 4.4 Mobile Screen Flow

```
Feed Tab                    Map Tab                   Profile Tab
  │                           │                          │
  ├─ Report Card ──► Report   ├─ Pin Tap ──► Bottom     ├─ My Reports
  │                  Detail   │              Sheet       │    │
  │                  (full    │                │         │    └─► Report Detail
  │                  screen)  │                ▼         │
  │                           │            Report Detail ├─ Admin Panel
  │                           │            (full screen) │    │
  Alerts Tab                  │                          │    ├─ Triage Queue
    │                         │                          │    ├─ Contacts
    ├─ Alert Detail           │                          │    ├─ Dashboard
    │   (expandable)          │                          │    └─ Analytics
                              │                          │
                              │                          ├─ Settings
                              │                          └─ Logout
```

### 4.5 Mobile Report Submission Flow

Fast multi-step wizard:

1. Incident type and category
2. Severity
3. Description (with character limit)
4. Location (current GPS or map pin drop + municipality/barangay selectors)
5. Media upload (with compression progress)
6. Review and submit

Mobile-specific requirements:

- Autosave draft to IndexedDB
- Upload progress indicators
- Retry on poor network
- Compress images before upload
- Accessible input labels and validation messages

---

## 5. Domain Model

### 5.1 Domain Boundaries

```
┌─────────────────────────────────────────────────────────────┐
│                        DOMAIN MAP                           │
│                                                              │
│  ┌──────────┐   ┌──────────────────────┐   ┌────────────┐  │
│  │  AUTH     │──►│  REPORTS              │──►│  MAP       │  │
│  │          │   │  ┌─────────────────┐  │   │(visualize  │  │
│  │ • Users  │   │  │ Public    Tier  │  │   │ reports)   │  │
│  │ • Roles  │   │  │ Private   Tier  │  │   └────────────┘  │
│  │ • Claims │   │  │ Ops       Tier  │  │        ▲          │
│  └──────────┘   │  └─────────────────┘  │        │          │
│       │         │  • Submit • Triage    │   ┌────┴─────┐    │
│       │         │  • Track  • State     │   │  FEED     │    │
│       │         └──────────────────────┘   │(list view)│    │
│       │              │          │           └──────────┘    │
│       │              ▼          ▼                            │
│       │         ┌──────────┐  ┌───────────┐                 │
│       │         │ CONTACTS │  │  AUDIT     │                │
│       │         │ • CRUD   │  │ • Immutable│                │
│       │         │ • Snap-  │  │   log      │                │
│       │         │   shots  │  └───────────┘                 │
│       │         └──────────┘                                │
│       ▼                        ┌──────────────┐             │
│  ┌──────────┐                  │  ALERTS      │             │
│  │ PROFILE  │                  │ • Announce-  │             │
│  │ • Info   │                  │   ments      │             │
│  │ • My     │                  │ • Push/FCM   │             │
│  │   Reports│                  │ • Delivery   │             │
│  └──────────┘                  └──────────────┘             │
│                                                              │
│                  ┌──────────────┐                            │
│                  │ ANALYTICS    │                            │
│                  │ • Aggregated │                            │
│                  │ • By muni/   │                            │
│                  │   province   │                            │
│                  └──────────────┘                            │
└─────────────────────────────────────────────────────────────┘
```

Each domain owns its:

- TypeScript contracts and Zod schemas
- Data queries and mutations (hooks)
- Permission helpers
- Tests
- UI composition components

### 5.2 Entity Definitions

#### User

```typescript
interface User {
  uid: string;
  email: string;
  displayName: string;
  phone: string | null;
  role: "citizen" | "municipal_admin" | "provincial_superadmin";
  municipalityCode: string | null; // required for municipal_admin + citizen
  barangayCode: string | null; // optional for citizen
  avatarUrl: string | null;
  status: "active" | "suspended";
  notificationPrefs: NotificationPrefs;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface NotificationPrefs {
  pushEnabled: boolean;
  alertSeverities: AnnouncementSeverity[];
}
```

#### Report (Public Tier — `reports` collection)

Citizen/public-safe fields. Visible in feed and map for verified reports:

```typescript
interface ReportPublic {
  reportId: string;
  reportNumber: string; // human-readable sequential ID
  incidentType: ReportType;
  category: ReportCategory;
  severity: Severity;
  title: string; // sanitized
  descriptionSanitized: string; // stripped of HTML
  approximateLocation: GeoPoint; // reduced precision
  geohash: string; // for geospatial queries
  locationAddress: string; // approximate
  municipalityCode: string;
  barangayCode: string;
  mediaThumbnails: string[]; // thumbnail URLs only
  publicStatus: PublicStatus;
  visibility: "public" | "hidden"; // hidden until verified
  verifiedForPublic: boolean;
  finalOutcome: string | null;
  createdByRole: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### ReportPrivate (Owner + Admin Tier — `report_private` collection)

Owner-readable and admin-readable private fields:

```typescript
interface ReportPrivate {
  reportId: string;
  reporterUid: string;
  reporterDisplayName: string;
  reporterContactSnapshot: {
    phone: string | null;
    email: string | null;
  };
  exactLocation: GeoPoint; // full precision
  exactAddress: string;
  rawDescription: string;
  rawMediaUrls: string[]; // original uploaded media
  ownerStatus: OwnerStatus;
  ownerVisibleLatestUpdateAt: Timestamp;
  ownerVisibleOutcome: string | null;
  submissionMetadata: {
    platform: "web" | "pwa";
    userAgent: string;
    submittedOffline: boolean;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### ReportOps (Admin-Only Tier — `report_ops` collection)

Internal operational state and admin-only metadata:

```typescript
interface ReportOps {
  reportId: string;
  municipalityCode: string;
  internalState: WorkflowState;
  priority: 1 | 2 | 3 | 4 | 5;
  classification: string | null;
  verifiedBy: string | null;
  verifiedAt: Timestamp | null;
  rejectionReason: string | null;
  rejectedBy: string | null;
  rejectedAt: Timestamp | null;
  assignedContactId: string | null;
  assignedContactSnapshot: ContactSnapshot | null;
  routingDestination: string | null;
  dispatchedBy: string | null;
  dispatchedAt: Timestamp | null;
  acknowledgedBy: string | null;
  acknowledgedAt: Timestamp | null;
  inProgressAt: Timestamp | null;
  inProgressBy: string | null;
  resolvedBy: string | null;
  resolvedAt: Timestamp | null;
  resolutionSummary: string | null;
  adminNotes: string | null;
  duplicateOfReportId: string | null;
  version: number; // optimistic concurrency
  lastStateChangeAt: Timestamp;
  lastStateChangeBy: string;
  createdByUid: string;
  createdByRole: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### Report Activity (Append-only subcollections)

Two separate activity streams with different visibility:

```typescript
// reports/{reportId}/activity — public/owner-visible timeline
interface ReportPublicActivity {
  id: string;
  event: PublicActivityEvent;
  message: string; // citizen-friendly description
  timestamp: Timestamp;
}

type PublicActivityEvent =
  | "submitted"
  | "under_review"
  | "verified"
  | "responders_notified"
  | "response_confirmed"
  | "response_underway"
  | "resolved"
  | "rejected";

// report_ops/{reportId}/activity — internal admin history
interface ReportOpsActivity {
  id: string;
  action: OpsActivityAction;
  performedBy: string;
  performedByName: string;
  performedByRole: string;
  previousState: WorkflowState | null;
  newState: WorkflowState | null;
  details: Record<string, any> | null;
  contactSnapshot: ContactSnapshot | null;
  timestamp: Timestamp;
}

type OpsActivityAction =
  | "created"
  | "verified"
  | "rejected"
  | "dispatched"
  | "rerouted"
  | "acknowledged"
  | "in_progress"
  | "resolved"
  | "priority_changed"
  | "classification_changed"
  | "note_added";
```

#### Contact

```typescript
interface Contact {
  contactId: string;
  name: string;
  agencyName: string;
  contactType: ContactType;
  municipalityCode: string;
  phones: string[];
  email: string | null;
  address: string | null;
  capabilities: string[];
  isActive: boolean;
  notes: string | null; // admin-only
  createdByUid: string;
  updatedByUid: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

type ContactType =
  | "fire"
  | "police"
  | "medical"
  | "rescue"
  | "military"
  | "government"
  | "ngo"
  | "utility"
  | "other";
```

#### ContactSnapshot (embedded in routing events)

```typescript
interface ContactSnapshot {
  contactId: string;
  name: string;
  agencyName: string;
  contactType: ContactType;
  phones: string[];
  email: string | null;
  municipalityCode: string;
  capturedAt: Timestamp;
  capturedByUid: string;
}
```

#### Announcement

```typescript
interface Announcement {
  announcementId: string;
  title: string;
  bodyText: string;
  announcementType: AnnouncementType;
  severity: AnnouncementSeverity;
  status: "draft" | "published" | "cancelled";
  scopeType: "municipality" | "multi_municipality" | "province";
  targetMunicipalities: string[];
  targetKeys: string[]; // e.g., ['province:CN', 'municipality:DAET']
  creatorUid: string;
  creatorRole: string;
  creatorMunicipalityCode: string | null;
  deliveryChannels: DeliveryChannel[];
  deliveryStatus: DeliveryStatus;
  recipientCount: number;
  publishedAt: Timestamp | null;
  expiresAt: Timestamp | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

type AnnouncementType = "alert" | "advisory" | "update" | "all_clear";
type AnnouncementSeverity = "info" | "warning" | "critical";
type DeliveryChannel = "in_app" | "push";
type DeliveryStatus = "draft" | "sending" | "sent" | "partial" | "failed";
```

#### NotificationLog (subcollection of Announcement)

```typescript
interface NotificationLog {
  id: string;
  recipientUid: string;
  recipientMunicipalityCode: string;
  channel: DeliveryChannel;
  status: "pending" | "delivered" | "failed" | "read";
  sentAt: Timestamp | null;
  readAt: Timestamp | null;
  error: string | null;
}
```

#### AuditEntry

```typescript
interface AuditEntry {
  auditId: string;
  feature: "reports" | "contacts" | "alerts" | "analytics" | "auth";
  action: string;
  actorUid: string;
  actorRole: string;
  actorMunicipalityCode: string | null;
  targetType: "report" | "contact" | "announcement" | "user";
  targetId: string;
  scopeMunicipalityCode: string | null;
  summary: string;
  metadata: Record<string, any>;
  requestId: string;
  timestamp: Timestamp;
}
```

#### Analytics Aggregation

```typescript
interface MunicipalityAggregate {
  municipalityCode: string;
  period: string; // '2024-01-15' | '2024-W03' | '2024-01'
  periodType: "daily" | "weekly" | "monthly";
  totalReports: number;
  reportsByType: Record<ReportType, number>;
  reportsBySeverity: Record<Severity, number>;
  reportsByState: Record<WorkflowState, number>;
  verifiedCount: number;
  rejectedCount: number;
  resolvedCount: number;
  averageVerificationTimeMs: number;
  averageResolutionTimeMs: number;
  activeReports: number;
  barangayHotspots: Record<string, number>;
  updatedAt: Timestamp;
}

interface ProvinceAggregate {
  provinceCode: string;
  period: string;
  periodType: "daily" | "weekly" | "monthly";
  totalReports: number;
  reportsByMunicipality: Record<string, number>;
  reportsByType: Record<ReportType, number>;
  reportsBySeverity: Record<Severity, number>;
  verifiedCount: number;
  resolvedCount: number;
  averageResolutionTimeMs: number;
  updatedAt: Timestamp;
}
```

### 5.3 Enumerations

```typescript
type ReportType =
  | "flood"
  | "fire"
  | "earthquake"
  | "landslide"
  | "typhoon"
  | "storm_surge"
  | "volcanic"
  | "accident"
  | "medical"
  | "infrastructure"
  | "security"
  | "other";

type ReportCategory =
  | "natural_disaster"
  | "weather"
  | "geological"
  | "human_caused"
  | "infrastructure"
  | "medical"
  | "security"
  | "other";

type Severity = "low" | "medium" | "high" | "critical";

type WorkflowState =
  | "pending"
  | "verified"
  | "rejected"
  | "dispatched"
  | "acknowledged"
  | "in_progress"
  | "resolved";

// Three-layer status model
type PublicStatus =
  | "Verified Incident"
  | "Response Initiated"
  | "Response Underway"
  | "Resolved";

type OwnerStatus =
  | "Submitted"
  | "Under Review"
  | "Verified"
  | "Responders Notified"
  | "Response Acknowledged"
  | "Response Underway"
  | "Resolved"
  | "Rejected";

// Camarines Norte municipalities
type Municipality =
  | "Basud"
  | "Capalonga"
  | "Daet"
  | "Jose Panganiban"
  | "Labo"
  | "Mercedes"
  | "Paracale"
  | "San Lorenzo Ruiz"
  | "San Vicente"
  | "Santa Elena"
  | "Talisay"
  | "Vinzons";
```

---

## 6. Firestore Schema Proposal

### 6.1 Collection Map

```
firestore-root/
│
├── users/{userId}                                    # User profile + role + municipality
│   └── subscriptions/{subscriptionId}                # FCM tokens and topic subscriptions
│
├── reports/{reportId}                                # PUBLIC tier (citizen-visible)
│   └── activity/{activityId}                         # Public/owner-visible timeline events
│
├── report_private/{reportId}                         # PRIVATE tier (owner + admin)
│
├── report_ops/{reportId}                             # OPS tier (admin-only)
│   └── activity/{activityId}                         # Internal triage/routing history
│
├── contacts/{contactId}                              # Municipality-scoped responder contacts
│
├── announcements/{announcementId}                    # Official announcements
│   └── notifications/{notificationId}                # Per-recipient delivery logs
│
├── audit/{auditId}                                   # Global immutable audit log
│
├── analytics_municipality/{municipalityCode}
│   ├── daily/{dayKey}                                # Daily municipality aggregates
│   ├── weekly/{weekKey}                              # Weekly municipality aggregates
│   ├── monthly/{monthKey}                            # Monthly municipality aggregates
│   └── summary/current                              # Current live municipality snapshot
│
├── analytics_province/{provinceCode}
│   ├── daily/{dayKey}                                # Daily province aggregates
│   └── summary/current                              # Current live province snapshot
│
├── catalog_municipalities/{municipalityCode}         # Canonical municipality metadata
└── catalog_barangays/{barangayCode}                  # Canonical barangay metadata (linked to muni)
```

### 6.2 Why Three Tiers for Reports

| Collection       | Who Reads                                     | What It Contains                                                  | Why Separate                                                                                                   |
| ---------------- | --------------------------------------------- | ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `reports`        | Public (verified only), owner (all their own) | Sanitized text, approximate location, thumbnails, public status   | Citizens must never see operational metadata; public must never see exact coordinates or reporter contact info |
| `report_private` | Owner + Admin                                 | Exact location, raw media, reporter contact, raw description      | Protects reporter's private information from general public while allowing owner self-tracking                 |
| `report_ops`     | Admin only                                    | Workflow state, priority, routing, admin notes, contact snapshots | Prevents citizens from seeing internal triage decisions, assigned responders, and admin commentary             |

This three-tier approach uniquely protects the reporting citizen's private details (exact location, phone, email) from the general public while simultaneously separating those details from admin-only operational fields.

### 6.3 Read Boundaries by Collection

| Collection                         |  Citizen (general)   |   Citizen (owner)    |   Municipal Admin   | Provincial Superadmin |
| ---------------------------------- | :------------------: | :------------------: | :-----------------: | :-------------------: |
| `reports` (public)                 |    Verified only     |      All of own      | All in municipality |          All          |
| `reports/{id}/activity`            |    Verified only     |      All of own      | All in municipality |          All          |
| `report_private`                   |          ❌          |       Own only       |   In municipality   |          All          |
| `report_ops`                       |          ❌          |          ❌          |   In municipality   |          All          |
| `report_ops/{id}/activity`         |          ❌          |          ❌          |   In municipality   |          All          |
| `contacts`                         |          ❌          |          ❌          |   In municipality   |          All          |
| `announcements`                    | Targeted + published | Targeted + published |  Scoped + targeted  |          All          |
| `announcements/{id}/notifications` |          ❌          |          ❌          |  Own municipality   |          All          |
| `audit`                            |          ❌          |          ❌          |  Own municipality   |          All          |
| `analytics_municipality`           |          ❌          |          ❌          |  Own municipality   |          All          |
| `analytics_province`               |          ❌          |          ❌          |         ❌          |     Province only     |

### 6.4 Write Policy

| Write Type                        | Mechanism                                | Rationale                                                      |
| --------------------------------- | ---------------------------------------- | -------------------------------------------------------------- |
| User preferences, FCM tokens      | Direct client write with security rules  | Low-risk, self-scoped                                          |
| Report creation                   | `submitReport` Cloud Function            | Centralized validation, three-document creation, audit logging |
| Report triage (all state changes) | `triageReport` Cloud Function            | State machine enforcement, scope checks, snapshots, audit      |
| Contact CRUD                      | `manageContact` Cloud Function           | Municipality scope enforcement, audit logging                  |
| Announcement creation/publishing  | `createAnnouncement` Cloud Function      | Scope authorization, FCM fan-out, delivery logging             |
| Role assignment                   | `setUserRole` Cloud Function             | Superadmin-only, custom claims management                      |
| Analytics aggregation             | Cloud Function triggers + scheduled jobs | No client writes to analytics                                  |
| Audit entries                     | Cloud Functions only                     | Immutable, append-only                                         |

### 6.5 Required Composite Indexes

```
reports:
  - visibility ASC, municipalityCode ASC, updatedAt DESC
  - visibility ASC, publicStatus ASC, municipalityCode ASC, updatedAt DESC
  - visibility ASC, createdAt DESC
  - reporterUid ASC (in report_private), updatedAt DESC (for owner tracking via private tier)

report_private:
  - reporterUid ASC, updatedAt DESC

report_ops:
  - municipalityCode ASC, internalState ASC, updatedAt DESC
  - municipalityCode ASC, priority ASC, updatedAt DESC
  - internalState ASC, updatedAt DESC

contacts:
  - municipalityCode ASC, isActive ASC, name ASC

announcements:
  - targetKeys ARRAY_CONTAINS, status ASC, publishedAt DESC
  - scopeType ASC, status ASC, publishedAt DESC

audit:
  - scopeMunicipalityCode ASC, timestamp DESC
  - feature ASC, timestamp DESC
  - actorUid ASC, timestamp DESC
```

### 6.6 Cloud Function Triggers and Callables

#### Triggers

| Trigger                 | Source                                                  | Action                                                                                                                                           |
| ----------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `onReportOpsWrite`      | `report_ops/{reportId}` write                           | Sync public status → `reports/{reportId}`, sync owner status → `report_private/{reportId}`, update visibility flag, increment analytics counters |
| `onAnnouncementPublish` | `announcements/{id}` update (status → published)        | Fan out FCM notifications, create `notifications` sub-docs                                                                                       |
| `onImageUpload`         | Storage `/reports/{uid}/{reportId}/{filename}` finalize | Compress, generate 400px thumbnail via sharp, upload to `/thumbnails/`, update report doc                                                        |
| `onUserCreate`          | Firebase Auth `onCreate`                                | Create `users` doc with default `citizen` role                                                                                                   |

#### Callables

| Function             | Caller                     | Purpose                                                                              |
| -------------------- | -------------------------- | ------------------------------------------------------------------------------------ |
| `submitReport`       | citizen                    | Validate, sanitize, create all three report docs + public activity entry             |
| `triageReport`       | admin (scoped)             | Validate state transition + version, update report_ops, log activities, update audit |
| `manageContact`      | admin (scoped)             | CRUD with municipality scope enforcement                                             |
| `createAnnouncement` | admin (scoped)             | Validate scope authorization, create announcement, trigger delivery                  |
| `setUserRole`        | provincial_superadmin only | Set custom claims + update user doc                                                  |
| `getAnalytics`       | admin (scoped)             | Return pre-aggregated data (fallback if stale)                                       |

#### Scheduled

| Function                      | Schedule           | Purpose                                                              |
| ----------------------------- | ------------------ | -------------------------------------------------------------------- |
| `scheduledAggregation`        | Daily at 02:00 PHT | Compute daily/weekly/monthly rollups, reconcile incremental counters |
| `cleanupExpiredAnnouncements` | Daily at 06:00 PHT | Mark expired announcements as inactive                               |

---

## 7. Workflow / State Machine Design

### 7.1 State Transition Diagram

```
                 ┌────────────────────────────────────────────┐
                 │                                            │
                 ▼                                            │
            ┌─────────┐     verify     ┌──────────┐          │
   submit──►│ PENDING │──────────────►│ VERIFIED  │          │
            └─────────┘               └──────────┘          │
                 │                         │    │             │
                 │ reject                  │    │ reject      │
                 ▼                         │    │(supervisory)│
            ┌─────────┐                    │    ▼             │
            │REJECTED │◄───────────────────┘ (REJECTED)      │
            └─────────┘                                       │
                                          │ dispatch         │
                                          ▼                   │
                                   ┌────────────┐            │
                                   │ DISPATCHED │────────────┘
                                   └────────────┘   reroute
                                     │      │
                              acknowledge   │ fast-start
                                     │      │
                                     ▼      ▼
                                ┌──────────────┐
                                │ ACKNOWLEDGED  │
                                └──────────────┘
                                     │
                                start work
                                     │
                                     ▼
                                ┌──────────────┐
                                │ IN_PROGRESS   │──── reroute ──►(DISPATCHED)
                                └──────────────┘
                                     │
                                  resolve
                                     │
                                     ▼
                                ┌──────────────┐
                                │  RESOLVED     │
                                └──────────────┘
```

### 7.2 Valid Transitions Table

| From           | To             | Action                 | Required Fields                           | Notes                                               |
| -------------- | -------------- | ---------------------- | ----------------------------------------- | --------------------------------------------------- |
| `pending`      | `verified`     | Verify report          | —                                         | —                                                   |
| `pending`      | `rejected`     | Reject report          | `rejectionReason`                         | —                                                   |
| `verified`     | `dispatched`   | Dispatch to responder  | `assignedContactId`, `routingDestination` | Contact snapshot captured                           |
| `verified`     | `rejected`     | Reject after review    | `rejectionReason`                         | Supervisory correction only; logged distinctly      |
| `verified`     | `resolved`     | Close without dispatch | `resolutionSummary`                       | For no-response-needed incidents                    |
| `dispatched`   | `acknowledged` | Responder acknowledges | —                                         | —                                                   |
| `dispatched`   | `in_progress`  | Work starts directly   | —                                         | Skips explicit ack if field team begins immediately |
| `dispatched`   | `dispatched`   | Reroute                | New `assignedContactId`                   | Previous routing preserved in activity              |
| `dispatched`   | `resolved`     | Fast closure           | `resolutionSummary`                       | —                                                   |
| `acknowledged` | `in_progress`  | Work begins            | —                                         | —                                                   |
| `acknowledged` | `resolved`     | Immediate closure      | `resolutionSummary`                       | —                                                   |
| `in_progress`  | `resolved`     | Incident resolved      | `resolutionSummary`                       | Normal closeout                                     |
| `in_progress`  | `dispatched`   | Reroute/escalation     | New `assignedContactId`                   | —                                                   |

**Blocked transitions:** Any transition not listed above is rejected by the Cloud Function. Terminal states: `rejected` and `resolved` have no outbound transitions.

### 7.3 Three-Layer Status Mapping

This system maintains three separate status layers, each serving a distinct audience:

| Workflow State (Internal) | Owner Status (Reporter Sees) | Public Status (General Public Sees) | Public Visibility |
| ------------------------- | ---------------------------- | ----------------------------------- | ----------------- |
| `pending`                 | "Submitted"                  | —                                   | Hidden            |
| `verified`                | "Verified"                   | "Verified Incident"                 | Public            |
| `rejected`                | "Rejected"                   | —                                   | Hidden            |
| `dispatched`              | "Responders Notified"        | "Response Initiated"                | Public            |
| `acknowledged`            | "Response Acknowledged"      | "Response Initiated"                | Public            |
| `in_progress`             | "Response Underway"          | "Response Underway"                 | Public            |
| `resolved`                | "Resolved"                   | "Resolved"                          | Public            |

Key points:

- **Pending reports** are hidden from the general public to prevent unverified misinformation. The reporting citizen can still track their pending report immediately in Profile.
- **Rejected reports** are hidden from the general public but remain visible to the owner with the rejection reason.
- The **owner status** provides more granular feedback than the public status.
- All three status values are computed and set by the Cloud Function during state transitions. Neither citizens nor the client app generate these values.

### 7.4 State Transition Validation (Cloud Function)

```typescript
const VALID_TRANSITIONS: Record<WorkflowState, WorkflowState[]> = {
  pending: ["verified", "rejected"],
  verified: ["dispatched", "rejected", "resolved"],
  rejected: [], // terminal
  dispatched: ["acknowledged", "in_progress", "dispatched", "resolved"],
  acknowledged: ["in_progress", "resolved"],
  in_progress: ["resolved", "dispatched"], // reroute/escalation
  resolved: [], // terminal
};

const STATE_TO_OWNER_STATUS: Record<WorkflowState, OwnerStatus> = {
  pending: "Submitted",
  verified: "Verified",
  rejected: "Rejected",
  dispatched: "Responders Notified",
  acknowledged: "Response Acknowledged",
  in_progress: "Response Underway",
  resolved: "Resolved",
};

const STATE_TO_PUBLIC_STATUS: Partial<Record<WorkflowState, PublicStatus>> = {
  verified: "Verified Incident",
  dispatched: "Response Initiated",
  acknowledged: "Response Initiated",
  in_progress: "Response Underway",
  resolved: "Resolved",
};

const STATE_TO_VISIBILITY: Record<WorkflowState, "public" | "hidden"> = {
  pending: "hidden",
  verified: "public",
  rejected: "hidden",
  dispatched: "public",
  acknowledged: "public",
  in_progress: "public",
  resolved: "public",
};
```

### 7.5 Optimistic Concurrency Control

To prevent conflicting admin actions on the same report:

- `report_ops` documents carry a `version` field (integer, starts at 1).
- Every `triageReport` call must include the expected current `version`.
- The Cloud Function checks `version` matches the current document. If not, the call returns a `failed-precondition` error.
- On success, `version` is incremented atomically.
- This prevents two admins from simultaneously applying conflicting state transitions.

---

## 8. Permissions and Municipality Scoping Model

### 8.1 Custom Claims Structure

Set exclusively via `admin.auth().setCustomClaims(uid, claims)` in the `setUserRole` Cloud Function:

```typescript
interface CustomClaims {
  role: "citizen" | "municipal_admin" | "provincial_superadmin";
  municipalityCode?: string; // required for municipal_admin and citizen
  provinceCode: "CN"; // Camarines Norte
}
```

After role change, the client must force a token refresh to pick up new claims.

### 8.2 Permission Matrix

| Resource                        | Action                |         citizen         |   municipal_admin    | provincial_superadmin |
| ------------------------------- | --------------------- | :---------------------: | :------------------: | :-------------------: |
| **reports**                     | create (via CF)       |         ✅ own          |          ❌          |          ❌           |
| **reports**                     | read public           |    ✅ verified only     |    ✅ all in muni    |        ✅ all         |
| **reports**                     | read own              |           ✅            |         N/A          |          N/A          |
| **report_private**              | read                  |       ✅ own only       |      ✅ in muni      |        ✅ all         |
| **report_ops**                  | read                  |           ❌            |      ✅ in muni      |        ✅ all         |
| **report_ops**                  | triage (via CF)       |           ❌            |      ✅ in muni      |        ✅ all         |
| **report_ops/activity**         | read                  |           ❌            |      ✅ in muni      |        ✅ all         |
| **contacts**                    | CRUD (via CF)         |           ❌            |      ✅ in muni      |        ✅ all         |
| **announcements**               | create (via CF)       |           ❌            |   ✅ own muni only   |     ✅ any scope      |
| **announcements**               | read                  | ✅ targeted + published | ✅ scoped + targeted |        ✅ all         |
| **announcements/notifications** | read                  |           ❌            |     ✅ own muni      |        ✅ all         |
| **audit**                       | read                  |           ❌            |     ✅ own muni      |        ✅ all         |
| **analytics_municipality**      | read                  |           ❌            |     ✅ own muni      |        ✅ all         |
| **analytics_province**          | read                  |           ❌            |          ❌          |          ✅           |
| **users**                       | read own              |           ✅            |          ✅          |          ✅           |
| **users**                       | read others           |           ❌            |      ✅ in muni      |        ✅ all         |
| **users**                       | update own prefs      |           ✅            |          ✅          |          ✅           |
| **users**                       | change roles (via CF) |           ❌            |          ❌          |          ✅           |

### 8.3 Three-Layer Scope Enforcement

Municipality scope is enforced at all three layers:

**Layer 1 — Firebase Auth Custom Claims**

```
{ role: "municipal_admin", municipalityCode: "DAET", provinceCode: "CN" }
```

**Layer 2 — Firestore Security Rules** (server-side)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isAuthenticated() { return request.auth != null; }
    function getRole() { return request.auth.token.role; }
    function getMunicipality() { return request.auth.token.municipalityCode; }
    function isSuperAdmin() { return getRole() == 'provincial_superadmin'; }
    function isMunicipalAdmin() { return getRole() == 'municipal_admin'; }
    function isCitizen() { return getRole() == 'citizen'; }
    function isAdmin() { return getRole() in ['municipal_admin', 'provincial_superadmin']; }
    function isInMunicipality(muni) { return isSuperAdmin() || getMunicipality() == muni; }

    // Users
    match /users/{userId} {
      allow read: if isAuthenticated() && (
        request.auth.uid == userId ||
        isSuperAdmin() ||
        (isMunicipalAdmin() && resource.data.municipalityCode == getMunicipality())
      );
      allow update: if isAuthenticated() && request.auth.uid == userId
        && !request.resource.data.diff(resource.data).affectedKeys()
            .hasAny(['role', 'uid', 'municipalityCode']);
      allow create: if false;  // Cloud Function only

      match /subscriptions/{subId} {
        allow read, write: if request.auth.uid == userId;
      }
    }

    // Reports (public tier)
    match /reports/{reportId} {
      allow read: if isAuthenticated() && (
        isSuperAdmin() ||
        (isAdmin() && resource.data.municipalityCode == getMunicipality()) ||
        (isCitizen() && resource.data.visibility == 'public') ||
        (isCitizen() && exists(/databases/$(database)/documents/report_private/$(reportId))
          && get(/databases/$(database)/documents/report_private/$(reportId)).data.reporterUid == request.auth.uid)
      );
      allow write: if false;  // Cloud Function only

      match /activity/{activityId} {
        allow read: if isAuthenticated() && (
          isSuperAdmin() ||
          (isAdmin() && get(/databases/$(database)/documents/reports/$(reportId)).data.municipalityCode == getMunicipality()) ||
          (get(/databases/$(database)/documents/report_private/$(reportId)).data.reporterUid == request.auth.uid)
        );
        allow write: if false;
      }
    }

    // Report private tier
    match /report_private/{reportId} {
      allow read: if isAuthenticated() && (
        resource.data.reporterUid == request.auth.uid ||
        isSuperAdmin() ||
        (isMunicipalAdmin() && get(/databases/$(database)/documents/report_ops/$(reportId)).data.municipalityCode == getMunicipality())
      );
      allow write: if false;
    }

    // Report ops tier (admin only)
    match /report_ops/{reportId} {
      allow read: if isAuthenticated() && (
        isSuperAdmin() ||
        (isMunicipalAdmin() && resource.data.municipalityCode == getMunicipality())
      );
      allow write: if false;  // Cloud Function only

      match /activity/{activityId} {
        allow read: if isAuthenticated() && (
          isSuperAdmin() ||
          (isMunicipalAdmin() && get(/databases/$(database)/documents/report_ops/$(reportId)).data.municipalityCode == getMunicipality())
        );
        allow write: if false;
      }
    }

    // Contacts
    match /contacts/{contactId} {
      allow read: if isAuthenticated() && isAdmin() && isInMunicipality(resource.data.municipalityCode);
      allow write: if false;  // Cloud Function only
    }

    // Announcements
    match /announcements/{announcementId} {
      allow read: if isAuthenticated() && (
        isSuperAdmin() ||
        (isMunicipalAdmin() && getMunicipality() in resource.data.targetMunicipalities) ||
        (isCitizen() && resource.data.status == 'published' && (
          resource.data.scopeType == 'province' ||
          getMunicipality() in resource.data.targetMunicipalities
        ))
      );
      allow write: if false;

      match /notifications/{notificationId} {
        allow read: if isAuthenticated() && (
          isSuperAdmin() ||
          (isMunicipalAdmin() && resource.data.recipientMunicipalityCode == getMunicipality())
        );
        allow write: if false;
      }
    }

    // Audit
    match /audit/{auditId} {
      allow read: if isAuthenticated() && (
        isSuperAdmin() ||
        (isMunicipalAdmin() && resource.data.scopeMunicipalityCode == getMunicipality())
      );
      allow write: if false;
    }

    // Analytics
    match /analytics_municipality/{municipalityCode}/{sub=**} {
      allow read: if isAuthenticated() && isAdmin() && isInMunicipality(municipalityCode);
      allow write: if false;
    }

    match /analytics_province/{provinceCode}/{sub=**} {
      allow read: if isAuthenticated() && isSuperAdmin();
      allow write: if false;
    }

    // Catalog (reference data)
    match /catalog_municipalities/{doc} { allow read: if isAuthenticated(); allow write: if false; }
    match /catalog_barangays/{doc} { allow read: if isAuthenticated(); allow write: if false; }
  }
}
```

**Layer 3 — Cloud Function Authorization** (server-side)

```typescript
// Every callable performs:
// 1. Authentication check
// 2. Role check
// 3. Municipality scope check (for municipal_admin)
// 4. Payload validation via Zod
// 5. State transition validation (for triage)
// 6. Version check (optimistic concurrency)
// 7. Execute in batch/transaction
// 8. Write audit log

async function triageReport(data: TriageInput, context: CallableContext) {
  if (!context.auth) throw new HttpsError("unauthenticated", "...");

  const role = context.auth.token.role;
  if (!["municipal_admin", "provincial_superadmin"].includes(role))
    throw new HttpsError("permission-denied", "Admin role required");

  const ops = await db.doc(`report_ops/${data.reportId}`).get();
  if (!ops.exists) throw new HttpsError("not-found", "Report not found");

  if (
    role === "municipal_admin" &&
    context.auth.token.municipalityCode !== ops.data().municipalityCode
  )
    throw new HttpsError(
      "permission-denied",
      "Not authorized for this municipality",
    );

  const currentState = ops.data().internalState;
  if (!VALID_TRANSITIONS[currentState]?.includes(data.newState))
    throw new HttpsError(
      "failed-precondition",
      `Cannot transition from ${currentState} to ${data.newState}`,
    );

  if (ops.data().version !== data.expectedVersion)
    throw new HttpsError(
      "failed-precondition",
      "Report was modified by another admin",
    );

  // ... validate required fields, execute batch writes, audit
}
```

---

## 9. Security Design

### 9.1 Authentication

| Aspect             | Implementation                                                                                          |
| ------------------ | ------------------------------------------------------------------------------------------------------- |
| Providers          | Email/password + Google OAuth via Firebase Auth                                                         |
| Session management | Firebase Auth SDK handles tokens; short-lived ID tokens auto-refreshed                                  |
| Custom claims      | `role`, `municipalityCode`, `provinceCode` set exclusively via `setUserRole` callable (superadmin only) |
| Default role       | New users get `citizen` role via `onUserCreate` trigger                                                 |
| Token refresh      | After role change, force token refresh on client                                                        |
| Admin provisioning | Municipal admin and superadmin accounts are provisioned by a bootstrapped superadmin (see §9.8)         |

### 9.2 Data Protection Summary

| Threat                     | Mitigation                                                                                                                             |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| XSS via user content       | Sanitize text fields on write in Cloud Functions. React's JSX escaping at render. Never use `dangerouslySetInnerHTML` on user content. |
| Unauthorized data access   | Firestore rules + Cloud Function authorization (double layer). No direct client writes to sensitive collections.                       |
| Municipality scope leak    | Server-side enforcement at rules + CF layers. Client filtering is UX convenience only.                                                 |
| Admin field leakage        | Citizens read from `reports` (public tier) which has no operational fields. `report_ops` is admin-only.                                |
| Location privacy           | Public tier uses approximate coordinates. Exact location in `report_private` only.                                                     |
| Invalid state transitions  | Cloud Function validates against `VALID_TRANSITIONS` map with version check.                                                           |
| Unauthorized announcements | CF verifies `municipal_admin` can only target their own municipality.                                                                  |
| Storage abuse              | Security rules restrict path, file type, and size. App Check prevents bot uploads.                                                     |
| Privilege escalation       | Users cannot modify own `role` or `municipalityCode` (blocked in rules and CF).                                                        |
| Concurrent state conflicts | Optimistic concurrency version field prevents conflicting admin actions.                                                               |

### 9.3 Storage Security Rules

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Report media
    match /reports/{userId}/{reportId}/{fileName} {
      allow read: if request.auth != null;
      allow write: if request.auth != null
        && request.auth.uid == userId
        && request.resource.size < 10 * 1024 * 1024    // 10MB
        && request.resource.contentType.matches('image/(jpeg|png|webp)')
    }

    // Thumbnails (Cloud Function only)
    match /thumbnails/{path=**} {
      allow read: if request.auth != null;
      allow write: if false;
    }

    // Avatars
    match /avatars/{userId}/{fileName} {
      allow read: if request.auth != null;
      allow write: if request.auth != null
        && request.auth.uid == userId
        && request.resource.size < 2 * 1024 * 1024     // 2MB
        && request.resource.contentType.matches('image/(jpeg|png|webp)')
    }
  }
}
```

### 9.4 Input Validation (Zod Schemas — shared across client and Cloud Functions)

| Surface               | Validation Rules                                                                                                                                                                                                                                |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Report submission     | Required fields present, municipality/barangay in catalog, severity is valid enum, type is valid enum, description ≤ 2000 chars, title ≤ 200 chars, GeoPoint within Camarines Norte bounds (~14.0°–14.5°N, 122.5°–123.0°E), mediaUrls ≤ 5 items |
| Triage actions        | Valid reportId, valid state transition, required fields per transition, version match                                                                                                                                                           |
| Contact CRUD          | Required fields, valid municipality in catalog, valid contact type, phone format                                                                                                                                                                |
| Announcement creation | Valid scope, valid target municipalities in catalog, valid severity, title ≤ 200 chars, body ≤ 2000 chars, scope authorized for caller role                                                                                                     |
| Role assignment       | Valid role enum, valid municipality for municipal_admin, caller is provincial_superadmin                                                                                                                                                        |

### 9.5 Abuse Prevention

- **Firebase App Check** on web app and all callable functions
- **Rate limiting** on report creation per user (e.g., max 10 per hour) with surge override (see §9.7)
- **Rate limiting** on announcement publishing
- Reject repeated malformed payloads
- Audit all admin activity
- Optional CAPTCHA on registration if needed
- Report history tracking for repeat offenders (admin bulk-reject tooling)

### 9.6 Philippines Data Privacy Act (RA 10173) Compliance Considerations

While a full legal review is outside the scope of this technical specification, the architecture should support compliance:

- **Data minimization**: Only collect necessary personal information. Public reports use approximate locations and sanitized text.
- **Consent**: Registration flow should include a clear privacy notice and data processing consent. Terms of service should explain what data is collected, how it is used, and who can see it.
- **Access rights**: Citizens can view all their own data through the Profile tab. A future enhancement should support data export and deletion requests.
- **Data storage**: All data resides in Firestore with Firebase's security infrastructure. Firebase's regional hosting should be configured to comply with any data residency requirements.
- **Breach notification**: Monitoring and alerting infrastructure (see §10.8) should support incident detection and rapid notification.

> **Open consideration**: A legal review should be conducted before production launch to confirm full RA 10173 compliance, particularly regarding the collection of location data and reporter contact information.

### 9.7 Disaster Surge vs. Abuse Differentiation

During actual mass disaster events, legitimate report volumes will spike dramatically. The system should:

- Apply **per-user** rate limits (not global) so a single abuser can't flood the system but many real reporters can submit simultaneously.
- Allow **admin configurable surge mode** that temporarily raises per-user rate limits during active disaster events.
- Track **user reputation signals** (verified account age, previous verified reports) to weight rate limit thresholds.
- Use Cloud Functions to detect and flag anomalous patterns (identical descriptions from different accounts, etc.) rather than blocking outright during active events.

### 9.8 Superadmin Bootstrapping

When the system is first deployed, there are no `provincial_superadmin` accounts:

1. A Firebase Admin SDK script (not exposed via API) is run by the deploying engineer.
2. The script creates or identifies the initial superadmin user by email and sets custom claims: `{ role: 'provincial_superadmin', provinceCode: 'CN' }`.
3. The script creates the corresponding `users` document with the correct role.
4. From that point forward, the bootstrapped superadmin can provision additional superadmins and municipal admins through the app's `setUserRole` callable.
5. The bootstrap script and its credentials are documented securely and restricted to the ops team.

---

## 10. Performance and Robustness Strategy

### 10.1 Real-Time Listener Scoping

| Listener             | Scope                                                                                                                                    | Client                | Notes                                      |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | --------------------- | ------------------------------------------ |
| Map pins             | `reports` WHERE `visibility == 'public'` AND `municipalityCode IN visible` LIMIT 200                                                     | All                   | Bounded by map viewport; clustered         |
| Feed                 | `reports` WHERE `visibility == 'public'` ORDER BY `createdAt DESC` LIMIT 20 + cursor                                                     | All                   | Cursor-based pagination; no broad listener |
| My Reports           | `report_private` WHERE `reporterUid == currentUser` ORDER BY `updatedAt DESC` LIMIT 20                                                   | citizen               | Narrow scope                               |
| Admin queue          | `report_ops` WHERE `municipalityCode == admin.muni` AND `internalState IN ['pending','verified','dispatched']` LIMIT 50                  | municipal_admin       | Scoped                                     |
| Alerts (citizen)     | `announcements` WHERE `targetKeys ARRAY_CONTAINS 'municipality:{code}'` AND `status == 'published'` ORDER BY `publishedAt DESC` LIMIT 20 | citizen               | Municipality-scoped                        |
| Province admin queue | `report_ops` WHERE `internalState == 'pending'` ORDER BY `createdAt DESC` LIMIT 50                                                       | provincial_superadmin | Paginated                                  |

**Rules:**

- No listener fetches more than 200 documents.
- No province-wide `onSnapshot` on mobile.
- Listeners are detached on component unmount or tab switch.
- Map listeners adjust on significant viewport changes (debounced, 500ms).
- Use React Query's `staleTime` and `cacheTime` to prevent redundant Firestore reads on tab switches.

### 10.2 Map Performance

| Concern                     | Strategy                                                                                                                                                                                                                            |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Map stability**           | `MapContainer` rendered once as a sibling to the workspace drawer. Never unmounted. Drawer and modals are separate React subtrees.                                                                                                  |
| **React 18 Strict Mode**    | Strict Mode double-mounts components in dev. The map container must be wrapped so that double-mount in dev does not cause issues, while in production single-mount is guaranteed. Use a ref guard to prevent double initialization. |
| **Marker volume**           | `supercluster` or `react-leaflet-markercluster` for client-side clustering. Decluster on zoom in.                                                                                                                                   |
| **Re-rendering**            | Marker data stored in Zustand store. Map reads from store. Marker updates batched. Map viewport changes don't re-trigger data fetches unless pan/zoom exceeds threshold.                                                            |
| **`invalidateSize`**        | Called after workspace drawer CSS transition completes (on `transitionend` event).                                                                                                                                                  |
| **Tile loading**            | OpenStreetMap tiles (free). Pre-load tiles for Camarines Norte bounding box.                                                                                                                                                        |
| **Municipality boundaries** | Static GeoJSON bundled as an asset in `/public/data/municipalities.geojson`. Loaded once on app init, not from Firestore.                                                                                                           |
| **Mobile map**              | Map tab preserves Leaflet instance via CSS `display: none/block` toggling when switching bottom tabs.                                                                                                                               |

### 10.3 Image Handling

```
Client Upload Flow:
  1. User selects images (max 5 per report)
  2. Client-side compression via browser-image-compression:
     - Max dimension: 1920px
     - Max file size: 1MB
     - Output format: JPEG or WebP
  3. Upload to Firebase Storage: /reports/{userId}/{reportId}/{filename}
  4. Cloud Function (submitReport) validates attachment references

Server Thumbnail Flow (Cloud Function trigger):
  1. onFinalize trigger on /reports/... path
  2. Download original from Storage
  3. Generate 400px-wide thumbnail using sharp
  4. Upload thumbnail to /thumbnails/reports/{reportId}/{filename}
  5. Update reports/{reportId} doc with thumbnailUrl
```

### 10.4 Analytics Aggregation Strategy

```
Incremental (trigger-based):
  - onReportOpsWrite detects state changes
  - Increments/decrements counters in current day's aggregate document
  - Keeps daily data near-real-time between scheduled runs

Scheduled (daily at 02:00 PHT):
  1. Query report_ops modified in last 24 hours
  2. For each affected municipality:
     a. Compute daily aggregation (full recount for accuracy)
     b. Upsert analytics_municipality/{code}/daily/{date}
  3. Compute province-wide daily aggregation
  4. Roll up weekly/monthly if appropriate day
  5. Update summary/current snapshots

Dashboard reads:
  - Fetch analytics_municipality/{code}/daily LIMIT 30 ORDER BY dayKey DESC
  - No raw report scanning
  - Favor verified, dispatched, resolved, and acknowledged data
```

### 10.5 PWA and Offline

| Feature              | Implementation                                                       |
| -------------------- | -------------------------------------------------------------------- |
| Service worker       | `vite-plugin-pwa` with Workbox, `GenerateSW` strategy                |
| Precaching           | App shell, critical CSS/JS, static assets, municipality GeoJSON      |
| Runtime caching      | NetworkFirst for API/Firestore, CacheFirst for tile images           |
| Offline report draft | Store draft in IndexedDB; submit when online via service worker sync |
| Offline feed         | Firestore SDK offline persistence provides cached reads              |
| Install prompt       | Custom install banner for mobile PWA                                 |
| Connection status    | Visible connection indicator; clear messaging when offline           |

### 10.6 Error Handling and Resilience

| Scenario                      | Handling                                                               |
| ----------------------------- | ---------------------------------------------------------------------- |
| Network failure during submit | Show retry UI with local draft preservation (IndexedDB)                |
| Cloud Function timeout        | Return user-friendly error; log to Cloud Logging                       |
| Firestore listener disconnect | SDK auto-reconnects; show connection status indicator                  |
| Image upload failure          | Retry with exponential backoff; allow submitting without failed images |
| Invalid auth state            | Redirect to login; clear stale tokens                                  |
| Concurrent admin conflict     | Return version mismatch error; admin refreshes and retries             |
| React errors                  | Error boundaries per domain; never crash the map                       |

### 10.7 Data Retention and Archival

> **Open consideration**: A formal data retention policy should be defined before production launch. Recommended starting points:

- **Active reports**: Retained indefinitely while in non-terminal states.
- **Resolved/rejected reports**: Retained for 5 years, then archived or anonymized.
- **Audit logs**: Retained for 7 years (regulatory minimum for government records in PH).
- **Delivery logs**: Retained for 1 year, then pruned.
- **Analytics aggregates**: Retained indefinitely (small documents, valuable for historical disaster mapping).
- A scheduled Cloud Function can handle archival by moving old documents to a cold collection or exporting to Cloud Storage.

### 10.8 Monitoring and Observability

| Concern                     | Strategy                                                                                                                                       |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Application errors          | Cloud Logging for Cloud Functions; frontend error boundary logging to a crash reporting service (e.g., Sentry or Firebase Crashlytics for web) |
| Uptime monitoring           | Firebase Hosting CDN provides inherent availability; external uptime check on public routes (e.g., UptimeRobot or Google Cloud Monitoring)     |
| Function health             | Cloud Functions v2 built-in Cloud Monitoring metrics (invocation count, error rate, latency) with alerting thresholds                          |
| Firestore quota             | Firebase Console alerts on read/write quotas approaching limits                                                                                |
| Scheduled function failures | Pub/Sub dead-letter topic; alert on aggregation function failures                                                                              |
| Admin activity anomalies    | Audit log analysis (manual in v1; automated alerting as future enhancement)                                                                    |
| Deployment                  | Firebase Hosting preview channels for pre-production verification                                                                              |

> **Open consideration**: A full on-call infrastructure (PagerDuty, runbooks, incident response process) should be established before production launch. For v1, alerting via Cloud Monitoring email notifications to the ops team is the minimum.

### 10.9 Backup and Disaster Recovery

> **Open consideration**: Firebase/Firestore infrastructure is managed by Google with built-in replication and availability guarantees. However, the team should:

- Enable **Firestore scheduled exports** (daily) to Cloud Storage for point-in-time recovery.
- Document a **recovery runbook** for common scenarios: accidental data deletion, corrupted aggregations, compromised admin account.
- Test the export/import cycle at least once before production launch.
- Firebase Auth user data can be exported via Admin SDK. Storage data is backed by Google Cloud Storage durability guarantees.

---

## 11. SEO Strategy for Public Surfaces

### 11.1 Public vs. Private Surface Classification

| Surface                                    | Public?          | Indexed? | SEO Optimized?    |
| ------------------------------------------ | ---------------- | -------- | ----------------- |
| Landing page (`/`)                         | ✅               | ✅       | ✅                |
| Public map (`/public/map`)                 | ✅               | ✅       | ✅                |
| Public alerts list (`/public/alerts`)      | ✅               | ✅       | ✅                |
| Public alert detail (`/public/alerts/:id`) | ✅               | ✅       | ✅ (dynamic meta) |
| Login (`/auth/login`)                      | ✅               | ❌       | ❌                |
| Register (`/auth/register`)                | ✅               | ❌       | ❌                |
| App routes (`/app/*`)                      | 🔒 Auth required | ❌       | ❌                |

**Important policy decision**: Individual user-submitted report detail pages should **not** be indexed for SEO, even if verified. Reasons:

- Privacy risk for reporters
- Misinformation risk before full context is established
- Dynamic freshness complexity
- Official announcements are the appropriate public-indexed content

### 11.2 Implementation

```html
<!-- Landing page -->
<title>Bantayog Alert — Disaster Reporting for Camarines Norte</title>
<meta
  name="description"
  content="Real-time disaster reporting, emergency alerts, and coordination platform for Camarines Norte, Philippines."
/>
<link rel="canonical" href="https://bantayogalert.ph/" />
<meta property="og:title" content="Bantayog Alert" />
<meta
  property="og:description"
  content="Report emergencies, receive alerts, and track disaster response in Camarines Norte."
/>
<meta property="og:image" content="https://bantayogalert.ph/og-image.jpg" />
<meta property="og:url" content="https://bantayogalert.ph/" />
<meta property="og:type" content="website" />
<meta name="twitter:card" content="summary_large_image" />
```

Route-level metadata managed via `react-helmet-async`.

### 11.3 Dynamic Meta for Shared Alert Pages

For `/public/alerts/:id`, a Cloud Function rewrite injects dynamic OG tags for social media sharing:

```typescript
// Firebase Hosting rewrite: /public/alerts/:id → renderPublicAlert function
exports.renderPublicAlert = functions.https.onRequest(async (req, res) => {
  const alertId = req.path.split("/").pop();
  const alert = await db.doc(`announcements/${alertId}`).get();
  if (!alert.exists || alert.data().status !== "published")
    return res.status(404).send("Not found");

  const data = alert.data();
  const html = `<!DOCTYPE html>
    <html>
    <head>
      <title>${escapeHtml(data.title)} — Bantayog Alert</title>
      <meta name="description" content="${escapeHtml(data.bodyText.substring(0, 160))}" />
      <meta property="og:title" content="${escapeHtml(data.title)}" />
      <meta property="og:description" content="${escapeHtml(data.bodyText.substring(0, 160))}" />
      <meta property="og:url" content="https://bantayogalert.ph/public/alerts/${alertId}" />
      <link rel="canonical" href="https://bantayogalert.ph/public/alerts/${alertId}" />
      <meta http-equiv="refresh" content="0;url=/public/alerts/${alertId}" />
    </head>
    <body>Loading...</body>
    </html>`;
  res.status(200).send(html);
});
```

### 11.4 robots.txt and Sitemap

```
# robots.txt
User-agent: *
Allow: /
Allow: /public/
Disallow: /app/
Disallow: /auth/
Disallow: /admin/
Disallow: /profile/
Sitemap: https://bantayogalert.ph/sitemap.xml
```

```xml
<!-- sitemap.xml -->
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://bantayogalert.ph/</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://bantayogalert.ph/public/map</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://bantayogalert.ph/public/alerts</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <!-- Dynamic alert pages can be added via a scheduled sitemap generator -->
</urlset>
```

### 11.5 noindex for Private Surfaces

All authenticated app routes include via `react-helmet-async`:

```html
<meta name="robots" content="noindex, nofollow" />
```

---

## 12. Testing Strategy

### 12.1 Testing Pyramid

```
                    ┌──────────┐
                    │   E2E    │  ~15 tests
                    │(Playwright│  Critical user journeys
                    │          │
                ┌───┴──────────┴───┐
                │   Integration    │  ~40 tests
                │  (Vitest + RTL)  │  Feature flows, hooks
                │  Firebase Emulator│
            ┌───┴──────────────────┴───┐
            │        Unit Tests        │  ~100+ tests
            │    (Vitest + RTL)        │  Components, utils,
            │                          │  domain logic
            └──────────────────────────┘

        ┌──────────────────────────────────┐
        │    Firestore Security Rules      │  ~60 tests
        │    (@firebase/rules-unit-testing) │  RBAC + scoping
        └──────────────────────────────────┘
```

### 12.2 Unit Tests (Vitest)

| Area                       | Examples                                                                                                    |
| -------------------------- | ----------------------------------------------------------------------------------------------------------- |
| State machine              | All valid transitions pass; all invalid transitions throw; required fields enforced                         |
| Three-layer status mapping | Every workflow state maps correctly to owner status, public status, and visibility                          |
| Validators (Zod)           | Report payload, contact, announcement scope, coordinate bounds                                              |
| Sanitization               | HTML stripping, XSS payload neutralization                                                                  |
| Geo utilities              | Bounding box checks (~14.0°–14.5°N, 122.5°–123.0°E), geohash generation, approximate coordinate computation |
| Format utilities           | Date formatting (PH locale), severity labels, type labels, municipality display names                       |
| Permission helpers         | `canTriage(role, municipality, reportMunicipality)` → boolean                                               |
| Version concurrency        | Version match/mismatch logic                                                                                |

### 12.3 Component Tests (Vitest + RTL)

| Component           | Tests                                                                               |
| ------------------- | ----------------------------------------------------------------------------------- |
| ReportCard          | Renders public fields, severity badge color, clickable, no admin fields for citizen |
| WorkspaceDrawer     | Opens/closes, renders correct panel, does not render map children                   |
| ReportForm          | Multi-step navigation, validation errors, submit disabled until valid               |
| MapMarker           | Renders at correct position, click handler fires                                    |
| AlertItem           | Severity icon correct, truncated body, expand/collapse                              |
| ContactForm         | CRUD form validation, municipality selector restricted for municipal_admin          |
| TriagePanel         | State transition buttons enabled/disabled per current state, confirmation dialogs   |
| NavRail             | Correct items per role, active state highlighting                                   |
| Focus management    | Modal/drawer focus trapping and return                                              |
| Keyboard navigation | All interactive elements reachable via Tab/Enter/Escape                             |

### 12.4 Integration Tests (Vitest + Firebase Emulator)

| Flow                     | Tests                                                                                 |
| ------------------------ | ------------------------------------------------------------------------------------- |
| Report submission        | Create report → verify all three docs created → public activity log entry exists      |
| Report triage full cycle | submit → verify → dispatch → acknowledge → resolve; check each state across all tiers |
| Invalid triage           | Attempt `pending → resolved` → expect rejection                                       |
| Version conflict         | Two simultaneous triage attempts → second fails with version error                    |
| Municipality scoping     | Municipal admin queries report_ops → only sees own municipality                       |
| Announcement delivery    | Create announcement → verify notification sub-docs → FCM mock called                  |
| Contact snapshot         | Dispatch report → edit contact → verify report still has old snapshot                 |
| Aggregation              | Create reports → trigger aggregation → verify counts                                  |
| Visibility rules         | Pending report → citizen query → not returned; verified report → returned             |

### 12.5 Firestore Security Rules Tests (~60 tests)

| Category              | Tests                                                                                                            |
| --------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Citizen reads         | ✅ `reports` (verified only). ❌ `report_ops`. ❌ `audit`. ✅ Own `report_private`. ❌ Others' `report_private`. |
| Municipal admin reads | ✅ `report_ops` in own municipality. ❌ `report_ops` in other municipality.                                      |
| Superadmin reads      | ✅ All collections.                                                                                              |
| Citizen writes        | ❌ Cannot write directly to any collection except own user prefs and subscriptions.                              |
| Contact scoping       | ✅ Admin CRUDs in own municipality. ❌ Cannot CRUD in other municipality.                                        |
| Announcement scoping  | ✅ Citizen reads targeted published. ❌ Cannot read other-municipality-only.                                     |
| User self-edit        | ✅ Can update displayName. ❌ Cannot update role or municipalityCode.                                            |
| Storage rules         | ✅ Upload image < 10MB. ❌ Upload > 10MB. ❌ Upload non-image. ❌ Upload to other user's path.                   |

### 12.6 E2E Tests (Playwright)

| Journey                        | Steps                                                                                                                     |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| Citizen report submission      | Login → Submit report → See in Profile tracker → Verify NOT in public feed yet                                            |
| Admin triage full cycle        | Login as admin → View pending → Verify → Dispatch → Acknowledge → Resolve → Check audit                                   |
| Municipality scope enforcement | Login as Daet admin → Attempt URL manipulation to Labo report → Verify denied                                             |
| Announcement flow              | Login as admin → Create announcement → Verify in citizen's Alerts tab                                                     |
| **Desktop map stability**      | Open Feed drawer → Close → Open Profile → Close → Open Analytics → Close → Verify map viewport unchanged (lat, lng, zoom) |
| Mobile report flow             | Open Feed → Tap report → View detail → Back → Switch to Map → Tap pin → View detail                                       |
| Cross-role visibility          | Create report in Daet → Login as Labo admin → Verify report not in queue                                                  |
| Responsive layout              | Test at 360px, 768px, 1280px, 1920px — no overflow or clipping                                                            |
| Pending report privacy         | Submit report → Log out → Log in as different citizen → Verify report not visible                                         |

### 12.7 Performance Testing

| Test                             | Tool                        | Target                                                         |
| -------------------------------- | --------------------------- | -------------------------------------------------------------- |
| Lighthouse Performance (mobile)  | Lighthouse CI               | ≥ 85                                                           |
| Lighthouse Performance (desktop) | Lighthouse CI               | ≥ 95                                                           |
| Lighthouse SEO (public pages)    | Lighthouse CI               | ≥ 90                                                           |
| Lighthouse Accessibility         | Lighthouse CI               | ≥ 95                                                           |
| LCP on landing page              | Lighthouse CI               | ≤ 2.5s                                                         |
| CLS on landing page              | Lighthouse CI               | ≤ 0.1                                                          |
| Map mount stability              | Playwright custom assertion | Map container DOM element unchanged before/after drawer toggle |
| Bundle size                      | Vite build analysis         | Main chunk < 200KB gzipped                                     |

### 12.8 Accessibility Testing Focus

- Semantic landmarks (`<main>`, `<nav>`, `<aside>`, `<dialog>`)
- Heading hierarchy
- Keyboard-only drawer and modal navigation
- Focus trapping in modals/drawers; focus return on close
- `aria-label` for icon-only buttons
- `aria-live` regions for submission confirmations and status changes
- Color contrast (WCAG AA minimum)
- Screen reader testing on critical flows

**Leaflet accessibility challenge**: Leaflet renders map content via Canvas/SVG which is inherently inaccessible to screen readers. Mitigations:

- Provide a fully accessible non-map alternative (feed view) for all information available on the map.
- Add `role="application"` with descriptive `aria-label` to the map container.
- Provide keyboard-accessible custom controls around the map (zoom, locate, filter).
- Map pin information is also accessible through the feed and detail modals.
- Adding an `aria-live` announcement when markers are selected via keyboard.

> **Open consideration**: Full map accessibility for screen reader users is an industry-wide challenge. The feed and list views serve as accessible alternatives that provide equivalent information.

---

## 13. Quality Scorecard

**Total score: 100**

| #     | Category                       | Max     | Target  | Strategy to Achieve                                          |
| ----- | ------------------------------ | ------- | ------- | ------------------------------------------------------------ |
| **1** | **Performance**                | **25**  | **≥20** |                                                              |
| 1a    | Mobile Lighthouse ≥ 85         | 8       | 8       | Code splitting, lazy routes, optimized images, SW precaching |
| 1b    | Desktop Lighthouse ≥ 95        | 4       | 4       | Minimal main bundle, efficient rendering                     |
| 1c    | LCP ≤ 2.5s                     | 4       | 4       | Preload hero, inline critical CSS, fast TTFB via CDN         |
| 1d    | CLS ≤ 0.1                      | 2       | 2       | Explicit dimensions on images/map, no layout shifts          |
| 1e    | Map mount stability            | 4       | 4       | Sibling architecture, ref guard, never unmount MapContainer  |
| 1f    | Scoped/paginated listeners     | 3       | 3       | All listeners bounded by scope + LIMIT                       |
| **2** | **Security**                   | **25**  | **≥23** |                                                              |
| 2a    | Zero critical flaws            | 8       | 8       | Security rules, CF validation, no direct writes, App Check   |
| 2b    | Zero high auth/data-leak flaws | 5       | 5       | Three-tier pattern, custom claims, server-side scope         |
| 2c    | 100% RBAC test pass            | 6       | 6       | 60+ security rules tests, E2E scope tests                    |
| 2d    | Server-side muni scope         | 3       | 3       | Custom claims in rules + CF checks                           |
| 2e    | Upload/sanitize/admin-data     | 3       | 3       | Storage rules, sanitization, three-tier report separation    |
| **3** | **Design**                     | **20**  | **≥16** |                                                              |
| 3a    | Desktop usable at 1280px+      | 5       | 5       | Map-first layout, responsive workspace drawer                |
| 3b    | Mobile usable at 360px         | 5       | 5       | Bottom tabs, card layouts, appropriate touch targets         |
| 3c    | Accessibility ≥ 95             | 4       | 4       | Semantic HTML, ARIA, focus management, contrast              |
| 3d    | Consistent right modal         | 3       | 3       | Single shared WorkspaceDrawer component                      |
| 3e    | No overflow/clipping           | 3       | 3       | Viewport testing at all breakpoints                          |
| **4** | **SEO**                        | **10**  | **≥8**  |                                                              |
| 4a    | Lighthouse SEO ≥ 90            | 4       | 4       | Proper meta, structure, headings                             |
| 4b    | Title/meta/canonical/social    | 3       | 3       | react-helmet-async, CF for public alert OG                   |
| 4c    | Sitemap + robots               | 2       | 2       | Static sitemap.xml + robots.txt                              |
| 4d    | Admin excluded from indexing   | 1       | 1       | `noindex` meta + robots.txt Disallow                         |
| **5** | **Overall Quality**            | **20**  | **≥17** |                                                              |
| 5a    | 100% test suite pass           | 7       | 7       | CI pipeline, pre-merge gates                                 |
| 5b    | No blocker bugs in core flows  | 5       | 5       | E2E coverage of critical paths                               |
| 5c    | No uncaught console errors     | 3       | 3       | Error boundaries, proper async handling                      |
| 5d    | Observability + audit          | 3       | 3       | Cloud Logging, audit collection, crash reporting             |
| 5e    | Documentation                  | 2       | 2       | README, setup guide, architecture doc                        |
|       | **TOTAL**                      | **100** | **≥90** |                                                              |

### Release Gate

- Minimum total score: **90/100**
- Performance ≥ 20/25
- Security ≥ 23/25
- Design ≥ 16/20
- SEO ≥ 8/10
- Overall Quality ≥ 17/20

### Automatic Release Blockers (Regardless of Score)

- Any broken municipality-scope rule
- Any broken provincial_superadmin permission path
- Any map reset or remount caused by right-modal navigation
- Any critical security flaw
- Any failing core workflow around reports, alerts, or triage

---

## 14. Phased Delivery Plan

### Phase 1: Project Foundation & Tooling (Est. 2 days)

**Deliverables:**

- Vite + React 18 + TypeScript project initialization
- Tailwind CSS configuration with design tokens
- Firebase project setup (dev + staging environments)
- Firebase Emulator Suite configuration
- ESLint + Prettier configuration
- Vitest + RTL setup with example test
- Playwright setup with example E2E test
- PWA configuration (vite-plugin-pwa)
- CI pipeline configuration (GitHub Actions)
- React Query + Zustand setup
- React Router v6 foundation
- Project directory structure following domain boundaries

**Exit criteria:** `npm run dev`, `npm run test`, `npm run build` all succeed. Firebase emulators start. Playwright runs one smoke test.

---

### Phase 2: Domain Model & Backend Contracts (Est. 2 days)

**Deliverables:**

- TypeScript type definitions for all entities (§5)
- Zod validation schemas (shared between client and functions)
- Enum definitions (municipalities, barangays, report types, etc.)
- State machine implementation with transition validation
- Three-layer status mapping logic
- Firestore schema deployment (indexes, security rules skeleton)
- Cloud Functions scaffolding (all callable + trigger stubs)
- Firebase Storage security rules
- Reference data seeding (catalog_municipalities, catalog_barangays)
- Municipality GeoJSON asset bundling
- Unit tests for state machine, validators, enums, status mapping

**Exit criteria:** All type definitions compile. State machine tests pass. Validation tests pass. Firebase emulator loads rules and seed data. GeoJSON loads correctly.

---

### Phase 3: Auth & Role Model (Est. 2 days)

**Deliverables:**

- Firebase Auth integration (email/password + Google OAuth)
- Custom claims management (`setUserRole` Cloud Function)
- `onUserCreate` trigger (default citizen role)
- Auth context and hooks (`useAuth`, `useRole`, `useMunicipality`)
- Protected route wrapper components
- Login page
- Registration page with municipality selection and privacy consent
- Role-based UI guards
- Superadmin bootstrap script (documented)
- Firestore security rules for users collection
- Security rules tests for authentication and role checks

**Exit criteria:** Can register, login, logout. Custom claims are set. Protected routes redirect unauthenticated users. Superadmin can provision roles. 60+ security rules tests pass.

---

### Phase 4: Desktop Shell & Mobile Shell (Est. 4 days)

**Deliverables:**

- Responsive layout detection (desktop ≥1280px vs mobile)
- Desktop: Navigation rail component
- Desktop: Persistent Leaflet map canvas (mounted once, sibling layout)
- Desktop: Workspace drawer component (reusable right-side panel with transitions)
- Desktop: Report detail modal component (centered overlay, independent of drawer)
- Desktop: `invalidateSize()` call on drawer `transitionend`
- Mobile: Bottom tab bar component
- Mobile: Tab-based layout with CSS display toggling (preserve map instance)
- Mobile: Full-screen modal wrapper for report detail
- Router configuration (panel as query parameter)
- Map ref guard for React 18 Strict Mode
- Focus management for modals and drawers
- Component tests for shell components
- Responsive tests at 360px, 768px, 1280px, 1920px

**Exit criteria:** Desktop and mobile shells render correctly. Drawer opens/closes with animation. Map stays mounted across all drawer changes. Tab switching preserves map on mobile. No layout overflow at tested widths.

---

### Phase 5: Report Submission (Est. 3 days)

**Deliverables:**

- Multi-step report form (type → location → details → media → confirm)
- Location picker (Leaflet map with pin drop + reverse geocoding)
- Municipality and barangay selectors (catalog-driven)
- Coordinate bounding box validation (Camarines Norte ~14.0°–14.5°N, 122.5°–123.0°E)
- Media upload with client-side compression (browser-image-compression)
- `submitReport` Cloud Function (validate, sanitize, create three-tier docs + activity)
- `onImageUpload` trigger (generate thumbnail via sharp)
- Desktop: form in workspace drawer
- Mobile: full-screen form modal
- Draft autosave to IndexedDB
- Form validation with accessible error messages
- Success state and redirect
- Unit tests for form validation
- Integration tests for submission flow (emulator)

**Exit criteria:** Can submit a report with all fields. Report appears in all three collections. Activity log entry created. Images compressed. Thumbnails generated. Draft preserved if form abandoned.

---

### Phase 6: Realtime Map & Feed (Est. 4 days)

**Deliverables:**

- Leaflet map initialization with Camarines Norte center and bounds
- Municipality boundary GeoJSON overlay (from static asset)
- Report markers (color-coded by severity, icon by type)
- Marker clustering (supercluster / react-leaflet-markercluster)
- Map filter bar (type, severity, municipality, date range)
- Click marker → report detail modal (desktop) / bottom sheet (mobile)
- Feed component with paginated report cards (React Query + cursor pagination)
- Report card component (severity badge, type icon, location, time, public status)
- Real-time listener for new verified reports (scoped, paginated)
- Visibility filter: only verified/public reports shown to citizens
- Pull-to-refresh (mobile)
- Infinite scroll (mobile)
- Map viewport preservation across workspace/drawer changes
- Desktop: feed in workspace drawer
- Mobile: feed as primary tab

**Exit criteria:** Verified reports appear on map and in feed in near real-time. Pending reports NOT visible to general citizens. Clustering works. Filters work. Map does not remount on drawer toggle. Feed paginates correctly.

---

### Phase 7: Profile Report Tracker (Est. 2 days)

**Deliverables:**

- Profile view (user info card)
- "My Reports" list from `report_private` (owner-scoped)
- Owner-facing status labels (three-layer status)
- Latest update time, location, outcome display
- Click tracked report → report detail (reuse detail modal)
- Empty state for users with no reports
- Status badge component (color-coded ownerStatus)
- Desktop: profile in workspace drawer
- Mobile: profile as tab
- Settings section (notification preferences)

**Exit criteria:** Profile shows user info and all submitted reports with correct owner status. Report status reflects real-time changes. Detail modal works from profile. Pending and rejected reports visible to owner.

---

### Phase 8: Admin Verification & Routing (Est. 4 days)

**Deliverables:**

- Admin dashboard workspace panel (summary cards, pending queue)
- Triage panel in report detail modal (admin-only actions)
- Verify, Reject (with reason), Dispatch (with contact + routing), Acknowledge, In Progress, Resolve (with summary) actions
- Priority change and classification
- Admin notes
- Optimistic concurrency: version field check on every triage action
- `triageReport` Cloud Function with full validation (state, scope, version, required fields)
- Contact snapshot capture at dispatch time
- Activity log entries (internal ops activity subcollection)
- Audit log entries
- Municipality scope enforcement in Cloud Function
- Three-tier sync: ops state change → public status + visibility update → owner status update
- Desktop: admin dashboard in workspace drawer
- Mobile: admin panel accessible from profile
- Integration tests for full triage cycle
- Security rules tests for admin scoping
- Version conflict test

**Exit criteria:** Full triage cycle works. Invalid transitions blocked. Municipality scope enforced. Version conflicts detected. Activity and audit logs populated. No cross-municipality access. Public/owner statuses sync correctly.

---

### Phase 9: Contacts Management (Est. 2 days)

**Deliverables:**

- Contacts list view (searchable, filterable by type and municipality)
- Contact detail view
- Add/Edit/Delete contact forms
- `manageContact` Cloud Function with municipality scope enforcement
- Contact snapshot logic (capture at dispatch time, preserved after edits)
- Contacts workspace panel (desktop)
- Contacts screen (mobile admin)
- Firestore security rules for contacts
- Tests for CRUD, scoping, and snapshot persistence

**Exit criteria:** CRUD works. Municipal admin restricted to own municipality. Superadmin can manage all. Snapshots captured at dispatch and preserved after contact edits.

---

### Phase 10: Announcements, Push & Alerts Tab (Est. 4 days)

**Deliverables:**

- Announcement creation form (title, body, type, severity, scope, target municipalities)
- `targetKeys` array generation (e.g., `['municipality:DAET']` or `['province:CN']`)
- Scope enforcement (municipal_admin → own municipality only)
- `createAnnouncement` Cloud Function
- FCM token management (register, refresh, remove via user subscriptions)
- Push notification delivery (FCM fan-out)
- Notification delivery log subcollection
- Alerts tab (citizen and admin) with municipality-scoped queries using `targetKeys ARRAY_CONTAINS`
- Alert list with severity styling
- Alert detail (expandable)
- Delivery status tracking (admin view)
- Announcement expiration handling
- Desktop: alerts in workspace; announcement creation in admin panel
- Mobile: alerts as tab
- Integration tests for announcement delivery and scope enforcement
- Security tests

**Exit criteria:** Announcements created, delivered via push, visible in Alerts tab. Municipal admin can only target own municipality. Province-wide announcements work for superadmin. Delivery logs accurate. Citizens see only relevant alerts.

---

### Phase 11: Analytics & Disaster Mapping (Est. 3 days)

**Deliverables:**

- `scheduledAggregation` Cloud Function (daily rollup at 02:00 PHT)
- Incremental aggregation triggers on `report_ops` state changes
- Analytics workspace panel with charts (using Recharts or Chart.js):
  - Reports by type (bar chart)
  - Reports by severity (donut chart)
  - Reports over time (line chart)
  - Active vs resolved (gauge)
  - Average verification and resolution times
  - Barangay hotspot counts
  - Reports by municipality (for superadmin — province aggregate)
- Municipality-scoped analytics for municipal_admin
- Province-wide analytics for superadmin
- Map heatmap overlay option
- Date range selector
- Desktop: analytics in workspace drawer
- Mobile: simplified analytics in admin panel

**Exit criteria:** Analytics shows pre-aggregated data. No raw report scanning on client. Municipality scope enforced. Province analytics restricted to superadmin. Charts render correctly.

---

### Phase 12: Hardening, A11y, Performance Tuning & Release Verification (Est. 5 days)

**Deliverables:**

- **Accessibility audit and fixes:**
  - Semantic landmarks, heading hierarchy
  - Keyboard navigation for all interactive elements
  - Focus trapping in modals/drawers with focus return
  - ARIA labels, live regions for status updates
  - Color contrast (WCAG AA)
  - Leaflet accessibility mitigations
  - Screen reader testing on critical flows
- **Performance optimization:**
  - Lighthouse audits and fixes
  - Bundle analysis and code splitting (dynamic imports for Leaflet, charts)
  - Image optimization (lazy loading, WebP)
  - Critical CSS inlining
  - Prefetch/preload hints
- **SEO finalization:**
  - Meta tags for all public pages
  - Sitemap generation
  - robots.txt
  - OG image
  - Cloud Function for dynamic public alert meta
  - `noindex` on all private routes
- **PWA finalization:**
  - Service worker caching strategies
  - Offline fallback page
  - App manifest with proper icons
  - Install prompt
- **Security hardening:**
  - Firebase App Check integration
  - Final security rules review
  - Dependency audit (`npm audit`)
  - Manual penetration test of municipality scope boundaries
- **Monitoring setup:**
  - Cloud Logging integration
  - Error boundaries with crash reporting
  - Uptime monitoring on public routes
  - Firestore export schedule
- **Documentation:**
  - README with setup instructions
  - Architecture documentation
  - Cloud Functions API documentation
  - Deployment guide
  - Superadmin bootstrap guide
