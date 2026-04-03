---
phase: 03-auth-role-model
plan: '02'
subsystem: auth
tags: [auth, ui, react-router, firebase-auth]
dependency_graph:
  requires:
    - 03-01-plan
  provides:
    - src/lib/auth/hooks.ts
    - src/lib/auth/operations.ts
    - src/lib/router/guards.tsx
    - src/app/auth/login/page.tsx
    - src/app/auth/register/page.tsx
    - src/app/auth/profile/page.tsx
  affects:
    - src/App.tsx
tech_stack:
  added:
    - Firebase Auth operations (signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, sendEmailVerification, signOut, updateProfile)
    - React Router v6 route guards (ProtectedRoute, AdminRoute)
  patterns:
    - Firebase Auth + Firestore user doc on registration
    - Route guards with useEffect-based redirects
key_files:
  created:
    - src/lib/auth/hooks.ts: useAuth, useRequireAuth, useRequireRole hooks
    - src/lib/auth/operations.ts: loginWithEmail, registerWithEmail, loginWithGoogle, logout, updateUserProfile
    - src/lib/router/guards.tsx: ProtectedRoute, AdminRoute components
    - src/app/auth/layout.tsx: AuthLayout centered card wrapper
    - src/app/auth/login/page.tsx: Login form with email/password + Google OAuth
    - src/app/auth/register/page.tsx: Registration form with displayName, email, password + Google OAuth
    - src/app/auth/profile/page.tsx: Profile page with notification preferences
  modified:
    - src/App.tsx: Added Routes for /auth/*, /app/*, /admin/*
decisions:
  - D-45: browserLocalPersistence (Phase 03-01)
  - D-44: signInWithPopup (not redirect) for Google OAuth (Phase 03-01)
  - D-48: Default role citizen, provinceCode=CMN, municipalityCode=null on registration
  - D-49: React Router loader functions for auth state (deferred to route guards pattern)
  - D-50: /app/* require auth, /admin/* require municipal_admin+ role
metrics:
  duration: "~4 min"
  completed: 2026-04-03
  tasks: 4
  commits: 5
  files: 8
---

# Phase 03 Plan 02: Auth UI Pages and Route Guards Summary

## One-liner

Authentication UI pages (Login, Register, Profile) with Firebase Auth operations and React Router v6 protected route guards.

## What Was Built

### Auth Hooks (`src/lib/auth/hooks.ts`)
- `useAuth` - re-exports from AuthProvider for convenience
- `useRequireAuth` - redirects to `/auth/login` if not authenticated
- `useRequireRole(allowedRoles)` - redirects to `/app` if role not in allowed list

### Auth Operations (`src/lib/auth/operations.ts`)
- `loginWithEmail(email, password)` - Firebase email/password sign-in
- `registerWithEmail(email, password, displayName)` - Creates Auth account, sends email verification, creates Firestore user doc with defaults (role=citizen, provinceCode=CMN, municipalityCode=null, default notification preferences)
- `loginWithGoogle()` - Google OAuth via popup
- `logout()` - Signs out
- `updateUserProfile(data)` - Updates Firestore user document

### Auth Pages
- **Login** (`src/app/auth/login/page.tsx`) - Email/password + Google OAuth buttons, error display, link to register
- **Register** (`src/app/auth/register/page.tsx`) - Display name, email, password, confirm password fields; password match validation; Google OAuth; triggers email verification
- **Profile** (`src/app/auth/profile/page.tsx`) - Read-only email/role badge; editable display name; notification toggles (push, email); alert types multi-select checkboxes; save with success/error feedback; sign out button

### Route Guards (`src/lib/router/guards.tsx`)
- `ProtectedRoute` - Shows loading spinner during auth check, redirects to `/auth/login` if unauthenticated
- `AdminRoute` - Restricts to municipal_admin and provincial_superadmin roles, redirects to `/app` if unauthorized

### App.tsx Routes
```
/auth/login         -> LoginPage
/auth/register     -> RegisterPage
/auth/profile      -> ProtectedRoute(ProfilePage)
/app/*             -> ProtectedRoute(AppLayout)
/admin/*           -> AdminRoute(AdminPanel)
/                  -> Navigate to /app
```

## Deviation: None

Plan executed exactly as written. No auto-fixes applied.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] sendEmailVerification type error**
- **Found during:** TypeScript check after Task 1
- **Issue:** `Property 'sendEmailVerification' does not exist on type 'User'` - it is a standalone function in firebase/auth v9+, not a method on User
- **Fix:** Added `sendEmailVerification` to the firebase/auth imports and changed `user.sendEmailVerification()` to `sendEmailVerification(user)`
- **Files modified:** `src/lib/auth/operations.ts`
- **Commit:** `d5bbbc3`

## Known Stubs

None.

## Verification Results

| Check | Result |
|-------|--------|
| `useAuth` exported from hooks.ts | PASS |
| All operations exported from operations.ts | PASS |
| login/page.tsx calls loginWithEmail | PASS |
| register/page.tsx calls registerWithEmail | PASS |
| profile/page.tsx calls updateUserProfile and logout | PASS |
| guards.tsx exports ProtectedRoute and AdminRoute | PASS |
| TypeScript clean (new files) | PASS |

## Commits

| Hash | Message |
|------|---------|
| `8c78476` | feat(03-02): add auth hooks and operations |
| `fcf12a1` | feat(03-02): add auth layout, login and register pages |
| `fb00d57` | feat(03-02): add profile page with notification preferences |
| `cce79d6` | feat(03-02): add route guards and wire up auth routes |
| `d5bbbc3` | fix(03-02): import sendEmailVerification as standalone function |

## Self-Check

All created files exist. All commits found. PASSED.
