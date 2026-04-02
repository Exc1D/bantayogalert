import { useState } from 'react'
import { useReports } from '../../contexts/ReportsContext'
import { useAuth } from '../../contexts/AuthContext'
import type { SeverityLevel } from '../../contexts/ReportsContext'
import { Card } from '../common/Card'
import { Badge } from '../common/Badge'
import { getMunicipalityName } from '../../data/municipalities'

/**
 * TriagePanel - shows all pending reports for admin review.
 * Municipal admins see only their municipality.
 * Provincial superadmins see all.
 */
export function TriagePanel() {
  const { reports } = useReports()
  const { user } = useAuth()
  const [selectedId, setSelectedId] = useState<string | null>(null)

  // Filter: municipal admins see only their municipality
  const scopedReports = reports.filter((r) => {
    if (!user) return false
    if (user.role === 'provincial_superadmin') return true
    if (user.role === 'municipal_admin') return r.municipality === user.municipality
    return false
  })

  // Group by status
  const byStatus = scopedReports.reduce<Record<string, typeof scopedReports>>((acc, r) => {
    const s = r.status ?? 'pending'
    if (!acc[s]) acc[s] = []
    acc[s].push(r)
    return acc
  }, {})

  const statuses = ['pending', 'verified', 'dispatched', 'acknowledged', 'in_progress', 'resolved', 'rejected'] as const

  const SEVERITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 } as const

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Report Triage</h2>
        <span className="text-sm text-gray-500">{scopedReports.length} total</span>
      </div>

      {scopedReports.length === 0 ? (
        <Card>
          <p className="text-center text-gray-500 py-4">No reports to triage</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {statuses.map((status) => {
            const items = byStatus[status] ?? []
            if (items.length === 0) return null

            const sorted = [...items].sort(
              (a, b) => (SEVERITY_ORDER[a.severity as SeverityLevel] ?? 4) - (SEVERITY_ORDER[b.severity as SeverityLevel] ?? 4)
            )

            return (
              <div key={status}>
                <h3 className="text-sm font-semibold text-gray-600 uppercase mb-2 flex items-center gap-2">
                  {status.replace('_', ' ')}
                  <Badge variant="info">{items.length}</Badge>
                </h3>
                <div className="space-y-1">
                  {sorted.map((report) => (
                    <Card
                      key={report.id}
                      onClick={() => setSelectedId(report.id === selectedId ? null : report.id)}
                      className={`cursor-pointer transition-shadow ${
                        selectedId === report.id ? 'ring-2 ring-primary-400' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full flex-shrink-0 ${
                            report.severity === 'critical'
                              ? 'bg-red-500'
                              : report.severity === 'high'
                              ? 'bg-orange-500'
                              : report.severity === 'medium'
                              ? 'bg-yellow-500'
                              : 'bg-green-500'
                          }`}
                        />
                        <span className="text-sm truncate flex-1">{report.title || `${report.type} report`}</span>
                        <span className="text-xs text-gray-400 flex-shrink-0">
                          {getMunicipalityName(report.municipality as Parameters<typeof getMunicipalityName>[0])}
                        </span>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
