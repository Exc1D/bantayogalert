import { useEffect, useState, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useUIStore, type ActiveTab } from '@/stores/uiStore'
import { MapContainerWrapper } from './MapContainerWrapper'
import { MunicipalityBoundaries } from '@/components/map/MunicipalityBoundaries'
import { ReportMarkers } from '@/components/map/ReportMarkers'
import { ReportFeed } from '@/components/report/ReportFeed'
import { FilterBar } from '@/components/map/FilterBar'
import { useVerifiedReportsListener } from '@/hooks/useVerifiedReportsListener'

interface MobileShellProps {
  children?: ReactNode
}

const TABS: { id: ActiveTab; label: string }[] = [
  { id: 'feed', label: 'Feed' },
  { id: 'map', label: 'Map' },
  { id: 'report', label: 'Report' },
  { id: 'alerts', label: 'Alerts' },
  { id: 'profile', label: 'Profile' },
]

function TabContent({ tab }: { tab: ActiveTab }) {
  switch (tab) {
    case 'feed':
      return (
        <div className="h-full w-full flex flex-col">
          <FilterBar />
          <ReportFeed />
        </div>
      )
    case 'map':
      return (
        <div className="h-full w-full">
          <MapContainerWrapper>
            <MunicipalityBoundaries />
            <ReportMarkers />
          </MapContainerWrapper>
        </div>
      )
    case 'alerts':
      return <div className="p-4">Alerts Content</div>
    case 'profile':
      return <div className="p-4">Profile Content</div>
    case 'report':
      // Report tab navigates to /app/report which renders ReportFormMobileWrapper
      return null
  }
}

export function MobileShell({ children }: MobileShellProps) {
  const [mounted, setMounted] = useState(false)
  const { activeTab, setActiveTab } = useUIStore()
  const navigate = useNavigate()
  const location = useLocation()

  // Single shared listener that powers both map tab and feed tab
  useVerifiedReportsListener()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Check if we're on the report route
  const isReportRoute = location.pathname === '/app/report'

  if (!mounted) return null

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden">
      <div className="flex-1 overflow-hidden relative">
        {/* Show tab content only if NOT on report route */}
        {!isReportRoute && TABS.map((t) => (
          <div
            key={t.id}
            className={activeTab === t.id ? 'block h-full' : 'hidden'}
          >
            <TabContent tab={t.id} />
          </div>
        ))}
        {/* Child routes render here */}
        {children}
      </div>
      <div className="h-16 flex-shrink-0 fixed bottom-0 w-full z-20 bg-white border-t border-gray-200 flex">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => {
              if (t.id === 'report') {
                navigate('/app/report')
              } else {
                setActiveTab(t.id)
              }
            }}
            className={`flex-1 flex flex-col items-center justify-center gap-1 text-xs ${
              activeTab === t.id || (t.id === 'report' && isReportRoute) ? 'text-blue-600' : 'text-gray-500'
            }`}
          >
            <div className="w-5 h-5 bg-gray-300 rounded" />
            {t.label}
          </button>
        ))}
      </div>
    </div>
  )
}
