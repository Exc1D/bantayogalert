import { useEffect, useState, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Bell, FilePlus2, LayoutList, Map, User } from 'lucide-react'
import { useUIStore, type ActiveTab } from '@/stores/uiStore'
import { MapContainerWrapper } from './MapContainerWrapper'
import { MunicipalityBoundaries } from '@/components/map/MunicipalityBoundaries'
import { ReportMarkers } from '@/components/map/ReportMarkers'
import { ReportFeed } from '@/components/report/ReportFeed'
import { FilterBar } from '@/components/map/FilterBar'
import { useVerifiedReportsListener } from '@/hooks/useVerifiedReportsListener'
import { useAuth } from '@/lib/auth/hooks'
import { UserRole } from '@/types/user'
import { AlertsFeed } from '@/components/alerts/AlertsFeed'

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
        <div className="space-y-3">
          <button
            onClick={() => navigate('/app/admin')}
            className="w-full text-left px-4 py-3 bg-blue-50 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors"
          >
            <p className="text-sm font-medium text-blue-700">Admin Panel</p>
            <p className="text-xs text-blue-500 mt-0.5">Access triage queue and admin tools</p>
          </button>
          <button
            onClick={() => navigate('/app/admin/analytics')}
            className="w-full text-left px-4 py-3 bg-amber-50 rounded-lg border border-amber-200 hover:bg-amber-100 transition-colors"
          >
            <p className="text-sm font-medium text-amber-700">Analytics</p>
            <p className="text-xs text-amber-600 mt-0.5">Review report metrics and hotspots</p>
          </button>
          <button
            onClick={() => navigate('/app/admin/audit')}
            className="w-full text-left px-4 py-3 bg-slate-50 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors"
          >
            <p className="text-sm font-medium text-slate-800">Audit Log</p>
            <p className="text-xs text-slate-500 mt-0.5">Inspect admin activity history</p>
          </button>
        </div>
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

const TAB_ICONS = {
  feed: LayoutList,
  map: Map,
  report: FilePlus2,
  alerts: Bell,
  profile: User,
} satisfies Record<ActiveTab, typeof Bell>

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
      return (
        <div className="h-full overflow-y-auto p-4">
          <AlertsFeed />
        </div>
      )
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

  const isReportRoute = location.pathname === '/app/report'
  const isTrackedReportRoute = location.pathname.startsWith('/app/track/')
  const isAlertRoute = location.pathname === '/app/alerts'
  const isAdminRoute =
    location.pathname === '/app/admin' ||
    location.pathname === '/app/admin/alerts' ||
    location.pathname === '/app/admin/analytics' ||
    location.pathname === '/app/admin/audit' ||
    location.pathname === '/app/contacts'
  const showsRouteContent =
    isReportRoute || isTrackedReportRoute || isAlertRoute || isAdminRoute

  if (!mounted) return null

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden">
      <div className="flex-1 overflow-hidden relative">
        {!showsRouteContent &&
          TABS.map((t) => (
            <div
              key={t.id}
              className={activeTab === t.id ? 'block h-full' : 'hidden'}
            >
              <TabContent tab={t.id} />
            </div>
          ))}
        {showsRouteContent ? children : null}
      </div>
      <div className="h-16 flex-shrink-0 fixed bottom-0 w-full z-20 bg-white border-t border-gray-200 flex">
        {TABS.map((t) => (
          (() => {
            const Icon = TAB_ICONS[t.id]

            return (
              <button
                key={t.id}
                onClick={() => {
                  if (t.id === 'report') {
                    navigate('/app/report')
                  } else if (t.id === 'alerts') {
                    setActiveTab('alerts')
                    navigate('/app/alerts')
                  } else if (t.id === 'profile') {
                    setActiveTab('profile')
                    navigate('/app')
                  } else {
                    setActiveTab(t.id)
                    navigate('/app')
                  }
                }}
                className={`flex-1 flex flex-col items-center justify-center gap-1 text-xs ${
                  activeTab === t.id ||
                  (t.id === 'report' && isReportRoute) ||
                  (t.id === 'alerts' && isAlertRoute)
                    ? 'text-blue-600'
                    : 'text-gray-500'
                }`}
              >
                <Icon className="w-5 h-5" />
                {t.label}
              </button>
            )
          })()
        ))}
      </div>
    </div>
  )
}
