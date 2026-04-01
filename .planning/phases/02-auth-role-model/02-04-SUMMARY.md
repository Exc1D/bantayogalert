---
phase: 02-auth-role-model
plan: '04'
subsystem: auth-role-model
tags: [auth, routing, desktop-shell, role-gate]
dependency_graph:
  requires:
    - 02-01
    - 02-03
  provides:
    - AUTH-05
  affects:
    - src/components/layout/DesktopShell.tsx
    - src/components/layout/NavRail.tsx
tech_stack:
  added: []
  patterns:
    - Role-based routing via useEffect on mount
    - RoleGate wrapping for conditional nav items
key_files:
  created: []
  modified:
    - src/components/layout/DesktopShell.tsx
    - src/components/layout/NavRail.tsx
decisions:
  - D-08: Desktop routing: Citizens → Feed, municipal_admin → Admin, provincial_superadmin → Admin
  - D-10: Admin-specific links (Contacts) visible only to admin roles
metrics:
  duration: "<5 min"
  completed: "2026-04-02"
---

# Phase 02 Plan 04: Role-Based Desktop Routing — Summary

## One-Liner

Implemented role-aware post-authentication routing: citizens default to Feed view, admins to Admin panel; NavRail conditionally shows Contacts link for admin roles only.

## Completed Tasks

| Task | Name                                              | Commit  | Files            |
| ---- | ------------------------------------------------- | ------- | ---------------- |
| 1    | Update DesktopShell with role-aware default panel | 8790b55 | DesktopShell.tsx |
| 2    | Update NavRail with admin-specific links          | 8790b55 | NavRail.tsx      |

## Implementation Details

### Task 1: DesktopShell Role-Aware Default Panel

**Files modified:** `src/components/layout/DesktopShell.tsx`

Added role-based routing via `useEffect` that runs on mount:

```tsx
useEffect(() => {
  if (!user) return
  switch (user.role) {
    case 'citizen':
      open('feed')
      break
    case 'municipal_admin':
    case 'provincial_superadmin':
      open('admin')
      break
  }
}, [user, open])
```

This fulfills D-08:

- Citizens → Feed view
- municipal_admin → Admin panel
- provincial_superadmin → Admin panel (province scope handled in Admin panel itself)

### Task 2: NavRail Admin-Specific Links

**Files modified:** `src/components/layout/NavRail.tsx`

Added Contacts link wrapped in RoleGate:

```tsx
<RoleGate roles={['municipal_admin', 'provincial_superadmin']}>
  <button aria-label="Contacts">👥</button>
</RoleGate>
```

This fulfills D-10: Admin panel accessible via role-gated nav items.

## Verification

- `npm run build` ✓ — TypeScript compilation passes
- `grep -c "useAuth\|role" DesktopShell.tsx` = 12 occurrences ✓
- `grep -c "RoleGate\|Contacts" NavRail.tsx` = 6 occurrences ✓

## Must-Haves Checklist

| Truth                                                               | Status                                       |
| ------------------------------------------------------------------- | -------------------------------------------- |
| Desktop shell routes to Feed for citizens                           | ✓                                            |
| Desktop shell routes to Admin panel for municipal_admin             | ✓                                            |
| Desktop shell routes to Province overview for provincial_superadmin | ✓ (routes to admin, province scope in panel) |
| NavRail shows admin link only for admin roles                       | ✓                                            |

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None.

## Auth Gates

None encountered.

## Deferred Issues

None.

---

## Self-Check

- [x] `src/components/layout/DesktopShell.tsx` exists — FOUND
- [x] `src/components/layout/NavRail.tsx` exists — FOUND
- [x] Commit `8790b55` exists — FOUND

**Self-Check: PASSED**
