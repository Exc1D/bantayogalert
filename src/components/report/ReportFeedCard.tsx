import { useMemo } from 'react'
import type { Report } from '@/types/report'
import { Severity } from '@/types/report'
import { WORKFLOW_TO_PUBLIC_STATUS } from '@/types/status'
import { getMunicipality } from '@/lib/geo/municipality'
import { INCIDENT_TYPE_COMPONENTS } from '@/lib/icons/incidentIcons'

// D-151 severity colors — backed by DESIGN.md §3.3 CSS custom properties
const SEVERITY_COLORS: Record<Severity, { bg: string; text: string; dot: string }> = {
  [Severity.Critical]: { bg: 'bg-severity-critical', text: 'text-severity-critical', dot: 'bg-severity-critical' },
  [Severity.High]: { bg: 'bg-severity-high', text: 'text-severity-high', dot: 'bg-severity-high' },
  [Severity.Medium]: { bg: 'bg-severity-medium', text: 'text-severity-medium', dot: 'bg-severity-medium' },
  [Severity.Low]: { bg: 'bg-severity-low', text: 'text-severity-low', dot: 'bg-severity-low' },
}

function formatRelativeTime(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(isoDate).toLocaleDateString()
}

interface ReportFeedCardProps {
  report: Report
  onClick?: (report: Report) => void
  isSelected?: boolean
  compact?: boolean
}

export function ReportFeedCard({ report, onClick, isSelected = false, compact = false }: ReportFeedCardProps) {
  const municipality = useMemo(
    () => getMunicipality(report.municipalityCode),
    [report.municipalityCode]
  )
  const severityStyle = SEVERITY_COLORS[report.severity]
  const IncidentIcon = INCIDENT_TYPE_COMPONENTS[report.type] ?? INCIDENT_TYPE_COMPONENTS.other
  const publicStatus = WORKFLOW_TO_PUBLIC_STATUS[report.workflowState]
  const typeLabel = report.type?.replace('_', ' ') ?? 'Unknown'

  return (
    <button
      onClick={() => onClick?.(report)}
      className={`w-full text-left px-3 py-2 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
        isSelected ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
      }`}
      aria-label={`${typeLabel} report in ${municipality?.name ?? report.municipalityCode}`}
    >
      {compact ? (
        <div className="flex items-center gap-2 h-10">
          <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${severityStyle.dot}`} />
          <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
            {typeLabel}
          </span>
          <span className="text-xs text-neutral-500 dark:text-neutral-400 truncate flex-1">
            {municipality?.name ?? report.municipalityCode}
          </span>
          <span className="text-xs text-neutral-400 flex-shrink-0">{formatRelativeTime(report.createdAt)}</span>
        </div>
      ) : (
        <div className="flex items-center gap-3 h-[72px]">
          {/* Severity dot + type icon */}
          <div className="flex flex-col items-center gap-0.5 w-8 flex-shrink-0">
            <IncidentIcon className="w-5 h-5" aria-hidden="true" />
            <span className={`w-2.5 h-2.5 rounded-full ${severityStyle.dot}`} aria-hidden="true" />
          </div>

          {/* Main info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100 capitalize">
                {typeLabel}
              </span>
              <span className={`text-xs px-1.5 py-0.5 rounded ${severityStyle.bg} text-white capitalize`} aria-label={`Severity: ${report.severity}`}>
                {report.severity}
              </span>
            </div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 truncate">
              {municipality?.name ?? report.municipalityCode}
            </div>
          </div>

          {/* Time + status */}
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            <span className="text-xs text-neutral-400">{formatRelativeTime(report.createdAt)}</span>
            <span className={`text-xs ${severityStyle.text} font-medium`}>
              {publicStatus}
            </span>
          </div>
        </div>
      )}
    </button>
  )
}
