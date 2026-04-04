# Phase 12: Hardening, PWA, SEO & Release - Context

**Gathered:** 2026-04-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 12 hardens the existing Bantayog Alert product for release readiness. The scoped work is limited to the roadmap items already defined: offline report submission resilience, a visible connection-state experience, indexable public surfaces, SEO/meta assets, private-route noindex protection, dynamic sharing metadata for public alerts, App Check rollout out of audit mode, and the accessibility/performance remediation needed to hit the release scorecard. This phase improves and exposes the product that already exists; it does not add new citizen or admin capabilities beyond those release-facing surfaces.

</domain>

<decisions>
## Implementation Decisions

### Public surfaces and routing
- **D-220:** Replace the current `/ -> /app` redirect with a real public landing page at `/`, and introduce explicit public routes at `/public/map`, `/public/alerts`, and `/public/alerts/:alertId`. Authenticated/product routes stay under `/app/*`, and auth routes stay under `/auth/*`.
- **D-221:** Public map and alerts pages reuse existing read-only report-map, feed, and alerts components where possible, but they must expose only already-public data. No owner-only, admin-only, or triage-only details move onto the public surface in this phase.
- **D-222:** Public alert detail pages become the canonical shareable/indexable dynamic public content for v1. Verified report detail pages remain non-indexed and stay outside the public SEO surface.

### Metadata and indexing strategy
- **D-223:** Route-level `react-helmet-async` metadata becomes the authority for page titles, descriptions, canonicals, and OG/Twitter tags. Every public surface sets explicit metadata; all `/app/*`, `/auth/*`, and admin-only pages set `robots: noindex, nofollow`.
- **D-224:** `robots.txt` and `sitemap.xml` are shipped as static assets from `public/`. The v1 sitemap includes the landing page, `/public/map`, and `/public/alerts`. Dynamic alert detail URLs may be omitted from the static sitemap for now.
- **D-225:** Dynamic OG support is limited to `/public/alerts/:alertId` and is implemented with a Firebase Hosting rewrite to an HTTP Cloud Function that returns crawler-friendly metadata and redirects browsers back into the SPA route. This phase does not introduce full SSR for the rest of the app.

### Offline resilience and PWA UX
- **D-226:** The existing IndexedDB report draft remains the source of truth for in-progress work. Phase 12 adds a second persisted "pending submission" queue for report submissions that fail because the user is offline or the submit request dies before completion.
- **D-227:** Automatic resubmission is client-managed when connectivity returns while the authenticated app is open. Do not require a full service-worker background-sync mutation pipeline for v1 because the current Firebase callable plus upload flow is app-centric and auth-dependent.
- **D-228:** Connection status is a shared app-level affordance: a lightweight but persistent offline indicator in the shell, with stronger inline guidance on report submission screens when the network is unavailable.
- **D-229:** Keep the current `vite-plugin-pwa` GenerateSW model and prompt-based registration. Extend it with an offline fallback document and release-grade install/connection UX rather than replacing the service-worker architecture.

### App Check and release hardening
- **D-230:** App Check moves from the current placeholder `CustomProvider` audit setup to a real production web provider, but rollout stays staged behind environment/config toggles so local/emulator flows and burn-in verification can continue without forcing enforcement everywhere at once.
- **D-231:** Release hardening focuses on remediation in existing critical flows: landing/public alerts/public map, login/register, report submission, desktop/mobile shell navigation, and admin analytics/audit surfaces. This phase is not a monitoring/documentation expansion phase unless directly required to satisfy the roadmap criteria.
- **D-232:** Performance work should prefer route/code splitting and targeted lazy loading for heavy surfaces such as Leaflet-driven map routes and analytics charts before attempting deeper architectural rewrites.
- **D-233:** Accessibility work treats the feed/list views as the accessible alternative to the map. Keyboard/focus semantics, landmarks, icon-button labels, status announcements, and contrast fixes take priority over trying to make the Leaflet canvas itself fully screen-reader-native.

### the agent's Discretion
- Exact landing-page visual language and copy hierarchy, as long as it serves the public onboarding and SEO goals.
- The specific connection-status presentation pattern (top banner, shell bar, inline chip) as long as offline state is visible and understandable.
- Install-prompt timing and dismissal behavior, as long as the existing prompt-based registration model is preserved.
- The exact Lighthouse/a11y tooling setup and code-splitting mechanics, as long as they support the Phase 12 scorecard targets.

</decisions>

<specifics>
## Specific Ideas

- Auto mode selected the standard release-ready route split: public marketing and discoverability on `/` and `/public/*`, authenticated work on `/app/*`.
- Auto mode selected app-managed offline retry backed by IndexedDB instead of a service-worker-only background sync pipeline.
- Auto mode selected route-level metadata management plus a narrow Cloud Function rewrite for shareable public alert detail pages.
- No user-supplied visual references were provided for the landing page or offline/install UX; standard product-quality approaches are acceptable.

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase scope and release criteria
- `.planning/ROADMAP.md` section `Phase 12: Hardening, PWA, SEO & Release` - goal, success criteria, and scope boundary for the phase
- `.planning/REQUIREMENTS.md` sections `PWA & Offline`, `SEO & Public Surfaces`, and `Infrastructure & Security` - `PWA-03`, `PWA-04`, `SEO-01` through `SEO-06`, and `SEC-01`
- `.planning/PROJECT.md` - project constraints around public vs private data, map stability, pre-aggregated analytics, and performance targets

### Product spec
- `SPECS.md` section `10.5 PWA and Offline` - intended offline draft, install prompt, and connection-state behavior
- `SPECS.md` section `10.6 Error Handling and Resilience` - reconnect, retry, and offline failure handling expectations
- `SPECS.md` sections `11.1` through `11.5` - public/private surface classification, route-level metadata, dynamic public alert OG strategy, robots, sitemap, and private-route noindex policy
- `SPECS.md` section `12.7 Performance Testing` - Lighthouse, LCP, CLS, and bundle targets for release
- `SPECS.md` section `12.8 Accessibility Testing Focus` - semantic, keyboard, focus, contrast, and Leaflet accessibility mitigations
- `SPECS.md` section `Phase 12: Hardening, A11y, Performance Tuning & Release Verification` - broader release-hardening deliverables to interpret alongside the stricter roadmap scope

### Prior phase decisions
- `.planning/phases/01-project-foundation-tooling/01-CONTEXT.md` - PWA registration model, Workbox strategy, manifest decisions, and class-based dark mode
- `.planning/phases/03-auth-role-model/03-CONTEXT.md` - App Check audit-mode decision and enforcement deferred to Phase 12
- `.planning/phases/04-desktop-mobile-shell/04-CONTEXT.md` - route-backed shell architecture, persistent map constraints, and mobile admin entry model
- `.planning/phases/05-report-submission/05-CONTEXT.md` - IndexedDB draft persistence and report submission flow constraints
- `.planning/phases/11-analytics-disaster-mapping/11-CONTEXT.md` - route-backed admin workspaces and persistent-map extension patterns that Phase 12 must preserve

### Existing code and config that define implementation limits
- `vite.config.ts` - current `vite-plugin-pwa` GenerateSW setup, runtime caching, and manifest ownership
- `firebase.json` - current Hosting config and rewrite surface available for public alert OG handling
- `public/manifest.json` - shipped PWA manifest baseline
- `src/App.tsx` - current route tree, Helmet usage, and root redirects that Phase 12 must restructure
- `src/app/router.tsx` - router entry point for adding public surfaces
- `src/app/providers.tsx` - provider composition, HelmetProvider placement, and app-wide setup hooks
- `src/features/report/useReportDraft.ts` - existing IndexedDB draft implementation to extend for offline resubmission
- `src/app/report/ReportForm.tsx` - current draft load/save and submit flow
- `src/lib/app-check/AppCheckProvider.tsx` - current App Check audit-mode implementation that Phase 12 replaces
- `functions/src/index.ts` - current HTTP/callable function export surface, including the existing stub onRequest entry point that can be replaced or extended for public OG rendering
- `src/app/shell/DesktopShell.tsx` and `src/app/shell/MobileShell.tsx` - current authenticated shell surfaces where connection-state UX and noindex behavior must integrate
- `src/components/alerts/AlertsFeed.tsx` - existing alerts UI baseline to reuse for public alerts surfaces

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/features/report/useReportDraft.ts`: existing IndexedDB draft storage that can be extended with a pending-submission queue
- `src/app/report/ReportForm.tsx`: current report draft save/load lifecycle and submit orchestration
- `src/components/alerts/AlertsFeed.tsx`: existing alerts list UI that can back authenticated and public alert list surfaces
- `src/components/map/ReportMarkers.tsx`, `src/components/map/MunicipalityBoundaries.tsx`, and `src/components/report/ReportFeed.tsx`: existing public-safe report visualization primitives for a public map/feed surface
- `src/app/providers.tsx`: app-level home for shared connectivity, install-prompt, and status-notification hooks
- `src/lib/app-check/AppCheckProvider.tsx`: current audit-mode scaffold that can be replaced rather than rebuilt from scratch

### Established Patterns
- React Router v6 route tree anchored in `src/App.tsx`
- `react-helmet-async` already installed and provided globally, but currently underused
- Route-backed shell architecture keeps the map mounted and swaps content panes around it
- PWA configuration is owned by `vite-plugin-pwa` GenerateSW in `vite.config.ts`, not a hand-authored custom service worker
- Firebase Hosting rewrites are currently empty, so public-alert OG rendering will require explicit hosting and function wiring

### Integration Points
- Replace the catch-all redirect and introduce new public routes in `src/App.tsx`
- Add static public SEO assets under `public/` and hosting rewrites in `firebase.json`
- Extend `AppProviders` or a nearby app-level hook to watch online/offline state and expose install/reconnect UX
- Extend report-submit flow and IndexedDB helpers to queue and retry pending submissions safely
- Swap `AppCheckProvider` to a production provider with env-gated enforcement and non-production fallback behavior

</code_context>

<deferred>
## Deferred Ideas

- Full service-worker background sync for report submission mutations - future PWA hardening if browser support and auth-safe upload flow become necessary
- Dynamic sitemap generation for every public alert detail page - optional later if static sitemap coverage becomes insufficient
- Monitoring, crash-reporting, export automation, and release-documentation tasks listed in the broader `SPECS.md` Phase 12 deliverables but not explicitly pulled into the current roadmap success criteria

</deferred>

---

*Phase: 12-hardening-pwa-seo-release*
*Context gathered: 2026-04-04*
