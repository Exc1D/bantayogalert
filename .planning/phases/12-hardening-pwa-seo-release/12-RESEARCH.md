# Phase 12: Hardening, PWA, SEO & Release - Research

**Researched:** 2026-04-04
**Domain:** Release hardening across public SEO surfaces, offline/PWA resilience, App Check rollout, accessibility, and performance
**Confidence:** MEDIUM

## Summary

Phase 12 is a release-shaping phase, not a new-feature phase. The codebase already contains the core product flows, but it still lacks the public route split, metadata/indexing strategy, reconnect submission path, offline fallback, and production App Check provider needed for a production-facing launch. The biggest architectural fact is that the app is still a client-side React Router SPA rooted at `src/App.tsx`, with `vite-plugin-pwa` GenerateSW handling service worker generation and a placeholder App Check provider in `src/lib/app-check/AppCheckProvider.tsx`. That means the safest Phase 12 path is to harden the existing SPA rather than introduce broad SSR or a service-worker-owned mutation layer.

Recommended implementation shape:
1. Establish a dedicated public route family and route-level SEO metadata primitives
2. Reuse existing public-safe report and alert components for `/`, `/public/map`, `/public/alerts`, and `/public/alerts/:alertId`
3. Add static SEO assets plus a narrow HTTP function rewrite for dynamic public alert OG tags
4. Extend IndexedDB draft persistence with an app-managed pending-submission queue and visible connection state
5. Finalize the PWA with an offline fallback document and prompt/install wiring that fits the existing GenerateSW setup
6. Move App Check to a real production provider with staged enforcement toggles
7. Finish with an accessibility/performance remediation pass and release-grade verification

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PWA-03 | Offline report draft saved to IndexedDB; submit when online | Existing `useReportDraft.ts` already stores drafts; add a persisted pending-submission queue and reconnect retry path |
| PWA-04 | Visible connection status indicator with offline messaging | Best added as an app-level connectivity hook/component in `AppProviders` or shell layouts |
| SEO-01 | Landing page with full meta tags, OG tags, canonical URL | Requires a real `/` landing page and route-level Helmet metadata |
| SEO-02 | Public map and alerts pages are indexed | Requires public routes and public-safe data loading patterns |
| SEO-03 | robots.txt allows public routes, disallows app/auth/admin | Best shipped as static assets from `public/` |
| SEO-04 | sitemap.xml includes landing, public/map, public/alerts | Best shipped as static v1 asset; dynamic detail pages can be deferred |
| SEO-05 | Private app routes have noindex meta tag | Route/layout-level Helmet wrapper is the safest fit for the current SPA |
| SEO-06 | Dynamic OG tags for shared public alert pages via Cloud Function rewrite | Current Hosting config has no rewrites; add a narrow HTTP function + hosting rewrite for `/public/alerts/:id` |
| SEC-01 | App Check integrated and enforced after burn-in | Current audit-mode `CustomProvider` is explicitly temporary and needs a production provider plus rollout controls |

## Standard Stack

### Existing Core
| Library | Version | Purpose | Why It Fits |
|---------|---------|---------|-------------|
| react-router-dom | 6.5.0 | Public/private route split | Already owns all routing |
| react-helmet-async | 3.0.0 | Route-level meta tags and noindex | Installed and globally provided |
| vite-plugin-pwa | 1.2.0 | Service worker, precache, runtime caching | Already owns PWA generation |
| idb | ^8.0.3 | Offline draft and queued submission storage | Already used for report drafts |
| firebase | 12.11.0 | Auth, Firestore, callable functions, App Check | Existing project backend |

### Existing Config Surfaces
| File | Role | Why It Matters |
|------|------|----------------|
| `vite.config.ts` | GenerateSW, runtime caching, manifest ownership | PWA changes must fit here |
| `firebase.json` | Hosting rewrites and static hosting behavior | Required for public-alert OG rewrites |
| `public/manifest.json` | Manifest baseline | Release assets must stay aligned with this |
| `src/App.tsx` | Current route tree and Helmet root | Public/private route split starts here |
| `src/lib/app-check/AppCheckProvider.tsx` | Audit-mode App Check scaffold | Replace rather than rebuild |

## Architecture Patterns

### Pattern 1: Explicit Public Route Family

**What:** Keep public discovery routes under `/` and `/public/*`, while authenticated product routes stay under `/app/*`.

**Why:** The current app is entirely protected or redirect-based. Making public pages explicit keeps indexing, metadata, and data-scope logic clean.

**Recommended routes:**
- `/` - landing page
- `/public/map` - indexable public verified-report surface
- `/public/alerts` - indexable public alert list
- `/public/alerts/:alertId` - public alert detail with shareable metadata
- `/auth/*` and `/app/*` remain non-indexed/private

### Pattern 2: Route-Level Metadata with a Narrow Server Rewrite

**What:** Use `react-helmet-async` for normal route metadata and reserve server-generated HTML only for public alert share pages.

**Why:** The current app is an SPA. Route-level Helmet is low-friction for landing/public pages and private noindex. Dynamic OG tags are only necessary where social crawlers need alert-specific metadata.

**Best fit split:**
- Helmet for `/`, `/public/map`, `/public/alerts`, `/auth/*`, `/app/*`
- HTTP function rewrite for `/public/alerts/:alertId`

### Pattern 3: App-Managed Offline Retry, Not Full Background Sync

**What:** Persist pending report submissions in IndexedDB and retry them from the app when connectivity returns.

**Why:** The current submission flow uses authenticated Firebase Storage uploads and a callable Cloud Function. Moving the full mutation path into a service worker would add substantial auth and upload complexity during a release-hardening phase.

**Recommended queue shape:**
- `report-draft-{userId}` remains for form state
- add `report-pending-{userId}` entries containing:
  - normalized form payload
  - media metadata or already-uploaded URLs
  - retry count
  - last attempt timestamp
  - failure reason

### Pattern 4: Shell-Level Connection Status

**What:** A shared online/offline indicator lives near the app shell/providers, while report submission screens add stronger inline messaging and retry affordances.

**Why:** Connectivity is a global product state, but submission failure handling is a local UX. The existing `AppProviders` component is already the home of cross-cutting runtime wiring.

### Pattern 5: Staged App Check Enforcement

**What:** Replace the placeholder audit provider with a real web App Check provider in production, but keep environment-gated rollout controls so emulators and local development do not require production secrets or full enforcement.

**Why:** Phase 3 explicitly deferred enforcement until Phase 12. The rollout must honor the burn-in period rather than flipping behavior universally in one step.

**Recommended implementation shape:**
- development/emulator: keep debug or audit-friendly behavior
- production: real provider with auto-refresh
- enforcement toggle controlled by env/config so rollout can be staged

### Pattern 6: Remediation-Focused A11y and Performance Pass

**What:** Audit the existing surfaces and patch the real issues rather than introducing broad new infrastructure.

**Why:** This phase must improve quality scores without destabilizing the product architecture that earlier phases already locked in.

**Priority surfaces:**
- Landing page and public SEO routes
- Auth pages
- Report submission flow
- Desktop/mobile shell navigation
- Admin analytics/audit workspaces

## Codebase Fit

### Reusable Assets
- `src/features/report/useReportDraft.ts` - already provides IndexedDB storage patterns
- `src/app/report/ReportForm.tsx` - current save/load and submit lifecycle
- `src/components/report/ReportFeed.tsx`, `src/components/map/ReportMarkers.tsx`, `src/components/map/MunicipalityBoundaries.tsx` - public-safe report display pieces
- `src/components/alerts/AlertsFeed.tsx` - current alert list UI to adapt for public use
- `src/app/providers.tsx` - shared runtime home for connectivity/install hooks
- `src/app/shell/DesktopShell.tsx` and `src/app/shell/MobileShell.tsx` - shell behavior and route-backed content patterns to preserve while adding noindex and connection status

### Constraints Discovered in Code
- No `/public/*` route family exists yet
- Root route still redirects into `/app`
- Helmet is only used for a bare `<title>` in `src/App.tsx`
- Hosting rewrites are empty in `firebase.json`
- No `robots.txt`, `sitemap.xml`, or dedicated OG image asset currently exist
- App Check provider is still a placeholder `CustomProvider`
- There is no install prompt hook or online/offline status hook in the app

## Implementation Order Recommendation

1. **SEO and route foundation** - route split, metadata helpers, private noindex
2. **Public surfaces** - landing/public map/public alerts/detail built from public-safe data
3. **Offline resilience** - queue failed submissions, show connection status, wire reconnect retry
4. **PWA finalization** - offline fallback, install prompt UX, caching refinements
5. **Dynamic sharing + assets** - robots, sitemap, OG rewrite, hosting config
6. **App Check rollout** - production provider and rollout gating
7. **A11y/performance verification** - remediate issues and lock release scorecard

## Risks and Mitigations

1. **Public/private data leakage**
   - Risk: Reusing authenticated hooks/components may accidentally expose non-public fields
   - Mitigation: keep public routes on public-safe collections only and explicitly review hooks used on `/public/*`

2. **Offline retry duplicates or partial uploads**
   - Risk: Retrying after flaky connectivity may produce duplicate reports or mismatched media state
   - Mitigation: persist a deterministic client-side submission ID and only queue post-validation payloads with clear retry bookkeeping

3. **Over-scoping into SSR or full service-worker sync**
   - Risk: release hardening turns into a platform rewrite
   - Mitigation: limit server-generated HTML to public alert OG pages and keep retries app-managed

4. **App Check rollout breaks local/dev flows**
   - Risk: switching providers or enforcement too early blocks development and tests
   - Mitigation: environment-gated provider selection and staged enforcement toggle

5. **Accessibility fixes regress map/shell behavior**
   - Risk: aggressive focus or semantic changes destabilize the persistent map shell
   - Mitigation: prioritize additive semantics and verify map stability after every shell-level remediation

## Open Questions

All product-level decisions needed for planning are resolved in `12-CONTEXT.md`. Remaining planning-level choices are:
- exact file structure for public route components and SEO helpers
- whether alert detail uses a dedicated public data hook or a split path inside existing announcement hooks
- how to store queued submission media references without overcomplicating offline media upload behavior
- which routes/tests make up the final Lighthouse/a11y verification checklist

## Environment Availability

> Step 2.6: No external services beyond the existing Firebase/Vite app stack are required.

**Existing infrastructure already available:**
- Firebase Hosting
- Firestore / Auth / Storage / Functions
- vite-plugin-pwa / Workbox GenerateSW
- react-helmet-async
- IndexedDB via `idb`

**New runtime dependencies are likely optional, not mandatory:**
- No new library is strictly required for Phase 12 if install/connectivity handling is implemented with native browser APIs and existing React patterns

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.2 plus existing build/lint tooling |
| Config file | `vite.config.ts` |
| Quick run command | `npx vitest run src/App.test.tsx` |
| Full suite command | `npm run lint && npm run build && (cd functions && npm run build) && npx vitest run` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|--------------|
| PWA-03 | Queued report submission retries when online | unit/component | `npx vitest run src/features/report src/app/report` | NO |
| PWA-04 | Offline indicator and report-form offline messaging render correctly | component | `npx vitest run src/app/shell src/app/report` | NO |
| SEO-01 | Landing page and public pages set title/meta/canonical tags | component | `npx vitest run src/App.test.tsx src/app/public` | NO |
| SEO-02 | Public map and alerts routes render indexable public surfaces | component | `npx vitest run src/App.test.tsx src/app/public` | NO |
| SEO-03 | robots.txt disallows private/auth/admin routes | build/static | `test -f public/robots.txt && grep -q 'Disallow: /app/' public/robots.txt` | NO |
| SEO-04 | sitemap.xml lists landing/public routes | build/static | `test -f public/sitemap.xml && grep -q '/public/map' public/sitemap.xml` | NO |
| SEO-05 | Private routes carry noindex metadata | component | `npx vitest run src/App.test.tsx` | NO |
| SEO-06 | Public alert OG function returns alert-specific HTML | functions/unit | `npx vitest run functions/src/public` | NO |
| SEC-01 | App Check uses staged production provider behavior | unit/build | `npx vitest run src/lib/app-check && npm run build` | NO |

### Wave 0 Gaps
- [ ] `src/app/public/*.test.tsx` - public landing/map/alerts route coverage
- [ ] `src/features/report/*offline*.test.ts` - queued submission and reconnect retry coverage
- [ ] `src/lib/app-check/*.test.ts` - provider selection and rollout gating coverage
- [ ] `functions/src/public/*.test.ts` - public alert OG rewrite handler coverage
- [ ] static asset checks for `public/robots.txt` and `public/sitemap.xml`

## Sources

### Primary (HIGH confidence)
- `.planning/phases/12-hardening-pwa-seo-release/12-CONTEXT.md` - locked product decisions for the phase
- `.planning/ROADMAP.md` section `Phase 12: Hardening, PWA, SEO & Release` - success criteria and scope boundary
- `.planning/REQUIREMENTS.md` sections `PWA & Offline`, `SEO & Public Surfaces`, and `Infrastructure & Security`
- `SPECS.md` sections `10.5`, `10.6`, `11.1` through `11.5`, `12.7`, `12.8`, and `Phase 12: Hardening, A11y, Performance Tuning & Release Verification`

### Secondary (MEDIUM confidence)
- `vite.config.ts` - current PWA/runtime caching setup
- `firebase.json` - current Hosting rewrite surface
- `src/App.tsx`, `src/app/router.tsx`, `src/app/providers.tsx` - routing and metadata integration points
- `src/features/report/useReportDraft.ts` and `src/app/report/ReportForm.tsx` - offline/draft integration baseline
- `src/lib/app-check/AppCheckProvider.tsx` - current App Check audit-mode baseline
- `src/app/shell/DesktopShell.tsx` and `src/app/shell/MobileShell.tsx` - shell-level integration points

## Metadata

**Confidence breakdown:**
- Public route and metadata architecture: HIGH
- Offline retry approach: MEDIUM
- App Check rollout: MEDIUM
- Accessibility/performance remediation scope: MEDIUM

**Research date:** 2026-04-04
**Valid until:** 2026-05-04
