import { type ReactNode } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Bell, FilePlus2, LayoutList, Map, User } from 'lucide-react'
import { useUIStore } from '@/stores/uiStore'
import { MapContainerWrapper } from './MapContainerWrapper'
import { MunicipalityBoundaries } from '@/components/map/MunicipalityBoundaries'
import { ReportMarkers } from '@/components/map/ReportMarkers'
import { ReportFeed } from '@/components/report/ReportFeed'
import { FilterBar } from '@/components/map/FilterBar'
import { AlertsFeed } from '@/components/alerts/AlertsFeed'

const TABS = [
  { id: 'feed' as const, label: 'Feed', Icon: LayoutList },
  { id: 'map' as const, label: 'Map', Icon: Map },
  { id: 'report' as const, label: 'Report', Icon: FilePlus2 },
  { id: 'alerts' as const, label: 'Alerts', Icon: Bell },
  { id: 'profile' as const, label: 'Profile', Icon: User },
]

interface TabletShellProps {
  children?: ReactNode
}

export function TabletShell({ children }: TabletShellProps) {
  const { activeTab, setActiveTab } = useUIStore()
  const navigate = useNavigate()
  const location = useLocation()

  const showsRouteContent =
    location.pathname === '/app/report' ||
    location.pathname.startsWith('/app/report?') ||
    location.pathname.startsWith('/app/track/') ||
    location.pathname.startsWith('/app/admin')

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden">
      {/* Top nav bar */}
      <nav
        className="h-14 flex items-center bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-gray-700 flex-shrink-0 z-10"
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
        {showsRouteContent ? children : null}
      </div>
    </div>
  )
}
