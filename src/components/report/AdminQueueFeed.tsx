import { useState, useMemo } from 'react'
import { useAuth } from '@/lib/auth/AuthProvider'
import {
  useAdminQueueListener,
  type AdminQueueReport,
  ADMIN_QUEUE_QUERY_KEY,
} from '@/hooks/useAdminQueueListener'
import { AdminQueueCard } from './AdminQueueCard'
import { useUIStore } from '@/stores/uiStore'
import { MUNICIPALITIES } from '@/lib/geo/municipality'
import { useQuery } from '@tanstack/react-query'

type Tab = 'pending' | 'verified' | 'dispatched'

function TabBadge({ count }: { count: number }) {
  return (
    <span className="ml-1.5 text-xs font-medium text-gray-500 bg-gray-100 rounded-full px-1.5 py-0.5">
      {count}
    </span>
  )
}

export function AdminQueueFeed() {
  const { customClaims } = useAuth()
  const role = customClaims?.role
  const userMunicipalityCode = customClaims?.municipalityCode ?? null

  // Superadmin default: all municipalities (null)
  const [filterMunicipality, setFilterMunicipality] = useState<string | null>(
    role === 'provincial_superadmin' ? null : userMunicipalityCode
  )

  // Listen to report_ops for the filtered municipality
  useAdminQueueListener(filterMunicipality)

  // Fetch from TanStack Query cache
  const { data: allReports = [] } = useQuery<AdminQueueReport[]>({
    queryKey: ADMIN_QUEUE_QUERY_KEY(filterMunicipality),
  })

  // Filter by workflowState for each tab
  const pendingReports = useMemo(
    () =>
      allReports
        .filter((r) => r.workflowState === 'pending')
        .sort((a, b) => {
          if (a.priority !== b.priority) {
            return (a.priority ?? 99) - (b.priority ?? 99)
          }
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        }),
    [allReports]
  )

  const verifiedReports = useMemo(
    () =>
      allReports
        .filter((r) => r.workflowState === 'verified')
        .sort((a, b) => {
          if (a.priority !== b.priority) {
            return (a.priority ?? 99) - (b.priority ?? 99)
          }
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        }),
    [allReports]
  )

  const dispatchedReports = useMemo(
    () =>
      allReports
        .filter((r) =>
          ['dispatched', 'acknowledged', 'in_progress'].includes(r.workflowState)
        )
        .sort((a, b) => {
          if (a.priority !== b.priority) {
            return (a.priority ?? 99) - (b.priority ?? 99)
          }
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        }),
    [allReports]
  )

  const [activeTab, setActiveTab] = useState<Tab>('pending')

  const { setSelectedReportId, setActivePanel } = useUIStore()

  function handleCardClick(report: AdminQueueReport) {
    setSelectedReportId(report.id)
    setActivePanel('admin-report-detail')
  }

  const activeReports =
    activeTab === 'pending'
      ? pendingReports
      : activeTab === 'verified'
        ? verifiedReports
        : dispatchedReports

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-lg font-semibold text-gray-900">Admin Queue</h1>

          {/* Superadmin municipality filter */}
          {role === 'provincial_superadmin' && (
            <select
              value={filterMunicipality ?? ''}
              onChange={(e) =>
                setFilterMunicipality(e.target.value || null)
              }
              className="text-sm border border-gray-300 rounded-md px-2 py-1 text-gray-700"
            >
              <option value="">All Municipalities</option>
              {MUNICIPALITIES.map((m) => (
                <option key={m.code} value={m.code}>
                  {m.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-4 mt-3 -mb-px">
          {(
            [
              { key: 'pending' as Tab, label: 'Pending', count: pendingReports.length },
              { key: 'verified' as Tab, label: 'Verified', count: verifiedReports.length },
              {
                key: 'dispatched' as Tab,
                label: 'Active',
                count: dispatchedReports.length,
              },
            ] as const
          ).map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`
                pb-2 text-sm font-medium border-b-2 transition-colors
                ${
                  activeTab === key
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }
              `}
            >
              {label}
              <TabBadge count={count} />
            </button>
          ))}
        </div>
      </div>

      {/* Card list */}
      <div className="flex-1 overflow-y-auto">
        {activeReports.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-gray-400 text-sm">
            {activeTab === 'pending' && 'No pending reports'}
            {activeTab === 'verified' && 'No verified reports'}
            {activeTab === 'dispatched' && 'No active reports'}
          </div>
        ) : (
          activeReports.map((report) => (
            <AdminQueueCard
              key={report.id}
              report={report}
              onClick={handleCardClick}
            />
          ))
        )}
      </div>
    </div>
  )
}
