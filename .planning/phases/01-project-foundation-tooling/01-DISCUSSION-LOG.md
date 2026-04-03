# Phase 1: Project Foundation & Tooling - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-03
**Phase:** 1-Project Foundation & Tooling
**Areas discussed:** Project Structure, Firebase Setup, TypeScript Config, PWA Strategy, Test Setup

---

## Project Structure

| Option | Description | Selected |
|--------|-------------|----------|
| Feature-based (src/features/) | Organized by domain (reports, map, auth), co-located components/hooks/types | ✓ (recommended) |
| Flat (src/components/) | All components at top level, grouped by type (components/, hooks/, pages/) | |
| Layered (src/ui/, src/logic/, src/data/) | Separated by technical concern | |

**[auto]** Project Structure — Q: "Which folder structure approach?" → Selected: "Feature-based (src/features/)" (recommended default)
**Rationale:** Bantayog Alert is a domain-rich app with 12 municipalities, multiple user roles, and complex feature interactions. Feature-based structure scales better than flat or layered approaches. CLAUDE.md has no constraint on structure, so this is a standard engineering choice.

## Firebase Setup

| Option | Description | Selected |
|--------|-------------|----------|
| Single project + .env.local | One Firebase project, dev config in .env.local, prod in .env.production | ✓ (recommended) |
| Separate dev/staging/prod projects | Three Firebase projects with separate configurations | |

**[auto]** Firebase Setup — Q: "Which Firebase project approach?" → Selected: "Single project + .env.local" (recommended default)
**Rationale:** For v1, managing three Firebase projects adds overhead without benefit. Single project with environment variable overlays is standard Firebase + Vite practice.

## TypeScript Config

| Option | Description | Selected |
|--------|-------------|----------|
| Full strict mode | strict: true, noUncheckedIndexedAccess: true, all strict flags | ✓ (recommended) |
| Minimal strict | Just strict: true, no extra checks | |

**[auto]** TypeScript Config — Q: "TypeScript strictness level?" → Selected: "Full strict mode" (recommended default)
**Rationale:** CLAUDE.md already specifies TypeScript 6.0.2 for strict typing. Full strict mode prevents null/undefined bugs that are costly in disaster scenarios.

## PWA Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| CacheFirst for assets, NetworkFirst for API | Standard PWA caching strategy | ✓ (recommended) |
| NetworkOnly (no caching) | Dev-only, not production-ready | |

**[auto]** PWA Strategy — Q: "PWA caching strategy?" → Selected: "CacheFirst for assets, NetworkFirst for API" (recommended default)
**Rationale:** Disaster scenarios may have intermittent connectivity. CacheFirst for static assets ensures the app shell loads offline; NetworkFirst for API ensures data freshness when connected.

## Test Setup

| Option | Description | Selected |
|--------|-------------|----------|
| Vitest (unit) + Playwright (smoke) | Standard Vite stack, headless smoke test | ✓ (recommended) |
| Vitest only | No E2E coverage | |

**[auto]** Test Setup — Q: "Test tooling approach?" → Selected: "Vitest (unit) + Playwright (smoke)" (recommended default)
**Rationale:** Success criteria explicitly require both Vitest (`npm run test`) and Playwright smoke test passing against dev server. Standard Vite ecosystem tooling.

---

## Claude's Discretion

The following decisions were made by Claude without user input (Phase 1 is greenfield with no prior user preferences):

- **ESLint/Prettier config choices**: Standard Vite/Eslint/Prettier ecosystem defaults with minimal project-specific overrides. Auto-format on save.
- **Firebase emulator ports**: Default ports (9099 auth, 5001 firestore, 9199 storage, 5002 functions). Standard configuration.
- **Placeholder app shell**: Blank page with title "Bantayog Alert" — sufficient for Phase 1 smoke test. No UI components yet.
- **Install prompt**: `registerType: 'prompt'` — user controls when to install the PWA, not forced auto-update.
- **Dark mode strategy**: `class` based (toggles `dark` class on `<html>`) — preferred for emergency workers in low-light conditions.
- **Theme colors**: Red-600 (`#dc2626`) for emergency theme, white background.

## Deferred Ideas

None — Phase 1 scope stayed well-bounded as pure infrastructure.
