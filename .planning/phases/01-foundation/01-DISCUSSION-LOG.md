# Phase 1: Foundation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-01
**Phase:** 01-foundation
**Areas discussed:** Firebase project setup, Firebase config strategy, TypeScript strictness, Playwright browser, CI configuration, Firebase emulator ports, Shell placeholder strategy, src/ directory structure

---

## Firebase Project Setup

| Option | Description | Selected |
|--------|-------------|----------|
| Existing Firebase project | Connect to existing bantayogalert project | ✓ |
| Create new project via CLI | Provision from scratch | |
| Defer to .env.example | Use placeholder config | |

**User's choice:** Existing Firebase project — provided full Firebase config (project ID: `bantayogalert`)
**Notes:** Firebase config provided by user directly in chat.

---

## Firebase Config Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| src/config/firebase.ts + .env | Dedicated module with import.meta.env vars | ✓ |
| .env only, used anywhere | Direct import.meta.env access | |
| You decide | | |

**User's choice:** `src/config/firebase.ts` + `.env` — clean TypeScript-friendly separation

---

## TypeScript Strictness

| Option | Description | Selected |
|--------|-------------|----------|
| Full strict + extras | strict:true + noUncheckedIndexedAccess + noUnusedLocals + noUnusedParams | ✓ |
| strict: true only | Standard React+TS strictness | |
| You decide | | |

**User's choice:** Full strict + extras — safety first given security-sensitive municipality scoping

---

## Playwright Browser

| Option | Description | Selected |
|--------|-------------|----------|
| Chromium only | Faster, smaller install | |
| Chromium + Firefox + WebKit | Full cross-browser coverage | ✓ |
| You decide | | |

**User's choice:** Full multi-browser suite — better QA coverage

---

## CI Configuration

| Option | Description | Selected |
|--------|-------------|----------|
| GitHub Actions (lint → typecheck → test → build) | Full quality gate | ✓ |
| GitHub Actions (test + build only) | Minimal pipeline | |
| You decide | | |

**User's choice:** Full GHA pipeline — ESLint → tsc --noEmit → vitest → playwright → vite build

---

## Firebase Emulator Ports

| Option | Description | Selected |
|--------|-------------|----------|
| Standard Firebase emulator ports | 8080, 5001, 9199, 4000 | ✓ |
| Offset by +10000 | 18080, 15001, 19199, 14000 | |
| You decide | | |

**User's choice:** Standard Firebase emulator ports

---

## Shell Placeholder Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Stubs now, full in Phase 4 | Minimal stubs with Phase 4 markers | ✓ |
| You decide | | |

**User's choice:** Stubs in Phase 1 — satisfies success criteria and keeps Phase 4 focused

---

## src/ Directory Structure

| Option | Description | Selected |
|--------|-------------|----------|
| Flat (src/components/, src/hooks/, src/utils/) | Standard React structure | ✓ |
| Feature-based (src/features/...) | Per-feature colocation | |
| You decide | | |

**User's choice:** Flat `src/` structure — simple and familiar

---

## Claude's Discretion

The following were left to Claude's discretion (user selected "You decide" or "continue"):
- Exact directory file counts and naming within `src/components/` subdirs
- Specific Tailwind color variable values
- Exact Playwright test file locations and names
- Emulator vs production Firebase initialization strategy (use emulator in dev mode)

## Deferred Ideas

None — all Phase 1 gray areas were discussed and decided.
