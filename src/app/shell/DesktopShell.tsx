import { useEffect, useState, type ReactNode } from 'react'
import { MapContainerWrapper } from './MapContainerWrapper'
import { WorkspaceDrawer } from './WorkspaceDrawer'
import { ReportFeed } from '@/components/report/ReportFeed'
import { FilterBar } from '@/components/map/FilterBar'
import { useVerifiedReportsListener } from '@/hooks/useVerifiedReportsListener'

interface DesktopShellProps {
  children?: ReactNode
}

function NavRail() {
  return (
    <div className="w-16 flex-shrink-0 bg-gray-100 border-r border-gray-200 flex flex-col items-center py-4 gap-4">
      <div className="w-10 h-10 bg-blue-500 rounded-lg" />
      <div className="w-8 h-8 bg-gray-300 rounded" />
      <div className="w-8 h-8 bg-gray-300 rounded" />
      <div className="w-8 h-8 bg-gray-300 rounded" />
      <div className="mt-auto w-8 h-8 bg-gray-300 rounded" />
    </div>
  )
}

export function DesktopShell({ children }: DesktopShellProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  // Single shared listener at shell level — feeds both map (ReportMarkers) and feed (ReportFeed)
  useVerifiedReportsListener()

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <NavRail />
      {/* 60% map / 40% feed split */}
      <div className="flex-1 relative overflow-hidden flex">
        {/* Map panel — ~60% */}
        <div className="flex-[3] relative overflow-hidden">
          <MapContainerWrapper>
            <WorkspaceDrawer />
          </MapContainerWrapper>
        </div>
        {/* Feed panel — ~40% */}
        <div className="flex-[2] flex flex-col border-l border-gray-200 bg-white overflow-hidden">
          {/* FilterBar at top of feed panel (D-139) */}
          <FilterBar />
          {/* Paginated feed below filter bar */}
          <ReportFeed />
        </div>
      </div>
      {/* Child routes (for pages that need full-screen overlay, not the feed panel) */}
      {children}
    </div>
  )
}
