import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { doc, getDoc } from 'firebase/firestore'
import { useAuth } from '../../../lib/auth/hooks'
import { updateUserProfile, logout } from '../../../lib/auth/operations'
import { db } from '@/lib/firebase/config'
import { UserRole, type NotificationPreferences } from '../../../types/user'
import { MyReportsList } from '@/components/profile/MyReportsList'

const ALERT_TYPE_OPTIONS = [
  { value: 'flood', label: 'Flood' },
  { value: 'landslide', label: 'Landslide' },
  { value: 'fire', label: 'Fire' },
  { value: 'earthquake', label: 'Earthquake' },
  { value: 'medical', label: 'Medical' },
  { value: 'all', label: 'All Alerts' },
] as const

export function ProfilePage() {
  const { user, customClaims, isLoading: authLoading } = useAuth()
  const navigate = useNavigate()

  const [displayName, setDisplayName] = useState('')
  const [pushEnabled, setPushEnabled] = useState(false)
  const [emailEnabled, setEmailEnabled] = useState(true)
  const [selectedAlertTypes, setSelectedAlertTypes] = useState<string[]>(['all'])
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle')
  const [saveError, setSaveError] = useState<string | null>(null)

  // Initialize form from auth state
  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '')
    }
  }, [user])

  // Load notification preferences from Firestore on mount
  useEffect(() => {
    if (!user) return

    const uid = user.uid

    async function loadPreferences() {
      try {
        const userDoc = await getDoc(doc(db, 'users', uid))
        if (userDoc.exists()) {
          const data = userDoc.data()
          if (data.notificationPreferences) {
            const prefs = data.notificationPreferences as NotificationPreferences
            setPushEnabled(prefs.pushEnabled ?? false)
            setEmailEnabled(prefs.emailEnabled ?? true)
            setSelectedAlertTypes(prefs.alertTypes ?? ['all'])
          }
        }
      } catch {
        // If Firestore read fails, defaults are already set
      }
    }

    loadPreferences()
  }, [user])

  async function handleSave(e: FormEvent) {
    e.preventDefault()
    setSaveStatus('saving')
    setSaveError(null)

    try {
      await updateUserProfile({
        displayName,
        notificationPreferences: {
          pushEnabled,
          emailEnabled,
          alertTypes: selectedAlertTypes as ('flood' | 'landslide' | 'fire' | 'earthquake' | 'medical' | 'all')[],
        },
      })
      setSaveStatus('success')
      setTimeout(() => setSaveStatus('idle'), 3000)
    } catch (err) {
      setSaveStatus('error')
      setSaveError(err instanceof Error ? err.message : 'Failed to save')
    }
  }

  async function handleSignOut() {
    await logout()
    navigate('/auth/login')
  }

  function handleAlertTypeChange(value: string, checked: boolean) {
    if (value === 'all') {
      setSelectedAlertTypes(checked ? ['all'] : [])
    } else {
      const newTypes = checked
        ? [...selectedAlertTypes.filter((t) => t !== 'all'), value]
        : selectedAlertTypes.filter((t) => t !== value)
      setSelectedAlertTypes(newTypes.length > 0 ? newTypes : ['all'])
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  if (!user) {
    navigate('/auth/login')
    return null
  }

  const roleLabel = {
    [UserRole.Citizen]: 'Citizen',
    [UserRole.MunicipalAdmin]: 'Municipal Admin',
    [UserRole.ProvincialSuperadmin]: 'Provincial Superadmin',
  }[customClaims?.role ?? UserRole.Citizen]

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Your Profile</h1>

            {/* Account Info (read-only) */}
            <div className="mb-6 pb-6 border-b border-gray-200">
              <h2 className="text-sm font-medium text-gray-500 uppercase mb-3">Account</h2>
              <div className="space-y-2">
                <div>
                  <span className="text-sm text-gray-500">Email:</span>
                  <span className="ml-2 text-sm text-gray-900">{user.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Role:</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {roleLabel}
                  </span>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Province:</span>
                  <span className="ml-2 text-sm text-gray-900">
                    {customClaims?.provinceCode ?? 'CMN'}
                  </span>
                </div>
              </div>
            </div>

            {/* Editable Profile */}
            <form onSubmit={handleSave} className="space-y-6">
              <div>
                <label htmlFor="displayName" className="block text-sm font-medium text-gray-700">
                  Display name
                </label>
                <input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="mt-1 block w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              {/* Notification Preferences */}
              <div>
                <h2 className="text-sm font-medium text-gray-700 uppercase mb-3">
                  Notification Preferences
                </h2>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <input
                      id="pushEnabled"
                      type="checkbox"
                      checked={pushEnabled}
                      onChange={(e) => setPushEnabled(e.target.checked)}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="pushEnabled" className="ml-2 block text-sm text-gray-700">
                      Enable push notifications
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      id="emailEnabled"
                      type="checkbox"
                      checked={emailEnabled}
                      onChange={(e) => setEmailEnabled(e.target.checked)}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="emailEnabled" className="ml-2 block text-sm text-gray-700">
                      Enable email notifications
                    </label>
                  </div>

                  <div className="pt-2">
                    <p className="text-sm text-gray-500 mb-2">Alert types:</p>
                    <div className="flex flex-wrap gap-3">
                      {ALERT_TYPE_OPTIONS.map((option) => (
                        <div key={option.value} className="flex items-center">
                          <input
                            id={`alert-${option.value}`}
                            type="checkbox"
                            checked={selectedAlertTypes.includes(option.value)}
                            onChange={(e) => handleAlertTypeChange(option.value, e.target.checked)}
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <label
                            htmlFor={`alert-${option.value}`}
                            className="ml-2 block text-sm text-gray-700"
                          >
                            {option.label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {saveError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
                  {saveError}
                </div>
              )}

              {saveStatus === 'success' && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-md text-sm text-green-700">
                  Profile updated successfully
                </div>
              )}

              <div className="flex items-center gap-4">
                <button
                  type="submit"
                  disabled={saveStatus === 'saving'}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saveStatus === 'saving' ? 'Saving...' : 'Save changes'}
                </button>
              </div>
            </form>

            {/* My Reports Section */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <MyReportsList
                onSelectReport={(reportId) => navigate(`/app/report/${reportId}`)}
              />
            </div>

            {/* Sign Out */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handleSignOut}
                className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
