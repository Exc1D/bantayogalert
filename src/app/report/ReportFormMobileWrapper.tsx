/**
 * ReportFormMobileWrapper - Mobile modal integration for ReportForm
 * Full-screen modal sliding up from bottom for mobile (<=768px)
 *
 * BLOCKER 1 fix: Same submit handler logic as desktop — media upload BEFORE submitReport CF
 */
import { useNavigate } from 'react-router-dom'
import { ReportForm } from './ReportForm'
import {
  buildSubmitReportPayload,
  executePreparedReportSubmission,
  retryQueuedReportSubmissions,
} from '@/features/report/reportSubmission'
import { useAuth } from '@/lib/auth/AuthProvider'
import type { ReportFormData } from '@/features/report/ReportFormSchema'

export function ReportFormMobileWrapper() {
  const navigate = useNavigate()
  const { user } = useAuth()

  async function handleFormSubmit(
    data: ReportFormData,
    mediaFiles: File[],
    submissionId: string
  ) {
    if (!user) return
    const payload = buildSubmitReportPayload(data, submissionId)
    const result = await executePreparedReportSubmission(payload, mediaFiles)
    navigate(`/app/track/${result.reportId}`)
  }

  async function retryQueued() {
    if (!user) {
      return 0
    }

    return retryQueuedReportSubmissions(user.uid)
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-white flex flex-col"
      style={{ transform: 'translateY(0)', transition: 'transform 300ms ease-out' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h1 className="text-lg font-semibold">Submit Report</h1>
        <button
          onClick={() => navigate('/app')}
          className="p-2 hover:bg-gray-100 rounded"
          aria-label="Close"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M15 5L5 15M5 5l10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Form content — takes remaining space and scrolls */}
      <div className="flex-1 overflow-y-auto">
        <ReportForm
          onSubmit={handleFormSubmit}
          retryQueued={retryQueued}
          onCancel={() => navigate('/app')}
        />
      </div>
    </div>
  )
}
