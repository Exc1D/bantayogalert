# Bantayog Alert — UI/UX Design Specification v2

### Merged & Corrected Edition

> **Core design principle:** _"When disaster strikes, people don't have time to think. The UX must do the thinking for them."_

> **Document status:** This is the authoritative merged specification incorporating the original design spec, the external critical review, and the architect's self-review. Every section has been reconciled — contradictions resolved, missing designs added, and violations of the spec's own principles corrected. No earlier document supersedes this one.

---

## Table of Contents

1. [Design Philosophy](#1-design-philosophy)
2. [Design Inspirations & Rationale](#2-design-inspirations--rationale)
3. [Color System](#3-color-system)
4. [Typography](#4-typography)
5. [Iconography & Visual Language](#5-iconography--visual-language)
6. [Severity Visual System](#6-severity-visual-system)
7. [Core Component Library](#7-core-component-library)
8. [Desktop Layout — Full Specifications](#8-desktop-layout--full-specifications)
9. [Mobile Layout — Full Specifications](#9-mobile-layout--full-specifications)
10. [Tablet Layout — 769px–1279px](#10-tablet-layout--769px1279px)
11. [Report Submission Flow](#11-report-submission-flow)
12. [Announcement Creation Flow](#12-announcement-creation-flow)
13. [Map Design System](#13-map-design-system)
14. [Admin-Specific Patterns](#14-admin-specific-patterns)
15. [Notification & Toast System](#15-notification--toast-system)
16. [Motion & Transitions](#16-motion--transitions)
17. [Accessibility Specifications](#17-accessibility-specifications)
18. [Dark Mode](#18-dark-mode)
19. [Empty States & Error States](#19-empty-states--error-states)
20. [Performance & Font Loading](#20-performance--font-loading)
21. [Design Quality Targets](#21-design-quality-targets)

---

## 1. Design Philosophy

### The Three Pillars

| Pillar             | Principle                           | Application                                                                                          |
| ------------------ | ----------------------------------- | ---------------------------------------------------------------------------------------------------- |
| **Clarity**        | One glance = one understanding      | Color-coded severity, large status badges, plain Filipino + English labels                           |
| **Speed**          | Every critical path ≤ 3 taps/clicks | Report in 3 steps on mobile; triage in 2 clicks for admins                                           |
| **Calm Authority** | Reduce panic, build trust           | Cool blue base palette, warm severity accents only where needed, verified badges on official content |

### Crisis UX Laws Applied

1. **Hick's Law** — Reduce choices at every step. The citizen report flow contains zero classification decisions (no disaster type, no severity picker). Those are admin responsibilities during triage, where trained personnel can make accurate judgments calmly.
2. **Fitts's Law** — Make critical buttons large (min 48×48px mobile, 44×44px desktop). The "Report Emergency" button is the largest interactive element.
3. **Miller's Law** — Chunk information. Report cards show **max 5** pieces of data in compact mode (severity, type, location, time, status). Standard mode adds description preview and thumbnails.
4. **Cognitive load theory** — In emergencies, working memory drops to ~3 items. Every screen answers: **What happened? Where? What should I do?** For citizens: capture evidence → confirm location → describe situation. Classification is deferred to admins.

### Design Mood

| Quality                     | How It Manifests                                                                            |
| --------------------------- | ------------------------------------------------------------------------------------------- |
| **Trustworthy**             | Government-adjacent color palette (navy + white), verified badges, official alert styling   |
| **Urgent but not alarming** | Red only for critical severity and destructive actions, never for navigation                |
| **Filipino-context aware**  | Barangay-level granularity, municipality-centric navigation, Tagalog-friendly label lengths |
| **Modern but conservative** | No experimental UI patterns. Cards, lists, maps — things people already know                |

### Compact vs. Standard Card Density

The feed supports two display densities toggled by user or triggered automatically:

- **Compact mode** (active disaster, default during declared emergencies): Shows severity + type + location + time only. 4 data items per card. Maximum scanning speed.
- **Standard mode** (normal browsing): Full card with description preview, thumbnails, and status. 7 items max.

Admins can force compact mode province-wide during active disaster declarations.

---

## 2. Design Inspirations & Rationale

> **Note:** This section documents only genuinely instructive takeaways — cases where a specific design decision in Bantayog Alert was shaped by studying the referenced app's approach, including what we rejected and why.

| Inspiration                 | Specific Takeaway                                | How It Shaped This Spec                                                                                                                                                            |
| --------------------------- | ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Watch Duty**              | Severity colors system; clustering behavior      | Watch Duty uses only 3 severity levels with warm-to-red progression. We expanded to 4 with a perceptually distinct palette (see §3.3) to accommodate more nuanced disaster states. |
| **FEMA App**                | Plain language labels; step-by-step confirmation | FEMA's confirm-before-submit screen reduces mis-reports significantly. Adopted in Step 3/4 of our submission flow.                                                                 |
| **Red Cross Emergency App** | Offline-first design; draft persistence          | Pre-loaded offline draft state taught us that form progress must survive app backgrounding. Adopted IndexedDB draft strategy.                                                      |
| **Citizen app**             | Feed-first mobile; social report card format     | Citizen's card density is optimized for engagement, not crisis. We adopted their spatial card layout but stripped engagement metrics in favor of severity-first hierarchy.         |
| **Crises Control**          | Role-based dashboard; audit trail UI             | Their admin panel requires training to use. We adopted the audit trail concept but required all triage actions to be performable in under 15 seconds without onboarding.           |
| **Google Crisis Response**  | Map overlay style; authoritative source badging  | Their municipality boundary overlays are too heavy (solid fills). We use dashed strokes only, preserving map readability.                                                          |

### Anti-Patterns We Explicitly Reject

- ❌ **Doom-scrolling feed design** — We paginate and stop, never infinite-scroll endlessly
- ❌ **Notification overload** — Alerts are severity-filtered; users control which levels they receive
- ❌ **Map-as-decoration** — Every map element is interactive and serves a purpose
- ❌ **Admin panels that look like email** — Admin triage is action-oriented, not list-management
- ❌ **Red as primary brand color** — Red is reserved for critical severity and destructive actions only; the Report button uses brand blue

---

## 3. Color System

### 3.1 Brand Palette

```
Primary Navy         #1B2A4A    — Navigation, headers, primary text
Primary Blue         #2563EB    — Interactive elements, links, selected states, Report CTA
Primary Blue Light   #3B82F6    — Hover states, secondary interactive
White                #FFFFFF    — Backgrounds, cards
```

### 3.2 Neutral Palette

```
Gray 900             #111827    — Primary text
Gray 700             #374151    — Secondary text
Gray 500             #6B7280    — Tertiary text, placeholders
Gray 300             #D1D5DB    — Borders, dividers
Gray 100             #F3F4F6    — Background surfaces
Gray  50             #F9FAFB    — Subtle background
```

### 3.3 Severity Palette

> **Design decision:** High Orange (#EA580C) and Medium Amber (#D97706) are too perceptually similar under stress and for color-vision-deficient users (deuteranopia affects ~6% of males). Medium has been shifted to a distinct yellow-green to create clear separation across all four levels. All values have been verified against WCAG AA contrast requirements and tested through deuteranopia/protanopia simulation.

```
Critical Red         #DC2626    bg: #FEF2F2    border: #FECACA    text: #991B1B
High Orange          #EA580C    bg: #FFF7ED    border: #FED7AA    text: #9A3412
Medium Yellow-Green  #65A30D    bg: #F7FEE7    border: #D9F99D    text: #3F6212
Low Blue             #2563EB    bg: #EFF6FF    border: #BFDBFE    text: #1E40AF
```

**Perceptual separation rationale:**

- Critical (Red) → High (Orange): Warm-to-warm, differentiated by hue
- High (Orange) → Medium (Yellow-Green): Warm-to-cool, maximum perceptual contrast
- Medium (Yellow-Green) → Low (Blue): Cool-to-cool, differentiated by hue
- Each level is also differentiated by icon shape and text label (never color alone)

### 3.4 Status Palette

```
Submitted Gray       #6B7280    bg: #F3F4F6
Under Review Blue    #2563EB    bg: #EFF6FF
Verified Green       #059669    bg: #ECFDF5
Dispatched Purple    #7C3AED    bg: #F5F3FF
In Progress Amber    #D97706    bg: #FFFBEB
Resolved Emerald     #047857    bg: #D1FAE5
Rejected Rose        #BE123C    bg: #FFF1F2
Duplicate Gray       #4B5563    bg: #F1F5F9
```

### 3.5 Alert/Announcement Palette

```
Info                 #2563EB    bg: #EFF6FF    icon: ℹ️
Warning              #D97706    bg: #FFFBEB    icon: ⚠️
Critical             #DC2626    bg: #FEF2F2    icon: 🚨
All Clear            #059669    bg: #ECFDF5    icon: ✅
```

### 3.6 Color Usage Rules

| Rule                                                                                                                                                          | Rationale                                                                                                                            |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| **Red (#DC2626) is ONLY used for: critical severity badges, destructive action buttons (Reject, Delete), and the notification dot on unread critical alerts** | Red = danger. Overuse destroys its warning power.                                                                                    |
| **The Report CTA button uses Primary Blue (#2563EB), not red**                                                                                                | The primary citizen action is constructive, not destructive. Its prominence comes from size and position, not borrowed crisis-color. |
| **Severity colors appear ONLY on severity badges, map pins, alert banners, and card left borders**                                                            | Preserves their warning power                                                                                                        |
| **Primary Navy is the dominant chrome color**                                                                                                                 | Creates a calm, authoritative baseline                                                                                               |
| **White/Gray 50 backgrounds for content areas**                                                                                                               | Maximizes readability, reduces visual fatigue                                                                                        |
| **All color pairs must pass WCAG AA (4.5:1 for text, 3:1 for large text/UI)**                                                                                 | Non-negotiable accessibility                                                                                                         |

---

## 4. Typography

### 4.1 Font Stack

```css
--font-primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', monospace; /* report IDs, timestamps */
```

**Why Inter:** Designed for screen legibility at all sizes. Tall x-height for readability on small mobile screens. Strong weight range for hierarchy.

**Font loading strategy:** Inter is bundled (not CDN-loaded) as a WOFF2 subset covering Latin Extended (for Filipino names with accents: ñ, etc.) at weights 400, 600, 700. Total size: ~90KB. This guarantees font availability offline during disaster connectivity loss. `font-display: swap` is used so text renders immediately in the system fallback font while Inter loads. The 400 weight is preloaded in `<head>`.

### 4.2 Type Scale

| Token     | Size             | Weight | Line Height | Usage                        |
| --------- | ---------------- | ------ | ----------- | ---------------------------- |
| `display` | 30px / 1.875rem  | 700    | 1.2         | Landing page hero only       |
| `h1`      | 24px / 1.5rem    | 700    | 1.3         | Panel/page titles            |
| `h2`      | 20px / 1.25rem   | 600    | 1.35        | Section headers              |
| `h3`      | 16px / 1rem      | 600    | 1.4         | Card titles, modal headers   |
| `body`    | 14px / 0.875rem  | 400    | 1.5         | Default body text            |
| `body-lg` | 16px / 1rem      | 400    | 1.5         | Emphasized body, form labels |
| `caption` | 12px / 0.75rem   | 500    | 1.4         | Timestamps, metadata, badges |
| `micro`   | 11px / 0.6875rem | 500    | 1.3         | Map labels, tooltips         |

### 4.3 Text Rules

- **Maximum line length:** 65ch for body text, 45ch for card descriptions
- **Truncation:** Ellipsis (`…`) after 2 lines for card descriptions (standard mode); 1 line in compact mode
- **Numbers:** Use tabular figures in tables and statistics (`font-variant-numeric: tabular-nums`)
- **Report IDs:** Monospace, uppercase: `RPT-2024-DAET-0042`
- **Timestamps:** Relative for < 24h ("2h ago"), absolute for > 24h ("Jan 15, 3:42 PM")

---

## 5. Iconography & Visual Language

### 5.1 Icon System

Use **Lucide Icons** (open source, consistent, Tailwind-community standard).

| Category       | Icons Used                                                                                                | Size                                           |
| -------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| Navigation     | `map`, `list`, `bell`, `user`, `plus-circle`, `layout-dashboard`, `contact`, `bar-chart-3`, `scroll-text` | 20px nav rail, 24px mobile tabs                |
| Disaster types | Custom set (see below)                                                                                    | 24px in cards, 20px on map pins, 32px in forms |
| Status         | `clock`, `check-circle`, `x-circle`, `truck`, `radio`, `loader`, `check-check`                            | 16px inline                                    |
| Actions        | `eye`, `check`, `x`, `send`, `edit`, `trash-2`, `phone`, `map-pin`                                        | 20px in buttons                                |

### 5.2 Disaster Type Icons (Custom SVG Set)

| Type           | Icon Shape            | Pin Color            |
| -------------- | --------------------- | -------------------- |
| Flood          | Water waves           | Blue `#2563EB`       |
| Fire           | Flame                 | Red-orange `#EA580C` |
| Earthquake     | Crack/zigzag          | Brown `#92400E`      |
| Landslide      | Mountain + arrow down | Earth `#78716C`      |
| Typhoon        | Spiral                | Teal `#0D9488`       |
| Storm Surge    | Wave + house          | Navy `#1E3A5F`       |
| Volcanic       | Mountain + smoke      | Dark red `#991B1B`   |
| Accident       | Car/collision         | Gray `#4B5563`       |
| Medical        | Cross/heart           | Rose `#E11D48`       |
| Infrastructure | Building crack        | Slate `#475569`      |
| Security       | Shield                | Indigo `#4338CA`     |
| Other          | Circle with `?`       | Gray `#6B7280`       |

> **Note:** Disaster type icon colors are category identifiers, independent of severity. A flood pin's blue does not mean "Low severity" — severity is communicated only by the severity color fill of the outer marker ring, and always paired with a text badge.

### 5.3 Verified Badge

A `shield-check` icon appears on: reports verified by admin, official announcements, admin-created content.

Color: `#059669` (Verified Green) on white/light backgrounds.

---

## 6. Severity Visual System

### 6.1 Severity Badge Component

```
┌──────────────────────┐
│ ● CRITICAL           │  ← Dot + uppercase label
│   bg: #FEF2F2        │
│   border: #FECACA    │
│   text: #991B1B      │
│   dot: #DC2626       │
└──────────────────────┘

┌──────────────────────┐
│ ● HIGH               │
│   bg: #FFF7ED        │
│   border: #FED7AA    │
│   text: #9A3412      │
│   dot: #EA580C       │
└──────────────────────┘

┌──────────────────────┐
│ ● MEDIUM             │
│   bg: #F7FEE7        │
│   border: #D9F99D    │
│   text: #3F6212      │
│   dot: #65A30D       │
└──────────────────────┘

┌──────────────────────┐
│ ● LOW                │
│   bg: #EFF6FF        │
│   border: #BFDBFE    │
│   text: #1E40AF      │
│   dot: #2563EB       │
└──────────────────────┘
```

### 6.2 Severity in Different Contexts

| Context          | Representation                                                      |
| ---------------- | ------------------------------------------------------------------- |
| **Report card**  | Colored left border (4px) + severity badge in top-right             |
| **Map pin**      | Outer ring colored by severity; inner icon colored by disaster type |
| **Map cluster**  | Cluster shows color of highest severity within                      |
| **Detail modal** | Large severity badge + colored header bar                           |
| **Admin queue**  | Severity column with colored dot + label                            |
| **Feed**         | Left-border accent + small badge                                    |

### 6.3 Severity Always Uses Triple Signal

Never use color alone. Every severity indicator includes:

1. The colored element (dot, border, fill)
2. A text label ("CRITICAL", "HIGH", "MEDIUM", "LOW")
3. A screen reader label: `aria-label="Severity: Critical"`

---

## 7. Core Component Library

### 7.1 Report Card — Standard Mode

```
Desktop (~440px in drawer):
┌─────────────────────────────────────────────┐
│ 🔥 Fire in Brgy. Gahonon                ● HIGH │
│ ─────────────────────────────────────────── │
│ Daet, Camarines Norte                        │
│ Structure fire near the public market...     │  ← 2 lines max
│                                              │
│ ┌──────┐                                    │
│ │ 📷   │  2h ago  ·  ✓ Verified Incident    │
│ └──────┘                                    │
└─────────────────────────────────────────────┘
  ↑ 4px severity-colored left border

Mobile (~360px):
┌─────────────────────────────────────────┐
│ ● HIGH  ·  🔥 Fire                      │
│ Fire in Brgy. Gahonon                   │
│ Daet · 2h ago                           │
│ Structure fire near the public market   │  ← 1 line
│ ┌────┐┌────┐  Verified Incident         │
│ │ 📷 ││ 📷 │                            │
│ └────┘└────┘                            │
└─────────────────────────────────────────┘
  ↑ 4px severity-colored left border
```

### 7.1b Report Card — Compact Mode

```
Desktop + Mobile:
┌─────────────────────────────────────────┐
│ ● HIGH  ·  🔥 Fire  ·  Daet  ·  2h ago │
└─────────────────────────────────────────┘
  ↑ 4px severity-colored left border
  No description, no thumbnails, no status badge
  Tap to open detail
```

### 7.2 Status Badge

```
Pill-shaped, 24px height, 12px font, 500 weight

Submitted:           bg:#F3F4F6  text:#374151
Under Review:        bg:#EFF6FF  text:#1E40AF
Verified:            bg:#ECFDF5  text:#065F46  + ✓ icon
Responders Notified: bg:#F5F3FF  text:#5B21B6  + 📡 icon
Response Underway:   bg:#FFFBEB  text:#92400E  + ⏳ icon
Resolved:            bg:#D1FAE5  text:#047857  + ✅ icon
Rejected:            bg:#FFF1F2  text:#9F1239  + ✕ icon
Duplicate:           bg:#F1F5F9  text:#4B5563  + ⊘ icon
```

### 7.3 Alert/Announcement Card

```
┌─────────────────────────────────────────────────┐
│ 🚨 CRITICAL ALERT                     Jan 15   │  ← Severity bar (full width, 4px)
├─────────────────────────────────────────────────┤
│                                                  │
│ Typhoon Signal #3 raised over Camarines Norte    │
│                                                  │
│ All residents in coastal barangays of Daet,      │
│ Mercedes, and Jose Panganiban are advised to...  │
│                                                  │
│ Province-wide  ·  Published 2h ago               │
│                                                  │
└─────────────────────────────────────────────────┘

Severity bar colors: Info: #2563EB | Warning: #D97706 | Critical: #DC2626 | All Clear: #059669
```

### 7.4 Buttons

```
Primary:    bg:#2563EB  text:white  hover:#1D4ED8  h:44px  rounded-lg
Secondary:  bg:white    text:#374151  border:#D1D5DB  hover:bg:#F3F4F6
Danger:     bg:#DC2626  text:white  hover:#B91C1C  (reject, delete ONLY)
Ghost:      bg:transparent  text:#2563EB  hover:bg:#EFF6FF

Report/Emergency CTA:
  bg:#2563EB  text:white  rounded-full  h:56px  shadow-lg
  (Mobile: elevated in bottom tab bar, 48px circle, -8px above bar)
  (Desktop: in nav rail, 40px circle, prominent)
  NOTE: Uses brand blue (#2563EB), NOT critical red. Urgency is
  communicated by size and elevated position, not borrowed crisis color.
```

### 7.5 Form Elements

```
Input:
  h: 44px
  border: 1px solid #D1D5DB
  rounded-lg
  focus: ring-2 ring-#2563EB ring-offset-2
  placeholder: #9CA3AF
  text: #111827
  font-size: 16px  ← CRITICAL: prevents iOS auto-zoom on focus

Textarea:
  min-h: 100px
  Same border/focus as input
  resize: vertical

Label:
  font-size: 14px  font-weight: 500  color: #374151  margin-bottom: 6px
  Always visible; placeholder is NEVER the sole label

Error message:
  font-size: 12px  color: #DC2626  margin-top: 4px  + ⚠ icon inline
  Associated via aria-describedby
```

### 7.6 Modal / Dialog

```
Desktop Report Detail Modal:
  max-width: 640px  max-height: 85vh
  centered overlay
  bg: white  rounded-xl  shadow-2xl  backdrop: bg-black/50
  Header: 56px  ·  severity-colored top border (4px)  ·  title + ✕ close
  Body: scrollable  ·  padding: 24px
  Footer (admin actions): 64px  ·  border-top: 1px #E5E7EB

Mobile Report Detail:
  Full screen slide-in from right
  Back arrow in header (< Back)
  Same content structure
  Fixed bottom action bar for admins

Header navigation:
  The drawer/modal header shows: Panel Title + ✕ Close only.
  NO "← Back" in the drawer header — that competes with Close
  and implies a navigation stack that doesn't exist.
  In-panel back navigation (e.g., list → detail → back to list)
  uses an in-content back arrow within the scrollable body.
```

---

## 8. Desktop Layout — Full Specifications

### 8.1 Overall Structure

```
┌──────┬──────────────────────────────────────┬──────────────────────┐
│ NAV  │                                      │     WORKSPACE        │
│ RAIL │           LIVE MAP                    │     DRAWER           │
│      │           (Leaflet)                   │  (responsive width)  │
│ 64px │                                      │                      │
│      │  ┌──────────────────────────┐         │  ┌────────────────┐  │
│      │  │    FLOATING FILTER BAR   │         │  │    HEADER      │  │
│ ──── │  └──────────────────────────┘         │  ├────────────────┤  │
│      │                                      │  │                │  │
│ LOGO │     Map with:                        │  │   SCROLLABLE   │  │
│      │     • Report pins                    │  │   CONTENT      │  │
│ Map  │     • Municipality boundaries        │  │                │  │
│ Feed │     • Clusters                       │  │                │  │
│ 🔔   │     • Current location               │  │                │  │
│ 👤   │                                      │  │                │  │
│ ➕   │  ┌──────────────┐                    │  │                │  │
│      │  │ MAP CONTROLS │                    │  │                │  │
│ ──── │  │ +  -  📍  ⛶  │                   │  │                │  │
│      │  └──────────────┘                    │  └────────────────┘  │
│ 📊   │                                      │                      │
│ 📇   │  [OFFLINE BANNER if disconnected]    │                      │
│ 📈   │                                      │                      │
│ 📜   │                                      │                      │
└──────┴──────────────────────────────────────┴──────────────────────┘
```

### 8.2 Navigation Rail (64px wide)

```
Visual spec:
  bg: #1B2A4A (primary navy)
  icons: white/60% opacity inactive, white/100% active
  active indicator: 3px rounded left border in #3B82F6
  icon size: 20px  ·  label: 10px white  ·  item height: 56px
  hover: white/10% bg highlight

Items (top to bottom):
  🛡️ Logo (32px, non-interactive)
  ─── divider ───
  🗺️ Map (primary view)
  📋 Feed
  🔔 Alerts (+ red notification dot if unread)
  👤 Profile
  ─── divider ───
  ➕ Report (40px circle bg:#2563EB, white icon)
  ─── divider (admin section) ───
  📊 Triage Dashboard (admin only)
  📇 Contacts (admin only)
  📈 Analytics (admin only)
  📜 Audit Log (admin only)
  ─── bottom spacer ───
  ⚙️ Settings (opens small popover)
```

### 8.3 Floating Filter Bar

```
Position: top: 16px, horizontally centered in map area
Visual: bg:white  shadow-lg  rounded-full (pill)  height: 40px  z-index above map

┌──────────────────────────────────────────────────────────────┐
│  All Types ▾  │  All Severity ▾  │  All Municipalities ▾  │  🔍  │  ✕ Clear │
└──────────────────────────────────────────────────────────────┘

Chip states:
  No filter active: bg:#F3F4F6  text:#374151
  Filter active:    bg:#EFF6FF  text:#2563EB
```

### 8.4 Workspace Drawer — Responsive Width

> **Critical fix:** Fixed 480px drawer at 1280px leaves only 736px of map — inadequate for a province-monitoring command center. Width is now responsive.

```
Breakpoint widths:
  1280px–1439px:  drawer = 400px  (map = 816px, 64% of viewport)
  1440px–1919px:  drawer = 480px  (map = 896px, 62% of viewport)
  1920px+:        drawer = 560px  (map = 1296px, 68% of viewport)

Implementation: CSS clamp(400px, 33vw, 560px)
Map reaction: map width = calc(100vw - 64px - drawerWidth), calls
              leafletMap.invalidateSize() on transitionend event.

┌────────────────────────────────────────┐
│  PANEL TITLE                 ✕ Close   │  ← Header (56px, bg:white, border-bottom)
│  (no ← Back here — see §7.6)          │
├────────────────────────────────────────┤
│  ┌────────────────────────────────┐    │
│  │ Search reports...          🔍  │    │
│  └────────────────────────────────┘    │
│  Sort: Newest ▾                        │
│                                        │
│  [Report Card] ...                     │  ← Scrollable, 12px card gap
│  [Load More]                           │
└────────────────────────────────────────┘

Visual spec:
  bg: #F9FAFB  ·  border-left: 1px #E5E7EB  ·  shadow-xl on left edge
  content: overflow-y auto  ·  padding: 16px
```

### 8.5 Report Detail Modal (Desktop)

```
┌────────────────────────────────────────────────────┐
│ ████████████████████████████████████████████████  │  ← 4px severity-colored top bar
│                                                    │
│  🔥 Fire in Brgy. Gahonon                ✕ Close  │
│  ● HIGH  ·  RPT-2024-DAET-0042                    │
│                                                    │
├────────────────────────────────────────────────────┤
│                                                    │
│  📍 Daet, Brgy. Gahonon, Camarines Norte          │
│  🕐 January 15, 2024 at 3:42 PM (2 hours ago)     │
│  Status: ✓ Verified Incident                      │
│                                                    │
│  Description                                       │
│  Structure fire near the public market. Smoke      │
│  visible from the highway. Multiple structures...  │
│                                                    │
│  📷 Photos (3)                                     │
│  ┌──────┐ ┌──────┐ ┌──────┐                       │
│  │      │ │      │ │      │                        │
│  └──────┘ └──────┘ └──────┘                        │
│                                                    │
│  📋 Timeline                                       │
│  ● Submitted — Jan 15, 3:42 PM                     │
│  ● Verified — Jan 15, 3:55 PM                      │
│  ● Responders Notified — Jan 15, 4:01 PM           │
│                                                    │
│  ┌─ 🗺️ Location Map ──────────────────────────┐   │
│  │                  📍                          │   │
│  └──────────────────────────────────────────────┘   │
│                                                    │
├────────────────────────────────────────────────────┤
│  ┌─── ADMIN TRIAGE ACTIONS (admin only) ──────┐   │
│  │  Current State: DISPATCHED                  │   │
│  │  Priority: ★★★☆☆  (clickable stars)         │   │
│  │  Assigned: Daet Fire Station (snapshot)      │   │
│  │  Admin Notes: [text area]  [Save Notes]      │   │
│  │                                              │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐    │   │
│  │  │ ✓ Ack    │ │ ↻ Reroute│ │ ✅ Resolve│   │   │
│  │  └──────────┘ └──────────┘ └──────────┘    │   │
│  │  Only valid next-state actions shown.        │   │
│  └──────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────┘
```

---

## 9. Mobile Layout — Full Specifications

### 9.1 Overall Structure

```
┌──────────────────────────┐
│ ████ Status Bar ████████ │
├──────────────────────────┤
│  🛡️  Bantayog Alert   ≡  │  ← App header (48px, bg: #1B2A4A)
├──────────────────────────┤
│                          │
│    ACTIVE TAB CONTENT    │
│    (full height minus    │
│     header + tab bar)    │
│                          │
├──────────────────────────┤
│ 📋 │ 🗺️ │  ➕  │ 🔔 │ 👤 │  ← Bottom tab bar (56px + safe area)
│Feed│ Map │Report│Alert│ Me │
└──────────────────────────┘
```

**Citizen tab bar** (5 items as above)

**Admin tab bar** (replaces Feed with Triage for faster crisis access):

```
│ 🗺️ │ 📊 │  ➕  │ 🔔 │ 👤 │
│Map │Triage│Report│Alert│ Me │
```

> **Design decision:** Admin users need mobile triage in ≤3 taps during field emergencies. Surfacing Triage directly in the tab bar (rather than buried under Profile → Admin Panel → Triage Queue) achieves this. Push notifications for new pending reports deep-link directly to the report detail, reducing the path to 2 taps: notification → triage action.

### 9.2 Bottom Tab Bar

```
Height: 56px + safe-area-inset-bottom
bg: white  ·  border-top: 1px #E5E7EB  ·  shadow-sm upward

Tab items:
  icon: 24px centered  ·  label: 10px below  ·  2px gap
  inactive: #6B7280  ·  active: #2563EB (icon + label)
  active indicator: 3px rounded top-border in #2563EB

Report button (center):
  48px circle  ·  bg: #2563EB  ·  white ➕ icon
  elevated: -8px above tab bar  ·  shadow-lg
  label "Report" below in 10px, #2563EB

Alert tab:
  notification dot: 8px #DC2626 circle, top-right of icon
  shown only when unread critical/high alerts exist
```

### 9.3 Feed Tab (Mobile)

```
┌──────────────────────────────────┐
│  🛡️  Bantayog Alert           ≡  │
├──────────────────────────────────┤
│  [Filter chips — horizontal scroll]
│  All │ Flood │ Fire │ Earthquake │...
│                                  │
│  PULL TO REFRESH ↓               │
│                                  │
│  ┌──────────────────────────────┐│
│  │ ● HIGH · 🔥 Fire            ││
│  │ Fire in Brgy. Gahonon       ││
│  │ Daet · 2h ago               ││
│  │ Structure fire near...      ││
│  │ [📷][📷]  Verified Incident  ││
│  └──────────────────────────────┘│
│  ...                             │
│  [Load more...]                  │
├──────────────────────────────────┤
│ 📋 │ 🗺️ │  ➕  │ 🔔 │ 👤        │
└──────────────────────────────────┘
```

### 9.4 Map Tab (Mobile) — With Bottom Sheet States

```
┌──────────────────────────────────┐
│  🛡️  Bantayog Alert           ≡  │
├──────────────────────────────────┤
│  [Filter chips floating top]     │
│                                  │
│         FULL SCREEN MAP          │
│    ●    ●●                       │
│         ⓭ (cluster)             │
│              ●                   │
│                           ┌──┐   │
│                           │+ │   │
│                           │- │   │
│                           │📍│   │
│                           └──┘   │
│                                  │
│  ┌──────────────────────────────┐│  ← BOTTOM SHEET: PEEK state
│  │ 🔥 HIGH · Brgy. Gahonon     ││    Height: 120px
│  │ Fire in Brgy. Gahonon       ││    Shows: type + severity + location
│  │ Daet · 2h ago               ││    + "Swipe up for details"
│  │ ──── swipe up ────          ││
│  └──────────────────────────────┘│
├──────────────────────────────────┤
│ 📋 │ 🗺️ │  ➕  │ 🔔 │ 👤        │  ← Tab bar visible in peek state
└──────────────────────────────────┘
```

**Bottom Sheet — Three States:**

```
PEEK (120px):
  Citizen view: severity badge + type + location + timestamp + "Swipe up"
  Admin view (unclassified): "⬜ Unclassified" + location + timestamp + "Classify →"
  Tab bar: visible below sheet
  Map: still interactive (can pan/tap other pins)
  Dismissed: tap outside sheet or swipe down

HALF (50% screen height):
  Visible: Full report card content + mini public timeline
  Tab bar: visible (peeking at bottom)
  Map: dimmed 30%, not interactive
  Handle: drag bar at top for swipe gestures

FULL (90% screen height):
  Visible: Full report detail (same as modal) including photos, full timeline
  Tab bar: hidden (space given to content)
  Map: fully hidden behind sheet
  Admin: triage actions appear in sticky bottom bar
  Dismissed: swipe down to HALF, then PEEK, then closed

Transitions: 200ms ease-out for all state changes
Gestures: swipe-up to expand, swipe-down to collapse, tap outside to dismiss from PEEK
```

### 9.5 Profile Tab (Mobile)

```
┌──────────────────────────────────┐
│  🛡️  Bantayog Alert           ≡  │
├──────────────────────────────────┤
│  ┌──────────────────────────┐    │
│  │  👤  Juan Dela Cruz      │    │
│  │  Citizen · Daet          │    │
│  │  juan@email.com          │    │
│  └──────────────────────────┘    │
│                                  │
│  MY REPORTS (3)                  │
│  [Report cards — compact mode]   │
│                                  │
│  ── Admin Panel ── (admin only)  │
│  [Triage Queue →]   ← prominent  │
│  [Contacts →]                    │
│  [Dashboard →]                   │
│  [Analytics →]                   │
│                                  │
│  ── Settings ──                  │
│  [Notification Preferences →]    │
│  [About →]  [Log Out]            │
├──────────────────────────────────┤
│ 📋 │ 🗺️ │  ➕  │ 🔔 │ 👤        │
└──────────────────────────────────┘
```

### 9.6 Admin Triage Tab (Mobile — Admin Users Only)

```
┌──────────────────────────────────┐
│  🛡️  Triage — Daet            ≡  │
├──────────────────────────────────┤
│  ┌────┐ ┌────┐ ┌────┐           │
│  │ 12 │ │  3 │ │  5 │           │  ← Summary counts
│  │Pend│ │Disp│ │Act │           │
│  └────┘ └────┘ └────┘           │
│                                  │
│  ─── PENDING ───                 │
│                                  │
│  ┌──────────────────────────────┐│
│  │ ⬜ Unclassified · 5m ago    ││  ← No severity color
│  │ Daet, Brgy. Gahonon         ││     Neutral gray left border
│  │ "Waist-deep tubig sa daan..." ││
│  │ 📷 2 photos                  ││
│  │  ┌──────────────────────┐    ││  ← Single CTA: full-width
│  │  │ Classify & Verify →  │    ││     opens bottom sheet
│  │  └──────────────────────┘    ││
│  └──────────────────────────────┘│
│  ...                             │
├──────────────────────────────────┤
│ 🗺️ │ 📊 │  ➕  │ 🔔 │ 👤        │
└──────────────────────────────────┘
```

**"Classify & Verify" opens a bottom sheet (HALF state):**

```
┌──────────────────────────────────┐
│  ── ●● ──  (drag handle)         │
│  Classify Report                 │
│  Daet, Brgy. Gahonon · 5m ago   │
├──────────────────────────────────┤
│  📷 [photo thumb] [photo thumb]  │  ← Evidence visible for reference
│                                  │
│  Hazard / Disaster Type *        │
│  ┌──────────────────────────────┐│
│  │ Select type...            ▾  ││  ← Full dropdown (all 12 types)
│  └──────────────────────────────┘│
│                                  │
│  Severity *                      │
│  ┌──────┐┌──────┐┌──────┐┌──────┐│
│  │  Low ││ Med  ││ High ││Crit. ││  ← Segmented control, color-coded
│  └──────┘└──────┘└──────┘└──────┘│
│                                  │
│  ┌──────────────────────────────┐│
│  │     ✓ Verify Report          ││  ← Disabled until both fields set
│  └──────────────────────────────┘│
│  [Reject instead]                │  ← Ghost button, secondary
└──────────────────────────────────┘
```

**Mobile triage interaction rules:**

- Pending cards show "Classify & Verify" as the single primary action (no inline Verify/Reject split)
- Classification bottom sheet shows photo evidence at top so admin can reference it while classifying
- Severity uses a segmented control (not radio buttons) — faster tap targeting on mobile
- "Verify" in the sheet is disabled until both Type and Severity are selected
- "Reject instead" is a ghost button below Verify — accessible but not prominent
- Reject opens a second bottom sheet with reason selector + note field
- Dispatch opens a contact picker bottom sheet (3-tap max: category → contact → confirm)
- Resolve opens a summary note field bottom sheet
- Maximum 3 taps for any triage action including classification + verify

---

## 10. Tablet Layout — 769px–1279px

> **Critical gap filled:** This breakpoint covers iPads (1024px), landscape phones (812px+), and issued government tablets — common devices in Philippine LGU operations.

### 10.1 Tablet Layout Strategy

Use a **modified desktop layout** with these adaptations:

```
┌──────────────────────────────────────────────────────┐
│ ┌────────────────────┐   HAMBURGER HEADER (48px)      │
│ │ 🛡️ Bantayog Alert  │  ≡  Daet, Camarines Norte      │
│ └────────────────────┘                                │
├──────────────────────────────────────────────────────┤
│                                                      │
│              LIVE MAP (full width)                   │
│                                                      │
│   [filter chips floating top]                        │
│                                                      │
│                                    ┌──────────────┐  │
│                                    │ SLIDE-OVER   │  │
│                                    │ DRAWER       │  │
│                                    │ 360px wide   │  │
│                                    │ (overlays    │  │
│                                    │  map, does   │  │
│                                    │  not squeeze │  │
│                                    │  it)         │  │
│                                    └──────────────┘  │
└──────────────────────────────────────────────────────┘
```

**Key differences from desktop:**

- No persistent nav rail — replaced by hamburger menu that opens a slide-over sidebar
- Workspace drawer overlays the map (slide-over) rather than squeezing it
- Drawer width: 360px fixed
- `invalidateSize()` is NOT called on drawer open (map doesn't resize)
- Map is dimmed 40% when drawer is open (drawer is a modal overlay)
- Touch-friendly: all interactive targets 48px minimum

**Key differences from mobile:**

- No bottom tab bar
- Can show full report detail in drawer without going full-screen
- Typing on physical keyboard (many tablet users): keyboard shortcuts active

---

## 11. Report Submission Flow

### Design Goal: 3 steps, zero classification decisions for the citizen

> **Design decision:** Disaster type and severity classification have been removed from the citizen submission flow entirely. During an emergency, a panicked citizen cannot reliably distinguish "High" from "Critical," or "Storm Surge" from "Flood." Wrong classifications create noise and erode public trust in the feed. Instead, citizens do only what they can do well under stress: capture evidence, confirm where they are, and describe what they see in their own words. Trained admins assign type and severity during triage, where they have context, tools, and the ability to cross-reference multiple reports.
>
> This also reduces the submission path from 4 steps to 3, and eliminates the largest source of decision fatigue in the old flow.

### 11.1 Responsibility Split

| Task                              | Citizen    | Admin (Triage)            |
| --------------------------------- | ---------- | ------------------------- |
| Capture photo/video evidence      | ✅ Step 1  | —                         |
| Confirm location (pin + barangay) | ✅ Step 2  | Can correct if wrong      |
| Describe what is happening        | ✅ Step 3  | —                         |
| Classify disaster/hazard type     | ❌ Removed | ✅ Required before Verify |
| Assign severity level             | ❌ Removed | ✅ Required before Verify |

### 11.2 Mobile Flow (Full-Screen)

```
Step 1: EVIDENCE  (1/3)
┌──────────────────────────────────┐
│  ← Cancel       Report  (1/3)   │
├──────────────────────────────────┤
│                                  │
│  ┌──────────────────────────────┐│
│  │                              ││
│  │                              ││
│  │       CAMERA VIEWFINDER      ││  ← Full camera preview
│  │                              ││     (requestCamera permission)
│  │                              ││
│  │         [ 📷 Capture ]       ││  ← 72px circle shutter button
│  └──────────────────────────────┘│
│                                  │
│  ── or choose from gallery ──    │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐   │
│  │    │ │    │ │    │ │ ➕  │   │  ← Recent gallery thumbnails (3)
│  └────┘ └────┘ └────┘ └────┘   │     + open full gallery picker
│                                  │
│  ┌──────────────────────────────┐│
│  │ Selected (1)  ·  Max 5       ││  ← Selection count indicator
│  └──────────────────────────────┘│
│                                  │
│  Photos are optional.            │  ← Reassurance note
│                                  │
│          [NEXT →]                │  ← Active even if no photos selected
└──────────────────────────────────┘

Photo state:
  Empty:    Step shows camera + gallery picker. NEXT is active.
  1+ added: Thumbnails show with ✕ remove. Camera still accessible.
  5 added:  Camera and gallery picker are disabled. Count shows "5/5".

Video support: Short clips (≤30s) accepted same as photos. Shown
with a play-icon overlay in the thumbnail grid.
```

```
Step 2: WHERE?  (2/3)
┌──────────────────────────────────┐
│  ← Back        Report  (2/3)    │
├──────────────────────────────────┤
│                                  │
│  ┌──────────────────────────────┐│
│  │                              ││
│  │        📍 PIN MAP            ││  ← 240px, draggable pin
│  │                              ││     Pre-centered on GPS position
│  └──────────────────────────────┘│
│                                  │
│  [ 📍 Use My Current Location ]  │  ← Primary action button if GPS
│                                  │     not yet used; re-centers pin
│                                  │
│  Municipality *                  │
│  ┌──────────────────────────────┐│
│  │ Daet                      ▾ ││  ← Auto-resolved from pin position
│  └──────────────────────────────┘│     via static GeoJSON intersection
│                                  │
│  Barangay *                      │
│  ┌──────────────────────────────┐│
│  │ Gahonon                   ▾ ││  ← Filtered by municipality
│  └──────────────────────────────┘│     Always editable
│                                  │
│          [NEXT →]                │
└──────────────────────────────────┘

Location resolution:
  - Uses offline static GeoJSON + coordinate bounding. No live API.
  - Municipality and barangay are always manually editable.
  - If GPS is unavailable: map defaults to municipality center;
    user must drag pin or manually select barangay.
  - GPS accuracy indicator shown as subtle ring around pin
    (green = <30m, yellow = 30–100m, red = >100m).
```

```
Step 3: WHAT'S HAPPENING?  (3/3)
┌──────────────────────────────────┐
│  ← Back        Report  (3/3)    │
├──────────────────────────────────┤
│                                  │
│  Describe what you see *         │
│  ┌──────────────────────────────┐│
│  │                              ││  ← Textarea, min 120px
│  │                              ││     Character counter: 0/2000
│  │                              ││     Placeholder: "E.g. Waist-deep
│  └──────────────────────────────┘│     flood water on the main road,
│                                  │     several houses submerged..."
│  ── Review ────                  │
│  Location: Daet, Brgy. Gahonon  │  ← Summary of Steps 1–2
│  Photos:   2 attached            │     (no type or severity — those
│                                  │     are set by admin)
│  ┌──────────────────────────────┐│
│  │      SUBMIT REPORT           ││  ← bg:#2563EB, 56px, full width
│  └──────────────────────────────┘│
│                                  │
│  Your report will be reviewed    │
│  by local authorities before     │
│  it appears on the public map.   │
└──────────────────────────────────┘

Note: The review summary intentionally omits disaster type and severity
because they are not yet classified. Citizens are not shown placeholder
or "unknown" values — the review only shows what they provided.
```

```
Success Screen:
┌──────────────────────────────────┐
│                                  │
│           ✅                      │
│                                  │
│  Report Submitted!               │
│  RPT-2024-DAET-0042              │
│                                  │
│  Local authorities have been     │
│  notified. You can track your    │
│  report in your Profile.         │
│                                  │
│  [Track My Report →]             │
│  [Back to Map]                   │
│                                  │
└──────────────────────────────────┘
```

### 11.3 Key Form UX Decisions

| Decision                                            | Rationale                                                                                                                                                                                                                |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Evidence first (camera/gallery)**                 | Puts the citizen's most immediate instinct first. Photo evidence is the highest-value input for admin classification. Opening with the camera also anchors the user before asking them to think.                         |
| **No disaster type or severity picker**             | Citizens under stress cannot classify reliably. Mis-classification (e.g., reporting a storm surge as a flood) creates inaccurate public data. Admins have training, context, and can cross-reference before classifying. |
| **Photos are optional — NEXT active from Step 1**   | Don't block urgent text-only reports. Some situations are too dangerous to photograph.                                                                                                                                   |
| **GPS + static GeoJSON for auto-location**          | No live geocoding API. Offline-safe and reliable during disaster network congestion.                                                                                                                                     |
| **GPS accuracy ring on pin**                        | Citizens know when their GPS is unreliable and will manually correct it.                                                                                                                                                 |
| **Textarea placeholder is an example, not a label** | Reduces blank-page anxiety. The example shows what kind of text is useful without being prescriptive.                                                                                                                    |
| **Review omits unclassified fields**                | Showing "Type: Unknown" or "Severity: —" would alarm or confuse citizens. The review shows only what they submitted.                                                                                                     |
| **Draft autosave**                                  | Every field change saves to IndexedDB as unsent form state. Once submitted, Firestore SDK handles queued delivery. No custom service worker sync.                                                                        |
| **Trust message at Step 3**                         | Sets expectation that the report goes through a review step before appearing publicly. Prevents confusion when their pin doesn't immediately appear on the map.                                                          |

---

## 12. Announcement Creation Flow

> **Critical gap filled:** Announcements are a core admin feature but had zero design in the original spec. This section brings it to the same fidelity as the report submission flow.

### 12.1 Who Can Create Announcements

| Role                  | Scope                             |
| --------------------- | --------------------------------- |
| Municipal admin       | Their municipality only           |
| Provincial superadmin | Any municipality or province-wide |

Scope selection UI must enforce this: municipal admins see a pre-filled, non-editable scope field. Superadmins see a multi-select.

### 12.2 Desktop Flow (Workspace Drawer or Full Modal)

```
Step 1: TYPE & SEVERITY
┌────────────────────────────────────────┐
│  New Announcement              ✕ Close │
├────────────────────────────────────────┤
│                                        │
│  Announcement Type *                   │
│  ┌──────────────────────────────────┐  │
│  │ ○ Evacuation Order               │  │
│  │ ○ Shelter-in-Place               │  │
│  │ ○ Road Closure                   │  │
│  │ ○ Utility Disruption             │  │
│  │ ○ General Advisory               │  │
│  │ ○ All Clear                      │  │
│  └──────────────────────────────────┘  │
│                                        │
│  Severity *                            │
│  ┌──────────────────────────────────┐  │
│  │ ○ Info   ○ Warning               │  │
│  │ ○ Critical   ○ All Clear         │  │
│  └──────────────────────────────────┘  │
│                                        │
│                   [NEXT →]             │
└────────────────────────────────────────┘
```

```
Step 2: CONTENT & SCOPE
┌────────────────────────────────────────┐
│  New Announcement              ✕ Close │
├────────────────────────────────────────┤
│                                        │
│  Title *                               │
│  ┌──────────────────────────────────┐  │
│  └──────────────────────────────────┘  │
│                                        │
│  Body *                                │
│  ┌──────────────────────────────────┐  │
│  │                                  │  │
│  │                    0/5000        │  │
│  └──────────────────────────────────┘  │
│                                        │
│  Scope *                               │
│  ┌──────────────────────────────────┐  │
│  │ Daet ✕ [add municipality ▾]      │  │  ← Superadmin: multi-select
│  └──────────────────────────────────┘  │     Municipal admin: pre-filled, read-only
│  ○ This municipality only              │
│  ○ Province-wide  (superadmin only)    │
│                                        │
│  Expiration (optional)                 │
│  ┌──────────────────────────────────┐  │
│  │ Jan 16, 2024 at 6:00 PM     📅  │  │
│  └──────────────────────────────────┘  │
│                                        │
│                   [PREVIEW →]          │
└────────────────────────────────────────┘
```

```
Step 3: PREVIEW & DELIVERY
┌────────────────────────────────────────┐
│  Preview Announcement          ✕ Close │
├────────────────────────────────────────┤
│                                        │
│  ┌──── PREVIEW (rendered card) ─────┐  │
│  │ 🚨 CRITICAL ALERT    Jan 15      │  │
│  │────────────────────────────────── │  │
│  │ Typhoon Signal #3 raised over... │  │
│  │ Daet, Camarines Norte            │  │
│  │ Province-wide · Expires Jan 16   │  │
│  └──────────────────────────────────┘  │
│                                        │
│  Delivery Channel *                    │
│  ☑ In-app notification                │
│  ☑ Push notification (FCM)            │
│                                        │
│  ── Actions ──                         │
│  ┌─────────┐  ┌──────────────────┐    │
│  │Save Draft│  │ Publish Now →   │    │
│  └─────────┘  └──────────────────┘    │
│                                        │
│  [← Edit]                             │
└────────────────────────────────────────┘
```

```
Confirmation Dialog (on Publish):
┌────────────────────────────────────────┐
│  Publish this announcement?            │
│                                        │
│  This will immediately notify all      │
│  citizens in: Daet, Camarines Norte    │
│  via in-app + push notification.       │
│                                        │
│  ┌───────┐  ┌─────────────────────┐   │
│  │Cancel │  │ Yes, Publish        │   │
│  └───────┘  └─────────────────────┘   │
└────────────────────────────────────────┘
```

---

## 13. Map Design System

### 13.1 Map Markers (Pins)

```
Standard Pin (28px visual, 48px touch target):
  ┌──────────────┐
  │  outer ring  │  ← Severity color (ring = severity, fills by status)
  │  ● (icon)    │  ← Disaster type icon (white, 16px) inside a circle
  └──────┬───────┘
         ▼           ← Small triangle pointer

Unclassified pin (pending, not yet triaged by admin):
  Outer ring: #6B7280 (gray) fill, dashed stroke
  Icon: ? (question mark, white)
  Visible only to admins on the map. Citizens cannot see pending
  reports on the public map until classified + verified.

Outer ring colors by severity (post-classification):
  Critical: #DC2626 fill, #991B1B stroke
  High:     #EA580C fill, #9A3412 stroke
  Medium:   #65A30D fill, #3F6212 stroke
  Low:      #2563EB fill, #1E40AF stroke

Touch target: 48px × 48px invisible hit area around every pin
Collision behavior: when targets overlap, prioritize pin closest
to center of tap point. On mobile, increase visual pin size to 36px.

Selected state:
  Scale up to 36px (mobile: 44px)
  White ring (3px)
  Bounce animation 150ms

Resolved:
  50% opacity + gray overlay ring
```

### 13.2 Cluster Markers

```
Cluster circle (32–48px, sized by count):
  Count in center (white, bold, 14px)
  Fill = severity color of worst report in cluster
  Ring = second-worst severity if mixed
  On click: zoom to show individual pins
```

### 13.3 Municipality Boundaries

```
GeoJSON overlay:
  Fill: transparent (faint #2563EB/5% on hover)
  Stroke: #2563EB at 40% opacity
  Stroke width: 2px  ·  Dashed: [8, 4]
  On hover: stroke 80% opacity + fill 8% + tooltip "Municipality Name"
```

### 13.4 Map Controls (Desktop)

```
Position: bottom-right of map area
┌──────┐
│  +   │  ← Zoom in
├──────┤
│  −   │  ← Zoom out
├──────┤
│  📍  │  ← Center on my location
├──────┤
│  ⛶  │  ← Reset to province view
└──────┘
36×36px each  ·  bg:white  ·  border:1px #D1D5DB  ·  rounded-lg  ·  shadow-md
```

### 13.5 Progressive Map Loading

```
Load order (prevents blocking main thread on mobile networks):
  1. Initial viewport: limit(50) reports
  2. User zooms out / scrolls: append 25 more
  3. Hard cap: 150 visible markers (clustering handles the rest)

Initial payload target: <1MB on mobile
```

---

## 14. Admin-Specific Patterns

### 14.1 Admin Dashboard (Workspace Drawer / Triage Tab)

```
┌────────────────────────────────────────┐
│  Dashboard — Daet                      │
├────────────────────────────────────────┤
│  ┌────────┐ ┌────────┐ ┌────────┐    │
│  │   12   │ │    3   │ │    5   │    │
│  │Pending │ │Dispatch│ │Active  │    │
│  └────────┘ └────────┘ └────────┘    │
│                                        │
│  ── PENDING QUEUE (newest first) ──    │
│                                        │
│  ┌──────────────────────────────┐      │
│  │ ⬜ UNCLASSIFIED  · 5m ago    │      │  ← No severity/type yet
│  │ Daet, Brgy. Gahonon          │      │     Shown as neutral gray
│  │ "Waist-deep tubig sa daan,   │      │
│  │  ilang bahay na natatakpan"  │      │
│  │ 📷 2 photos                  │      │
│  │ [Classify & Verify] [Reject] │      │  ← Primary action is now
│  └──────────────────────────────┘      │     "Classify & Verify"
│  ┌──────────────────────────────┐      │
│  │ ⬜ UNCLASSIFIED  · 12m ago   │      │
│  │ Daet, Brgy. Lag-on           │      │
│  │ "May sunog sa tabi ng palengke│     │
│  │  may usok galing sa highway" │      │
│  │ 📷 1 photo                   │      │
│  │ [Classify & Verify] [Reject] │      │
│  └──────────────────────────────┘      │
│  ...                                   │
│                                        │
│  ── RECENT ACTIVITY ──                 │
│  Admin classified RPT-0042 as         │
│  🔥 Fire · HIGH · Verified · 15m ago  │
│  Admin dispatched RPT-0039 · 1h ago   │
└────────────────────────────────────────┘
```

**Pending queue card — unclassified state:**

- No severity color badge or left border color (neutral gray `#6B7280`)
- Shows: location, citizen's description (2 lines), photo count, submission time
- Primary CTA is **"Classify & Verify"** — opens the classification panel
- "Reject" is secondary, requires confirmation + reason

### 14.2 Triage Action Panel — Pending / Unclassified Report

When a report arrives in the queue it has no type or severity. The admin must classify it before they can verify and dispatch. The triage panel is structured in two phases: **Classify first, then act.**

```
Desktop — Pending Report Detail (Admin View):

┌────────────────────────────────────────────────────┐
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │  ← 4px neutral gray top bar
│                                                    │     (no severity color yet)
│  📋 Report from Brgy. Gahonon, Daet    ✕ Close   │
│  ⬜ Unclassified  ·  RPT-2024-DAET-0042           │
│                                                    │
├────────────────────────────────────────────────────┤
│  📍 Daet, Brgy. Gahonon                           │
│  🕐 January 15, 2024 at 3:42 PM (12 min ago)      │
│  Status: Under Review                              │
│                                                    │
│  Citizen's Description                             │
│  "Waist-deep tubig sa daan, ilang bahay na         │
│  natatakpan na. Kailangan ng tulong."              │
│                                                    │
│  📷 Photos (2)                                     │
│  ┌──────┐ ┌──────┐                                │
│  │      │ │      │  ← Click to expand full-size   │
│  └──────┘ └──────┘                                │
│                                                    │
│  ┌─ 🗺️ Location ──────────────────────────────┐  │
│  │                  📍                          │  │
│  └──────────────────────────────────────────────┘  │
│                                                    │
├────────────────────────────────────────────────────┤
│  ┌─── STEP 1: CLASSIFY (required to verify) ───┐  │
│  │                                              │  │
│  │  Hazard / Disaster Type *                    │  │
│  │  ┌──────────────────────────────────────┐   │  │
│  │  │ 🌊 Flood                          ▾ │   │  │  ← Dropdown, all 12 types
│  │  └──────────────────────────────────────┘   │  │
│  │                                              │  │
│  │  Severity *                                  │  │
│  │  ┌──────────────────────────────────────┐   │  │
│  │  │ ○ Low  ○ Medium  ○ High  ○ Critical  │   │  │  ← Color-coded radio group
│  │  └──────────────────────────────────────┘   │  │
│  │                                              │  │
│  │  Admin Notes (optional)                      │  │
│  │  ┌──────────────────────────────────────┐   │  │
│  │  │                                      │   │  │
│  │  └──────────────────────────────────────┘   │  │
│  │                                              │  │
│  └──────────────────────────────────────────────┘  │
│                                                    │
│  ┌─── STEP 2: ACTION ──────────────────────────┐  │
│  │                                              │  │
│  │  ┌──────────────────┐  ┌──────────────────┐ │  │
│  │  │  ✓ Verify Report  │  │  ✕ Reject Report │ │  │
│  │  └──────────────────┘  └──────────────────┘ │  │
│  │                                              │  │
│  │  Verify is disabled until Type + Severity    │  │
│  │  are both selected.                          │  │
│  │                                              │  │
│  └──────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────┘

State behavior:
  - Type and Severity fields are empty on arrival
  - "Verify Report" button is disabled (grayed, not hidden) with
    tooltip: "Select Type and Severity to verify"
  - Once both are filled: "Verify Report" becomes active (Primary Blue)
  - On Verify: report transitions to Verified; severity color fills
    the top bar; type icon appears in the report header
  - On Reject: confirmation bottom sheet with required reason
```

### 14.3 Triage Action Panel — Post-Classification States

Once classified and verified, the triage panel changes to show the standard action set for subsequent state transitions.

```
┌─── TRIAGE ACTIONS (post-verify) ────────────────────┐
│                                                      │
│  Internal State: [ VERIFIED ]                        │
│  Type: 🌊 Flood  ·  Severity: ● HIGH                │
│  Priority: ★★★☆☆  (click stars to change)           │
│                                                      │
│  Admin Notes:                                        │
│  [text area]  [Save Notes]                           │
│                                                      │
│  ── Available Actions ──                             │
│  [ 📡 Dispatch ]  [ ✕ Reject ]                      │
│  (Only valid next-state actions are shown)           │
│                                                      │
└──────────────────────────────────────────────────────┘

Dispatched state adds:
│  Assigned Contact:                                   │
│  ┌──────────────────────────────────────────────┐   │
│  │ 🚒 Daet Municipal Fire Station               │   │
│  │ (0912) 345-6789  ·  Captured Jan 15, 4:01 PM │   │
│  └──────────────────────────────────────────────┘   │
│  [ ✓ Acknowledge ] [ ↻ Reroute ] [ ✅ Resolve ]     │
```

### 14.4 Triage Action UX Rules

| Rule                                                                     | Rationale                                                                                                                                      |
| ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| **Classification (Type + Severity) is required before Verify**           | Citizens don't classify — admins do. No report can go Verified without both fields set.                                                        |
| **"Verify" is disabled (not hidden) until Type + Severity are selected** | Disabled with tooltip communicates what's needed. Hiding would leave admins confused about where the action went.                              |
| **Classification fields are shown before action buttons**                | Visual hierarchy signals that classify-first is the expected workflow, not an afterthought.                                                    |
| **Admin can re-classify after Verify**                                   | Mistakes happen. Type and Severity remain editable post-Verify by the same or higher-role admin. Re-classification creates an audit log entry. |
| **Only show valid next-state actions**                                   | Prevents confusion. If dispatched, don't show "Verify."                                                                                        |
| **Reject requires confirmation + reason**                                | Modal with required reason field; reason stored in audit log. Can be done before or after classification.                                      |
| **Dispatch requires contact selection**                                  | Contact picker filtered by municipality.                                                                                                       |
| **Resolve requires resolution summary**                                  | Text input before confirming; stored in activity log.                                                                                          |
| **Duplicate action available from any state**                            | Admin can mark as duplicate of canonical report ID.                                                                                            |
| **Version conflict shows inline error**                                  | "This report was updated by another admin. Please refresh."                                                                                    |
| **verified → rejected**                                                  | Restricted to `provincial_superadmin` only; requires reason code `supervisory_override`; triggers audit alert.                                 |

### 14.4 Duplicate Report State

When a report is marked as duplicate:

- Status changes to `duplicate` (terminal state)
- Public feed hides the duplicate and shows only the canonical report
- Admin view shows "Duplicate of: RPT-2024-DAET-0039 → [View]" link
- Analytics exclude duplicate reports from incident counts

---

## 15. Notification & Toast System

> **Critical gap filled:** The original spec described toasts in one line with no system for priority ordering, stacking, or differentiation. During active disasters, multiple notification types arrive simultaneously and must be visually distinguishable.

### 15.1 Three-Tier Notification System

**Tier 1: Critical Alert Banner**

```
┌──────────────────────────────────────────────────────────┐
│ 🚨  Typhoon Signal #3 raised over Camarines Norte         │  ← Full-width
│     Province-wide · Issued 2m ago            [View] [✕]  │     bg:#FEF2F2
└──────────────────────────────────────────────────────────┘     height: 56px
  Position: top of screen, below app header
  Behavior: Persistent until explicitly dismissed
  For: Official critical/warning announcements from admins
  Animation: Slide down 300ms + subtle pulse every 4s
```

**Tier 2: Informational Toast**

```
┌──────────────────────────────────────┐
│  ✓ Report submitted successfully     │  ← Bottom-right corner (desktop)
└──────────────────────────────────────┘     Bottom-center (mobile)
  bg: #111827 (dark)  text: white
  Height: 48px  ·  rounded-lg  ·  shadow-lg
  Auto-dismiss: 5 seconds
  Max visible: 3 stacked (newest on top, oldest auto-dismisses)
  For: Submit success, triage action confirmation, status updates
```

**Tier 3: System Message Bar**

```
┌──────────────────────────────────────────┐
│ 📡  You're offline. Showing cached data. │  ← Below app header
└──────────────────────────────────────────┘     bg:#FFFBEB  text:#92400E  height:32px
  Persistent while condition exists (offline, version conflict, etc.)
  Non-dismissable while condition is active
  Disappears automatically when condition resolves
  For: Connectivity loss, version conflict, session expiry warnings
```

### 15.2 Notification Priority Rules

When multiple notifications arrive simultaneously:

1. Tier 1 takes the top banner position (displaces any existing Tier 1)
2. Tier 3 occupies the system bar (stacked below Tier 1 if both active)
3. Tier 2 toasts queue: max 3 visible, FIFO for overflow
4. A critical alert does NOT use the same toast component as "Report submitted"

### 15.3 In-App Notification Center

Accessible via the 🔔 Alert tab. Shows:

- All active and recent official announcements
- Status updates on the user's own reports (last 30 days)
- Admin: triage actions performed by colleagues (last 24h)

---

## 16. Motion & Transitions

### 16.1 Animation Budget

| Animation                        | Duration | Easing             | Purpose                |
| -------------------------------- | -------- | ------------------ | ---------------------- |
| Workspace drawer open/close      | 250ms    | ease-out / ease-in | Spatial grounding      |
| Modal fade in/out                | 200ms    | ease-out           | Focused attention      |
| Report card hover                | 150ms    | ease               | Interactive feedback   |
| Map pin bounce (selected)        | 300ms    | spring             | Spatial identification |
| Severity pulse (critical alerts) | 2s loop  | ease-in-out        | Urgent attention       |
| Tab switch content               | 0ms      | none               | Speed over flourish    |
| Bottom sheet slide up/down       | 200ms    | ease-out           | Spatial context        |
| Toast slide in                   | 300ms    | ease-out           | Status confirmation    |
| Critical alert banner slide      | 300ms    | ease-out           | Priority attention     |

### 16.2 Motion Rules

1. **No animation on the critical report path.** Submit → success is instant feedback.
2. **Never add React transitions to the map.** Use Leaflet's native smooth behavior only.
3. **`prefers-reduced-motion: reduce`** — All animations collapse to 0ms except map zoom.
4. **Loading states use skeleton screens, not spinners.** Skeleton blocks match the layout of expected content.

---

## 17. Accessibility Specifications

### 17.1 WCAG 2.1 AA Compliance

| Requirement              | Implementation                                                                                            |
| ------------------------ | --------------------------------------------------------------------------------------------------------- |
| **Color contrast**       | All text ≥ 4.5:1. Large text ≥ 3:1. UI components ≥ 3:1. Severity palette verified AA-compliant.          |
| **Touch targets**        | Minimum 44×44px desktop, 48×48px mobile. Map pins: 28px visual + 48px hit area.                           |
| **Focus indicators**     | `ring-2 ring-blue-500 ring-offset-2` on all focusable elements. Never removed.                            |
| **Keyboard navigation**  | All interactions reachable via Tab, Enter, Escape, Arrow keys. `R` shortcut opens report form on desktop. |
| **Focus trapping**       | Modals and drawers trap focus. On close, returns to trigger element.                                      |
| **Screen reader labels** | All icon-only buttons have `aria-label`. Severity badges: `aria-label="Severity: Critical"`.              |
| **Live regions**         | `aria-live="polite"` for feed updates. `aria-live="assertive"` for critical alert toasts.                 |
| **Headings**             | Every panel has an `h1`. Sections use `h2`/`h3` in order. Never skip levels.                              |
| **Landmarks**            | `<main>` for content, `<nav>` for nav rail/tabs, `<aside>` for workspace drawer, `<dialog>` for modals.   |
| **Error messages**       | Associated with inputs via `aria-describedby`. Announced on appearance.                                   |
| **Form labels**          | Every input has a visible `<label>`. Placeholder is never the only label.                                 |

### 17.2 Map Accessibility

Since Leaflet renders to Canvas/SVG (inaccessible to screen readers):

1. **Feed is the accessible equivalent.** All map data is available in the Feed.
2. **Map container**: `role="application"`, `aria-label="Live disaster map. Use the Feed tab for an accessible list of reports."`
3. **Map controls** (zoom, locate): Rendered as HTML buttons outside canvas, fully keyboard accessible.
4. **Selected pin**: An `aria-live` region announces: "Selected: Fire in Barangay Gahonon, Daet. High severity. 2 hours ago."
5. **Skip link**: Hidden skip link at top: "Skip to Feed" bypasses the map for keyboard users.

---

## 18. Dark Mode

> **Design decision reversed:** The original spec deferred dark mode to V2 with the rationale that "light mode is maximally legible in all conditions." This is incorrect for the primary use case: typhoons, floods, and earthquakes frequently occur at night. A bright white UI destroys dark-adapted vision, creates a conspicuous screen beacon, and drains OLED battery faster — critical issues in the Philippines where OLED phones are common and power outages accompany disasters.

### 18.1 V1 Implementation: Auto Mode

V1 implements `prefers-color-scheme: dark` auto mode only. The app follows the system setting.

Implementation is feasible because the color system is built on semantic CSS tokens (`--color-surface`, `--color-text-primary`, etc.) that map to dark values in a `@media (prefers-color-scheme: dark)` block.

### 18.2 Dark Token Mappings

```
Light                    Dark
─────────────────────────────────────────
--color-surface: #FFFFFF  →  #111827
--color-surface-2: #F9FAFB → #1F2937
--color-text-primary: #111827 → #F9FAFB
--color-text-secondary: #374151 → #D1D5DB
--color-border: #D1D5DB   →  #374151
--color-nav: #1B2A4A       →  #0F172A
```

Severity colors maintain their hues but are lightened slightly for dark backgrounds to preserve WCAG AA contrast. Map tiles: use CartoDB Dark Matter (free, no key required) when dark mode is active.

### 18.3 V2 Enhancement

V2 adds a manual toggle (Light / Dark / Auto) in user settings.

---

## 19. Empty States & Error States

### 19.1 Empty States

```
Feed (no reports):
┌──────────────────────────────────┐
│          📋                       │
│  No reports in your area yet     │
│  Verified reports will appear    │
│  here when submitted.            │
└──────────────────────────────────┘

My Reports:
┌──────────────────────────────────┐
│          📝                       │
│  You haven't submitted any       │
│  reports yet.                    │
│  [Report an Emergency →]         │
└──────────────────────────────────┘

Admin Queue (no pending):
┌──────────────────────────────────┐
│          ✅                       │
│  All caught up!                  │
│  No pending reports to review.   │
└──────────────────────────────────┘

Alerts:
┌──────────────────────────────────┐
│          🔔                       │
│  No alerts for your area.        │
│  Official announcements will     │
│  appear here.                    │
└──────────────────────────────────┘
```

### 19.2 Error States

```
Network Error:
┌──────────────────────────────────┐
│    📡 ╳                          │
│  Can't connect right now.        │
│  Check your connection.          │
│  [Retry]                         │
└──────────────────────────────────┘

Submit Failed:
┌──────────────────────────────────┐
│  ⚠️  Report couldn't be sent     │
│  Draft saved. Will submit        │
│  automatically when online.      │
│  [Try Again]  [View Draft]       │
└──────────────────────────────────┘

Permission Denied (403):
┌──────────────────────────────────┐
│    🔒                             │
│  You don't have access.          │
│  This may be outside your        │
│  assigned municipality.          │
│  [Go Back]                       │
└──────────────────────────────────┘

Offline Banner (persistent, below app header):
┌──────────────────────────────────┐
│ 📡 You're offline. Showing       │  ← bg:#FFFBEB  text:#92400E  32px
│    cached data.                  │     Non-dismissable while offline
└──────────────────────────────────┘
```

### 19.3 Loading States (Skeletons)

```
Report Card Skeleton:
┌──────────────────────────────────┐
│ ████████████ ████                │  ← Animated shimmer
│ ████████████████████             │
│ ██████████ · ██████              │
│ ████████████████████████████     │
└──────────────────────────────────┘

Shimmer animation:
  background: linear-gradient(90deg, #F3F4F6, #E5E7EB, #F3F4F6)
  background-size: 200% 100%
  animation: shimmer 1.5s infinite
```

---

## 20. Performance & Font Loading

| Concern                     | Decision                                                                                                                                                                                    |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Font delivery**           | Bundled WOFF2 subset (not CDN). Latin Extended subset for Filipino names. Weights: 400, 600, 700. ~90KB total.                                                                              |
| **Font display**            | `font-display: swap`. Text renders in system font immediately; Inter swaps in. 400 weight preloaded.                                                                                        |
| **Offline font**            | Guaranteed available (bundled). No Google Fonts CDN dependency.                                                                                                                             |
| **Map initial load**        | `limit(50)` for first viewport. Progressive load up to 150 max visible markers.                                                                                                             |
| **Offline sync**            | Firestore SDK offline persistence handles queued writes. IndexedDB is used only for unsaved multi-step form drafts (before the user hits Submit). No custom service worker sync for writes. |
| **Geocoding**               | Static GeoJSON intersection only. No live geocoding API. Municipality/barangay resolved from pin coordinates offline.                                                                       |
| **React Query + Firestore** | React Query for paginated feed queries. Direct `onSnapshot` for map viewport and admin triage queue. These are separate systems; do not force `onSnapshot` streams into React Query.        |

---

## 21. Design Quality Targets

| Metric                                | Target                                    | How We Achieve It                                                                      |
| ------------------------------------- | ----------------------------------------- | -------------------------------------------------------------------------------------- |
| **Time to submit report (mobile)**    | ≤ 45 seconds                              | 3-step flow, evidence-first, GPS auto-fill, zero classification decisions for citizen  |
| **Time to classify + triage (admin)** | ≤ 20 seconds per report                   | Classification panel inline with evidence, segmented severity control, one confirm tap |
| **Admin mobile triage path**          | ≤ 3 taps                                  | Dedicated Triage tab in admin tab bar; push notifications deep-link to action          |
| **Lighthouse Accessibility**          | ≥ 95                                      | WCAG AA contrasts, keyboard nav, ARIA, semantic HTML                                   |
| **Cognitive load per screen**         | ≤ 3–5 information units                   | Compact/standard card modes, chunked form steps, progressive disclosure                |
| **Critical action click depth**       | ≤ 3 clicks/taps                           | Report, triage, and alert receipt all ≤ 3 interactions                                 |
| **Map stability**                     | Zero remounts on navigation               | Sibling architecture, CSS-only drawer transitions                                      |
| **Severity recognition time**         | ≤ 1 second                                | Consistent color + text + position across all views                                    |
| **Offline resilience**                | Core read/submit available offline        | Firestore SDK persistence + bundled assets + IndexedDB form drafts                     |
| **Dark mode**                         | System auto mode (V1), manual toggle (V2) | Semantic CSS tokens, CartoDB Dark Matter map tiles                                     |

---

> **The best emergency UI is the one you never have to think about using. Every pixel in Bantayog Alert serves one purpose: helping people act fast and act right when it matters most.**
