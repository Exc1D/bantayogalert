import { useMemo } from 'react'
import type { Report } from '@/types/report'
import { Severity } from '@/types/report'
import { WORKFLOW_TO_PUBLIC_STATUS } from '@/types/status'
import { getMunicipality } from '@/lib/geo/municipality'

// D-151 severity colors for badge
const SEVERITY_COLORS: Record<Severity, { bg: string; text: string; dot: string }> = {
  [Severity.Critical]: { bg: 'bg-red-600', text: 'text-red-600', dot: 'bg-red-600' },
  [Severity.High]: { bg: 'bg-orange-500', text: 'text-orange-500', dot: 'bg-orange-500' },
  [Severity.Medium]: { bg: 'bg-yellow-500', text: 'text-yellow-700', dot: 'bg-yellow-500' },
  [Severity.Low]: { bg: 'bg-green-500', text: 'text-green-600', dot: 'bg-green-500' },
}

const TYPE_ICONS: Record<string, string> = {
  flood: '💧',
  landslide: '🔺',
  fire: '🔥',
  earthquake: '⚡',
  medical: '➕',
  vehicle_accident: '🚗',
  crime: '🛡️',
  other: '❗',
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
}

export function ReportFeedCard({ report, onClick, isSelected = false }: ReportFeedCardProps) {
  const municipality = useMemo(
    () => getMunicipality(report.municipalityCode),
    [report.municipalityCode]
  )
  const severityStyle = SEVERITY_COLORS[report.severity]
  const typeIcon = TYPE_ICONS[report.type] ?? TYPE_ICONS.other
  const publicStatus = WORKFLOW_TO_PUBLIC_STATUS[report.workflowState]

  return (
    <button
      onClick={() => onClick?.(report)}
      className={`w-full text-left px-3 py-2 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
        isSelected ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
      }`}
      aria-label={`${report.type} report in ${municipality?.name ?? report.municipalityCode}`}
    >
      <div className="flex items-center gap-3 h-[72px]">
        {/* Severity dot + type icon */}
        <div className="flex flex-col items-center gap-0.5 w-8 flex-shrink-0">
          <span className="text-lg">{typeIcon}</span>
          <span className={`w-2.5 h-2.5 rounded-full ${severityStyle.dot}`} />
        </div>

        {/* Main info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-900 capitalize">
              {report.type.replace('_', ' ')}
            </span>
            <span className={`text-xs px-1.5 py-0.5 rounded ${severityStyle.bg} text-white capitalize`}>
              {report.severity}
            </span>
          </div>
          <div className="text-xs text-gray-500 mt-0.5 truncate">
            {municipality?.name ?? report.municipalityCode}
          </div>
        </div>

        {/* Time + status */}
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <span className="text-xs text-gray-400">{formatRelativeTime(report.createdAt)}</span>
          <span className={`text-xs ${severityStyle.text} font-medium`}>
            {publicStatus}
          </span>
        </div>
      </div>
    </button>
  )
}
