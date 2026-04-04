# Phase 12: Hardening, PWA, SEO & Release - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in `12-CONTEXT.md`; this log preserves the alternatives considered.

**Date:** 2026-04-04T22:01:55+08:00
**Phase:** 12-hardening-pwa-seo-release
**Areas discussed:** Public surfaces and routing, Metadata and indexing strategy, Offline resilience and PWA UX, App Check and release hardening

---

## Public surfaces and routing

| Option | Description | Selected |
|--------|-------------|----------|
| Dedicated public route family | Introduce `/`, `/public/map`, `/public/alerts`, and `/public/alerts/:alertId` as explicit public surfaces while keeping authenticated work under `/app/*`. | ✓ |
| Minimal public shell | Add only a landing page at `/` and keep map/alerts inside the authenticated app. | |
| Shared route tree | Reuse `/app/*` routes and toggle visibility/auth behavior to make some pages public. | |

**User's choice:** Auto-selected recommended default: dedicated public route family
**Notes:** `[auto] Selected all gray areas.` The recommended default fits the roadmap's explicit public-surface requirements, keeps indexing boundaries clear, and avoids weakening existing auth-gated routes.

---

## Metadata and indexing strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Route-level metadata plus static SEO assets | Use `react-helmet-async` for page metadata, add `robots.txt` and `sitemap.xml`, and apply `noindex` to all private routes. | ✓ |
| Static-only metadata | Set a single app title/description and rely on static hosting files only. | |
| Server-only metadata | Move all metadata generation to server/render functions rather than route components. | |

**User's choice:** Auto-selected recommended default: route-level metadata plus static SEO assets
**Notes:** This matches the current SPA architecture, uses tooling already installed, and limits server-render work to the one route that actually needs dynamic OG tags.

---

## Offline resilience and PWA UX

| Option | Description | Selected |
|--------|-------------|----------|
| Client-managed reconnect queue | Extend IndexedDB draft persistence with a pending-submission queue and auto-retry from the app when connectivity returns. | ✓ |
| Service-worker-only background sync | Rebuild submission flow around Workbox/background sync so retries happen fully in the service worker. | |
| Draft-only persistence | Keep offline drafts only and require manual resubmission later. | |

**User's choice:** Auto-selected recommended default: client-managed reconnect queue
**Notes:** The current report flow uses authenticated Firebase uploads and callable functions, so app-managed retry is the lowest-risk release path. An offline fallback page and visible connection status still remain part of the phase.

---

## App Check and release hardening

| Option | Description | Selected |
|--------|-------------|----------|
| Staged enforcement and remediation pass | Switch to a real App Check provider in production behind rollout controls and prioritize a11y/performance fixes on critical flows. | ✓ |
| Immediate hard enforcement everywhere | Enable production enforcement without rollout toggles and treat all remaining hardening as follow-up. | |
| Stay in audit mode | Keep the existing placeholder audit setup and defer enforcement past Phase 12. | |

**User's choice:** Auto-selected recommended default: staged enforcement and remediation pass
**Notes:** This keeps local/emulator flows working, respects the two-week burn-in decision from Phase 3, and aligns the hardening effort with the roadmap scorecard rather than adding new product scope.

---

## the agent's Discretion

- Exact landing-page visual design and copy hierarchy
- Connection-status presentation pattern
- Install-prompt timing and dismissal behavior
- Lighthouse/a11y tooling setup and the precise lazy-loading mechanics

## Deferred Ideas

- Full service-worker background sync for report submission mutations
- Dynamic sitemap generation for every public alert detail page
- Monitoring, crash-reporting, export automation, and release-documentation tasks from the broader spec but outside the current roadmap scope
