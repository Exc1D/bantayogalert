import { useEffect, useState, useRef } from 'react'
import { MapContainer } from 'react-leaflet'
import type L from 'leaflet'
import { WorkspaceDrawer } from './WorkspaceDrawer'

// Placeholder NavRail — implemented in Plan 04-02
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

export function DesktopShell() {
  const [mounted, setMounted] = useState(false)
  const mapRef = useRef<L.Map | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <NavRail />
      <div className="flex-1 relative overflow-hidden">
        <MapContainer
          ref={mapRef}
          center={[14.15, 122.9]}
          zoom={10}
          style={{ height: '100%', width: '100%' }}
        />
        <WorkspaceDrawer mapRef={mapRef} />
      </div>
    </div>
  )
}
