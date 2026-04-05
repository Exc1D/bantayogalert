import { useMemo } from 'react'
import type { AdminQueueReport } from '@/hooks/useAdminQueueListener'
import type { Severity } from '@/types/report'
import { getMunicipality } from '@/lib/geo/municipality'
import { getIncidentIcon } from '@/lib/icons/incidentIcons'

const SEVERITY_COLORS: Record<Severity, { bg: string; dot: string }> = {
  critical: { bg: 'bg-severity-critical', dot: 'bg-severity-critical' },
  high: { bg: 'bg-severity-high', dot: 'bg-severity-high' },
  medium: { bg: 'bg-severity-medium', dot: 'bg-severity-medium' },
  low: { bg: 'bg-severity-low', dot: 'bg-severity-low' },
}

const PRIORITY_DOT: Record<number, string> = {
  1: 'bg-red-500',
  2: 'bg-orange-400',
  3: 'bg-yellow-400',
  4: 'bg-blue-400',
  5: 'bg-gray-400',
}

const WORKFLOW_STATE_BADGE: Record<string, { bg: string; label: string }> = {
  pending: { bg: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
  verified: { bg: 'bg-blue-100 text-blue-800', label: 'Verified' },
  dispatched: { bg: 'bg-purple-100 text-purple-800', label: 'Dispatched' },
  acknowledged: { bg: 'bg-indigo-100 text-indigo-800', label: 'Acknowledged' },
  in_progress: { bg: 'bg-orange-100 text-orange-800', label: 'In Progress' },
  resolved: { bg: 'bg-green-100 text-green-800', label: 'Resolved' },
  rejected: { bg: 'bg-gray-100 text-gray-600', label: 'Rejected' },
}

function formatRelativeTime(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d`
  return new Date(isoDate).toLocaleDateString()
}

interface AdminQueueCardProps {
  report: AdminQueueReport
  onClick?: (report: AdminQueueReport) => void
  isSelected?: boolean
}

export function AdminQueueCard({
  report,
  onClick,
  isSelected = false,
}: AdminQueueCardProps) {
  const municipality = useMemo(
    () => getMunicipality(report.municipalityCode),
    [report.municipalityCode]
  )
  const severityStyle = SEVERITY_COLORS[report.severity]
  const IncidentIcon = getIncidentIcon(report.type)
  const stateBadge = WORKFLOW_STATE_BADGE[report.workflowState] ?? { bg: 'bg-gray-100 text-gray-600', label: report.workflowState }
  const priorityDot = report.priority ? PRIORITY_DOT[report.priority] : null

  return (
    <button
      onClick={() => onClick?.(report)}
      className={`w-full text-left px-3 py-2 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
        isSelected ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
      }`}
      aria-label={`${report.type} report in ${municipality?.name ?? report.municipalityCode}`}
    >
      <div className="flex items-center gap-3 h-[72px]">
        {/* Left: type icon + severity dot */}
        <div className="flex flex-col items-center gap-0.5 w-8 flex-shrink-0">
          <IncidentIcon className="w-5 h-5" aria-hidden="true" />
          <span className={`w-2.5 h-2.5 rounded-full ${severityStyle.dot}`} />
        </div>

        {/* Center: type + municipality + barangay + relative time */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-900 capitalize">
              {report.type.replace('_', ' ')}
            </span>
            <span className={`text-xs px-1.5 py-0.5 rounded ${stateBadge.bg}`}>
              {stateBadge.label}
            </span>
          </div>
          <div className="text-xs text-gray-500 mt-0.5 truncate">
            {municipality?.name ?? report.municipalityCode}
            {report.barangayCode ? ` · ${report.barangayCode}` : ''}
          </div>
        </div>

        {/* Right: priority dot + time */}
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <span className="text-xs text-gray-400">
            {formatRelativeTime(report.createdAt)}
          </span>
          {priorityDot && (
            <span
              className={`w-2.5 h-2.5 rounded-full ${priorityDot}`}
              title={`Priority ${report.priority}`}
            />
          )}
        </div>
      </div>
    </button>
  )
}
