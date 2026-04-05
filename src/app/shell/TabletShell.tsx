import { useState, type ReactNode } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Bell, FilePlus2, LayoutList, Map, User, Shield } from 'lucide-react'
import { useUIStore } from '@/stores/uiStore'
import { useAuth } from '@/lib/auth/hooks'
import { UserRole } from '@/types/user'
import { MapContainerWrapper } from './MapContainerWrapper'
import { MunicipalityBoundaries } from '@/components/map/MunicipalityBoundaries'
import { ReportMarkers } from '@/components/map/ReportMarkers'
import { ReportFeed } from '@/components/report/ReportFeed'
import { FilterBar } from '@/components/map/FilterBar'
import { AlertsFeed } from '@/components/alerts/AlertsFeed'
import { OverlayDrawer } from '@/components/ui/OverlayDrawer'

const BASE_TABS = [
  { id: 'map' as const, label: 'Map', Icon: Map },
  { id: 'feed' as const, label: 'Feed', Icon: LayoutList },
  { id: 'report' as const, label: 'Report', Icon: FilePlus2 },
  { id: 'alerts' as const, label: 'Alerts', Icon: Bell },
  { id: 'profile' as const, label: 'Profile', Icon: User },
]

interface TabletShellProps {
  children?: ReactNode
}

function TabletProfileContent() {
  const navigate = useNavigate()
  const { customClaims } = useAuth()
  const role = customClaims?.role ?? UserRole.Citizen
  const isAdmin =
    role === UserRole.MunicipalAdmin || role === UserRole.ProvincialSuperadmin

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Profile</h2>
      {isAdmin && (
        <div className="space-y-3">
          <button
            onClick={() => navigate('/app/admin')}
            className="w-full text-left px-4 py-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors"
          >
            <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Admin Panel</p>
            <p className="text-xs text-blue-500 dark:text-blue-400 mt-0.5">Access triage queue and admin tools</p>
          </button>
          <button
            onClick={() => navigate('/app/admin/analytics')}
            className="w-full text-left px-4 py-3 bg-amber-50 dark:bg-amber-950 rounded-lg border border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900 transition-colors"
          >
            <p className="text-sm font-medium text-amber-700 dark:text-amber-300">Analytics</p>
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">Review report metrics and hotspots</p>
          </button>
          <button
            onClick={() => navigate('/app/admin/audit')}
            className="w-full text-left px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Audit Log</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Inspect activity history</p>
          </button>
        </div>
      )}
    </div>
  )
}

export function TabletShell({ children }: TabletShellProps) {
  const { activeTab, setActiveTab } = useUIStore()
  const navigate = useNavigate()
  const location = useLocation()
  const { customClaims } = useAuth()
  const role = customClaims?.role ?? UserRole.Citizen
  const isAdmin =
    role === UserRole.MunicipalAdmin || role === UserRole.ProvincialSuperadmin

  const tabs = isAdmin
    ? [
        ...BASE_TABS.slice(0, -1),
        { id: 'admin' as const, label: 'Admin', Icon: Shield },
        BASE_TABS.at(-1)!,
      ]
    : BASE_TABS

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [isLandscape, setIsLandscape] = useState(
    typeof window !== 'undefined' && window.innerWidth > window.innerHeight
  )

  if (typeof window !== 'undefined') {
    window.addEventListener('resize', () => {
      setIsLandscape(window.innerWidth > window.innerHeight)
    })
  }

  const showsRouteContent =
    location.pathname === '/app/report' ||
    location.pathname.startsWith('/app/report?') ||
    location.pathname.startsWith('/app/track/') ||
    location.pathname.startsWith('/app/admin')

  const placement = isLandscape ? 'right' as const : 'bottom' as const

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden">
      {/* Top nav bar */}
      <nav
        className="h-14 flex items-center bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-gray-700 flex-shrink-0 z-10"
        aria-label="Tablet navigation"
      >
        {tabs.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => {
              if (id === 'report') {
                navigate('/app/report')
              } else if (id === 'alerts') {
                setActiveTab('alerts')
                navigate('/app/alerts')
              } else if (id === 'admin') {
                setActiveTab('admin')
                navigate('/app/admin')
              } else {
                setActiveTab(id)
                navigate('/app')
              }
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium transition-colors ${
              activeTab === id
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 dark:text-gray-400'
            }`}
            aria-label={label}
          >
            <Icon className="w-5 h-5" />
            <span className="sm:inline hidden">{label}</span>
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
        {activeTab === 'profile' && !showsRouteContent && (
          <div className="h-full overflow-y-auto">
            <TabletProfileContent />
          </div>
        )}
        {showsRouteContent ? children : null}

        {/* Overlay drawer for report detail */}
        <OverlayDrawer
          isOpen={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          placement={placement}
        >
          <div className="p-4 h-full overflow-y-auto">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Report detail — wired in Wave 5
            </div>
          </div>
        </OverlayDrawer>
      </div>
    </div>
  )
}
