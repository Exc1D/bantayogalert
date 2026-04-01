# Phase 2: Auth & Role Model - Context

**Gathered:** 2026-04-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 2 delivers complete authentication flows, role-based access control, and server-side municipality scoping enforcement. Users can create accounts, sign in/out, and access is restricted based on role and municipality scope.

**Phase 2 delivers:**

1. Email/password sign-up and sign-in for citizens
2. Request → approval flow for municipal_admin role assignment
3. Firebase console setup for provincial_superadmin
4. Firebase Auth custom claims (role, municipality) set server-side via Cloud Function
5. RoleGate and ProtectedRoute React components
6. Post-auth routing to role-appropriate views
7. Firestore security rules enforcing municipality scoping (hybrid approach)

</domain>

<decisions>
## Implementation Decisions

### Sign-Up Flow

- **D-01:** Citizens self-signup with: email, password (medium: 8+ chars + 1 number), display name, municipality (dropdown of 12), phone number
- **D-02:** municipal_admin accounts: user requests access → provincial_superadmin approves via admin panel → account activated with role
- **D-03:** provincial_superadmin accounts: manual Firebase console setup only

### Role Model

- **D-04:** Roles: citizen, municipal_admin, provincial_superadmin (one role per user)
- **D-05:** Custom claims structure: `{ role: string, municipality: string | null }`
- **D-06:** municipal_admin custom claim includes assigned municipality code
- **D-07:** Custom claims set exclusively by privileged Cloud Function (never client-side) — SEC-06

### Post-Auth Routing

- **D-08:** Desktop routing:
  - Citizens → Feed view
  - municipal_admin → Admin panel (with map)
  - provincial_superadmin → Province overview (with map)
- **D-09:** Mobile routing: Same bottom tabs (Feed, Map, Alerts, Profile) for all roles
- **D-10:** Mobile admin access: Admin panel accessible via Profile tab → role badge menu

### Firestore Security Rules

- **D-11:** Hybrid architecture: municipality scope function factored out, collection rules stay readable
- **D-12:** `hasMunicipalityAccess(request, userMuni, targetMuni)` function for consistent enforcement
- **D-13:** Rules for collections: reports, contacts, announcements, users
- **D-14:** provincial_superadmin bypasses municipality scoping (province-wide access)

### Agent's Discretion

- Exact UI component names and file structure
- Specific error messages and validation copy
- Approval notification delivery method (in-app vs email)
- Admin panel UI layout specifics

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Specs

- `./SPEC.md` — Full technical specification; Firestore data model, workflow states, and architecture rules
- `./CLAUDE.md` — Project guide; defines preferred stack, delivery strategy, and quality scorecard
- `./PROJECT.md` — Core value, active requirements, constraints, and key architectural decisions
- `./.planning/REQUIREMENTS.md` — Full REQ-ID traceability (AUTH-01 through AUTH-06, SEC-01 through SEC-03)
- `./.planning/ROADMAP.md` — Phase 2 goal and success criteria
- `./.planning/phases/01-foundation/01-CONTEXT.md` — Firebase project config, SEC-06 custom claims requirement

### Phase 1 Specific

- `./src/config/firebase.ts` — Firebase initialization (already connected to `bantayogalert` project)
- `./src/contexts/AuthContext.tsx` — AuthContext stub to replace in Phase 2

### Municipality Codes

- `./.planning/phases/01-foundation/01-CONTEXT.md` — All 12 codes: `basud`, `daet`, `josepanganiban`, `labo`, `mercedes`, `paracale`, `sanlorenzo`, `sanvicente`, `talisay`, `vinzales`, `capalonga`, `staelena`

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- `src/contexts/AuthContext.tsx` — Stub ready for Phase 2 implementation (signIn/signOut currently empty)
- `src/components/layout/NavRail.tsx` — Left nav placeholder for admin panel link
- `src/components/layout/DesktopShell.tsx` — Shell structure ready for role-based routing

### Established Patterns

- Context pattern: `{ Provider, useHook }` export structure
- Firebase service getters in `src/config/firebase.ts`
- TypeScript strict mode with noUnusedLocals/noUnusedParameters

### Integration Points

- `src/App.tsx` — AuthProvider wrapping app, ready for ProtectedRoute integration
- `src/config/firebase.ts` — getFirebaseAuth(), getFirebaseFunctions() available
- Shell routing (mobile/desktop) already in App.tsx — needs role-based post-auth routing

</code_context>

<specifics>
## Specific Ideas

- Admin approval panel: List of pending requests with approve/reject buttons
- Role badge in Profile tab: Visual indicator of current role with admin menu link
- Password validation: min 8 chars, at least 1 digit (medium strength)
- MunicipalAdmin request flow: User signs up as citizen, requests admin role with municipality claim

</specifics>

<deferred>
## Deferred Ideas

None — all Phase 2 decisions captured in this discussion.

</deferred>

---

_Phase: 02-auth-role-model_
_Context gathered: 2026-04-02_
