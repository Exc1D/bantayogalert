# Bantayog Alert CLAUDE Guide

This file is the primary product, architecture, and quality contract for Bantayog Alert.

If this repo also contains `.claude/CLAUDE.md`, keep the two files identical. Do not allow them to drift.

Use this guide when:

- bootstrapping a new Bantayog Alert repo
- planning major architecture changes
- implementing features
- reviewing production readiness

## Mission

Bantayog Alert is a production-grade disaster reporting, official alerting, emergency coordination, and disaster-mapping platform for Camarines Norte, Philippines.

The platform must do two things well at the same time:

- help citizens report emergencies quickly and understand what is happening around them
- help responders and administrators verify reports, route incidents correctly, send official alerts, and preserve reliable structured data for disaster mapping

## Core Roles

### `citizen`

- submit reports
- view public reports in feed and map views
- track their own reports from the profile tab
- receive relevant official alerts

### `municipal_admin`

- restricted to one assigned municipality
- verify, reject, route, acknowledge, and resolve reports in that municipality
- manage municipality-scoped responder contacts
- send municipality-scoped announcements and push notifications
- view municipality-scoped analytics, alerts, and audit data

### `provincial_superadmin`

- has authority across all municipalities in Camarines Norte
- can view and manage reports across the province
- can manage contacts across municipalities
- can review all alerts, logs, analytics, and audit records
- can send province-wide announcements or target one or more municipalities

## Scope Rules

- Municipality scope is a hard security boundary.
- `municipal_admin` must never read or mutate reports, contacts, announcements, or admin analytics outside the assigned municipality.
- `provincial_superadmin` may operate across all municipalities.
- Citizens should only see public reports, their own private account data, and alerts relevant to their municipality plus province-wide alerts.
- Scope enforcement must exist server-side, not only in UI filtering.

## Product Shape

### Desktop

Desktop is a map-first command center.

Non-negotiable desktop layout:

- minimal left-side navbar or navigation rail
- persistent live map as the primary canvas
- reusable right-side modal or drawer as the workspace surface

Non-negotiable desktop behavior:

- the map remains mounted and visible at all times
- feed, profile, alerts, admin, analytics, and similar sections open inside the right-side modal
- clicking a report pin opens a dedicated report-detail modal with full context and actions
- closing the modal returns the user to the map without resetting viewport, filters, or selected state unnecessarily
- desktop must not be implemented as a stretched mobile layout

### Mobile

Mobile is a feed-first mini social app paired with a live map.

Non-negotiable mobile behavior:

- fast report browsing
- fast access to the map
- dedicated Alerts tab
- profile tab with report status tracker
- low-friction report submission flow

Desktop and mobile can share domain logic and backend contracts, but they must not share the same layout assumptions.

## Core Features

### Realtime reporting

- citizens submit reports with type, category, severity, description, location, municipality, barangay, and media
- reports appear in near realtime in feed and map views
- location data must remain structured enough for future analytics and mapping

### Profile report tracker

- profile includes active and recent report tracking
- each tracked report shows current state, latest update time, location, and final outcome
- users can open a tracked report for more detail

### Admin triage

- admins can verify, reject, classify, reprioritize, route, acknowledge, mark in progress, and resolve reports
- triage includes routing destination selection and responder contact assignment
- routing history must be auditable

### Contacts directory

- contacts represent agencies, units, or individuals used for routing
- routed reports must store a snapshot of the chosen contact so history remains accurate after later directory edits

### Announcements and Alerts

- admins can create customized official announcements
- `municipal_admin` can send only to users in the assigned municipality
- `provincial_superadmin` can send province-wide or to selected municipalities
- announcements are reviewable in the Alerts tab
- delivery logs are preserved for auditability

### Disaster mapping and analytics

- structured report and alert data must support municipality-level and province-level analysis
- analytics should favor verified and operationally processed data over raw user content alone

## Preferred Stack

- React 18
- Vite
- Tailwind CSS
- Firebase Auth
- Firestore
- Firebase Storage
- Firebase Cloud Functions
- Firebase Hosting
- Firebase Cloud Messaging
- Leaflet or React-Leaflet
- PWA support
- Vitest
- React Testing Library
- Playwright

Use this stack unless there is a strong reason to change it. If changing it, explain the tradeoff first.

## Build Philosophy

- Start from domain boundaries, not from screens.
- Define data contracts before building complex UI.
- Keep the desktop map-persistence rule as architecture, not polish.
- Keep public-facing data separate from internal operational metadata.
- Prefer append-only activity logs over mutating large history arrays on parent documents.
- Prefer scalable backend-safe patterns over fast one-off UI shortcuts.

## Repo Conventions

If the repo contains workflow and skill infrastructure, use it.

- `workflows/` contains SOPs and execution flows
- `.claude/skills/` contains repeatable execution steps
- `docs/` holds product and system documentation
- `principles/` holds architecture and coding standards
- `errors/` documents recurring failures and root causes

Before inventing a new process, check whether an existing workflow or skill already covers the task.

## Architecture Rules

- Separate layout concerns from domain logic.
- Separate public report fields from admin-only workflow fields.
- Treat the right-side modal as a shared workspace surface, not a collection of one-off overlays.
- Modal state changes must not remount the map.
- Route changes, if used, must not force the Leaflet tree to reinitialize.
- Avoid tight coupling between analytics screens and raw client-side report scans.
- Prefer explicit query boundaries by role, municipality, status, and feature.

## Suggested Domain Boundaries

- `auth`: sign-in, role loading, municipality scope
- `reports`: submit, list, detail, verify, reject, route, resolve
- `map`: markers, viewport persistence, filters, pin selection
- `feed`: public stream, search, sort, pagination
- `profile`: account, preferences, report tracker
- `contacts`: responder directory
- `alerts`: announcements, delivery logs, Alerts tab
- `analytics`: aggregates, charts, disaster-mapping summaries
- `audit`: workflow history and critical action logging

## Firestore Modeling Guidelines

Prefer small, focused documents and move high-churn history into subcollections.

Recommended top-level collections:

- `users`
- `reports`
- `contacts`
- `announcements`
- `audit`

Recommended subcollections:

- `reports/{reportId}/activity`
- `announcements/{announcementId}/notifications`
- `users/{userId}/subscriptions`

Recommended report modeling:

- keep the parent report document lean
- store current public state and essential admin state on the parent
- store workflow history in `reports/{reportId}/activity`
- do not keep unbounded arrays of history or logs on the main report document
- keep media metadata compact and store files in Storage

Recommended announcement modeling:

- include creator role
- include creator municipality
- include scope type such as `municipality`, `multi_municipality`, or `province`
- include target municipalities when applicable
- include severity and delivery metadata
- store delivery logs in a subcollection instead of on the parent document

## Workflow Model

Minimum report states:

- `pending`
- `verified`
- `rejected`
- `dispatched`
- `acknowledged`
- `in_progress`
- `resolved`

Workflow rules:

- internal operational workflow and citizen-facing status are related but not identical
- not every internal state must be exposed verbatim to citizens
- every state transition must record actor, timestamp, previous state, next state, and notes when relevant
- invalid transitions must be blocked by backend rules or callable/backend functions, not just the UI

## Performance And Scaling Guardrails

These are non-optional.

### Realtime

- use realtime listeners only where they materially improve UX
- do not keep broad province-wide listeners open on every screen
- scope listeners by role, municipality, status, and surface

### Feed

- paginate feed queries
- use bounded page sizes
- avoid loading full report history into memory on mobile

### Map

- keep the desktop map mounted and stable
- avoid remounting the Leaflet tree during modal or workspace changes
- preserve viewport, marker selection, and filters when practical
- cluster markers as report volume grows
- avoid expensive derived computations on every render
- filter and shape data before rendering markers
- opening and closing the right-side modal must not trigger a full map reset or unnecessary refetch

### Analytics

- do not compute province-wide analytics by scanning all raw reports in the client
- prefer pre-aggregated documents, scheduled jobs, or Cloud Functions for expensive summaries
- design aggregates for incremental updates

### Media

- compress images before upload
- generate thumbnails when useful
- reject oversized or unsafe uploads early

### Firestore scale

- keep hot documents small
- avoid unbounded arrays on top-level documents
- use subcollections for activity logs and delivery logs
- design indexes intentionally
- be careful with fanout writes and global counters

### Notifications

- use municipality-scoped topics for push notifications
- handle province-wide sends separately from municipality sends
- preserve send logs and failure information for retries and audit

## Robustness Guardrails

- client validation is UX-only; security must live in rules and backend logic
- gracefully handle malformed documents, missing fields, deleted media, and partial failures
- prefer idempotent backend operations for workflow mutations and notifications
- critical operations must be logged
- do not let a failed side effect corrupt the main workflow state
- treat offline and reconnect behavior as first-class concerns for mobile

## Security Requirements

- enforce role-based access in UI and server-side rules
- enforce municipality scope server-side
- sanitize all user-generated content before rendering
- validate all write payloads
- restrict Storage uploads by path, type, and size
- keep admin-only operational metadata private
- keep audit history readable only to authorized roles
- prevent cross-municipality privilege leaks
- prevent invalid state transitions and unauthorized announcement sends

## Accessibility Requirements

- use semantic landmarks and headings
- support keyboard navigation for all major actions
- manage focus correctly for modals and drawers
- keep color contrast strong in both public and admin surfaces
- make status messaging screen-reader friendly
- keep forms and dialogs accessible by default

## SEO Rules

SEO matters only for public surfaces.

- public pages must have correct title, meta description, canonical, and social metadata
- generate or maintain sitemap and robots rules for public pages
- admin, auth, and private account surfaces must be excluded from indexing
- do not spend SEO effort on authenticated command-center surfaces

## Delivery Strategy

Build in phases:

1. project foundation and tooling
2. domain model and backend contracts
3. auth and role model
4. desktop shell and mobile shell
5. report submission
6. realtime map and feed
7. profile report tracker
8. admin verification and routing
9. contacts management
10. announcements, push notifications, and Alerts tab
11. analytics and disaster mapping
12. hardening, accessibility, performance tuning, and release verification

Do not skip the shell architecture phase. The map-first desktop shell is a core requirement.

## Testing Expectations

Required coverage areas:

- unit tests for workflow logic, role scoping, sanitization, and utilities
- integration tests for report submission, routing, announcements, and profile tracking
- E2E tests for desktop modal behavior and mobile UX flows
- permission tests for `citizen`, `municipal_admin`, and `provincial_superadmin`
- push notification and alert visibility tests
- regression tests proving map persistence on desktop

## Quality Scorecard

Use this exact weighted release rubric.

Total score: `100`

### 1. Performance = `25`

- mobile Lighthouse Performance on a public route is `85+` = `8`
- desktop Lighthouse Performance on a public route is `95+` = `4`
- LCP on the main public route is `2.5s` or better = `4`
- CLS on the main public route is `0.1` or lower = `2`
- desktop map stays mounted when opening or closing the right modal = `4`
- feed and map subscriptions are scoped and paginated, not broad unbounded listeners = `3`

### 2. Security = `25`

- zero critical security flaws = `8`
- zero high-severity authorization or data-leak flaws = `5`
- `100%` pass on role, rules, and RBAC tests = `6`
- municipality scoping is enforced server-side for `municipal_admin` = `3`
- upload validation, sanitization, and admin-only data protection are implemented = `3`

### 3. Design = `20`

- desktop layout is fully usable at `1280px+` and preserves map context = `5`
- mobile layout is fully usable at `360px` width = `5`
- accessibility score is `95+` on key public and admin flows = `4`
- right modal interactions are consistent across feed, profile, alerts, admin, and report details = `3`
- no major overflow, clipping, or broken interaction states in tested layouts = `3`

### 4. SEO = `10`

- Lighthouse SEO score on public routes is `90+` = `4`
- public pages have correct title, meta description, canonical, and social metadata = `3`
- sitemap and robots rules are correct for public content = `2`
- admin and private surfaces are excluded from indexing = `1`

### 5. Overall Quality = `20`

- `100%` pass on required unit, integration, and E2E suites = `7`
- no blocker bugs in report submission, map and feed sync, profile tracking, triage, or alerts = `5`
- no uncaught console errors in primary user journeys = `3`
- observability, audit logging, and failure handling are in place = `3`
- core documentation and setup are strong enough for another engineer to continue = `2`

### Release gate

- minimum total score: `90/100`
- Performance must be at least `20/25`
- Security must be at least `23/25`
- Design must be at least `16/20`
- SEO must be at least `8/10`
- Overall Quality must be at least `17/20`

### Automatic release blockers

- any broken municipality-scope rule
- any broken `provincial_superadmin` permission path
- any map reset or remount caused by right-modal navigation
- any critical security flaw
- any failing core workflow around reports, alerts, or triage

### Scoring output format

When evaluating progress or release readiness, always return:

- category score breakdown
- evidence for each score
- failed criteria
- release blockers if any
- next actions needed to reach release quality

## Definition Of Done

A feature is not done unless:

- it respects role scope rules
- it preserves desktop map persistence where relevant
- it includes loading, empty, and error states appropriate to the risk
- it uses backend-safe data handling
- it does not introduce obvious performance regressions
- it has tests appropriate to its risk level

## Working Style For Claude Code

- restate phase goal and assumptions before major implementation
- prefer deliberate architecture over fast patching
- call out scale-sensitive tradeoffs before committing to them
- keep changes phase-oriented and cohesive
- update docs when a durable architectural decision changes
- do not claim production-ready unless the release gate is met

## Useful Commands

- `npm run dev`
- `npm run build`
- `npm run lint`
- `npm run typecheck`
- `npm run test:run`
- `npm run test:e2e`
