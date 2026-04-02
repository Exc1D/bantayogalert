import { useState } from 'react'
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore'
import { Timestamp } from 'firebase/firestore'
import { useReports } from '../../contexts/ReportsContext'
import { useAuth } from '../../contexts/AuthContext'
import type { ReportStatus, ReportActivityEntry } from '../../contexts/ReportsContext'
import { getFirebaseFirestore } from '../../config/firebase'
import { Card } from '../common/Card'
import { Badge } from '../common/Badge'
import { Button } from '../common/Button'
import { Spinner } from '../common/Spinner'
import { Toast } from '../common/Toast'
import { RoleGate } from '../auth/RoleGate'
import { getMunicipalityName } from '../../data/municipalities'

// ─── Helpers ───────────────────────────────────────────────────────────────

const SEVERITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 } as const
const SEVERITY_COLOR: Record<string, string> = {
  critical: 'bg-red-500',
  high:     'bg-orange-500',
  medium:   'bg-yellow-500',
  low:      'bg-green-500',
}

const STATUS_LABELS: Record<string, string> = {
  pending:      'Pending',
  verified:     'Verified',
  rejected:     'Rejected',
  dispatched:   'Dispatched',
  acknowledged: 'Acknowledged',
  in_progress:  'In Progress',
  resolved:     'Resolved',
}

const REPORT_TYPE_ICONS: Record<string, string> = {
  flood:         '🌊',
  landslide:     '⛰️',
  fire:          '🔥',
  earthquake:    '🌍',
  medical:       '🏥',
  crime:         '🚨',
  infrastructure:'🏗️',
  other:         '📌',
}

// Valid next transitions from reportWorkflow.ts
const NEXT_ACTIONS: Record<ReportStatus, { label: string; status: ReportStatus; variant: 'primary' | 'secondary' | 'danger' }[]> = {
  pending:      [
    { label: 'Verify',  status: 'verified',     variant: 'primary'  },
    { label: 'Reject',  status: 'rejected',      variant: 'danger'   },
  ],
  verified:     [
    { label: 'Dispatch', status: 'dispatched',  variant: 'primary'  },
  ],
  dispatched:   [
    { label: 'Acknowledge', status: 'acknowledged', variant: 'secondary' },
  ],
  acknowledged: [
    { label: 'In Progress',  status: 'in_progress',  variant: 'secondary' },
  ],
  in_progress:  [
    { label: 'Resolve',     status: 'resolved',    variant: 'primary'  },
  ],
  rejected:     [],
  resolved:     [],
}

function formatRelativeTime(timestamp: Timestamp | undefined): string {
  if (!timestamp) return 'Unknown'
  const now = Date.now()
  const then = timestamp.toDate().getTime()
  const diffMs = now - then
  const diffSec = Math.floor(diffMs / 1_000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)
  if (diffDay > 0) return `${diffDay}d ago`
  if (diffHour > 0) return `${diffHour}h ago`
  if (diffMin > 0) return `${diffMin}m ago`
  return 'Just now'
}

// ─── Inline Report Detail ──────────────────────────────────────────────────

interface ReportDetailViewProps {
  report: ReturnType<typeof useReports>['reports'][number]
  onClose: () => void
}

function ReportDetailView({ report, onClose }: ReportDetailViewProps) {
  const { updateReportStatus } = useReports()
  const { user } = useAuth()
  const [activity, setActivity] = useState<ReportActivityEntry[]>([])
  const [loadingActivity, setLoadingActivity] = useState(true)
  const [toast, setToast] = useState<{ message: string; type: 'info' | 'success' | 'error' } | null>(null)
  const [processing, setProcessing] = useState(false)

  // Subscribe to activity subcollection
  useState(() => {
    const db = getFirebaseFirestore()
    const activityRef = collection(db, 'reports', report.id, 'activity')
    const q = query(activityRef, orderBy('timestamp', 'desc'))
    const unsub = onSnapshot(q, (snap) => {
      setActivity(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ReportActivityEntry, 'id'>) })))
      setLoadingActivity(false)
    })
    return unsub
  })

  const showToast = (message: string, type: 'info' | 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  const handleAction = async (status: ReportStatus, label: string) => {
    if (!user || !report) return
    setProcessing(true)
    try {
      await updateReportStatus(report.id, status, user.uid, user.role ?? 'citizen', user.municipality ?? null)
      showToast(`${label}d successfully`, 'success')
    } catch {
      showToast('Failed to update — check console', 'error')
    } finally {
      setProcessing(false)
    }
  }

  const icon = REPORT_TYPE_ICONS[report.type] ?? '📌'
  const municipalityName = getMunicipalityName(report.location?.municipality as Parameters<typeof getMunicipalityName>[0])

  return (
    <Card className="space-y-3">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-xl flex-shrink-0">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold">{report.title || `${report.type} report`}</h3>
          <div className="flex flex-wrap gap-1.5 mt-1">
            <Badge variant={report.severity === 'critical' ? 'danger' : report.severity === 'high' ? 'warning' : report.severity === 'medium' ? 'info' : 'success'}>
              {report.severity}
            </Badge>
            <Badge variant="info">{STATUS_LABELS[report.status] ?? report.status}</Badge>
          </div>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none px-1">✕</button>
      </div>

      {/* Location */}
      <div className="text-sm text-gray-600">
        📍 {municipalityName}{report.location?.barangay ? `, ${report.location.barangay}` : ''}
      </div>

      {/* Description */}
      {report.description && (
        <p className="text-sm text-gray-700 whitespace-pre-wrap">{report.description}</p>
      )}

      {/* Reporter */}
      <div className="text-xs text-gray-500">
        Reported by <span className="font-medium text-gray-700">{report.submitterAnonymous ? 'Anonymous' : report.submitterName}</span>
        {' · '}{formatRelativeTime(report.createdAt)}
      </div>

      {/* Activity timeline */}
      <div>
        <p className="text-xs font-medium text-gray-500 uppercase mb-1">Activity</p>
        {loadingActivity ? (
          <Spinner size="sm" />
        ) : activity.length === 0 ? (
          <p className="text-xs text-gray-400">No activity yet</p>
        ) : (
          <div className="space-y-1.5 max-h-32 overflow-y-auto">
            {activity.map((entry) => (
              <div key={entry.id} className="flex gap-1.5 text-xs">
                <div className="w-1.5 h-1.5 rounded-full bg-gray-300 mt-1.5 flex-shrink-0" />
                <div>
                  <span className="font-medium text-gray-700 capitalize">{entry.performedByName ?? entry.performedBy}</span>
                  {' — '}
                  <span className="capitalize text-gray-600">{STATUS_LABELS[entry.action] ?? entry.action}</span>
                  {entry.notes && <p className="text-gray-400">{entry.notes}</p>}
                  <p className="text-gray-300">{formatRelativeTime(entry.timestamp)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action buttons — admin only */}
      <RoleGate roles={['municipal_admin', 'provincial_superadmin']}>
        <div className="flex flex-wrap gap-1.5 pt-1 border-t">
          {NEXT_ACTIONS[report.status]?.map(({ label, status, variant }) => (
            <Button
              key={status}
              variant={variant}
              size="sm"
              disabled={processing}
              onClick={() => handleAction(status, label)}
            >
              {label}
            </Button>
          ))}
          {NEXT_ACTIONS[report.status]?.length === 0 && (
            <p className="text-xs text-gray-400 italic">No actions available — report is {STATUS_LABELS[report.status]}</p>
          )}
        </div>
      </RoleGate>

      {toast && <Toast message={toast.message} type={toast.type} />}
    </Card>
  )
}

// ─── Main TriagePanel ──────────────────────────────────────────────────────

export function TriagePanel() {
  const { reports } = useReports()
  const { user } = useAuth()
  const [selectedId, setSelectedId] = useState<string | null>(null)

  // Role-scoped reports
  const scopedReports = reports.filter((r) => {
    if (!user) return false
    if (user.role === 'provincial_superadmin') return true
    if (user.role === 'municipal_admin') return r.location?.municipality === user.municipality
    return false
  })

  // Group by status
  const byStatus = scopedReports.reduce<Record<string, typeof scopedReports>>((acc, r) => {
    const s = r.status ?? 'pending'
    if (!acc[s]) acc[s] = []
    acc[s].push(r)
    return acc
  }, {})

  const STATUSES: ReportStatus[] = [
    'pending', 'verified', 'dispatched', 'acknowledged', 'in_progress', 'resolved', 'rejected',
  ]

  const selectedReport = selectedId ? scopedReports.find((r) => r.id === selectedId) : null

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Report Triage</h2>
        <span className="text-sm text-gray-500">{scopedReports.length} total</span>
      </div>

      {scopedReports.length === 0 ? (
        <Card>
          <p className="text-center text-gray-500 py-6">No reports to triage</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {STATUSES.map((status) => {
            const items = byStatus[status] ?? []
            if (items.length === 0) return null

            const sorted = [...items].sort(
              (a, b) =>
                (SEVERITY_ORDER[a.severity as keyof typeof SEVERITY_ORDER] ?? 4) -
                (SEVERITY_ORDER[b.severity as keyof typeof SEVERITY_ORDER] ?? 4)
            )

            return (
              <div key={status}>
                <h3 className="text-sm font-semibold text-gray-600 uppercase mb-2 flex items-center gap-2">
                  {status === 'in_progress' ? 'In Progress' : STATUS_LABELS[status] ?? status}
                  <Badge variant="info">{items.length}</Badge>
                </h3>

                <div className="space-y-1">
                  {sorted.map((report) => {
                    const isSelected = selectedId === report.id
                    const icon = REPORT_TYPE_ICONS[report.type] ?? '📌'

                    return (
                      <div key={report.id} className="space-y-1">
                        {/* Report card */}
                        <Card
                          onClick={() => setSelectedId(isSelected ? null : report.id)}
                          className={`cursor-pointer transition-shadow ${
                            isSelected ? 'ring-2 ring-primary-400' : 'hover:shadow-md'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${SEVERITY_COLOR[report.severity] ?? 'bg-gray-300'}`} />
                            <span className="text-lg flex-shrink-0">{icon}</span>
                            <span className="text-sm truncate flex-1">
                              {report.title || `${report.type} report`}
                            </span>
                            <span className="text-xs text-gray-400 flex-shrink-0">
                              {getMunicipalityName(report.location?.municipality as Parameters<typeof getMunicipalityName>[0])}
                            </span>
                            <span className={`text-xs px-1.5 py-0.5 rounded flex-shrink-0 ${
                              report.severity === 'critical' ? 'bg-red-100 text-red-700' :
                              report.severity === 'high' ? 'bg-orange-100 text-orange-700' :
                              report.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-green-100 text-green-700'
                            }`}>
                              {report.severity}
                            </span>
                          </div>
                        </Card>

                        {/* Expanded inline detail */}
                        {isSelected && selectedReport && (
                          <ReportDetailView
                            report={selectedReport}
                            onClose={() => setSelectedId(null)}
                          />
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
