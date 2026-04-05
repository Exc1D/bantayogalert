import { useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { type Report, Severity } from '@/types/report'
import { WORKFLOW_TO_PUBLIC_STATUS } from '@/types/status'
import { getMunicipality } from '@/lib/geo/municipality'
import { REPORTS_QUERY_KEY } from '@/hooks/useVerifiedReportsListener'

const SEVERITY_STYLES: Record<Severity, { bg: string; text: string; border: string }> = {
  [Severity.Critical]: { bg: 'bg-severity-criticalBg', text: 'text-severity-critical', border: 'border-severity-criticalBorder' },
  [Severity.High]: { bg: 'bg-severity-highBg', text: 'text-severity-high', border: 'border-severity-highBorder' },
  [Severity.Medium]: { bg: 'bg-severity-mediumBg', text: 'text-severity-medium', border: 'border-severity-mediumBorder' },
  [Severity.Low]: { bg: 'bg-severity-lowBg', text: 'text-severity-low', border: 'border-severity-lowBorder' },
}

const TYPE_LABELS: Record<string, string> = {
  flood: 'Flood',
  landslide: 'Landslide',
  fire: 'Fire',
  earthquake: 'Earthquake',
  medical: 'Medical Emergency',
  vehicle_accident: 'Vehicle Accident',
  crime: 'Crime',
  other: 'Other Incident',
}

interface ReportDetailPanelProps {
  reportId: string
}

export function ReportDetailPanel({ reportId }: ReportDetailPanelProps) {
  const queryClient = useQueryClient()

  // Read from TanStack Query cache (populated by useVerifiedReportsListener)
  const { data: reports = [] } = useQuery<Report[]>({
    queryKey: REPORTS_QUERY_KEY,
    initialData: () => queryClient.getQueryData<Report[]>(REPORTS_QUERY_KEY) ?? [],
    staleTime: Infinity,
  })

  const report = useMemo(
    () => reports.find((r) => r.id === reportId),
    [reports, reportId]
  )

  if (!report) {
    return (
      <div className="p-4 text-center text-gray-500">
        <p className="text-sm">Report not found</p>
      </div>
    )
  }

  const municipality = getMunicipality(report.municipalityCode)
  const severityStyle = SEVERITY_STYLES[report.severity]
  const publicStatus = WORKFLOW_TO_PUBLIC_STATUS[report.workflowState]

  return (
    <div className="flex flex-col h-full">
      {/* Header: severity badge + type + status */}
      <div className={`p-4 border-b ${severityStyle.border} ${severityStyle.bg}`}>
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {TYPE_LABELS[report.type] ?? report.type}
            </h2>
            <p className="text-sm text-gray-600 mt-0.5">
              {municipality?.name ?? report.municipalityCode}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${severityStyle.bg} ${severityStyle.text} border ${severityStyle.border}`}>
              {report.severity.toUpperCase()}
            </span>
            <span className="text-xs text-gray-500">{publicStatus}</span>
          </div>
        </div>
      </div>

      {/* Body: scrollable */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Description */}
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Description</h3>
          <p className="text-sm text-gray-700">{report.description}</p>
        </div>

        {/* Location */}
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Location</h3>
          <p className="text-sm text-gray-700">
            {municipality?.name ?? report.municipalityCode}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {report.location.lat.toFixed(5)}, {report.location.lng.toFixed(5)}
          </p>
        </div>

        {/* Media thumbnails */}
        {report.mediaUrls && report.mediaUrls.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Photos</h3>
            <div className="flex gap-2 flex-wrap">
              {report.mediaUrls.map((url, i) => (
                <img
                  key={i}
                  src={url}
                  alt={`Report photo ${i + 1}`}
                  className="w-20 h-20 object-cover rounded border border-gray-200"
                  loading="lazy"
                />
              ))}
            </div>
          </div>
        )}

        {/* Timestamps */}
        <div className="text-xs text-gray-400 space-y-0.5 pt-2 border-t border-gray-100">
          <p>Reported: {new Date(report.createdAt).toLocaleString()}</p>
          <p>Updated: {new Date(report.updatedAt).toLocaleString()}</p>
        </div>
      </div>
    </div>
  )
}
