import { useEffect, useState, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useUIStore, type ActiveTab } from '@/stores/uiStore'
import { MapContainerWrapper } from './MapContainerWrapper'
import { MunicipalityBoundaries } from '@/components/map/MunicipalityBoundaries'
import { ReportMarkers } from '@/components/map/ReportMarkers'
import { ReportFeed } from '@/components/report/ReportFeed'
import { FilterBar } from '@/components/map/FilterBar'
import { useVerifiedReportsListener } from '@/hooks/useVerifiedReportsListener'
import { useAuth } from '@/lib/auth/hooks'
import { UserRole } from '@/types/user'

interface MobileShellProps {
  children?: ReactNode
}

function ProfileContent() {
  const { customClaims } = useAuth()
  const navigate = useNavigate()
  const role = customClaims?.role ?? UserRole.Citizen
  const isAdmin = role === UserRole.MunicipalAdmin || role === UserRole.ProvincialSuperadmin

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-base font-semibold text-gray-900">Profile</h2>
      {isAdmin && (
        <button
          onClick={() => navigate('/app/admin')}
          className="w-full text-left px-4 py-3 bg-blue-50 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors"
        >
          <p className="text-sm font-medium text-blue-700">Admin Panel</p>
          <p className="text-xs text-blue-500 mt-0.5">Access triage queue and admin tools</p>
        </button>
      )}
    </div>
  )
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
      return <ProfileContent />
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
