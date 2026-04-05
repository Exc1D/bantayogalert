import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { MapContainerWrapper } from './MapContainerWrapper'
import { WorkspaceDrawer } from './WorkspaceDrawer'
import { DesktopNavRail } from './DesktopNavRail'
import { ReportFeed } from '@/components/report/ReportFeed'
import { FilterBar } from '@/components/map/FilterBar'
import { useVerifiedReportsListener } from '@/hooks/useVerifiedReportsListener'

interface DesktopShellProps {
  children?: React.ReactNode
}

export function DesktopShell({ children }: DesktopShellProps) {
  const [mounted, setMounted] = useState(false)
  const location = useLocation()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Single shared listener at shell level — feeds both map (ReportMarkers) and feed (ReportFeed)
  useVerifiedReportsListener()

  if (!mounted) return null

  const routeBackedPanelPaths = new Set([
    '/app/alerts',
    '/app/contacts',
    '/app/admin',
    '/app/admin/alerts',
    '/app/admin/analytics',
    '/app/admin/audit',
  ])

  const panelContent =
    routeBackedPanelPaths.has(location.pathname) && children ? (
      <div className="flex-1 overflow-y-auto p-4">{children}</div>
    ) : (
      <>
        <FilterBar />
        <ReportFeed />
      </>
    )

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <DesktopNavRail />
      <div className="flex-1 relative overflow-hidden flex">
        <div className="flex-[3] relative overflow-hidden">
          <MapContainerWrapper>
            <WorkspaceDrawer />
          </MapContainerWrapper>
        </div>
        <div className="flex-[2] flex flex-col border-l border-gray-200 bg-white overflow-hidden">
          {panelContent}
        </div>
      </div>
    </div>
  )
}
