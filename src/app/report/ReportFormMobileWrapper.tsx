/**
 * ReportFormMobileWrapper - Mobile modal integration for ReportForm
 * Full-screen modal sliding up from bottom for mobile (<=768px)
 *
 * BLOCKER 1 fix: Same submit handler logic as desktop — media upload BEFORE submitReport CF
 */
import { useNavigate } from 'react-router-dom'
import { collection, doc } from 'firebase/firestore'
import { getFirestore } from 'firebase/firestore'
import { ReportForm } from './ReportForm'
import { submitReport } from '@/features/report/submitReport'
import { uploadMediaFiles, compressImage } from '@/features/report/mediaUpload'
import { clearDraft } from '@/features/report/useReportDraft'
import { useAuth } from '@/lib/auth/AuthProvider'
import type { ReportFormData } from '@/features/report/ReportFormSchema'

export function ReportFormMobileWrapper() {
  const navigate = useNavigate()
  const { user } = useAuth()

  async function handleFormSubmit(data: ReportFormData, mediaFiles: File[]) {
    if (!user) return

    const db = getFirestore()

    // 1. Generate reportId upfront BEFORE media upload and CF call
    const reportId = doc(collection(db, 'reports')).id

    // 2. Compress images
    const compressedFiles = mediaFiles.length > 0
      ? await Promise.all(mediaFiles.map(f => compressImage(f)))
      : []

    // 3. Upload media files FIRST → get download URLs
    const mediaUrls = compressedFiles.length > 0
      ? await uploadMediaFiles(compressedFiles, reportId)
      : []

    // 4. Call submitReport CF with complete data including mediaUrls and reportId
    await submitReport({
      type: data.type,
      severity: data.severity,
      description: data.description,
      municipalityCode: data.municipalityCode,
      barangayCode: data.barangayCode,
      exactLocation: { lat: data.location.lat, lng: data.location.lng },
      mediaUrls,
      reportId,  // pass pre-generated ID so CF uses the same ID
    })

    // 5. Clear draft
    await clearDraft(user.uid)

    // 6. Navigate to track page
    navigate(`/app/track/${reportId}`)
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
        <ReportForm onSubmit={handleFormSubmit} onCancel={() => navigate('/app')} />
      </div>
    </div>
  )
}
