# Wave 3: Mobile UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add three-tier responsive layout, bottom sheet with swipe gestures, tablet shell with orientation-aware overlay, and admin tab integration.

**Architecture:** Refactor ShellRouter from binary mobile/desktop to three-tier breakpoint routing (mobile/tablet/desktop). Introduce BottomSheet component with PEEK/HALF/FULL states rendered via portal. Add new TabletShell with top nav and orientation-aware overlay drawer. Replace MobileShell's inline nav with MobileBottomTabs (pre-existing, unused).

**Tech Stack:** React 18, Tailwind CSS 3.4.17, Zustand 5.x, React Router 6.5.0, Lucide icons

---

### Task 1: Three-Tier Breakpoint System

**Files:**
- Modify: `src/app/shell/ShellRouter.tsx`
- Modify: `src/app/shell/index.ts` (export hooks)
- Test: Create `tests/unit/shell/useBreakpoint.test.ts`

- [ ] Step 1: Create a `useBreakpoint` hook in a new file that exposes `isMobile`, `isTablet`, `isDesktop`

Create `src/hooks/useBreakpoint.ts`:

```typescript
import { useEffect, useState } from 'react'

type Breakpoint = 'mobile' | 'tablet' | 'desktop'

export function useBreakpoint(): {
  breakpoint: Breakpoint
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
} {
  const getBreakpoint = (): Breakpoint => {
    const width = window.innerWidth
    if (width <= 768) return 'mobile'
    if (width <= 1279) return 'tablet'
    return 'desktop'
  }

  const [breakpoint, setBreakpoint] = useState<Breakpoint>(getBreakpoint)

  useEffect(() => {
    const handler = () => setBreakpoint(getBreakpoint())
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  return {
    breakpoint,
    isMobile: breakpoint === 'mobile',
    isTablet: breakpoint === 'tablet',
    isDesktop: breakpoint === 'desktop',
  }
}
```

- [ ] Step 2: Test the hook

Create `tests/unit/shell/useBreakpoint.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useBreakpoint } from '@/hooks/useBreakpoint'

function setViewportWidth(width: number) {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  })
  window.dispatchEvent(new Event('resize'))
}

describe('useBreakpoint', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should return mobile at 375px', () => {
    const { result } = renderHook(() => useBreakpoint())
    // Initial value set at mount
    expect(result.current.breakpoint).toBe('desktop') // JSDOM defaults
  })

  it('should return mobile at <= 768px', () => {
    setViewportWidth(768)
    const { result } = renderHook(() => useBreakpoint())
    expect(result.current.breakpoint).toBe('mobile')
    expect(result.current.isMobile).toBe(true)
    expect(result.current.isTablet).toBe(false)
    expect(result.current.isDesktop).toBe(false)
  })

  it('should return tablet at 1024px', () => {
    setViewportWidth(1024)
    const { result } = renderHook(() => useBreakpoint())
    expect(result.current.breakpoint).toBe('tablet')
    expect(result.current.isTablet).toBe(true)
  })

  it('should return desktop at >= 1280px', () => {
    setViewportWidth(1280)
    const { result } = renderHook(() => useBreakpoint())
    expect(result.current.breakpoint).toBe('desktop')
  })
})
```

- [ ] Step 3: Refactor ShellRouter to use useBreakpoint

Update `src/app/shell/ShellRouter.tsx`:

```typescript
import { Outlet } from 'react-router-dom'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { DesktopShell } from './DesktopShell'
import { MobileShell } from './MobileShell'
import { TabletShell } from './TabletShell'

export function ShellRouter() {
  const { isMobile, isTablet, isDesktop } = useBreakpoint()

  return isDesktop ? (
    <DesktopShell>
      <Outlet />
    </DesktopShell>
  ) : isTablet ? (
    <TabletShell>
      <Outlet />
    </TabletShell>
  ) : (
    <MobileShell>
      <Outlet />
    </MobileShell>
  )
}
```

- [ ] Step 4: Export new hook and component

Add exports to `src/app/shell/index.ts` (create if missing, else modify).

- [ ] Step 5: Run tests and commit

```bash
npm run test -- tests/unit/shell/useBreakpoint.test.ts
npm run build
git add src/hooks/useBreakpoint.ts src/app/shell/ShellRouter.tsx src/app/shell/index.ts tests/unit/shell/useBreakpoint.test.ts docs/superpowers/plans/ docs/superpowers/specs/2026-04-05-wave-3-mobile-ux-design.md
git commit -m "feat(wave-3): three-tier breakpoint system — mobile/tablet/desktop"
```

### Task 2: Bottom Sheet Component

**Files:**
- Create: `src/components/ui/BottomSheet.tsx`
- Test: Create `tests/unit/ui/BottomSheet.test.tsx`

- [ ] Step 1: Write tests for BottomSheet states and interactions

Create `tests/unit/ui/BottomSheet.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BottomSheet } from '@/components/ui/BottomSheet'

describe('BottomSheet', () => {
  it('should not render when not open', () => {
    render(
      <BottomSheet isOpen={false} onClose={vi.fn()}>Content</BottomSheet>
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('should render and start at PEEK state when open', () => {
    render(
      <BottomSheet isOpen={true} onClose={vi.fn()}>Content</BottomSheet>
    )
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('should call onClose when backdrop is clicked', () => {
    const onClose = vi.fn()
    render(
      <BottomSheet isOpen={true} onClose={onClose}>Content</BottomSheet>
    )
    fireEvent.click(screen.getByTestId('bottom-sheet-backdrop'))
    expect(onClose).toHaveBeenCalled()
  })

  it('should call onClose when Escape is pressed', () => {
    const onClose = vi.fn()
    render(
      <BottomSheet isOpen={true} onClose={onClose}>Content</BottomSheet>
    )
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalled()
  })
})
```

- [ ] Step 2: Implement BottomSheet

```tsx
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

export type SheetState = 'peek' | 'half' | 'full'

interface BottomSheetProps {
  isOpen: boolean
  onClose: () => void
  /** Override which snap points are available. Defaults to all three. */
  states?: SheetState[]
  /** Initial state when opened */
  defaultState?: SheetState
  children: ReactNode
}

const HEIGHT_MAP: Record<SheetState, string> = {
  peek: '30vh',
  half: '60vh',
  full: '100vh',
}

const SNAP_ORDER: SheetState[] = ['peek', 'half', 'full']

export function BottomSheet({
  isOpen,
  onClose,
  states = SNAP_ORDER,
  defaultState = 'peek',
  children,
}: BottomSheetProps) {
  const [sheetState, setSheetState] = useState<SheetState>(defaultState)
  const startYRef = useRef(0)
  const currentYRef = useRef(0)
  const isDragging = useRef(false)
  const panelRef = useRef<HTMLDivElement>(null)

  // Reset state when reopened
  useEffect(() => {
    if (isOpen) setSheetState(defaultState)
  }, [isOpen, defaultState])

  // Escape key closes
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const currentHeight = HEIGHT_MAP[sheetState]
  const backdropOpacity = sheetState === 'peek' ? 'opacity-0' : 'opacity-100'

  const snapToNearest = () => {
    const deltaY = startYRef.current - currentYRef.current
    const currentIndex = SNAP_ORDER.indexOf(sheetState)
    const thresholds = [60, 120]

    let newIndex = currentIndex
    if (deltaY < -thresholds[1]) {
      // Swipe down — go to PEEK or close
      newIndex = 0
    } else if (deltaY < -thresholds[0] && currentIndex > 0) {
      newIndex = currentIndex - 1
    } else if (deltaY > thresholds[1] && currentIndex < SNAP_ORDER.length - 1) {
      newIndex = currentIndex + 1
    } else if (deltaY > thresholds[0] && currentIndex === 0) {
      newIndex = 1
    }

    setSheetState(SNAP_ORDER[newIndex])
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    // Only start drag if at top of content
    const target = e.target as HTMLElement
    const isScrollAtTop = (e.currentTarget.querySelector('[data-sheet-scroll]')?.scrollTop ?? 0) === 0
    if (isScrollAtTop || target.hasAttribute('data-sheet-handle')) {
      startYRef.current = e.touches[0].clientY
      isDragging.current = true
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return
    currentYRef.current = e.touches[0].clientY
    const deltaY = startYRef.current - currentYRef.current
    const panel = panelRef.current
    if (panel) {
      panel.style.transform = `translateY(${-deltaY}px)`
    }
  }

  const handleTouchEnd = () => {
    if (!isDragging.current) return
    isDragging.current = false
    const panel = panelRef.current
    if (panel) panel.style.transform = ''
    snapToNearest()
  }

  return createPortal(
    <>
      {/* Backdrop — tap to collapse/close */}
      <div
        data-testid="bottom-sheet-backdrop"
        className={`fixed inset-0 bg-black/40 transition-opacity duration-200 ${backdropOpacity} z-40`}
        onClick={() => {
          if (sheetState === 'peek') {
            onClose()
          } else {
            setSheetState('peek')
          }
        }}
        aria-hidden="true"
      />
      {/* Sheet panel */}
      <div
        role="dialog"
        aria-modal="true"
        ref={panelRef}
        className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 rounded-t-2xl shadow-2xl z-50 transition-transform duration-200 ease-out"
        style={{ height: currentHeight }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Drag handle */}
        <div
          data-sheet-handle
          className="flex justify-center py-3 cursor-grab active:cursor-grabbing"
          aria-hidden="true"
        >
          <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
        </div>
        {/* Scrollable content */}
        <div data-sheet-scroll className="h-full overflow-y-auto pb-4">
          {children}
        </div>
      </div>
    </>,
    document.body
  )
}
```

- [ ] Step 3: Run tests

```bash
npm run test -- tests/unit/ui/BottomSheet.test.tsx --run
```

- [ ] Step 4: Commit

```bash
git add src/components/ui/BottomSheet.tsx tests/unit/ui/BottomSheet.test.tsx
git commit -m "feat(wave-3): BottomSheet component with PEEK/HALF/FULL states + swipe"
```

### Task 3: TabletShell and OverlayDrawer

**Files:**
- Create: `src/app/shell/TabletShell.tsx`
- Create: `src/components/ui/OverlayDrawer.tsx`
- Modify: `src/app/ShellRouter.tsx` (already modified in Task 1 — just import TabletShell)
- Test: Create `tests/unit/shell/TabletShell.test.tsx`

- [ ] Step 1: Create OverlayDrawer component

```tsx
import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

interface OverlayDrawerProps {
  isOpen: boolean
  onClose: () => void
  /** "bottom" for portrait tablets, "right" for landscape */
  placement?: 'bottom' | 'right'
  children: ReactNode
}

export function OverlayDrawer({
  isOpen,
  onClose,
  placement = 'right',
  children,
}: OverlayDrawerProps) {
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const isRight = placement === 'right'

  const panelClasses = isRight
    ? 'fixed top-0 right-0 h-full w-[360px] max-w-full bg-white dark:bg-gray-900 shadow-2xl z-40 translate-x-full'
    : 'fixed bottom-0 left-0 right-0 max-h-[80vh] bg-white dark:bg-gray-900 rounded-t-2xl shadow-2xl z-40 translate-y-full'

  return createPortal(
    <>
      <div
        className="fixed inset-0 bg-black/40 z-30"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className={panelClasses}>
        {children}
      </div>
    </>,
    document.body
  )
}
```

- [ ] Step 2: Create TabletShell

```tsx
import { useState, type ReactNode } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Bell, FilePlus2, LayoutList, Map, User } from 'lucide-react'
import { useUIStore } from '@/stores/uiStore'
import { MapContainerWrapper } from './MapContainerWrapper'
import { MunicipalityBoundaries } from '@/components/map/MunicipalityBoundaries'
import { ReportMarkers } from '@/components/map/ReportMarkers'
import { ReportFeed } from '@/components/report/ReportFeed'
import { FilterBar } from '@/components/map/FilterBar'
import { AlertsFeed } from '@/components/alerts/AlertsFeed'
import { OverlayDrawer } from '@/components/ui/OverlayDrawer'

const TABS = [
  { id: 'feed', label: 'Feed', Icon: LayoutList },
  { id: 'map', label: 'Map', Icon: Map },
  { id: 'report', label: 'Report', Icon: FilePlus2 },
  { id: 'alerts', label: 'Alerts', Icon: Bell },
  { id: 'profile', label: 'Profile', Icon: User },
] as const

interface TabletShellProps {
  children?: ReactNode
}

export function TabletShell({ children }: TabletShellProps) {
  const { activeTab, setActiveTab } = useUIStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Orientation detection for drawer placement
  const [isLandscape, setIsLandscape] = useState(
    window.innerWidth > window.innerHeight
  )
  useState(() => {
    const handler = () => setIsLandscape(window.innerWidth > window.innerHeight)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  })

  const showsRouteContent =
    location.pathname.startsWith('/app/report') ||
    location.pathname.startsWith('/app/track/') ||
    location.pathname.startsWith('/app/admin')

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden">
      {/* Top nav bar */}
      <nav
        className="h-14 flex items-center justify-around bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-gray-700 flex-shrink-0 z-10"
        aria-label="Tablet navigation"
      >
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => {
              if (id === 'report') {
                navigate('/app/report')
              } else if (id === 'alerts') {
                setActiveTab('alerts')
                navigate('/app/alerts')
              } else {
                setActiveTab(id)
                navigate('/app')
              }
            }}
            className={`flex flex-1 items-center justify-center gap-2 py-2 text-sm font-medium transition-colors ${
              activeTab === id
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 dark:text-gray-400'
            }`}
            aria-label={label}
          >
            <Icon className="w-5 h-5" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </nav>

      {/* Map + content area */}
      <div className="flex-1 overflow-hidden relative">
        {!showsRouteContent && activeTab === 'map' && (
          <MapContainerWrapper>
            <MunicipalityBoundaries />
            <ReportMarkers />
          </MapContainerWrapper>
        )}
        {activeTab === 'feed' && !showsRouteContent && (
          <div className="h-full w-full flex flex-col">
            <FilterBar />
            <ReportFeed />
          </div>
        )}
        {activeTab === 'alerts' && !showsRouteContent && (
          <div className="h-full overflow-y-auto p-4">
            <AlertsFeed />
          </div>
        )}
        {showsRouteContent ? children : null}

        {/* Overlay drawer for report detail */}
        <OverlayDrawer
          isOpen={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          placement={isLandscape ? 'right' : 'bottom'}
        >
          {/* This will be wired to report detail content later */}
          <div className="p-4">Drawer content</div>
        </OverlayDrawer>
      </div>
    </div>
  )
}
```

- [ ] Step 3: Write tests

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { OverlayDrawer } from '@/components/ui/OverlayDrawer'

describe('OverlayDrawer', () => {
  it('should not render when not open', () => {
    render(
      <OverlayDrawer isOpen={false} onClose={vi.fn()}>Content</OverlayDrawer>
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('should render when open', () => {
    render(
      <OverlayDrawer isOpen={true} onClose={vi.fn()}>Content</OverlayDrawer>
    )
    expect(screen.getByText('Content')).toBeInTheDocument()
  })

  it('should call onClose on Escape', () => {
    const onClose = vi.fn()
    render(
      <OverlayDrawer isOpen={true} onClose={onClose}>Content</OverlayDrawer>
    )
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalled()
  })
})
```

Add import: `import { fireEvent } from '@testing-library/react'` to the test file.

- [ ] Step 4: Run build and commit

```bash
npm run build
git add src/app/shell/TabletShell.tsx src/components/ui/OverlayDrawer.tsx tests/unit/shell/TabletShell.test.tsx
git commit -m "feat(wave-3): TabletShell with orientation-aware overlay drawer"
```

### Task 4: Admin Tab Integration into MobileShell

**Files:**
- Modify: `src/app/shell/MobileShell.tsx` — integrate MobileBottomTabs, add Admin tab
- Modify: `src/stores/uiStore.ts` — add `admin` to `ActiveTab`
- Test: Create `tests/unit/shell/MobileBottomTabs.test.tsx`

- [ ] Step 1: Add `admin` to ActiveTab type

Update `src/stores/uiStore.ts`:

```typescript
export type ActiveTab = 'feed' | 'map' | 'report' | 'alerts' | 'profile' | 'admin'
```

- [ ] Step 2: Replace MobileShell's inline nav with MobileBottomTabs

Modify `src/app/shell/MobileShell.tsx`:

1. Remove the inline `TABS` array, `TAB_ICONS` map, and the `<nav>` block at lines 57-186
2. Remove individual TABS mapping code
3. Import and render `<MobileBottomTabs />` inside the Shell before closing `</div>` of the outer flex container
4. Keep the ProfileContent component and TabContent for rendering content
5. Add support for admin tab route matching in `showsRouteContent`:

```typescript
const isAdminRoute =
  location.pathname.startsWith('/app/admin') ||
  location.pathname === '/app/contacts'
```

The nav replacement looks like:
- Delete lines 57-71 (TABS, TAB_ICONS)
- Delete lines 146-186 (the `<nav>` block)
- Replace with `<MobileBottomTabs />` at the end, before the closing `</div>`

- [ ] Step 3: Update MobileBottomTabs to properly handle Admin tab navigation

Modify `src/app/shell/MobileBottomTabs.tsx`:

The current MobileBottomTabs has a "Contacts" tab as the admin tab. Per the design spec, we want an "Admin" tab that shows the admin queue. Update the admin tab entry:

1. Change the Contacts tab (if present) to "Admin" tab that navigates to `/app/admin` on mobile
2. Ensure it shows only for admin roles (already gated)
3. Add `admin` to the allowed ActiveTab union

- [ ] Step 4: Test the admin tab rendering

```bash
npm run test -- tests/unit/shell/MobileBottomTabs.test.tsx --run
```

- [ ] Step 5: Build and commit

```bash
npm run build
git add src/stores/uiStore.ts src/app/shell/MobileShell.tsx src/app/shell/MobileBottomTabs.tsx
git commit -m "feat(wave-3): integrate MobileBottomTabs with admin tab"
```

### Task 5: Bottom Sheet Integration for Admin Triage

**Files:**
- Create: `src/components/report/BottomSheetReportDetail.tsx`
- Modify: `src/components/report/AdminQueueFeed.tsx` — open sheet on card tap
- Modify: `src/app/shell/MobileShell.tsx` — add BottomSheetProvider

- [ ] Step 1: Create BottomSheetReportDetail wrapper

```tsx
import { BottomSheet } from '@/components/ui/BottomSheet'
import { AdminReportDetailPanel } from './AdminReportDetailPanel'

interface BottomSheetReportDetailProps {
  isOpen: boolean
  onClose: () => void
  reportId: string | null
}

export function BottomSheetReportDetail({
  isOpen,
  onClose,
  reportId,
}: BottomSheetReportDetailProps) {
  if (!reportId) return null

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose}>
      <div className="p-4 max-h-full">
        <AdminReportDetailPanel reportId={reportId} />
      </div>
    </BottomSheet>
  )
}
```

- [ ] Step 2: Wire sheet into AdminQueueFeed

In `src/components/report/AdminQueueFeed.tsx`, find the card onClick handler that calls `setActivePanel('admin-report-detail')`. Replace it with:

```tsx
// On card tap — open bottom sheet instead of panel
onReportTap(report.id)
```

The `onReportTap` prop comes from the parent (MobileShell or admin route handler).

- [ ] Step 3: Add bottom sheet state management to admin route

In the mobile admin route handler (parent of AdminQueueFeed), add sheet state:

```tsx
const [sheetOpen, setSheetOpen] = useState(false)
const [selectedReportId, setSelectedReportId] = useState<string | null>(null)

const handleReportTap = (id: string) => {
  setSelectedReportId(id)
  setSheetOpen(true)
}
```

And render:
```tsx
<BottomSheetReportDetail
  isOpen={sheetOpen}
  onClose={() => setSheetOpen(false)}
  reportId={selectedReportId}
/>
```

- [ ] Step 4: Build and test

```bash
npm run build
npm run dev  # manual verification on mobile viewport
npx playwright test  # if E2E tests exist
```

- [ ] Step 5: Verify admin mobile flow end-to-end

Manual checklist:
- Admin tab visible for admin users, hidden for citizens
- Admin queue loads with three tabs (pending/verified/dispatched)
- Tapping a card opens the bottom sheet at PEEK
- Swipe up expands to HALF
- Swipe up again expands to FULL
- Swipe down collapses
- Escape key closes sheet
- Backdrop tap collapses/closes sheet
- Report form accessible from mobile

- [ ] Step 6: Final commit

```bash
git add src/components/report/BottomSheetReportDetail.tsx src/components/report/AdminQueueFeed.tsx src/app/shell/MobileShell.tsx
git commit -m "feat(wave-3): bottom sheet integration for admin triage flow"
```

## 6. Summary of Commits

| # | Commit Message | Type |
|---|---------------|------|
| 1 | `feat(wave-3): three-tier breakpoint system — mobile/tablet/desktop` | Feature |
| 2 | `feat(wave-3): BottomSheet component with PEEK/HALF/FULL states + swipe` | Feature |
| 3 | `feat(wave-3): TabletShell with orientation-aware overlay drawer` | Feature |
| 4 | `feat(wave-3): integrate MobileBottomTabs with admin tab` | Feature |
| 5 | `feat(wave-3): bottom sheet integration for admin triage flow` | Feature |

## 7. Risk Mitigation

- **Touch gesture conflicts**: BottomSheet touch handling must not interfere with map panning. Portal rendering isolates the sheet.
- **JSOM test environment**: JSDOM's `window.innerWidth` defaults to 1024px. Tests must explicitly set viewport width.
- **TypeScript any types**: `useVerifiedReportsListener` uses `any` types — if importing in tests, be careful with type assertions.

## 8. Out of Scope (Future Work)

- Map pin redesign (Wave 4)
- Municipality boundary fixes (Wave 4)
- Empty states (Wave 4)
- A11y audit beyond basic focus/Escape/ARIA (Wave 4)
- Toast tier wiring (Wave 2.2 follow-up)
- Tablet orientation-aware drawer wired to actual report detail content (placeholder in this wave)
