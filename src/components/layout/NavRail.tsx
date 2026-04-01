import { RoleGate } from '../auth/RoleGate'

/**
 * NavRail - Left navigation rail with role-aware visibility.
 *
 * Visible to all authenticated users:
 * - Feed, Map, Alerts, Profile
 *
 * Admin-only (municipal_admin, provincial_superadmin):
 * - Contacts
 */
export function NavRail() {
  return (
    <aside className="w-16 h-screen bg-white border-r border-gray-200 flex flex-col items-center py-4 gap-4">
      {/* Logo */}
      <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center text-white font-bold">
        BA
      </div>

      {/* Navigation items */}
      <nav className="flex-1 flex flex-col gap-2 mt-4">
        {/* Feed - visible to all */}
        <button
          className="w-10 h-10 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          aria-label="Feed"
        >
          📋
        </button>

        {/* Map - visible to all */}
        <button
          className="w-10 h-10 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          aria-label="Map"
        >
          📍
        </button>

        {/* Alerts - visible to all */}
        <button
          className="w-10 h-10 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          aria-label="Alerts"
        >
          🔔
        </button>

        {/* Profile - visible to all */}
        <button
          className="w-10 h-10 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          aria-label="Profile"
        >
          👤
        </button>

        {/* Contacts - admin only (D-08, D-10) */}
        <RoleGate roles={['municipal_admin', 'provincial_superadmin']}>
          <button
            className="w-10 h-10 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
            aria-label="Contacts"
          >
            👥
          </button>
        </RoleGate>
      </nav>

      {/* Settings - visible to all (opens profile modal) */}
      <div className="mt-auto">
        <button
          className="w-10 h-10 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100"
          aria-label="Settings"
        >
          ⚙️
        </button>
      </div>
    </aside>
  )
}
