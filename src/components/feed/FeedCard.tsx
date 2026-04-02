import { Card } from '../common/Card'
import { Badge } from '../common/Badge'
import type { Report, ReportType, Severity } from '../../contexts/ReportsContext'
import { getMunicipalityName } from '../../data/municipalities'

const REPORT_TYPE_ICONS: Record<ReportType, string> = {
  flood: '🌊',
  landslide: '⛰️',
  fire: '🔥',
  earthquake: '🌍',
  medical: '🏥',
  crime: '🚨',
  infrastructure: '🏗️',
  other: '📌',
}

const SEVERITY_VARIANT: Record<Severity, 'danger' | 'warning' | 'info' | 'success'> = {
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

function formatRelativeTime(timestamp: { toDate: () => Date } | undefined): string {
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

interface FeedCardProps {
  report: Report
  onClick: () => void
}

export function FeedCard({ report, onClick }: FeedCardProps) {
  const icon = REPORT_TYPE_ICONS[report.type] ?? '📌'
  const severityVariant = SEVERITY_VARIANT[report.severity] ?? 'info'
  const municipalityName = getMunicipalityName(report.municipality as Parameters<typeof getMunicipalityName>[0])

  return (
    <Card onClick={onClick} className="hover:ring-2 hover:ring-primary-200 transition-shadow">
      <div className="flex gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-xl">
          {icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-medium text-sm truncate">{report.title || `${report.type} report`}</h3>
              <p className="text-xs text-gray-500">
                {municipalityName}
                {report.barangay ? `, ${report.barangay}` : ''}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1 flex-shrink-0">
              <Badge variant={severityVariant}>{report.severity}</Badge>
              {report.status && (
                <span className="text-xs text-gray-400">
                  {STATUS_LABELS[report.status] ?? report.status}
                </span>
              )}
            </div>
          </div>

          {/* Description */}
          {report.description && (
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">{report.description}</p>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-gray-400">
              {formatRelativeTime(report.reportedAt)}
            </span>
            {report.mediaUrls && report.mediaUrls.length > 0 && (
              <span className="text-xs text-gray-400 flex items-center gap-1">
                🖼️ {report.mediaUrls.length}
              </span>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}
