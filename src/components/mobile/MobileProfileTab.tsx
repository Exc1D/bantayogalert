import { useState } from 'react'
import { ReportTracker } from '../profile/ReportTracker'
import { useAuth } from '../../contexts/AuthContext'
import { RoleGate } from '../auth/RoleGate'

interface MobileProfileTabProps {
  onReportPress?: (reportId: string) => void
}

function getRoleBadgeColor(role: string | null): string {
  switch (role) {
    case 'provincial_superadmin':
      return 'bg-purple-100 text-purple-800'
    case 'municipal_admin':
      return 'bg-blue-100 text-blue-800'
    case 'citizen':
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

function getRoleLabel(role: string | null): string {
  switch (role) {
    case 'provincial_superadmin':
      return 'Provincial Admin'
    case 'municipal_admin':
      return 'Municipal Admin'
    case 'citizen':
    default:
      return 'Citizen'
  }
}

function getAvatarColor(name: string | null): string {
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-orange-500',
    'bg-pink-500',
    'bg-teal-500',
  ]
  if (!name) return colors[0]!
  const index = name.charCodeAt(0) % colors.length
  return colors[index]!
}

export function MobileProfileTab({ onReportPress }: MobileProfileTabProps) {
  const { user, signOut } = useAuth()
  const [pushEnabled, setPushEnabled] = useState(true)
  const [municipalAlerts, setMunicipalAlerts] = useState(true)
  const [provinceAlerts, setProvinceAlerts] = useState(true)

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (err) {
      console.error('Sign out failed:', err)
    }
  }

  if (!user) {
    return (
      <div className="flex flex-col h-full bg-gray-50 items-center justify-center">
        <p className="text-gray-500">Not signed in</p>
      </div>
    )
  }

  const initial = user.displayName?.charAt(0).toUpperCase() ?? user.email?.charAt(0).toUpperCase() ?? '?'

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <h1 className="text-lg font-bold text-gray-900">Profile</h1>
      </div>

      <div className="flex-1 overflow-auto">
        {/* User Info Card */}
        <div className="p-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-4">
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold ${getAvatarColor(
                  user.displayName
                )}`}
              >
                {initial}
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-gray-900">
                  {user.displayName ?? 'Unknown User'}
                </h2>
                <p className="text-sm text-gray-500">{user.email}</p>
                <span
                  className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium mt-1 ${getRoleBadgeColor(
                    user.role
                  )}`}
                >
                  {getRoleLabel(user.role)}
                </span>
              </div>
            </div>
            {user.municipality && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Municipality</p>
                <p className="text-sm font-medium text-gray-900 capitalize">
                  {user.municipality.replace('_', ' ')}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Report Tracker */}
        <div className="px-4 pb-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Your Reports</h3>
            </div>
            <div className="p-4">
              <ReportTracker onReportPress={onReportPress} />
            </div>
          </div>
        </div>

        {/* Notification Preferences */}
        <div className="px-4 pb-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Notification Preferences</h3>
            </div>
            <div className="divide-y divide-gray-100">
              <label className="flex items-center justify-between px-4 py-3 hover:bg-gray-50">
                <span className="text-sm text-gray-700">Push Notifications</span>
                <input
                  type="checkbox"
                  checked={pushEnabled}
                  onChange={(e) => setPushEnabled(e.target.checked)}
                  className="w-5 h-5 rounded text-blue-500 focus:ring-blue-500"
                />
              </label>
              <label className="flex items-center justify-between px-4 py-3 hover:bg-gray-50">
                <span className="text-sm text-gray-700">Municipal Alerts</span>
                <input
                  type="checkbox"
                  checked={municipalAlerts}
                  onChange={(e) => setMunicipalAlerts(e.target.checked)}
                  className="w-5 h-5 rounded text-blue-500 focus:ring-blue-500"
                />
              </label>
              <label className="flex items-center justify-between px-4 py-3 hover:bg-gray-50">
                <span className="text-sm text-gray-700">Province-wide Alerts</span>
                <input
                  type="checkbox"
                  checked={provinceAlerts}
                  onChange={(e) => setProvinceAlerts(e.target.checked)}
                  className="w-5 h-5 rounded text-blue-500 focus:ring-blue-500"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Admin Panel Access */}
        <RoleGate roles={['municipal_admin', 'provincial_superadmin']}>
          <div className="px-4 pb-4">
            <div className="bg-blue-50 rounded-xl border border-blue-100 p-4">
              <h3 className="font-semibold text-blue-900 mb-1">Admin Access</h3>
              <p className="text-sm text-blue-700 mb-3">
                Access the admin panel for report management
              </p>
              <button
                className="w-full py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors"
                onClick={() => {
                  // TODO: Navigate to admin panel
                  console.log('Navigate to admin panel')
                }}
              >
                Open Admin Panel
              </button>
            </div>
          </div>
        </RoleGate>

        {/* Sign Out */}
        <div className="px-4 pb-8">
          <button
            onClick={handleSignOut}
            className="w-full py-3 border border-red-300 text-red-600 rounded-xl font-medium hover:bg-red-50 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  )
}
