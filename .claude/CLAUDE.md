# Bantayog Alert — Claude Instructions

## Project Overview
Bantayog Alert is a disaster reporting, emergency alerting, and coordination platform for Camarines Norte, Philippines. Built on Firebase (Auth, Firestore, Storage, Functions, FCM) with a React 18 + Vite + Tailwind CSS frontend.

## Architecture (per SPECS.md)

### Stack
- **UI**: React 18 + TypeScript + Vite + Tailwind CSS v4
- **Backend**: Firebase (Auth, Firestore, Storage, Cloud Functions v2, FCM, Hosting)
- **State**: React Query (async) + Zustand (sync UI state)
- **Routing**: React Router v6
- **Mapping**: Leaflet + React-Leaflet
- **PWA**: vite-plugin-pwa with Workbox
- **Testing**: Vitest + React Testing Library + Playwright

### Three-Tier Report Model
| Collection | Visibility | Contains |
|------------|-----------|----------|
| `reports` | Public (verified only) + owner | Sanitized text, approx location, thumbnails, public status |
| `report_private` | Owner + admin | Exact location, raw media, reporter contact, raw description |
| `report_ops` | Admin only | Workflow state, priority, routing, admin notes, contact snapshots |

### RBAC Roles
- `citizen` — submit reports, view public feed + alerts, track own reports
- `municipal_admin` — triage/route/resolve reports in own municipality, manage contacts, view analytics
- `provincial_superadmin` — province-wide access, manage all admins

### Workflow States
`pending` → `verified` → `dispatched` → `acknowledged` → `in_progress` → `resolved`
                ↓
           `rejected` (terminal)

### Municipality Scope (12 municipalities)
Basud, Capalonga, Daet, Jose Panganiban, Labo, Mercedes, Paracale, San Lorenzo Ruiz, San Vicente, Santa Elena, Talisay, Vinzons

## Phase Progress
- **Phase 1: Foundation** ✅ COMPLETE
- **Phase 2: Domain Model & Backend Contracts** — NEXT

## Key Files
- `SPECS.md` — Full specification (source of truth)
- `src/shared/contracts/` — TypeScript types and Zod schemas
- `src/shared/lib/store.ts` — Zustand UI store
- `src/firebase/config.ts` — Firebase SDK initialization

## Important Constraints
1. Municipality scope is a SERVER-SIDE security boundary (not just UI filter)
2. Map `MapContainer` must NEVER unmount — sibling architecture
3. Pending reports NOT visible to public until verified
4. Analytics powered by pre-aggregated data (clients never scan raw reports)
5. All writes to sensitive collections go through Cloud Functions
