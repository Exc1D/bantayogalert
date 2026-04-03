# Phase 6: Real-time Map & Feed - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-04
**Phase:** 06-real-time-map-feed
**Mode:** auto (--auto flag)

---

## Gray Areas Discussed

All gray areas auto-resolved via `--auto` flag using recommended defaults.

### 1. Real-time Data Delivery

| Option | Description | Selected |
|--------|-------------|----------|
| Firestore onSnapshot → React Query cache | Real-time websocket + React Query cache management | ✓ |
| Raw onSnapshot without React Query | Direct component state management | |
| Polling with refetchInterval | TanStack Query background refetch | |

**[auto]** Real-time delivery — Q: "How should verified reports be delivered to map and feed in real-time?" → Selected: `onSnapshot` → React Query cache (recommended default)

**Rationale:** Combines Firestore's real-time websocket push (~1s latency) with React Query's cache invalidation, loading states, and deduplication. This is the standard Firebase + TanStack Query pattern.

---

### 2. Pin Rendering

| Option | Description | Selected |
|--------|-------------|----------|
| Custom L.divIcon with severity color + type icon | Colored circle per severity + inline SVG icon overlay | ✓ |
| Default Leaflet markers with popup | Standard blue markers, tap for popup | |
| L.circleMarker with color fill | CircleMarkers with severity color, no icon | |

**[auto]** Pin rendering — Q: "How should map pins represent report severity and type?" → Selected: Custom `L.divIcon` (recommended default)

**Rationale:** Severity-colored pins enable instant visual scanning of the map without tapping. Type icons give additional context at a glance. Supercluster already selected (D-98) so custom icons are feasible within that architecture.

---

### 3. Feed Card Density

| Option | Description | Selected |
|--------|-------------|----------|
| Compact cards (severity badge + type icon + location + time) | Single-row ~80px cards, fast to scan | ✓ |
| Full cards with thumbnail + description preview | Larger cards with media thumbnail, 2-3 lines text | |

**[auto]** Feed card density — Q: "How much information should each feed card show?" → Selected: Compact cards (recommended default)

**Rationale:** Compact cards load faster, scan quicker, and are consistent with mobile-first design. Thumbnails are available in the detail view. This prioritizes triage speed.

---

### 4. Filter Bar Location

| Option | Description | Selected |
|--------|-------------|----------|
| Sticky top of map/feed split | Shared filter bar above both views | ✓ |
| Separate filter positions per view | Different placement on map vs feed views | |

**[auto]** Filter bar — Q: "Where should the dual-canvas filter bar be positioned?" → Selected: Sticky top of map/feed split (recommended default)

**Rationale:** Single shared component avoids duplication and ensures filter state is consistent between map and feed views.

---

### 5. Report Detail Interaction

| Option | Description | Selected |
|--------|-------------|----------|
| Drawer on desktop, bottom sheet on mobile | Matches existing shell architecture | ✓ |
| Modal on desktop, full-screen on mobile | Different pattern from shell | |
| Same bottom sheet on both | No desktop-specific behavior | |

**[auto]** Report detail — Q: "How should clicking a pin/card open the report detail?" → Selected: Drawer on desktop, bottom sheet on mobile (recommended default)

**Rationale:** Matches existing Phase 4 shell architecture — WorkspaceDrawer for desktop, MobileShell slide-up modal pattern for mobile. Reuses existing `report-detail` ActivePanel type.

---

### 6. Cluster Visual Style

| Option | Description | Selected |
|--------|-------------|----------|
| CircleMarker with count label | Supercluster default, no custom assets | ✓ |
| Custom cluster icons | Requires icon asset creation | |

**[auto]** Cluster visual — Q: "How should clustered markers appear?" → Selected: CircleMarker with count (recommended default)

**Rationale:** Supercluster's default CircleMarker clusters require no custom assets. Click-to-zoom behavior is built-in.

---

### 7. Feed Pagination

| Option | Description | Selected |
|--------|-------------|----------|
| Cursor-based (startAfter + last doc) | Firestore-optimized, stable under concurrent writes | ✓ |
| Offset pagination | Simple but unstable under concurrent writes | |

**[auto]** Feed pagination — Q: "What pagination strategy for the report feed?" → Selected: Cursor-based (recommended default)

**Rationale:** Firestore's `startAfter(doc)` is the idiomatic approach. Offset pagination breaks when reports are added/removed concurrently.

---

## Auto-resolve Summary

All 7 gray areas resolved automatically via `--auto` flag. No user input required — all decisions align with recommended defaults based on codebase patterns and prior phase decisions.
