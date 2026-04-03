# Phase 5: Report Submission - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-03
**Phase:** 05-report-submission
**Areas discussed:** Form Layout & Routing, Location Picker Architecture, Media Upload UX

---

## Area 1: Form Layout & Routing

| Option | Description | Selected |
|--------|-------------|----------|
| Drawer (desktop) + full-screen modal (mobile) | `/app/report` route, 480px drawer on desktop, full-screen on mobile — follows D-62/D-65 patterns | ✓ |
| Dedicated full-page route for both | Separate `/app/report` page not tied to drawer | |

**User's choice:** (auto-selected — `--auto` mode) Drawer + modal pattern
**Notes:** Follows existing D-62 (drawer panels) and D-65 (mobile full-screen modal) from Phase 4 shell architecture.

---

## Area 2: Location Picker Architecture

| Option | Description | Selected |
|--------|-------------|----------|
| Dedicated LocationPickerMap component | New MapContainer instance for picker, separate from main map stability | ✓ |
| Overlay on existing map | Same Leaflet instance, draw temporary marker on top | |
| Reuse TestMap with mode="picker" prop | Adds draggable marker to existing map, fires callback | |

**User's choice:** (auto-selected — `--auto` mode) Dedicated LocationPickerMap component
**Notes:** Separation of concerns — picker has its own MapContainer. GPS auto-detect via navigator.geolocation + reverse geocode.

---

## Area 3: Media Upload UX

| Option | Description | Selected |
|--------|-------------|----------|
| Single file input with capture="environment" | `<input type="file" multiple capture="environment">` — camera default on mobile | ✓ |
| Separate Take Photo vs Choose Gallery buttons | Explicit choice between camera and gallery | |

**User's choice:** (auto-selected — `--auto` mode) Single file input with capture="environment"
**Notes:** Simpler UX, works universally. browser-image-compression for client-side compression to 1MB/1920px.

---

## Claude's Discretion

- Step count and order: 4 steps (Type+Severity → Description → Location+Media → Review+Submit)
- Compression library: browser-image-compression
- Geohash library: ngeohash
- Mobile step indicator: dot indicator
- Photo preview: thumbnail grid with remove button
- Draft persistence: idb library, one draft per user keyed by userId

## Deferred Ideas

None — all discussion stayed within Phase 5 scope.
