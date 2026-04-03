# Plan 01-08: GitHub Actions CI — Summary

**Plan:** 01-08
**Tasks:** 2/2
**Status:** Complete

---

## Tasks Completed

### Task 1: Create .github/workflows/ci.yml ✓
Created GitHub Actions CI pipeline with two jobs:

**Job 1 — `build-and-test`:**
- Triggers on push to `main` and all PRs
- Checks out code, sets up Node.js 20.x with npm cache
- Runs `npm ci` → `npm run build` → `npm run test -- --run` → `npm run lint`

**Job 2 — `emulators-and-smoke`** (depends on `build-and-test`):
- Installs Playwright browsers with deps
- Starts Firebase Emulators in background via `npm run emulators:ci`
- Waits 15s for emulators to start (Auth 9099, Firestore 8080)
- Runs Playwright smoke tests against the running emulators
- Stops emulators on completion (always, even on failure)

### Task 2: Update .gitignore ✓
Augmented existing `.gitignore` with:
- `.pnp`, `.pnp.js` (PnP package manager)
- `*.local` (Vite build output)
- `yarn-debug.log*`, `pnpm-debug.log*`, `lerna-debug.log*` (log files)
- `.vscode/*`, `.idea/`, `*.swp`, `*.swo`, `*~` (editor artifacts)
- `firebase-debug.log*`, `*-debug.log*` (Firebase debug logs)
- `.lib/` (Functions build output)
- `emulators/` (Emulator data directory)
- `coverage/` (Vitest coverage reports)
- `.env.*.local` (all local env variants)

Existing entries preserved (node_modules, dist, firebase config files, playwright reports, ESLint logs, TypeScript tsbuildinfo, PWA dev-dist, OS files).

---

## Files Modified

- `.github/workflows/ci.yml` — created
- `.gitignore` — augmented

## Verification

```bash
$ cat .github/workflows/ci.yml | grep "npm run build"
        run: npm run build
$ cat .github/workflows/ci.yml | grep "npm run test"
        run: npm run test -- --run
$ cat .github/workflows/ci.yml | grep "emulators:ci"
        run: npm run emulators:ci &
```

All acceptance criteria met:
- ✓ CI workflow triggers on push to `main` and PRs
- ✓ `build-and-test` job runs npm ci, build, test, lint
- ✓ `emulators-and-smoke` job depends on `build-and-test`
- ✓ Emulators start in background
- ✓ Playwright smoke tests run after emulators start
- ✓ Emulators always stopped via `if: always()`
- ✓ `.gitignore` is comprehensive with all required entries
