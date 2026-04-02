import { useState, useEffect, useCallback } from 'react'
import { RoleGate } from '../auth/RoleGate'
import { AlertCard } from '../alerts/AlertCard'
import { AnnouncementForm } from '../announcements/AnnouncementForm'
import { getAnnouncements, Announcement } from '../../services/announcementService'
import { useAuth } from '../../contexts/AuthContext'

interface MobileAlertsTabProps {
  onAlertPress?: (announcementId: string) => void
  onCreateAnnouncement?: () => void
}

export function MobileAlertsTab({ onAlertPress: _onAlertPress, onCreateAnnouncement }: MobileAlertsTabProps) {
  const { user } = useAuth()
  const [alerts, setAlerts] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  const fetchAlerts = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getAnnouncements(user?.municipality ?? undefined)
      setAlerts(data)
    } catch (err) {
      console.error('Error fetching announcements:', err)
    } finally {
      setLoading(false)
    }
  }, [user?.municipality])

  useEffect(() => {
    fetchAlerts()
  }, [fetchAlerts])

  if (showForm) {
    return (
      <div className="flex flex-col h-full bg-white">
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-bold text-gray-900">Create Announcement</h1>
          <button
            onClick={() => setShowForm(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        <div className="flex-1 overflow-auto">
          <AnnouncementForm
            onSuccess={() => {
              setShowForm(false)
              fetchAlerts()
            }}
            onCancel={() => setShowForm(false)}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Alerts</h1>
          <p className="text-sm text-gray-500">Important announcements</p>
        </div>
        <RoleGate roles={['municipal_admin', 'provincial_superadmin']}>
          <button
            onClick={() => onCreateAnnouncement?.() ?? setShowForm(true)}
            className="w-10 h-10 bg-primary-500 text-white rounded-full flex items-center justify-center text-lg hover:bg-primary-600 active:scale-95 transition-all"
            aria-label="Create Announcement"
          >
            +
          </button>
        </RoleGate>
      </div>

      {/* Alerts list */}
      <div className="flex-1 overflow-auto p-4 space-y-3">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white h-24 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <span className="text-5xl mb-4">🔔</span>
            <h3 className="font-semibold text-gray-900 mb-1">No alerts yet</h3>
            <p className="text-sm text-gray-500">
              Important announcements will appear here
            </p>
          </div>
        ) : (
          alerts.map((alert) => {
            const severity = alert.severity === 'critical' ? 'danger' : alert.severity === 'warning' ? 'warning' : 'info'
            return (
              <AlertCard
                key={alert.id}
                id={alert.id}
                title={alert.title}
                message={alert.body}
                severity={severity}
                municipality={alert.scope === 'province' ? 'All municipalities' : alert.targetMunicipalities.join(', ')}
                createdAt={alert.createdAt?.toDate?.().toLocaleString() ?? 'Unknown'}
              />
            )
          })
        )}
      </div>
    </div>
  )
}
