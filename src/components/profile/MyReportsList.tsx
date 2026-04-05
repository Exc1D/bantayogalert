import { useMyReports } from '@/hooks/useMyReports'
import { OWNER_STATUS_LABELS } from '@/types/status'
import { ReportStatus, type ActivityLogEntry } from '@/types/report'
import { AlertCircle, Clock, CheckCircle } from 'lucide-react'

interface MyReportsListProps {
  onSelectReport?: (reportId: string) => void
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

function getStatusIcon(status: ReportStatus) {
  switch (status) {
    case ReportStatus.Verified:
    case ReportStatus.Resolved:
      return <CheckCircle className="w-4 h-4" />
    case ReportStatus.Rejected:
      return <AlertCircle className="w-4 h-4" />
    default:
      return <Clock className="w-4 h-4" />
  }
}

function getLastActivity(log: ActivityLogEntry[]): string {
  if (!log || log.length === 0) return 'No activity'
  const lastEntry = log[log.length - 1]
  return lastEntry?.action ?? 'No activity'
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

function truncateId(id: string): string {
  if (id.length <= 12) return id
  return `${id.slice(0, 6)}...${id.slice(-4)}`
}

export function MyReportsList({ onSelectReport }: MyReportsListProps) {
  const { reports, loading } = useMyReports()

  if (loading) {
    return (
      <div className="space-y-3">
        <h2 className="text-lg font-medium text-gray-900">My Reports</h2>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="animate-pulse bg-white border border-gray-200 rounded-lg p-4"
          >
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-24" />
                <div className="h-3 bg-gray-200 rounded w-32" />
              </div>
              <div className="h-6 bg-gray-200 rounded w-20" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (reports.length === 0) {
    return (
      <div className="space-y-3">
        <h2 className="text-lg font-medium text-gray-900">My Reports</h2>
        <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
          <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No reports yet</p>
          <p className="text-sm text-gray-400 mt-1">
            When you submit a report, it will appear here
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-medium text-gray-900">My Reports</h2>
      <div className="space-y-2">
        {reports.map((report) => (
          <button
            key={report.id}
            type="button"
            onClick={() => onSelectReport?.(report.id)}
            className="w-full text-left bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-sm transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <code className="text-xs font-mono text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                    {truncateId(report.id)}
                  </code>
                  <span className="text-xs text-gray-400">
                    {formatRelativeTime(report.updatedAt)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-sm text-gray-600">
                  {getStatusIcon(report.ownerStatus)}
                  <span>{getLastActivity(report.activityLog)}</span>
                </div>
              </div>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(report.ownerStatus)}`}
              >
                {OWNER_STATUS_LABELS[report.ownerStatus]}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
