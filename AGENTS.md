<!-- GSD:project-start source:PROJECT.md -->

## Project

**Bantayog Alert**

Bantayog Alert is a dual-surface disaster reporting, official alerting, emergency coordination, and disaster-mapping platform for Camarines Norte, Philippines. It serves three roles — **citizen**, **municipal_admin**, and **provincial_superadmin** — through a map-first desktop command center and a feed-first mobile citizen app. The core value chain is: citizen-submitted reports → admin triage (verify/reject/route/acknowledge/dispatch/resolve) → official announcements → push notification delivery.

**Core Value:** Citizens in Camarines Norte can report emergencies in seconds and understand active incidents around them; responders and administrators can verify, route, and resolve incidents with auditable precision — all with municipality scope as an unbreakable security boundary.

### Constraints

- **Tech stack**: React 18, Vite, Tailwind CSS, Firebase — not optional unless explicit tradeoff is explained
- **Security**: Municipality scoping enforced server-side — no exceptions, no UI-only enforcement
- **Performance**: No province-wide Firestore listeners; all queries paginated and scope-bounded
- **Map**: Desktop map must never remount during modal navigation — architectural guarantee required
- **Release gate**: 90/100 on Bantayog Alert Quality Scorecard. Automatic blockers: broken scope rules, broken provincial permissions, map remount, critical security flaw, failing core workflows
- **Offline**: Firestore offline persistence enabled; report submission queued offline and retried on reconnect
<!-- GSD:project-end -->

<!-- GSD:stack-start source:STACK.md -->

## Technology Stack

Technology stack not yet documented. Will populate after codebase mapping or first phase.

<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->

## Conventions

Conventions not yet established. Will populate as patterns emerge during development.

<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->

## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.

<!-- GSD:architecture-end -->

<!-- GSD:workflow-start source:GSD defaults -->

## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:

- `/gsd:quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd:debug` for investigation and bug fixing
- `/gsd:execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.

<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->

## Developer Profile

> Profile not yet configured. Run `/gsd:profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.

<!-- GSD:profile-end -->
