# Phase 6: Real-time Map & Feed - Context

**Gathered:** 2026-04-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Citizens and admins see verified reports as real-time map pins and paginated feed cards. Verified reports appear within seconds of being confirmed by an admin (Phase 9). Both the map view and feed view share the same filter state, and clicking a report opens a detail view.

**Delivers:**
- Real-time Firestore listener delivers verified reports to both map pins and feed cards
- Map pins colored by severity (critical=red, high=orange, medium=yellow, low=green) with incident type icon
- Supercluster groups dense pins; declustering on zoom reveals individual markers
- Municipality boundary GeoJSON overlay on map
- Dual-canvas filter bar (type, severity, municipality, date range) filters map and feed simultaneously
- Paginated feed of verified report cards sorted by createdAt DESC
- Clicking map pin opens report detail drawer (desktop) or bottom sheet (mobile)
- Map viewport preserved when workspace drawer opens/closes

**Constraints (non-negotiable from prior phases):**
- react-leaflet 4.2.1, Leaflet 1.9.4 (v4 requires React 18)
- Supercluster for marker clustering (D-98, PROJECT.md)
- MapContainer never remounts (sibling layout, D-56 from Phase 4)
- MapRefContext / useMap() hook shares Leaflet instance (D-67 from Phase 4)
- invalidateSize() on drawer's transitionend (D-61 from Phase 4)
- `reports/` Firestore collection — only verified reports visible (Phase 3 rules)
- IncidentType, Severity, WorkflowState enums already defined (src/types/report.ts)
- WORKFLOW_TO_PUBLIC_STATUS mapping ready (src/types/status.ts)
- Municipality GeoJSON at `/public/data/municipalities.geojson` via loadMunicipalitiesGeoJSON()
- MobileShell uses `display: none/block` for map tab (D-57 from Phase 4)
- TanStack Query 5.x already integrated (Phase 1)
- Zustand 5.x for UI state (Phase 1)
</domain>

<decisions>
## Implementation Decisions

### Real-time Data Delivery
- **D-108:** Firestore `onSnapshot` listener on `reports` collection (verified-only via query filter `workflowState == 'verified'`) delivers new reports within seconds
- **D-109:** `onSnapshot` results sync into TanStack Query cache via `queryClient.setQueryData` — maintains React Query's cache invalidation and loading states while enabling real-time push
- **D-110:** Single shared listener managed at shell level; map pins and feed card components consume via TanStack Query hooks (`useQuery` reads cache, `onSnapshot` updates it)

### Map Pin Rendering
- **D-111:** Custom `L.divIcon` per marker — colored circle (severity) + incident type icon overlay
  - Critical: `#dc2626` (red-600), High: `#f97316` (orange-500), Medium: `#eab308` (yellow-500), Low: `#22c55e` (green-500)
  - Icon inside circle: flood (water drop), landslide (triangle), fire (flame), earthquake (zigzag), medical (cross), vehicle (car), crime (shield), other (exclamation)
- **D-112:** Marker click → `useUIStore.setActivePanel('report-detail')` + `setDrawerOpen(true)` on desktop; navigate to detail bottom sheet route on mobile
- **D-113:** Selected marker: slightly larger scale + white border ring

### Supercluster Integration
- **D-114:** Reports converted to GeoJSON Feature objects: `geometry: { type: 'Point', coordinates: [location.lng, location.lat] }`, properties: `{ id, type, severity, createdAt }`
- **D-115:** Supercluster index rebuilt whenever `reports` query cache updates
- **D-116:** `moveend`/`zoomend` → recalculate clusters at current viewport bounds + zoom level
- **D-117:** Cluster markers rendered as `L.circleMarker` with count label inside; click → `map.fitBounds(cluster.properties.cluster ? true : false, { padding: [50, 50] })`

### Municipality Boundary Overlay
- **D-118:** GeoJSON layer from `loadMunicipalitiesGeoJSON()` (already implemented in src/lib/geo/municipality.ts)
- **D-119:** Municipality boundaries rendered as `L.geoJSON` with transparent fill (`fillOpacity: 0.05`) and stroke color `#6b7280` (gray-500), weight 1.5
- **D-120:** Boundary layer non-interactive (no click events) — purely visual reference

### Filter Bar
- **D-121:** Single `FilterBar` component shared between desktop map view and mobile feed view
- **D-122:** Filter state stored in Zustand: `{ type: IncidentType | null, severity: Severity | null, municipalityCode: string | null, dateRange: { from: Date | null, to: Date | null } }`
- **D-123:** Filters applied client-side to cached reports (no Firestore re-query for type/severity/date — server-side filter only for municipality when scoped)
- **D-124:** Active filters shown as dismissible chips below the filter bar
- **D-125:** Desktop: filter bar sticky below nav rail, above map/feed split. Mobile: filter bar at top of feed tab, collapses to "Filters" button that expands a sheet

### Feed Card Design
- **D-126:** Compact cards — severity badge (colored dot + label) + incident type icon + municipality name + relative time + public status label
- **D-127:** Card dimensions: full-width, ~80px height, single line of info
- **D-128:** Feed sorted by `createdAt DESC` (newest first)
- **D-129:** Feed pagination: cursor-based using `startAfter(lastDoc)` + 20 items per page — Firestore-optimized, stable under concurrent writes
- **D-130:** Infinite scroll on feed — load next page when last card enters viewport (IntersectionObserver)

### Report Detail — Desktop
- **D-131:** Desktop: click pin or card → `useUIStore.setActivePanel('report-detail')` → opens WorkspaceDrawer (480px, right side)
- **D-132:** Drawer content panel `report-detail` renders `<ReportDetailPanel reportId={id} />`
- **D-133:** Drawer header: severity badge + incident type + "Verified" label + close button
- **D-134:** Drawer body: description, location name (barangay + municipality), media thumbnails (if any), activity timeline (admin-only visible states)

### Report Detail — Mobile
- **D-135:** Mobile: clicking pin or card navigates to `/app/report/:id` — renders full-screen bottom sheet over map
- **D-136:** Bottom sheet: draggable handle, snaps to 40%/90% height, scrim overlay on map
- **D-137:** Sheet content same as desktop drawer — shared `<ReportDetailPanel>` component

### Map-Feed Split (Desktop)
- **D-138:** Desktop ≥1280px: left ~60% map, right ~40% feed panel (resizable in future)
- **D-139:** Feed panel scrolls independently; filter bar shared at top of feed panel
- **D-140:** Map and feed both scroll/list independently — no nesting

### Feed-Map Toggle
- **D-141:** Desktop nav "Map" item shows map view (map + drawer); "Feed" item shows feed-only view with map thumbnail + "View on Map" link that opens map view
- **D-142:** Alternatively, a split layout (D-138) renders both simultaneously — **Claude's discretion: implement split view first; toggle is lower priority**

### Map Viewport Preservation
- **D-143:** Map viewport (center, zoom, selectedMarkerId) stored in Zustand: `{ mapViewport: { center: [lat, lng], zoom: number }, selectedMarkerId: string | null }`
- **D-144:** Zustand state updated on `moveend`/`zoomend` events; restored on drawer close (map already persisted via sibling architecture)

### Firebase Query Structure
- **D-145:** Primary query: `reports` collection, filter `workflowState == 'verified'`, order by `createdAt DESC`, limit 20 (paginated)
- **D-146:** Municipality-filtered query: same as above + `municipalityCode == scope` filter (for municipal admin view)
- **D-147:** Real-time: single `onSnapshot` on the base query (no pagination) — delivers all verified reports, client-side filtered/paginated

### Empty & Loading States
- **D-148:** Map: if no verified reports in viewport, show centered "No verified reports in this area" message over map
- **D-149:** Feed: if no reports match filters, show "No reports match your filters" with "Clear filters" button
- **D-150:** Initial load: skeleton cards (3-4) while first query resolves

### Severity Color System
- **D-151:** Severity → Tailwind color class mapping for badges and pins:
  - Critical → `bg-red-600 text-white`
  - High → `bg-orange-500 text-white`
  - Medium → `bg-yellow-500 text-black`
  - Low → `bg-green-500 text-white`
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Definition
- `.planning/PROJECT.md` — Core value (real-time verified reports visible in seconds), map stability via sibling layout, Supercluster for clustering (D-98), three-tier report split
- `.planning/REQUIREMENTS.md` §Report Feed & Map — FM-01 through FM-09
- `.planning/CLAUDE.md` — Stack locked: react-leaflet 4.2.1, Leaflet 1.9.4, Tailwind 3.4.17, TanStack Query 5.x, Zustand 5.x

### Prior Phase Context
- `.planning/phases/04-desktop-mobile-shell/04-CONTEXT.md` — D-55 through D-74 (shell layout, MapContainerWrapper, WorkspaceDrawer, sibling architecture, useMap() hook, invalidateSize())
- `.planning/phases/05-report-submission/05-CONTEXT.md` — D-75 through D-107 (report types, submission, form patterns)
- `.planning/phases/02-domain-model-backend-contracts/02-CONTEXT.md` — D-21 through D-42 (types, schemas, state machine, geohash)

### Phase-Internal
- `.planning/ROADMAP.md` §Phase 6 — Success criteria (8 must-be-TRUE statements)
- `src/types/report.ts` — IncidentType, Severity, Report, GeoLocation interfaces and Zod schemas
- `src/types/status.ts` — WORKFLOW_TO_PUBLIC_STATUS, OWNER_STATUS_LABELS mappings
- `src/stores/uiStore.ts` — useUIStore with activePanel, drawerOpen, activeTab state
- `src/app/shell/MapContainerWrapper.tsx` — Leaflet instance management via MapRefContext (D-67, D-68)
- `src/app/shell/WorkspaceDrawer.tsx` — Drawer animation, transitionend invalidateSize pattern (D-61)
- `src/app/shell/MobileShell.tsx` — display:none/block for map tab preservation (D-57)
- `src/lib/geo/municipality.ts` — loadMunicipalitiesGeoJSON(), MUNICIPALITIES constant
- `src/components/map/TestMap.tsx` — Existing Leaflet usage pattern with GeoJSON overlay
- `src/components/map/LocationPickerMap.tsx` — Location picker map as reference for Leaflet component patterns
</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `MapRefContext` / `useMap()` — Leaflet map instance shared across shell without prop drilling
- `loadMunicipalitiesGeoJSON()` — municipality boundary GeoJSON already available
- `IncidentType`, `Severity` enums — no need to define
- `WORKFLOW_TO_PUBLIC_STATUS` — already maps workflow states to citizen-facing strings
- `useUIStore` Zustand store — activePanel/drawerOpen for report-detail panel
- `WorkspaceDrawer` — already handles `report-detail` panel type
- `browser-image-compression` — already available from Phase 5
- Supercluster npm package — needs installation (not yet in package.json)

### Established Patterns
- Sibling layout: MapContainerWrapper renders `{children}` alongside the map div
- Zustand for UI state, TanStack Query for async server state
- CSS `transform: translateX()` for drawer slide animation
- `L.divIcon` for custom marker rendering (Leaflet standard pattern)
- Firestore `onSnapshot` for real-time; queryClient.setQueryData to sync into React Query

### Integration Points
- `reports` Firestore collection (verified docs only via query)
- WorkspaceDrawer: add `report-detail` panel type → existing `PANEL_LABELS` + `DrawerContent` switch
- Mobile `/app/report/:id` route — new route in ShellRouter child routes
- Filter state: new Zustand slice `useFilterStore`
- Supercluster index: new `useSupercluster(reportFeatures, bounds, zoom)` hook
</code_context>

<specifics>
## Specific Ideas

No user-provided UI references yet — no Figma designs or reference apps specified for Phase 6. Aesthetic decisions (exact pin sizes, card spacing, typography) follow existing Tailwind theme from Phase 1.
</specifics>

<deferred>
## Deferred Ideas

- **Map-Feed Toggle** (vs split view): D-142 — split view implemented first, toggle is nice-to-have
- **Resizable map/feed split**: Fixed 60/40 for v1; resizable split deferred to Phase 12
- **Report thumbnails in feed cards**: Compact card design deferred photo thumbnails; full cards with thumbnails could be Phase 12 enhancement
- **"View on Map" from feed card**: Nice-to-have shortcut; primary interaction is click-to-detail

### Reviewed Todos (not folded)
None — no pending todos matched Phase 6 scope.
</deferred>
