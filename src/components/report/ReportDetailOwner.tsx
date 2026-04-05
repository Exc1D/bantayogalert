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
import { ReportStatus, type ReportPrivate, type ActivityLogEntry } from '@/types/report'

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

function TimelineEntry({ entry, isLast }: { entry: ActivityLogEntry; isLast: boolean }) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className="w-2.5 h-2.5 rounded-full bg-primary-500 mt-1.5" />
        {!isLast && <div className="w-0.5 flex-1 bg-gray-200 mt-1 min-h-[2rem]" />}
      </div>
      <div className="flex-1 pb-4">
        <div className="text-sm font-medium text-gray-900">{entry.action}</div>
        <div className="text-xs text-gray-500 mt-0.5">
          {formatRelativeTime(entry.performedAt)} &middot; {entry.performedBy}
        </div>
        {entry.details && (
          <div className="text-sm text-gray-600 mt-1 bg-gray-50 rounded p-2 mt-1">
            {entry.details}
          </div>
        )}
      </div>
    </div>
  )
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
      <div className="flex items-center justify-center h-full min-h-[12rem]">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">Loading your report...</p>
        </div>
      </div>
    )
  }

  if (error || !reportPrivate) {
    return (
      <div className="p-4 text-center">
        <p className="text-sm text-red-500">{error ?? 'Report not found'}</p>
      </div>
    )
  }

  const statusLabel = OWNER_STATUS_LABELS[reportPrivate.ownerStatus] ?? 'Unknown'
  const statusColor = getStatusBadgeColor(reportPrivate.ownerStatus)

  return (
    <div className="flex flex-col h-full">
      {/* Header: owner status badge + report ID */}
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Your Report</h2>
            <p className="text-xs text-gray-500 font-mono mt-0.5">{reportId}</p>
          </div>
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusColor}`}
          >
            {statusLabel}
          </span>
        </div>
        <p className="text-sm text-gray-600">
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

        {/* Activity Timeline */}
        {reportPrivate.activityLog && reportPrivate.activityLog.length > 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
              Activity Timeline
            </h3>
            <div>
              {reportPrivate.activityLog.map((entry, i) => (
                <TimelineEntry
                  key={i}
                  entry={entry}
                  isLast={i === reportPrivate.activityLog.length - 1}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-500 text-center py-4">
              No activity recorded yet
            </p>
          </div>
        )}

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
