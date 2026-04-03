/**
 * ReportTrack - Citizen report tracking page
 * Route: /app/track/:reportId
 * Shows real-time owner status via report_private snapshot
 * RPT-09, RPT-10, RPT-11
 */
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { doc, onSnapshot } from 'firebase/firestore'
import { getFirestore } from 'firebase/firestore'
import { ArrowLeftIcon } from 'lucide-react'
import { OWNER_STATUS_LABELS } from '@/types/status'
import { ReportStatus } from '@/types/report'
import type { ReportPrivate } from '@/types/report'

export function ReportTrack() {
  const { reportId } = useParams<{ reportId: string }>()
  const navigate = useNavigate()
  const [reportPrivate, setReportPrivate] = useState<ReportPrivate | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!reportId) return

    const db = getFirestore()
    const ref = doc(db, 'report_private', reportId)
    const unsubscribe = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        setReportPrivate(snap.data() as ReportPrivate)
      }
      setLoading(false)
    })

    return unsubscribe
  }, [reportId])

  // Show 'Submitted' immediately while waiting for real-time update
  const displayStatus = reportPrivate?.ownerStatus ?? ReportStatus.Submitted
  const statusLabel = OWNER_STATUS_LABELS[displayStatus]

  if (loading && !reportPrivate) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading your report...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto p-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/app')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Back to home"
        >
          <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
        </button>
        <h1 className="text-xl font-semibold text-gray-900">Your Report</h1>
      </div>

      {/* Status Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-gray-500">Current Status</span>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            displayStatus === ReportStatus.Submitted ? 'bg-blue-100 text-blue-700' :
            displayStatus === ReportStatus.Verified ? 'bg-green-100 text-green-700' :
            displayStatus === ReportStatus.Rejected ? 'bg-red-100 text-red-700' :
            displayStatus === ReportStatus.Resolved ? 'bg-gray-100 text-gray-700' :
            'bg-yellow-100 text-yellow-700'
          }`}>
            {statusLabel}
          </span>
        </div>

        <div className="text-2xl font-bold text-gray-900 mb-1">
          {statusLabel}
        </div>
        <p className="text-sm text-gray-500">
          Updated {reportPrivate?.activityLog?.length ? 'just now' : 'moments ago'}
        </p>
      </div>

      {/* Report Details */}
      {reportPrivate && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Report Details</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Report ID</span>
              <span className="font-mono text-xs">{reportId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Submitted</span>
              <span>{reportPrivate.activityLog?.[0]?.performedAt
                ? new Date(reportPrivate.activityLog[0].performedAt).toLocaleString()
                : 'Just now'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Activity Timeline */}
      {reportPrivate?.activityLog && reportPrivate.activityLog.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-700 mb-4">Activity Timeline</h3>
          <div className="space-y-4">
            {reportPrivate.activityLog.map((entry, i) => (
              <div key={i} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-2 h-2 mt-2 rounded-full bg-primary-500" />
                  {i < reportPrivate.activityLog.length - 1 && (
                    <div className="w-0.5 flex-1 bg-gray-200 mt-1" />
                  )}
                </div>
                <div className="flex-1 pb-4">
                  <div className="text-sm font-medium text-gray-900">{entry.action}</div>
                  <div className="text-xs text-gray-500">
                    {new Date(entry.performedAt).toLocaleString()}
                  </div>
                  {entry.details && (
                    <div className="text-sm text-gray-600 mt-1">{entry.details}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Help Text */}
      <div className="mt-6 p-4 bg-gray-50 rounded-xl">
        <p className="text-sm text-gray-600">
          Your report is being reviewed by municipal administrators. You will be notified when there's an update.
        </p>
      </div>
    </div>
  )
}
