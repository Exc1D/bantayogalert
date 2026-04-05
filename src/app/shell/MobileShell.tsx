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
import { AlertsFeed } from '@/components/alerts/AlertsFeed'
import { MobileBottomTabs } from './MobileBottomTabs'
import { AdminQueueFeed } from '@/components/report/AdminQueueFeed'
import { AdminReportDetailPanel } from '@/components/report/AdminReportDetailPanel'
import { BottomSheet } from '@/components/ui/BottomSheet'

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
      <h2 className="text-base font-semibold text-gray-900 dark:text-white">Profile</h2>
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
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Inspect admin activity history</p>
          </button>
        </div>
      )}
    </div>
  )
}

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
    case 'admin':
      return <AdminQueueFeed />
    case 'profile':
      return <ProfileContent />
    case 'report':
      return null
  }
}

export function MobileShell({ children }: MobileShellProps) {
  const [mounted, setMounted] = useState(false)
  const { activeTab, activePanel, selectedReportId, setActivePanel, setSelectedReportId } = useUIStore()
  const location = useLocation()

  useVerifiedReportsListener()

  useEffect(() => {
    setMounted(true)
  }, [])

  const showsRouteContent =
    location.pathname === '/app/report' ||
    location.pathname.startsWith('/app/report?') ||
    location.pathname.startsWith('/app/track/') ||
    location.pathname.startsWith('/app/admin') ||
    location.pathname === '/app/alerts' ||
    location.pathname === '/app/contacts'

  function handleAdminDetailSheetClose() {
    setActivePanel(null)
    setSelectedReportId(null)
  }

  if (!mounted) return null

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden">
      <div className="flex-1 overflow-hidden relative">
        {!showsRouteContent && (
          <>
            <div className={activeTab === 'feed' ? 'block h-full' : 'hidden'}>
              <TabContent tab="feed" />
            </div>
            <div className={activeTab === 'map' ? 'block h-full' : 'hidden'}>
              <TabContent tab="map" />
            </div>
            <div className={activeTab === 'admin' ? 'block h-full' : 'hidden'}>
              <TabContent tab="admin" />
            </div>
            <div className={activeTab === 'alerts' ? 'block h-full' : 'hidden'}>
              <TabContent tab="alerts" />
            </div>
            <div className={activeTab === 'profile' ? 'block h-full' : 'hidden'}>
              <TabContent tab="profile" />
            </div>
          </>
        )}
        {showsRouteContent ? children : null}
      </div>

      {/* Admin report detail bottom sheet (mobile) */}
      <BottomSheet
        isOpen={activePanel === 'admin-report-detail' && selectedReportId !== null}
        onClose={handleAdminDetailSheetClose}
        defaultState="half"
      >
        <AdminReportDetailPanel reportId={selectedReportId!} />
      </BottomSheet>

      <MobileBottomTabs />
    </div>
  )
}
