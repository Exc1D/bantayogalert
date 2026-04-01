import { NavRail } from './NavRail'
import { RightModal } from './RightModal'

// MapCanvas placeholder - Phase 4
function MapCanvas() {
  return (
    <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
      <p className="text-gray-400">MapCanvas — Phase 4</p>
    </div>
  )
}

{/* Phase 4: Replace with full DesktopShell implementation */}
export function DesktopShell() {
  return (
    <div className="flex h-screen">
      <NavRail />
      <main className="flex-1 relative overflow-hidden">
        {/* MapCanvas is ALWAYS mounted here — never inside the modal */}
        <MapCanvas />
        {/* RightModal is a sibling to MapCanvas, not a child */}
        <RightModal />
      </main>
    </div>
  )
}
