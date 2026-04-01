# Phase 2: Auth & Role Model - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-02
**Phase:** 02-auth-role-model
**Areas discussed:** Sign-up flow, Role assignment, Post-auth routing, Firestore rules architecture

---

## Sign-Up Flow

| Option         | Description                                             | Selected |
| -------------- | ------------------------------------------------------- | -------- |
| Self-signup    | User creates account directly, citizen role immediately | ✓        |
| Admin-approval | User signs up → pending → admin approves                |          |
| Hybrid         | Self-signup as citizen, admin role requires approval    |          |

**User's choice:** Self-signup for citizens
**Notes:** Fast, no friction for citizens

---

### Sign-up Fields

**User's choice:** Email, password (medium), display name, municipality, phone number
**Notes:** Added phone number per request

---

### Password Requirements

| Option           | Description                                     | Selected |
| ---------------- | ----------------------------------------------- | -------- |
| Firebase default | 8+ characters                                   |          |
| Medium           | 8+ chars, at least 1 number                     | ✓        |
| Strong           | 8+ chars, uppercase, lowercase, number, special |          |

**User's choice:** Medium enforcement
**Notes:** Balance between security and usability

---

## Role Assignment

### municipal_admin Creation

| Option                   | Description                                         | Selected |
| ------------------------ | --------------------------------------------------- | -------- |
| Provincial admin creates | Admin creates accounts in console                   |          |
| Invitation flow          | Admin invites by email, invitee sets password       |          |
| Request-then-approve     | Request button → admin approves → account activated | ✓        |

**User's choice:** Request-then-approve flow
**Notes:** Allows users to request, provincial_superadmin controls access

---

### provincial_superadmin Creation

| Option                | Description                                  | Selected |
| --------------------- | -------------------------------------------- | -------- |
| Firebase console only | Manual setup, admin script for custom claims | ✓        |
| First-run wizard      | First person creates admin, then locks       |          |

**User's choice:** Firebase console only
**Notes:** Simpler, manual but controlled

---

## Post-Auth Routing

### Desktop Routing

| Option                   | Description                                                           | Selected |
| ------------------------ | --------------------------------------------------------------------- | -------- |
| Role-specific dashboards | Citizens → Feed, Admins → Admin panel, Superadmin → Province overview | ✓        |
| Same landing for all     | Everyone lands on map, content filtered by role                       |          |

**User's choice:** Role-specific dashboards
**Notes:** Clear separation of concerns per role

---

### Mobile Admin Access

| Option               | Description                                          | Selected |
| -------------------- | ---------------------------------------------------- | -------- |
| Profile section      | Admin panel accessible via Profile → role badge menu | ✓        |
| Long-press Profile   | Long-press reveals admin menu                        |          |
| Hamburger menu       | Overlay menu with admin access                       |          |
| Extended Profile tab | Profile becomes "Profile & Admin"                    |          |
| Top bar overflow     | Three-dot menu in header                             |          |

**User's choice:** Profile section (role badge → admin menu)
**Notes:** Consistent with same tab structure, intuitive for users

---

## Firestore Rules Architecture

| Option        | Description                                             | Selected |
| ------------- | ------------------------------------------------------- | -------- |
| By collection | Separate rule blocks per collection                     |          |
| By operation  | Common checks factored out, reused                      |          |
| Hybrid        | Municipality scope function + readable collection rules | ✓        |

**User's choice:** Hybrid approach
**Notes:** One function to verify security-critical municipality scoping, collection rules stay readable.

---

## Agent's Discretion

- Exact UI component names and file structure
- Specific error messages and validation copy
- Approval notification delivery method (in-app vs email)
- Admin panel UI layout specifics

---

## Deferred Ideas

None — discussion stayed within phase scope.
