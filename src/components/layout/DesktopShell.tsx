import { useEffect } from 'react'
import { NavRail } from './NavRail'
import { RightModal } from './RightModal'
import { useAuth } from '../../contexts/AuthContext'
import { useModal } from '../../contexts/ModalContext'

// MapCanvas placeholder - Phase 4
function MapCanvas() {
  return (
    <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
      <p className="text-gray-400">MapCanvas — Phase 4</p>
    </div>
  )
}

/**
 * DesktopShell - Role-aware desktop layout with map-first design.
 *
 * Routing based on user role (D-08):
 * - Citizens → Feed view
 * - municipal_admin → Admin panel
 * - provincial_superadmin → Admin panel (with province scope)
 *
 * The shell structure remains:
 * - NavRail on left (admin links gated by RoleGate)
 * - MapCanvas always mounted (never remounts on modal toggle)
 * - RightModal as sibling to MapCanvas
 */
export function DesktopShell() {
  const { user } = useAuth()
  const { open } = useModal()

  // Role-based default panel selection on mount
  useEffect(() => {
    if (!user) return

    switch (user.role) {
      case 'citizen':
        open('feed')
        break
      case 'municipal_admin':
      case 'provincial_superadmin':
        open('admin')
        break
      default:
        // Unknown role - no default panel
        break
    }
  }, [user, open])

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
