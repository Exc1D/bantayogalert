import { useEffect, useRef } from 'react'
import type L from 'leaflet'
import { useUIStore, type ActivePanel } from '@/stores/uiStore'

interface WorkspaceDrawerProps {
  mapRef: React.RefObject<L.Map | null>
}

const PANEL_LABELS: Record<NonNullable<ActivePanel>, string> = {
  'report-detail': 'Report Detail',
  'contact-detail': 'Contact Detail',
  'announcement-detail': 'Announcement Detail',
  settings: 'Settings',
}

function DrawerContent({ panel }: { panel: ActivePanel }) {
  if (!panel) return null
  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold">{PANEL_LABELS[panel]}</h2>
      <p className="text-gray-500 mt-2">Content for {panel} panel</p>
    </div>
  )
}

export function WorkspaceDrawer({ mapRef }: WorkspaceDrawerProps) {
  const { drawerOpen, activePanel, setDrawerOpen } = useUIStore()
  const drawerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const drawer = drawerRef.current
    if (!drawer) return

    const handleTransitionEnd = () => {
      mapRef.current?.invalidateSize()
    }

    drawer.addEventListener('transitionend', handleTransitionEnd)
    return () => drawer.removeEventListener('transitionend', handleTransitionEnd)
  }, [mapRef])

  return (
    <>
      {drawerOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-[19]"
          onClick={() => setDrawerOpen(false)}
        />
      )}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label={activePanel ? PANEL_LABELS[activePanel] : 'Workspace'}
        className="absolute right-0 top-0 h-full w-[480px] z-30 bg-white shadow-xl overflow-y-auto"
        style={{
          transform: drawerOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 300ms ease-in-out',
        }}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h1 className="text-lg font-semibold">
            {activePanel ? PANEL_LABELS[activePanel] : 'Workspace'}
          </h1>
          <button
            onClick={() => setDrawerOpen(false)}
            className="p-2 hover:bg-gray-100 rounded"
            aria-label="Close drawer"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M15 5L5 15M5 5l10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <DrawerContent panel={activePanel} />
      </div>
    </>
  )
}
