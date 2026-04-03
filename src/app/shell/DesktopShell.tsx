import { useEffect, useState, type ReactNode } from 'react'
import { MapContainerWrapper } from './MapContainerWrapper'
import { WorkspaceDrawer } from './WorkspaceDrawer'

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

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <NavRail />
      <div className="flex-1 relative overflow-hidden">
        <MapContainerWrapper>
          <WorkspaceDrawer />
        </MapContainerWrapper>
        {/* Child routes render here, overlaid on map */}
        {children}
      </div>
    </div>
  )
}
