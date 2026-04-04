---
phase: 12
slug: hardening-pwa-seo-release
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-04
---

# Phase 12 - Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | `vite.config.ts` |
| **Quick run command** | `npx vitest run src/App.test.tsx` |
| **Full suite command** | `npm run lint && npm run build && (cd functions && npm run build) && npx vitest run` |
| **Estimated runtime** | ~120 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run src/App.test.tsx`
- **After every plan wave:** Run `npm run build` and any newly introduced focused Vitest suites for that wave
- **Before `$gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 120 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 12-01-01 | 01 | 1 | SEO-01, SEO-05 | component | `npx vitest run src/App.test.tsx` | ❌ W0 | ⬜ pending |
| 12-02-01 | 02 | 2 | SEO-01, SEO-02 | component | `npx vitest run src/app/public` | ❌ W0 | ⬜ pending |
| 12-03-01 | 03 | 3 | SEO-03, SEO-04, SEO-06 | static/functions | `test -f public/robots.txt && test -f public/sitemap.xml && npx vitest run functions/src/public` | ❌ W0 | ⬜ pending |
| 12-04-01 | 04 | 1 | PWA-03, PWA-04 | unit/component | `npx vitest run src/features/report src/app/report` | ❌ W0 | ⬜ pending |
| 12-05-01 | 05 | 3 | PWA-03, PWA-04 | build/component | `npm run build && npx vitest run src/app/shell` | ❌ W0 | ⬜ pending |
| 12-06-01 | 06 | 1 | SEC-01 | unit/build | `npx vitest run src/lib/app-check && npm run build` | ❌ W0 | ⬜ pending |
| 12-07-01 | 07 | 4 | SEO-01, SEO-02, PWA-04, SEC-01 | integration/manual | `npm run lint && npm run build && npx vitest run` | ✅ partial | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠ flaky*

---

## Wave 0 Requirements

- [ ] `src/app/public/*.test.tsx` - route/meta coverage for landing, public map, and public alerts
- [ ] `src/features/report/*offline*.test.ts` - queued submission retry and persistence coverage
- [ ] `src/lib/app-check/*.test.ts` - provider selection and rollout gating coverage
- [ ] `functions/src/public/*.test.ts` - public alert OG rewrite handler coverage
- [ ] static asset checks for `public/robots.txt` and `public/sitemap.xml`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Public alert share preview shows alert-specific metadata | SEO-06 | Social crawlers and link unfurlers cannot be fully validated in Vitest alone | Share a `/public/alerts/:id` URL into at least one social preview tool or messaging app and verify the title/description match the alert |
| Install prompt and offline fallback feel correct on mobile | PWA-04 | Browser install heuristics and offline navigation are browser-driven | Open the public landing page on mobile, trigger the install prompt, then simulate offline navigation and verify the fallback page/message |
| Keyboard/focus flow across drawer, modal, auth, and report submission is intact | PWA-04 | Requires real tab order and focus-return behavior | Test keyboard-only navigation across login, report form, shell drawers/modals, and public pages |
| Lighthouse targets are met on landing/public routes | SEO-01, SEO-02 | Requires browser audit tooling against built assets | Run Lighthouse on `/`, `/public/map`, and `/public/alerts` and record the final mobile/desktop scores |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all missing references
- [ ] No watch-mode flags
- [ ] Feedback latency < 120s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
