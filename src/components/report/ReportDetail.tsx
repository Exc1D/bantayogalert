import { useState, useEffect } from 'react'
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore'
import { Timestamp } from 'firebase/firestore'
import { useReports } from '../../contexts/ReportsContext'
import { useAuth } from '../../contexts/AuthContext'
import { updateReportStatus, ReportStatus, ReportActivityEntry } from '../../services/reportService'
import { getFirebaseFirestore } from '../../config/firebase'
import { getMunicipalityName } from '../../data/municipalities'
import { Button } from '../common/Button'
import { Badge } from '../common/Badge'
import { Spinner } from '../common/Spinner'
import { Toast } from '../common/Toast'
import { RoleGate } from '../auth/RoleGate'

const REPORT_TYPE_ICONS: Record<string, string> = {
  flood: '🌊',
  landslide: '⛰️',
  fire: '🔥',
  earthquake: '🌍',
  medical: '🏥',
  crime: '🚨',
  infrastructure: '🏗️',
  other: '📌',
}

const SEVERITY_VARIANT: Record<string, 'danger' | 'warning' | 'info' | 'success'> = {
  critical: 'danger',
  high: 'warning',
  medium: 'info',
  low: 'success',
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  verified: 'Verified',
  rejected: 'Rejected',
  dispatched: 'Dispatched',
  acknowledged: 'Acknowledged',
  in_progress: 'In Progress',
  resolved: 'Resolved',
}

// Admin status actions available to municipal_admin and provincial_superadmin
const ADMIN_ACTIONS: { label: string; status: ReportStatus; variant: 'primary' | 'secondary' | 'danger' }[] = [
  { label: 'Verify', status: 'verified', variant: 'primary' },
  { label: 'Reject', status: 'rejected', variant: 'danger' },
  { label: 'Dispatch', status: 'dispatched', variant: 'primary' },
  { label: 'Acknowledge', status: 'acknowledged', variant: 'secondary' },
  { label: 'In Progress', status: 'in_progress', variant: 'secondary' },
  { label: 'Resolve', status: 'resolved', variant: 'primary' },
]

function formatDate(timestamp: Timestamp | undefined): string {
  if (!timestamp) return 'Unknown'
  return timestamp.toDate().toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatRelativeTime(timestamp: Timestamp | undefined): string {
  if (!timestamp) return 'Unknown'
  const now = Date.now()
  const then = timestamp.toDate().getTime()
  const diffMs = now - then
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)
  if (diffDay > 0) return `${diffDay}d ago`
  if (diffHour > 0) return `${diffHour}h ago`
  if (diffMin > 0) return `${diffMin}m ago`
  return 'Just now'
}

interface ReportDetailProps {
  reportId: string
}

export function ReportDetail({ reportId }: ReportDetailProps) {
  const { reports } = useReports()
  const { user } = useAuth()
  const [activity, setActivity] = useState<ReportActivityEntry[]>([])
  const [loadingActivity, setLoadingActivity] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'info' | 'success' | 'error' } | null>(null)
  const [processing, setProcessing] = useState(false)

  const report = reports.find((r) => r.id === reportId)

  // Subscribe to activity subcollection
  useEffect(() => {
    if (!reportId) return
    setLoadingActivity(true)

    const db = getFirebaseFirestore()
    const activityRef = collection(db, 'reports', reportId, 'activity')
    const q = query(activityRef, orderBy('timestamp', 'desc'))

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const entries: ReportActivityEntry[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<ReportActivityEntry, 'id'>),
        }))
        setActivity(entries)
        setLoadingActivity(false)
      },
      (err) => {
        console.error('Error fetching activity:', err)
        setLoadingActivity(false)
      }
    )

    return unsubscribe
  }, [reportId])

  const showToast = (message: string, type: 'info' | 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  const handleStatusAction = async (status: ReportStatus, label: string) => {
    if (!user || !report) return
    setProcessing(true)
    try {
      await updateReportStatus(reportId, status, user.uid, user.role ?? 'citizen', user.municipality ?? null)
      showToast(`Report ${label.toLowerCase()}d successfully`, 'success')
    } catch (err) {
      console.error('Error updating status:', err)
      showToast('Failed to update report status', 'error')
    } finally {
      setProcessing(false)
    }
  }

  if (!report) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500">Report not found</p>
      </div>
    )
  }

  const icon = REPORT_TYPE_ICONS[report.type] ?? '📌'
  const severityVariant = SEVERITY_VARIANT[report.severity] ?? 'info'
  const municipalityName = getMunicipalityName(report.municipality as Parameters<typeof getMunicipalityName>[0])

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-2xl flex-shrink-0">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-semibold">{report.title || `${report.type} report`}</h2>
          <div className="flex flex-wrap gap-2 mt-1">
            <Badge variant={severityVariant}>{report.severity}</Badge>
            {report.status && (
              <Badge variant="info">{STATUS_LABELS[report.status] ?? report.status}</Badge>
            )}
          </div>
        </div>
      </div>

      {/* Location */}
      <div className="text-sm text-gray-600">
        <span className="font-medium">📍</span> {municipalityName}
        {report.barangay ? `, ${report.barangay}` : ''}
      </div>

      {/* Description */}
      {report.description && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-1">Description</h3>
          <p className="text-sm text-gray-600 whitespace-pre-wrap">{report.description}</p>
        </div>
      )}

      {/* Reporter info */}
      <div className="text-sm text-gray-500">
        <p>
          Reported by <span className="font-medium text-gray-700">{report.reportedByName ?? 'Unknown'}</span>
        </p>
        <p>{formatDate(report.reportedAt)}</p>
      </div>

      {/* Media */}
      {report.mediaUrls && report.mediaUrls.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Attached Media</h3>
          <div className="flex gap-2 flex-wrap">
            {report.mediaUrls.slice(0, 4).map((url, i) => (
              <img
                key={i}
                src={url}
                alt={`Media ${i + 1}`}
                className="w-20 h-20 object-cover rounded-lg border"
              />
            ))}
            {report.mediaUrls.length > 4 && (
              <div className="w-20 h-20 rounded-lg border bg-gray-50 flex items-center justify-center text-gray-400 text-sm">
                +{report.mediaUrls.length - 4} more
              </div>
            )}
          </div>
        </div>
      )}

      {/* Admin action buttons */}
      <RoleGate roles={['municipal_admin', 'provincial_superadmin']}>
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Admin Actions</h3>
          <div className="flex flex-wrap gap-2">
            {ADMIN_ACTIONS.map(({ label, status, variant }) => (
              <Button
                key={status}
                variant={variant}
                size="sm"
                disabled={processing || report.status === status}
                onClick={() => handleStatusAction(status, label)}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>
      </RoleGate>

      {/* Activity Timeline */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-2">Activity</h3>
        {loadingActivity ? (
          <Spinner size="sm" />
        ) : activity.length === 0 ? (
          <p className="text-xs text-gray-400">No activity recorded yet</p>
        ) : (
          <div className="space-y-2">
            {activity.map((entry) => (
              <div key={entry.id} className="flex gap-2 text-sm">
                <div className="flex-shrink-0 w-2 h-2 rounded-full bg-primary-400 mt-1.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-gray-700">
                    <span className="font-medium capitalize">{entry.performedByName ?? entry.performedBy}</span>
                    {' — '}
                    <span className="capitalize">{STATUS_LABELS[entry.action] ?? entry.action}</span>
                  </p>
                  {entry.notes && <p className="text-gray-500 text-xs">{entry.notes}</p>}
                  <p className="text-gray-400 text-xs">{formatRelativeTime(entry.timestamp)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  )
}
