# Phase 3: Auth & Role Model - Context

**Gathered:** 2026-04-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can register, authenticate, and receive role-based custom claims enforced server-side. Firebase Auth with email/password + Google OAuth. Custom claims (role, municipalityCode, provinceCode) set via Cloud Function and verified in Firestore rules. App Check in audit mode.

**Delivers:**
- Firebase Auth (email/password + Google OAuth)
- Custom claims (role, municipalityCode, provinceCode) via setUserRole callable
- Auth state persistence and route guards
- setUserRole callable (superadmin only)
- Profile update (displayName, notification preferences)
- Firestore rules fully enforce RBAC + municipality scope (60+ rule tests)
- Storage rules: image-only uploads, max 10MB, path ownership
- Cloud Functions validate role + municipality scope on all writes
- App Check integrated (audit/logging mode)

**Constraints (from prior phases):**
- Firebase SDK 12.x, React 18.3.28, TypeScript strict
- Three-tier report split: reports / report_private / report_ops
- Custom claims RBAC: role + municipalityCode + provinceCode
- UserRole enum: citizen, municipal_admin, provincial_superadmin
</domain>

<decisions>
## Implementation Decisions

### Auth Strategy
- **D-43:** Email/password registration with Firebase Auth — no custom token issuance
- **D-44:** Google OAuth as secondary provider — one account per Google email
- **D-45:** Session persistence: `browserLocalPersistence` — session survives refresh

### Custom Claims
- **D-46:** setUserRole callable Cloud Function — superadmin only, sets role + municipalityCode + provinceCode on user record
- **D-47:** Claims set atomically on user document AND custom claims token — both updated together
- **D-48:** Default role on registration: `citizen` with provinceCode = 'CMN', municipalityCode = null

### Route Protection
- **D-49:** React Router loader functions check auth state — redirect to /auth/login if unauthenticated
- **D-50:** Protected routes: all /app/* routes require authentication; /admin/* requires municipal_admin or provincial_superadmin role

### App Check
- **D-51:** App Check in audit mode (verify, don't enforce) — logs but doesn't block traffic
- **D-52:** Enforced after Phase 12 burn-in period

### Firestore Rules Coverage (60+ tests)
- **D-53:** Rules cover: users read/own, reports/verified, report_private/owner+admin, report_ops/admin-only, contacts/municipal_scoped, announcements/scoped, analytics/admin_only, audit/provincial_only

### Cloud Functions Validation
- **D-54:** All CF write triggers (report create, triage action, announcement publish) validate role + municipality scope before writing

### Claude's Discretion
- Email verification template: default Firebase email (customized with Bantayog branding in Phase 12)
- Google OAuth redirect URI: use Firebase console default
- Notification preferences UI: simple toggles in Profile (Phase 7)
</decisions>

<canonical_refs>
## Canonical References

### Project Definition
- `.planning/PROJECT.md` — Core value, three-tier report, map stability
- `.planning/REQUIREMENTS.md` §Auth — AUTH-01 through AUTH-08, SEC-01 through SEC-07

### Prior Phase Context
- `.planning/phases/01-project-foundation-tooling/01-CONTEXT.md` — D-01 through D-20
- `.planning/phases/02-domain-model-backend-contracts/02-CONTEXT.md` — D-21 through D-42

### Phase-Internal
- `.planning/ROADMAP.md` §Phase 3 — Success criteria (12 must-be-TRUE)
</canonical_refs>

<specifics>
## Specific Ideas

No user-facing specifics — Phase 3 is pure Firebase Auth infrastructure. All decisions are standard Firebase patterns.
</specifics>

<deferred>
## Deferred Ideas

None — Phase 3 scope stayed well-bounded.
</deferred>
