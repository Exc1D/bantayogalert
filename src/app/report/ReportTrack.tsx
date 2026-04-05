/**
 * ReportTrack - Citizen report tracking page
 * Route: /app/track/:reportId
 * Shows real-time owner status via report_private snapshot + zigzag timeline
 * RPT-09, RPT-10, RPT-11
 */
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { doc, onSnapshot } from 'firebase/firestore'
import { getFirestore } from 'firebase/firestore'
import { ArrowLeftIcon } from 'lucide-react'
import { ReportStatus } from '@/types/report'
import type { ReportPrivate } from '@/types/report'
import { StatusTimeline, StatusTimelineSkeleton } from '@/components/report/StatusTimeline'

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

  const displayStatus = reportPrivate?.ownerStatus ?? ReportStatus.Submitted
  const activityLog = reportPrivate?.activityLog ?? []

  if (loading && !reportPrivate) {
    return (
      <div className="max-w-lg mx-auto p-4">
        <StatusTimelineSkeleton />
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto p-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/app')}
          className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
          aria-label="Back to home"
        >
          <ArrowLeftIcon className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
        </button>
        <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Your Report</h1>
      </div>

      {/* Status Timeline */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
        <StatusTimeline currentStatus={displayStatus} activityLog={activityLog} />
      </div>

      {/* Report Details */}
      {reportPrivate && (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
          <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">Report Details</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-neutral-500 dark:text-neutral-400">Report ID</span>
              <span className="font-mono text-xs text-neutral-900 dark:text-neutral-100">{reportId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500 dark:text-neutral-400">Submitted</span>
              <span className="text-neutral-900 dark:text-neutral-100">
                {activityLog[0]?.performedAt
                  ? new Date(activityLog[0].performedAt).toLocaleString()
                  : 'Just now'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Help Text */}
      <div className="mt-6 p-4 bg-neutral-50 dark:bg-neutral-800 rounded-xl">
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Your report is being reviewed by municipal administrators. You will be notified when there&apos;s an update.
        </p>
      </div>
    </div>
  )
}
