# Phase 5: Report Submission - Context

**Gathered:** 2026-04-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Citizens can submit emergency reports with type, severity, location, description, and optional media through a guided multi-step form backed by a Cloud Function that atomically creates three Firestore documents.

**Delivers:**
- Multi-step form: type/severity → description → location → media → review → submit
- Leaflet location picker with pin-drop + GPS auto-detect
- Municipality/barangay selectors from catalog data
- Client-side image compression (max 1MB, 1920px, JPEG/WebP)
- Cloud Function (`submitReport`) creates three docs: `reports`, `report_private`, `report_ops`
- Approximate geohash (9-char) in `reports/`; exact coords in `report_private/`
- IndexedDB auto-save draft on abandonment
- Submitting citizen sees own report immediately via `report_private` real-time listener

**Constraints (non-negotiable from prior phases):**
- React 18.3.1, react-leaflet 4.2.1, Tailwind CSS 3.4.17
- MapContainer never remounts (sibling layout, D-02 from PROJECT.md)
- Three-tier report split: `reports` (public/verified) / `report_private` (owner+admin) / `report_ops` (admin-only)
- Geohash public locations, exact coords in report_private (D-26, D-27)
- IncidentType, Severity enums already defined (src/types/report.ts)
- ReportSchema, ReportPrivateSchema already defined (src/types/report.ts)
- WORKFLOW_TO_OWNER_STATUS mapping ready (src/types/status.ts)
- Auth context via useAuth() (src/lib/auth/AuthProvider.tsx)
- Desktop/Mobile shells already exist (src/app/shell/)
</domain>

<decisions>
## Implementation Decisions

### Form Layout & Routing
- **D-75:** Report form at `/app/report` route — accessible from both desktop and mobile
- **D-76:** Desktop (≥1280px): Form renders inside the 480px workspace drawer as a drawer panel. Content scrolls within the drawer. Step indicator + back navigation at top.
- **D-77:** Mobile (≤768px): Form opens as a full-screen modal sliding up from bottom (per D-65). Same component, different wrapper.
- **D-78:** Form uses a step-by-step wizard pattern with persistent step indicator showing current step and total steps
- **D-79:** Each step validates before advancing. "Back" preserves entered data. "Submit" is only on the final review step.

### Location Picker Architecture
- **D-80:** Dedicated `LocationPickerMap` component at `src/components/map/LocationPickerMap.tsx` — separate MapContainer instance for the picker (not the main map)
- **D-81:** LocationPickerMap renders a draggable marker on an embedded Leaflet map. Marker position (lat/lng) exposed via `onLocationChange` callback prop
- **D-82:** GPS auto-detect: `navigator.geolocation.getCurrentPosition()` → place marker at returned coords → trigger reverse geocode to fill municipality/barangay selectors
- **D-83:** If GPS fails or returns coords outside Camarines Norte bounds, fall back to manual pin placement with initial map center at user's municipality (from auth claims) or province center
- **D-84:** Coordinates validated against Camarines Norte bounds (lat 13.8°–14.8°N, lng 122.3°–123.3°E) before submission
- **D-85:** Geohash (9-char precision) computed client-side from exact coords for the public `reports/` document

### Media Upload
- **D-86:** File input: `<input type="file" accept="image/jpeg,image/png,image/webp" multiple capture="environment">` — rear camera default on mobile, gallery picker fallback
- **D-87:** Client-side compression via `browser-image-compression` library — target: 1MB max, 1920px longest edge, JPEG/WebP output. Compression applied before upload.
- **D-88:** Upload to Firebase Storage at path: `reports/{reportId}/{filename}` — Cloud Function provides signed URL or upload token
- **D-89:** Upload progress shown per file. Retry on failure. Remove individual files before submit.
- **D-90:** Max 5 images per report (enforced in Zod schema)

### Municipality/Barangay Selection
- **D-91:** Municipality selector: dropdown populated from `MUNICIPALITIES` constant (src/lib/geo/municipality.ts)
- **D-92:** Barangay selector: filtered dropdown, populated from barangay catalog (Firestore `municipalities/{code}/barangays` collection)
- **D-93:** If GPS location is used, municipality auto-selects from reverse geocode; barangay also auto-fills if unambiguous
- **D-94:** If user manually drops pin, municipality/barangay selectors update to reflect pin location (reverse geocode)
- **D-95:** User can override auto-detected municipality/barangay — manual selection always takes precedence

### Cloud Function (submitReport)
- **D-96:** Single callable `submitReport` — receives: type, severity, description, municipalityCode, barangayCode, exactLocation, mediaUrls[], reporterId
- **D-97:** Function computes geohash from exactLocation for the public document
- **D-98:** Function creates three docs atomically via `firestore.runTransaction()`:
  - `reports/{newId}`: public fields + geohash location + `workflowState: 'pending'`
  - `report_private/{newId}`: exactLocation + reporterEmail + reporterName + ownerStatus + activityLog entry
  - `report_ops/{newId}`: empty initial doc (admin fills on triage)
- **D-99:** Function validates: user is authenticated, role is citizen, municipalityCode matches user's scope (citizens can report for any municipality)
- **D-100:** Rate limiting: CF checks per-user report count; denies if over limit (D-54 from Phase 3)

### Form Draft Persistence
- **D-101:** Auto-save form draft to IndexedDB via `idb` library after each step completion
- **D-102:** Draft key: `report-draft-{userId}` — one active draft per user
- **D-103:** On navigation to `/app/report`, if draft exists, prompt: "Resume draft or start fresh?"
- **D-104:** Draft cleared on successful submission

### Citizen Feedback Post-Submit
- **D-105:** On submit: navigate to `/app/track/{reportId}` (report detail page showing owner status)
- **D-106:** Report detail page listens to `report_private/{reportId}` for real-time owner status updates
- **D-107:** Initial owner status shown immediately: "Submitted" (from WORKFLOW_TO_OWNER_STATUS[pending])

### Claude's Discretion
- Step order and exact step count: 4 steps (Type+Severity → Description → Location+Media → Review+Submit) — keeps form digestible
- Mobile step indicator: compact dot indicator at top (not numbered)
- Compression library: browser-image-compression (most widely used for this purpose in React ecosystem)
- Geohash library: ngeohash (lightweight, no dependencies) — install if not already present
- Drawer on desktop: form header + step indicator sticky at top; form content scrolls
- Photo preview: grid of thumbnails before submit, remove button per photo
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Definition
- `.planning/PROJECT.md` — Core value, three-tier report, map stability, server-side municipality scope
- `.planning/REQUIREMENTS.md` §Report Submission — RPT-01 through RPT-11
- `.planning/CLAUDE.md` — Stack locked: React 18.3.1, react-leaflet 4.2.1, Tailwind 3.4.17

### Prior Phase Context
- `.planning/phases/01-project-foundation-tooling/01-CONTEXT.md` — D-01 through D-20
- `.planning/phases/02-domain-model-backend-contracts/02-CONTEXT.md` — D-21 through D-42 (types, schemas, state machine, geohash)
- `.planning/phases/03-auth-role-model/03-CONTEXT.md` — D-43 through D-54 (auth, custom claims, rate limiting)
- `.planning/phases/04-desktop-mobile-shell/04-CONTEXT.md` — D-55 through D-74 (shell layout, drawer, mobile tabs)

### Phase-Internal
- `.planning/ROADMAP.md` §Phase 5 — Success criteria (10 must-be-TRUE statements)
- `src/types/report.ts` — IncidentType, Severity enums, ReportPublic, ReportPrivate, ReportOps interfaces, Zod schemas
- `src/types/status.ts` — WORKFLOW_TO_OWNER_STATUS mapping
- `src/types/workflow.ts` — VALID_TRANSITIONS, canTransition()
- `src/types/geo.ts` — Municipality, Barangay interfaces, MunicipalitySchema
- `src/lib/geo/municipality.ts` — MUNICIPALITIES constant, getMunicipality(), loadMunicipalitiesGeoJSON()
- `src/lib/auth/AuthProvider.tsx` — useAuth() hook with custom claims
- `src/components/map/TestMap.tsx` — Existing Leaflet map pattern to follow for LocationPickerMap
- `src/app/shell/DesktopShell.tsx` — Existing drawer state management pattern
- `src/app/shell/MobileShell.tsx` — Mobile modal pattern for report form
</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/types/report.ts` — IncidentType, Severity enums, GeoLocation, ReportMedia, Report + Zod schemas all ready
- `src/types/status.ts` — WORKFLOW_TO_OWNER_STATUS: maps pending → "Submitted", verified → "Verified", etc.
- `MUNICIPALITIES` constant at `src/lib/geo/municipality.ts` — 12 municipalities, no need to re-fetch
- `useAuth()` hook — provides user + custom claims (municipalityCode available for GPS fallback)
- `browser-image-compression` npm package — standard for client-side image compression
- `TestMap.tsx` — MapContainer usage pattern to replicate for LocationPickerMap

### Established Patterns
- Drawer panel pattern: `DesktopShell` passes `isOpen` + `onClose` to drawer content panels via props
- MobileShell modal: CSS `transform: translateY()` slide-up animation, `z-index` above map and tab bar
- Form validation: Zod schemas defined, need React Hook Form + Zod resolver pattern
- Real-time listener: `onSnapshot` from Firestore for `report_private` owner status

### Integration Points
- `/app/report` route added to `src/app/router.tsx`
- Cloud Function `submitReport` callable: deployed in `functions/src/`
- Storage path: `reports/{reportId}/` — CF provides upload token
- Auth: userId from `useAuth().user?.uid`, email from `useAuth().user?.email`
- Draft persistence: IndexedDB via `idb` — new dependency if not present
</code_context>

<specifics>
## Specific Ideas

No user-provided UI references yet — Phase 5 is the first user-facing form. Aesthetic decisions (colors, spacing, typography) follow existing Tailwind theme from Phase 1.
</specifics>

<deferred>
## Deferred Ideas

None — Phase 5 scope stayed well-bounded to single report submission flow.

### Reviewed Todos (not folded)
None — no pending todos matched Phase 5 scope.
</deferred>
