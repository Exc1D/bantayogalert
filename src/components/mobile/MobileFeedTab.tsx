import { useState, useEffect, useRef, useCallback } from 'react'
import { collection, query, orderBy, limit, startAfter, getDocs } from 'firebase/firestore'
import { getFirebaseFirestore } from '../../config/firebase'

const PAGE_SIZE = 10

interface Report {
  id: string
  type: string
  description: string
  severity: string
  status: string
  municipality: string
  barangay?: string
  createdAt: { toDate: () => Date }
  submitterName?: string
  photos?: string[]
}

const TYPE_ICONS: Record<string, string> = {
  flood: '🌊',
  landslide: '⛰️',
  fire: '🔥',
  earthquake: '🌍',
  storm: '🌪️',
  accident: '🚗',
  crime: '🚨',
  medical: '🏥',
  utility: '⚡',
  other: '📌',
}

const TYPE_COLORS: Record<string, string> = {
  flood: 'bg-blue-100',
  landslide: 'bg-orange-100',
  fire: 'bg-red-100',
  earthquake: 'bg-yellow-100',
  storm: 'bg-purple-100',
  accident: 'bg-gray-100',
  crime: 'bg-pink-100',
  medical: 'bg-red-100',
  utility: 'bg-yellow-100',
  other: 'bg-gray-100',
}

function getSeverityColor(severity: string): string {
  switch (severity) {
    case 'critical':
      return 'text-red-600'
    case 'high':
      return 'text-orange-600'
    case 'medium':
      return 'text-yellow-600'
    case 'low':
    default:
      return 'text-green-600'
  }
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'resolved':
      return 'bg-green-100 text-green-800'
    case 'in_progress':
      return 'bg-yellow-100 text-yellow-800'
    case 'verified':
      return 'bg-blue-100 text-blue-800'
    case 'pending':
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

function timeAgo(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

interface FeedCardProps {
  report: Report
  onPress: () => void
}

function FeedCard({ report, onPress }: FeedCardProps) {
  const icon = TYPE_ICONS[report.type?.toLowerCase()] ?? '📌'
  const colorClass = TYPE_COLORS[report.type?.toLowerCase()] ?? 'bg-gray-100'
  const createdAtDate = report.createdAt?.toDate?.() ?? new Date()

  return (
    <button
      onClick={onPress}
      className="w-full bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-left hover:shadow-md transition-shadow"
    >
      <div className="flex items-start gap-3">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${colorClass}`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h3 className="font-semibold text-gray-900 capitalize">
              {report.type?.replace('_', ' ') ?? 'Report'}
            </h3>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${getStatusColor(
                report.status
              )}`}
            >
              {report.status?.replace('_', ' ') ?? 'pending'}
            </span>
          </div>
          <p className="text-sm text-gray-600 line-clamp-2 mb-2">
            {report.description || 'No description provided'}
          </p>
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>
              {report.municipality?.replace('_', ' ')}
              {report.barangay ? `, ${report.barangay}` : ''}
            </span>
            <span className={getSeverityColor(report.severity ?? 'low')}>
              {report.severity?.toUpperCase() ?? 'LOW'}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1">{timeAgo(createdAtDate)}</p>
        </div>
      </div>
    </button>
  )
}

interface MobileFeedTabProps {
  onNewReport?: () => void
  onReportPress?: (reportId: string) => void
}

export function MobileFeedTab({ onNewReport, onReportPress }: MobileFeedTabProps) {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [lastDoc, setLastDoc] = useState<any>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const isPulling = useRef(false)

  const fetchReports = useCallback(async (reset = false) => {
    const db = getFirebaseFirestore()
    const reportsRef = collection(db, 'reports')

    try {
      if (reset) {
        setLoading(true)
        const q = query(reportsRef, orderBy('createdAt', 'desc'), limit(PAGE_SIZE))
        const snap = await getDocs(q)
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Report))
        setReports(data)
        setLastDoc(snap.docs[snap.docs.length - 1] ?? null)
        setHasMore(snap.docs.length === PAGE_SIZE)
      } else if (lastDoc) {
        setLoadingMore(true)
        const q = query(
          reportsRef,
          orderBy('createdAt', 'desc'),
          startAfter(lastDoc),
          limit(PAGE_SIZE)
        )
        const snap = await getDocs(q)
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Report))
        setReports((prev) => [...prev, ...data])
        setLastDoc(snap.docs[snap.docs.length - 1] ?? null)
        setHasMore(snap.docs.length === PAGE_SIZE)
      }
    } catch (err) {
      console.error('Error fetching reports:', err)
    } finally {
      setLoading(false)
      setLoadingMore(false)
      isPulling.current = false
    }
  }, [lastDoc])

  useEffect(() => {
    fetchReports(true)
  }, [])

  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current
    if (scrollTop + clientHeight >= scrollHeight - 200 && hasMore && !loadingMore) {
      fetchReports(false)
    }
  }, [hasMore, loadingMore, fetchReports])

  const handlePull = useCallback(() => {
    if (isPulling.current) return
    isPulling.current = true
    setLastDoc(null)
    fetchReports(true)
  }, [fetchReports])

  // Pull-to-refresh via touch
  const touchStartY = useRef(0)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (scrollRef.current?.scrollTop === 0) {
      touchStartY.current = e.touches[0]?.clientY ?? 0
    }
  }
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (scrollRef.current?.scrollTop === 0) {
      const diff = (e.changedTouches[0]?.clientY ?? 0) - touchStartY.current
      if (diff > 80) {
        handlePull()
      }
    }
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <h1 className="text-lg font-bold text-gray-900">Incident Feed</h1>
        <p className="text-sm text-gray-500">Camarines Norte Reports</p>
      </div>

      {/* Feed content */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="flex-1 overflow-auto px-4 py-4 space-y-3"
      >
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl h-32 animate-pulse" />
            ))}
          </div>
        ) : reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <span className="text-5xl mb-4">📋</span>
            <h3 className="font-semibold text-gray-900 mb-1">No reports yet</h3>
            <p className="text-sm text-gray-500">Be the first to report an incident</p>
          </div>
        ) : (
          <>
            {reports.map((report) => (
              <FeedCard
                key={report.id}
                report={report}
                onPress={() => onReportPress?.(report.id)}
              />
            ))}
            {loadingMore && (
              <div className="flex justify-center py-4">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            {!hasMore && reports.length > 0 && (
              <p className="text-center text-sm text-gray-400 py-4">No more reports</p>
            )}
          </>
        )}
      </div>

      {/* FAB */}
      {onNewReport && (
        <button
          onClick={onNewReport}
          className="fixed bottom-20 right-4 w-14 h-14 bg-primary-500 text-white rounded-full shadow-lg flex items-center justify-center text-2xl hover:bg-primary-600 active:scale-95 transition-all"
          aria-label="New Report"
        >
          +
        </button>
      )}
    </div>
  )
}
