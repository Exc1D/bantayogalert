/**
 * ReportFormDesktopWrapper - Desktop integration for ReportForm
 * Renders ReportForm inside the WorkspaceDrawer on desktop (>=1280px)
 *
 * BLOCKER 1 fix: media uploaded BEFORE submitReport CF
 * 1. Generate reportId upfront
 * 2. Compress images
 * 3. Upload media FIRST to Storage → get download URLs
 * 4. Call submitReport CF with complete mediaUrls
 * 5. Clear draft
 * 6. Navigate to /app/track/{reportId}
 */
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ReportForm } from './ReportForm'
import { useUIStore } from '@/stores/uiStore'
import { useAuth } from '@/lib/auth/AuthProvider'
import {
  buildSubmitReportPayload,
  executePreparedReportSubmission,
  retryQueuedReportSubmissions,
} from '@/features/report/reportSubmission'
import type { ReportFormData } from '@/features/report/ReportFormSchema'

export function ReportFormDesktopWrapper() {
  const { setActivePanel, setDrawerOpen } = useUIStore()
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    // Open the drawer with report-form panel
    setActivePanel('report-form')
    return () => {
      setActivePanel(null)
    }
  }, [setActivePanel])

  async function handleFormSubmit(
    data: ReportFormData,
    mediaFiles: File[],
    submissionId: string
  ) {
    if (!user) return
    const payload = buildSubmitReportPayload(data, submissionId)
    const result = await executePreparedReportSubmission(payload, mediaFiles)

    setDrawerOpen(false)
    setActivePanel(null)
    navigate(`/app/track/${result.reportId}`)
  }

  async function retryQueued() {
    if (!user) {
      return 0
    }

    return retryQueuedReportSubmissions(user.uid)
  }

  return <ReportForm onSubmit={handleFormSubmit} retryQueued={retryQueued} />
}
