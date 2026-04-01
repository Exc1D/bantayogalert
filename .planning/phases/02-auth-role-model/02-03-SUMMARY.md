---
phase: 02-auth-role-model
plan: '03'
subsystem: auth
tags: [role-gate, protected-route, auth-guard, access-control]
dependency_graph:
  requires:
    - '02-01'
  provides:
    - RoleGate component for UI access control
    - ProtectedRoute component for route guarding
    - AuthGuard component for auth loading states
  affects:
    - src/components/auth/
    - src/App.tsx (future integration)
tech_stack:
  added:
    - react-router-dom (for Navigate component)
  patterns:
    - RoleGate for conditional rendering based on role/municipality
    - ProtectedRoute for route-level auth checks
    - AuthGuard for loading state handling
key_files:
  created:
    - src/components/auth/RoleGate.tsx
    - src/components/auth/ProtectedRoute.tsx
    - src/components/auth/AuthGuard.tsx
  modified:
    - src/components/auth/index.ts
    - package.json (react-router-dom dependency)
decisions: []
metrics:
  duration: '~5 minutes'
  completed: '2026-04-01T19:08:00Z'
---

# Phase 02 Plan 03: Role-Based Access Control Components

## One-Liner

RoleGate, ProtectedRoute, and AuthGuard components for role-based UI access control and route guarding.

## Completed Tasks

| #   | Task                            | Commit    | Files                                      |
| --- | ------------------------------- | --------- | ------------------------------------------ |
| 1   | Create RoleGate component       | `206ae09` | RoleGate.tsx, index.ts                     |
| 2   | Create ProtectedRoute component | `3f70f18` | ProtectedRoute.tsx, index.ts, package.json |
| 3   | Create AuthGuard component      | `7029c97` | AuthGuard.tsx, index.ts                    |

## What Was Built

### RoleGate (`src/components/auth/RoleGate.tsx`)

Conditional rendering component based on user role and municipality scope:

```tsx
// Props
interface RoleGateProps {
  children: ReactNode
  roles: Role | Role[]
  municipality?: MunicipalityCode
  fallback?: ReactNode
  requireAuth?: boolean
}

// Usage examples
<RoleGate roles={['municipal_admin', 'provincial_superadmin']}>
  <AdminPanel />
</RoleGate>

<RoleGate roles={['municipal_admin']} municipality="daet">
  <DaetAdminContent />
</RoleGate>
```

**Features:**

- Single role or array of roles support
- Optional municipality scope checking
- Optional authentication requirement
- Handles loading state during auth initialization
- Exports `Role` and `MunicipalityCode` types

### ProtectedRoute (`src/components/auth/ProtectedRoute.tsx`)

Route guard component for authenticated pages:

```tsx
// Props
interface ProtectedRouteProps {
  children: ReactNode
  roles?: Role[]
  redirectTo?: string
  loadingComponent?: ReactNode
}

// Usage examples
<ProtectedRoute>
  <Dashboard />
</ProtectedRoute>

<ProtectedRoute roles={['municipal_admin', 'provincial_superadmin']}>
  <AdminPanel />
</ProtectedRoute>
```

**Features:**

- Redirects to `/signin` when user is null (unauthenticated)
- Optional role checking
- Customizable redirect destination
- Customizable loading component
- Uses `react-router-dom` Navigate component

### AuthGuard (`src/components/auth/AuthGuard.tsx`)

Page-level auth loading state handler:

```tsx
// Props
interface AuthGuardProps {
  children: ReactNode
  loadingIndicator?: ReactNode
}

// Usage example
;<AuthGuard loadingIndicator={<PageSkeleton />}>
  <MyPage />
</AuthGuard>
```

**Features:**

- Shows loading state while auth is initializing
- Renders children once auth state is resolved
- Works regardless of whether user is authenticated

## Exports Added to `src/components/auth/index.ts`

```typescript
export { RoleGate } from './RoleGate'
export { ProtectedRoute } from './ProtectedRoute'
export { AuthGuard } from './AuthGuard'
export type { Role, MunicipalityCode } from './RoleGate'
```

## Verification

- ✅ `npm run build` succeeds (TypeScript compilation + Vite build)
- ✅ RoleGate accepts roles prop (single or array)
- ✅ RoleGate accepts children prop
- ✅ RoleGate accepts fallback prop
- ✅ RoleGate checks user.role against allowed roles
- ✅ RoleGate optionally checks user.municipality matches municipality prop
- ✅ RoleGate handles loading state
- ✅ ProtectedRoute redirects to /signin when user is null
- ✅ ProtectedRoute checks role if roles prop provided
- ✅ ProtectedRoute renders children when authorized
- ✅ ProtectedRoute handles loading state
- ✅ AuthGuard shows loading state when auth is loading
- ✅ AuthGuard renders children when auth is resolved

## Deviations from Plan

None — plan executed exactly as written.

## Dependencies

- `react-router-dom` installed for Navigate component in ProtectedRoute

## Next Steps

These components are ready for integration into:

- `src/App.tsx` for route protection
- Admin panel pages for role-based content visibility
- Mobile and desktop shells for conditional rendering

---

**Requirement:** AUTH-05 (Role-based UI access control)
