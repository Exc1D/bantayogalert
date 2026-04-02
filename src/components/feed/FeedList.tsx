import { useState, useRef, useCallback } from 'react'
import { useReports } from '../../contexts/ReportsContext'
import type { ReportType, Severity } from '../../contexts/ReportsContext'
import { useMap } from '../../contexts/MapContext'
import { useModal } from '../../contexts/ModalContext'
import { FeedCard } from './FeedCard'
import { Spinner } from '../common/Spinner'
import { Card } from '../common/Card'

const REPORT_TYPES: ReportType[] = ['flood', 'landslide', 'fire', 'earthquake', 'medical', 'crime', 'infrastructure', 'other']
const SEVERITIES: Severity[] = ['critical', 'high', 'medium', 'low']
const PAGE_SIZE = 20

export function FeedList() {
  const { reports } = useReports()
  const { setSelectedPinId } = useMap()
  const { open } = useModal()
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [filterType, setFilterType] = useState<ReportType | ''>('')
  const [filterSeverity, setFilterSeverity] = useState<Severity | ''>('')
  const [filterStatus, setFilterStatus] = useState<string>('')
  const observerRef = useRef<IntersectionObserver | null>(null)

  // Apply filters
  const filtered = reports.filter((r) => {
    if (filterType && r.type !== filterType) return false
    if (filterSeverity && r.severity !== filterSeverity) return false
    if (filterStatus && r.status !== filterStatus) return false
    return true
  })

  const visible = filtered.slice(0, visibleCount)
  const hasMore = visibleCount < filtered.length

  // Infinite scroll via IntersectionObserver
  const loadMore = useCallback(() => {
    setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, filtered.length))
  }, [filtered.length])

  // Set up intersection observer on the sentinel element
  const setSentinelRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (observerRef.current) observerRef.current.disconnect()
      if (!node) return
      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting && hasMore) {
            loadMore()
          }
        },
        { threshold: 0.1 }
      )
      observerRef.current.observe(node)
    },
    [hasMore, loadMore]
  )

  const handleCardClick = (reportId: string) => {
    setSelectedPinId(reportId)
    open('report-detail')
  }

  const clearFilters = () => {
    setFilterType('')
    setFilterSeverity('')
    setFilterStatus('')
  }

  const hasActiveFilters = filterType || filterSeverity || filterStatus

  return (
    <div className="space-y-3">
      {/* Filter bar */}
      <div className="flex flex-wrap gap-2 items-center">
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as ReportType | '')}
          className="text-sm border rounded px-2 py-1.5"
        >
          <option value="">All Types</option>
          {REPORT_TYPES.map((t) => (
            <option key={t} value={t} className="capitalize">
              {t}
            </option>
          ))}
        </select>

        <select
          value={filterSeverity}
          onChange={(e) => setFilterSeverity(e.target.value as Severity | '')}
          className="text-sm border rounded px-2 py-1.5"
        >
          <option value="">All Severities</option>
          {SEVERITIES.map((s) => (
            <option key={s} value={s} className="capitalize">
              {s}
            </option>
          ))}
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="text-sm border rounded px-2 py-1.5"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="verified">Verified</option>
          <option value="rejected">Rejected</option>
          <option value="dispatched">Dispatched</option>
          <option value="acknowledged">Acknowledged</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
        </select>

        {hasActiveFilters && (
          <button onClick={clearFilters} className="text-xs text-primary-500 hover:underline ml-auto">
            Clear filters
          </button>
        )}
      </div>

      <p className="text-xs text-gray-500">
        {filtered.length} report{filtered.length !== 1 ? 's' : ''} found
      </p>

      {/* Report list */}
      {visible.length === 0 ? (
        <Card>
          <p className="text-gray-500 text-center py-6">No reports to display</p>
        </Card>
      ) : (
        <>
          <div className="space-y-2">
            {visible.map((report) => (
              <FeedCard key={report.id} report={report} onClick={() => handleCardClick(report.id)} />
            ))}
          </div>

          {/* Infinite scroll sentinel */}
          <div ref={setSentinelRef} className="h-4" />

          {/* Loading indicator */}
          {hasMore && (
            <div className="flex justify-center py-2">
              <Spinner size="sm" />
            </div>
          )}

          {!hasMore && visible.length > 0 && (
            <p className="text-center text-xs text-gray-400 py-2">All reports loaded</p>
          )}
        </>
      )}
    </div>
  )
}
