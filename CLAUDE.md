<!-- GSD:project-start source:PROJECT.md -->
## Project

**Bantayog Alert**

Production-grade disaster reporting, official alerting, emergency coordination, and disaster-mapping platform purpose-built for the Province of Camarines Norte, Philippines. Citizens submit emergency reports with structured metadata and media, track reports through resolution, consume a real-time feed and map of verified incidents, and receive official alerts relevant to their municipality. Municipal Admins operate within a hard-scoped municipality boundary for triage, verification, routing, and coordination. Provincial Superadmins oversee all 12 municipalities with province-wide visibility.

**Core Value:** **Verified incidents are visible and actionable within seconds of confirmation** — citizens see real-time verified reports on map and feed; admins dispatch responders without delay; push alerts reach affected municipalities immediately.

### Constraints

- **Tech Stack**: Firebase + React 18 + Vite + Tailwind CSS — specified, not negotiable
- **Server-side Municipality Scope**: All municipality boundary enforcement must be in Firestore rules + Cloud Functions, never client-only filtering
- **Map Stability**: Leaflet MapContainer must never remount due to drawer/modal state changes — sibling layout architecture required
- **Pre-aggregated Analytics**: Clients never scan raw reports — Cloud Functions maintain analytics documents
- **Append-only Audit**: All significant state changes logged to immutable audit subcollections
- **Pending Reports Hidden**: Unverified reports not publicly visible; only submitting citizen sees their own pending reports
- **Performance Targets**: 90+/100 quality scorecard, Lighthouse ≥85 mobile, ≥95 desktop, LCP ≤2.5s, CLS ≤0.1
<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->
## Technology Stack

## Recommended Stack
### Core Technologies
| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| React | 18.3.28 | UI Framework | Stable, well-tested with React-Leaflet 4.x. React 19 available but requires react-leaflet 5 which has different API. |
| Vite | 8.0.3 | Build Tool | Fast HMR, native ESM, excellent DX. v8 is current as of April 2026. |
| TypeScript | 6.0.2 | Type Safety | Strict typing across client and Cloud Functions. v6 is current. |
| Tailwind CSS | 3.4.17 | Styling | **Stay on v3** — Tailwind v4 is a major rewrite (CSS-first config, no tailwind.config.js). v3.4.17 is the last v3 release and fully stable. |
### Firebase Backend
| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Firebase SDK (web) | 12.11.0 | Client Auth/Firestore/Storage | Current as of April 2026. Supports React 18 and 19. |
| firebase-functions | 7.2.2 | Cloud Functions v2 | Node 18+ required. Event-driven architecture for triggers. |
| firebase-admin | 13.7.0 | Admin SDK in Functions | Server-side operations, custom claims management. |
| Firebase Auth | - | Authentication | Email/password + Google OAuth with custom claims for RBAC. |
| Cloud Firestore | - | Database | Real-time listeners, security rules, offline persistence. |
| Firebase Storage | - | Media Storage | CDN-backed, security rules on paths. |
| FCM (Firebase Cloud Messaging) | - | Push Notifications | Topic-based and token-based delivery. |
| Firebase Hosting | - | Deployment | CDN, automatic SSL, SPA rewrites, preview channels. |
### Mapping
| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Leaflet | 1.9.4 | Map Library | Lightweight, open-source, tile-provider agnostic. |
| react-leaflet | 4.2.1 | React Bindings | **Must use v4 with React 18** — v5 requires React 19. v4.2.1 is the last v4 release. |
| @react-leaflet/core | 2.1.1 | Core Map Hooks | Required peer dependency for react-leaflet v4. |
| supercluster | 8.0.1 | Marker Clustering | Client-side geospatial clustering for map performance. |
### State Management & Data Fetching
| Technology | Version | Purpose | When to Use |
|------------|---------|---------|-------------|
| TanStack Query (React Query) | 5.96.2 | Async State/Caching | Firestore data fetching, caching, deduplication. |
| Zustand | 5.0.12 | Synchronous State | UI concerns: drawer state, map viewport, active filters. |
### Routing
| Technology | Version | Purpose | When to Use |
|------------|---------|---------|-------------|
| React Router | 6.5.0 | Client Routing | **Stay on v6** — React Router v7 is out but introduces breaking changes. v6 is stable and well-tested. |
| react-router-dom | 6.5.0 | DOM Bindings | v7 package renamed to react-router-dom; v6 still works. |
### Validation & Types
| Technology | Version | Purpose | When to Use |
|------------|---------|---------|-------------|
| Zod | 4.3.6 | Schema Validation | Shared validation schemas between client and Cloud Functions. |
| react-helmet-async | 3.0.0 | SEO Metadata | Per-route meta tags, OG tags, canonical URLs. |
### Image Handling
| Technology | Version | Purpose | When to Use |
|------------|---------|---------|-------------|
| browser-image-compression | 2.0.2 | Client Compression | Compress images before upload (max 1MB, 1920px). |
| sharp | 0.34.5 | Server Thumbnails | Cloud Function thumbnail generation (400px). |
### PWA / Offline
| Technology | Version | Purpose | When to Use |
|------------|---------|---------|-------------|
| vite-plugin-pwa | 1.2.0 | PWA Generation | Service worker + manifest generation via Workbox. **Note:** peer deps show Vite 3-7; Vite 8 may work but is untested. |
| Workbox | 7.4.0 | Service Worker Lib | Runtime caching, precaching, offline strategies. |
### Testing
| Technology | Version | Purpose | When to Use |
|------------|---------|---------|-------------|
| Vitest | 4.1.2 | Unit/Integration Testing | Vite-native, fast, component-level testing. |
| @testing-library/react | 16.3.2 | Component Testing | DOM testing with React Testing Library. |
| Playwright | 1.59.1 | E2E Testing | Multi-browser, reliable, parallel execution. |
### Development Tools
| Tool | Purpose | Notes |
|------|---------|-------|
| Firebase Emulator Suite | Local Development | Firestore, Functions, Auth, Storage emulators. |
| ESLint + Prettier | Code Quality | Linting and formatting. |
| GitHub Actions | CI/CD | Pre-merge gates, test execution. |
## Alternatives Considered
| Category | Recommended | Alternative | When to Use Alternative |
|----------|-------------|-------------|------------------------|
| React | 18.3.28 | 19.2.4 | Upgrade to React 19 if you also upgrade react-leaflet to v5 (different API). React 18 is more conservative. |
| Tailwind CSS | 3.4.17 | 4.2.2 | Use v4 for new projects — it has CSS-first config and better performance. v3 is recommended here for stability since project is in active development. |
| React Router | 6.5.0 | 7.14.0 | Use v7 for new projects — it's the future. v6 is recommended here for stability. |
| State Management | Zustand + React Query | Redux Toolkit | Zustand + React Query is lighter and fits this app's needs better. |
## What NOT to Use
| Avoid | Why | Use Instead |
|-------|-----|-------------|
| react-leaflet v5 with React 18 | v5 requires React 19; v4 API differs significantly | react-leaflet 4.2.1 with React 18 |
| Tailwind CSS v4 (for this project) | Major breaking changes from v3; project uses v3 config approach | Tailwind CSS 3.4.17 |
| React Router v7 (for this project) | Breaking changes from v6; new project layout | React Router 6.5.0 |
| @react-leaflet/core v3 | Only works with react-leaflet v5 | @react-leaflet/core 2.1.1 with react-leaflet 4.x |
## Installation
# Core dependencies
# Tailwind CSS v3 (NOT v4)
# Firebase
# Mapping
# State & Routing
# Validation & SEO
# Image Handling
# PWA
# Testing
## Version Compatibility
| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| react-leaflet 4.2.1 | React 18.x | **Critical**: v5 requires React 19 |
| react-leaflet 5.0.0 | React 19.x | New API, different from v4 |
| firebase SDK 12.x | React 18, 19 | Works with both |
| vite-plugin-pwa 1.2.0 | Vite 3-7 | Vite 8 untested but likely compatible |
| React Router 6.5.0 | React 18, 19 | v7 has breaking changes |
| TanStack Query 5.x | React 18, 19 | v5 is current |
| Zustand 5.x | React 18, 19 | Current version |
| Tailwind CSS 3.4.17 | Vite 8.x | Works |
| Tailwind CSS 4.x | Vite 8.x | **Incompatible** with v3 config approach |
## Critical Dependency Conflicts to Watch For
### 1. React-Leaflet + React Version Mismatch (HIGH SEVERITY)
### 2. Vite 8 + vite-plugin-pwa (MEDIUM SEVERITY)
### 3. Tailwind CSS v4 Breaking Changes (HIGH SEVERITY)
- No more `tailwind.config.js` (CSS-first config)
- New `@tailwindcss/vite` plugin required
- Different theme/breakpoint approach
### 4. React Router v7 vs v6 (LOW SEVERITY)
## React 18 Strict Mode + Leaflet
## Firebase v2 Cloud Functions Notes
### Node.js Version
- firebase-functions 7.2.2 requires Node 18+
- Use Node 20 LTS for Cloud Functions (recommended by Firebase)
### Cold Start Handling
- Functions v2 has improved cold starts but they still occur
- Use `keepAlive` and `maxInstances` for frequently-called functions
- Consider `onRequest` with `region` optimization
### Security Rules
- Always validate in Cloud Functions even with Firestore rules
- Rules + Function validation = defense in depth
- Custom claims verified in both layers
## PWA / Workbox Configuration for Disaster Apps
### Offline-First Strategy for Disaster Scenarios
## Sources
- npm registry version data (verified 2026-04-03)
- Firebase SDK 12.x documentation
- react-leaflet GitHub — peer dependency declarations
- Tailwind CSS v3.4 vs v4 migration guide
- vite-plugin-pwa documentation
- React 18 Strict Mode behavior with Map components
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd:quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd:debug` for investigation and bug fixing
- `/gsd:execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd:profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
