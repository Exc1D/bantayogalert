/**
 * ReportDetailOwner - Owner view of a report from report_private collection
 * Shows: exact location, full activity timeline, owner status
 * Props: reportId: string
 */
import { useEffect, useState } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { getFirestore } from 'firebase/firestore'
import { MapPinIcon } from 'lucide-react'
import { OWNER_STATUS_LABELS } from '@/types/status'
import { ReportStatus, type ReportPrivate } from '@/types/report'
import { StatusTimeline, StatusTimelineSkeleton } from '@/components/report/StatusTimeline'

interface ReportDetailOwnerProps {
  reportId: string
}

const STATUS_BADGE_COLORS: Record<ReportStatus, string> = {
  [ReportStatus.Submitted]: 'bg-status-submittedBg text-status-submitted',
  [ReportStatus.UnderReview]: 'bg-status-underReviewBg text-status-underReview',
  [ReportStatus.Verified]: 'bg-status-verifiedBg text-status-verified',
  [ReportStatus.Rejected]: 'bg-status-rejectedBg text-status-rejected',
  [ReportStatus.Dispatched]: 'bg-status-dispatchedBg text-status-dispatched',
  [ReportStatus.Acknowledged]: 'bg-status-inProgressBg text-status-inProgress',
  [ReportStatus.InProgress]: 'bg-status-inProgressBg text-status-inProgress',
  [ReportStatus.Resolved]: 'bg-status-resolvedBg text-status-resolved',
}

function getStatusBadgeColor(status: ReportStatus): string {
  return STATUS_BADGE_COLORS[status] ?? STATUS_BADGE_COLORS[ReportStatus.UnderReview]
}

function formatRelativeTime(isoString: string): string {
  if (!isoString) return 'Unknown'
  const date = new Date(isoString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSecs < 60) return 'Just now'
  if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`
  return date.toLocaleDateString()
}

export function ReportDetailOwner({ reportId }: ReportDetailOwnerProps) {
  const [reportPrivate, setReportPrivate] = useState<ReportPrivate | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!reportId) return

    const db = getFirestore()
    const ref = doc(db, 'report_private', reportId)
    const unsubscribe = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          setReportPrivate({ id: snap.id, ...snap.data() } as ReportPrivate)
        } else {
          setError('Report not found')
        }
        setLoading(false)
      },
      (err) => {
        console.error('Error listening to report_private:', err)
        setError('Failed to load report')
        setLoading(false)
      }
    )

    return unsubscribe
  }, [reportId])

  if (loading) {
    return (
      <div className="p-4 space-y-4" aria-label="Loading report details">
        <StatusTimelineSkeleton />
      </div>
    )
  }

  if (error || !reportPrivate) {
    return (
      <div className="p-4 text-center">
        <p className="text-sm text-severity-critical">{error ?? 'Report not found'}</p>
      </div>
    )
  }

  const statusLabel = OWNER_STATUS_LABELS[reportPrivate.ownerStatus] ?? 'Unknown'
  const statusColor = getStatusBadgeColor(reportPrivate.ownerStatus)

  return (
    <div className="flex flex-col h-full">
      {/* Header: owner status badge + report ID */}
      <div className="p-4 border-b border-neutral-200 dark:border-neutral-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-neutral-800 dark:to-neutral-800">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Your Report</h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 font-mono mt-0.5">{reportId}</p>
          </div>
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusColor}`}
          >
            {statusLabel}
          </span>
        </div>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Submitted {reportPrivate.activityLog?.[0]?.performedAt
            ? formatRelativeTime(reportPrivate.activityLog[0].performedAt)
            : 'just now'}
        </p>
      </div>

      {/* Body: scrollable */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Exact Location */}
        {reportPrivate.exactLocation && (
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <MapPinIcon className="w-4 h-4 text-red-500" />
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Exact Location
              </h3>
            </div>
            <p className="text-sm font-medium text-gray-900 mb-1">
              {reportPrivate.exactLocation.lat.toFixed(6)}, {reportPrivate.exactLocation.lng.toFixed(6)}
            </p>
            <p className="text-xs text-gray-400">
              Precise coordinates visible only to you
            </p>
          </div>
        )}

        {/* Reporter Info */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Reporter
          </h3>
          <div className="space-y-1 text-sm">
            <p className="text-gray-900 font-medium">{reportPrivate.reporterName}</p>
            <p className="text-gray-500">{reportPrivate.reporterEmail}</p>
          </div>
        </div>

        {/* Priority (if set) */}
        {reportPrivate.priority && (
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Priority Level
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-gray-900">
                {reportPrivate.priority}
              </span>
              <span className="text-sm text-gray-500">/ 5</span>
            </div>
          </div>
        )}

        {/* Status Timeline */}
        <StatusTimeline currentStatus={reportPrivate.ownerStatus} activityLog={reportPrivate.activityLog} />

        {/* Internal Notes (if any) */}
        {reportPrivate.internalNotes && (
          <div className="bg-amber-50 rounded-xl border border-amber-200 p-4">
            <h3 className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-2">
              Internal Notes
            </h3>
            <p className="text-sm text-amber-800">{reportPrivate.internalNotes}</p>
          </div>
        )}
      </div>
    </div>
  )
}
