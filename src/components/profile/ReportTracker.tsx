import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore'
import { getFirebaseFirestore } from '../../config/firebase'

interface ReportSummary {
  id: string
  type: string
  description: string
  status: string
  municipality: string
  createdAt: { toDate: () => Date }
}

interface ReportTrackerProps {
  onReportPress?: (reportId: string) => void
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

export function ReportTracker({ onReportPress }: ReportTrackerProps) {
  const { user } = useAuth()
  const [activeReports, setActiveReports] = useState<ReportSummary[]>([])
  const [recentReports, setRecentReports] = useState<ReportSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    const db = getFirebaseFirestore()
    const reportsRef = collection(db, 'reports')

    const fetchReports = async () => {
      try {
        // Active reports (not resolved)
        const activeQuery = query(
          reportsRef,
          where('submitterUid', '==', user.uid),
          where('status', '!=', 'resolved'),
          orderBy('createdAt', 'desc'),
          limit(10)
        )
        const activeSnap = await getDocs(activeQuery)
        setActiveReports(
          activeSnap.docs.map((d) => ({ id: d.id, ...d.data() } as ReportSummary))
        )

        // Recent reports (any status, last 5)
        const recentQuery = query(
          reportsRef,
          where('submitterUid', '==', user.uid),
          orderBy('createdAt', 'desc'),
          limit(5)
        )
        const recentSnap = await getDocs(recentQuery)
        setRecentReports(
          recentSnap.docs.map((d) => ({ id: d.id, ...d.data() } as ReportSummary))
        )
      } catch (err) {
        console.error('Error fetching user reports:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchReports()
  }, [user])

  if (!user) return null

  if (loading) {
    return (
      <div className="p-4 space-y-3">
        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Active Reports */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Your Active Reports</h3>
        {activeReports.length === 0 ? (
          <p className="text-sm text-gray-500 py-2">No active reports</p>
        ) : (
          <div className="space-y-2">
            {activeReports.map((report) => (
              <button
                key={report.id}
                onClick={() => onReportPress?.(report.id)}
                className="w-full flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
              >
                <span className="text-xl">
                  {TYPE_ICONS[report.type?.toLowerCase()] ?? '📌'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {report.description || 'No description'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {report.municipality?.replace('_', ' ')} • {report.createdAt?.toDate ? timeAgo(report.createdAt.toDate()) : 'Unknown'}
                  </p>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${getStatusColor(
                    report.status
                  )}`}
                >
                  {report.status?.replace('_', ' ') ?? 'pending'}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Recent Reports */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Recent Reports</h3>
        {recentReports.length === 0 ? (
          <p className="text-sm text-gray-500 py-2">No reports yet</p>
        ) : (
          <div className="space-y-2">
            {recentReports.map((report) => (
              <button
                key={report.id}
                onClick={() => onReportPress?.(report.id)}
                className="w-full flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
              >
                <span className="text-xl">
                  {TYPE_ICONS[report.type?.toLowerCase()] ?? '📌'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 truncate">
                    {report.description || 'No description'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {report.municipality?.replace('_', ' ')} • {report.createdAt?.toDate ? timeAgo(report.createdAt.toDate()) : 'Unknown'}
                  </p>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${getStatusColor(
                    report.status
                  )}`}
                >
                  {report.status?.replace('_', ' ') ?? 'pending'}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
