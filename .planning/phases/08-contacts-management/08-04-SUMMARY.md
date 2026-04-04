---
phase: 08-contacts-management
plan: "08-04"
subsystem: navigation
tags: [contacts, routing, navigation]
dependency_graph:
  requires:
    - "08-03"
  provides:
    - CON-01
    - CON-02
    - CON-03
    - CON-04
    - CON-05
tech_stack:
  added: []
  patterns:
    - AdminRoute guard pattern for protected routes
    - Role-based nav item filtering
    - Dynamic tab computation based on user role
key_files:
  created:
    - src/app/contacts/page.tsx
  modified:
    - src/App.tsx
    - src/app/shell/DesktopNavRail.tsx
    - src/app/shell/MobileBottomTabs.tsx
decisions:
  - "Added /app/contacts nested route under ShellRouter in App.tsx (not the stub router.tsx)"
  - "Contacts nav items use navigate('/app/contacts') instead of drawer panel"
  - "MobileBottomTabs computes tabs dynamically based on role at render time"
metrics:
  duration: ~2 min
  tasks_completed: 4
  files_created: 1
  files_modified: 3
  commits: 4
---

# Phase 08 Plan 04: Router and Nav Integration Summary

## One-Liner
Contacts management accessible at `/app/contacts` route with admin-only nav items in both desktop rail and mobile bottom tabs.

## Completed Tasks

| Task | Name | Commit | Files |
| ---- | ---- | ------ | ----- |
| 1 | Create ContactsRoute component | `5fb1cbe` | src/app/contacts/page.tsx |
| 2 | Add /app/contacts route to App.tsx | `931a96b` | src/App.tsx |
| 3 | Update DesktopNavRail Contacts nav | `6346f63` | src/app/shell/DesktopNavRail.tsx |
| 4 | Add admin Contacts tab to MobileBottomTabs | `e47ede6` | src/app/shell/MobileBottomTabs.tsx |

## What Was Built

### 1. ContactsRoute (`src/app/contacts/page.tsx`)
- Route component wrapping `ContactsPage` from 08-03
- Auth guard: redirects unauthenticated users to `/auth/login`
- Role guard: redirects non-admin users to `/app`
- Renders `ContactsPage` for municipal_admin and provincial_superadmin

### 2. Route Registration (`src/App.tsx`)
- Added `import ContactsRoute from './app/contacts/page'`
- Added nested route `<Route path="contacts" element={<ContactsRoute />} />` under `/app` ShellRouter
- Note: The plan referenced `src/app/router.tsx` but that file is a stub placeholder not used by the actual app. Routes are defined in `App.tsx`.

### 3. DesktopNavRail Update
- Added `useNavigate` import from react-router
- Updated `buildNavItems` to accept `navigate` parameter
- Changed Contacts nav item from `onClick: onPanel('contact-detail')` to `onClick: () => navigate('/app/contacts')`

### 4. MobileBottomTabs Update
- Added `useNavigate`, `useAuth`, `UserRole` imports
- Computed tabs dynamically with role check: `isAdmin = role === UserRole.MunicipalAdmin || role === UserRole.ProvincialSuperadmin`
- Added Contacts tab at index 2 (before Report button) for admin users via `tabs.splice(2, 0, {...})`
- Contacts tab uses `navigate('/app/contacts')` onClick

## Deviations from Plan

### 1. Route registration in App.tsx instead of router.tsx
- **Plan said:** Update `src/app/router.tsx` to add `/app/contacts` route
- **Found:** `src/app/router.tsx` is a minimal stub placeholder that is NOT used by the app
- **Actual:** Routes are defined in `src/App.tsx` using nested routing under `ShellRouter`
- **Resolution:** Added route to `App.tsx` instead

## Verification Results

- TypeScript compilation: PASS
- `grep "contacts" src/app/shell/DesktopNavRail.tsx`: Found Contacts nav with navigate
- `grep "contacts" src/app/shell/MobileBottomTabs.tsx`: Found dynamic Contacts tab
- `grep "/app/contacts" src/App.tsx`: Found route registration
- `grep "ContactsPage" src/app/contacts/page.tsx`: Found ContactsPage import and usage

## Self-Check: PASSED

All files exist, all commits found, TypeScript compiles without errors.

## Requirements Satisfied

- CON-01: Emergency contact display - Contacts page accessible at `/app/contacts`
- CON-02: Contact categorization - ContactsPage (from 08-03) handles display
- CON-03: Quick dial/action - Contacts nav integrated in nav rail and mobile tabs
- CON-04: Municipal-level filtering - AdminRoute guard enforces role check
- CON-05: Provincial overview - ProvincialSuperadmin sees Contacts nav in both shells
