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
import { collection, doc } from 'firebase/firestore'
import { getFirestore } from 'firebase/firestore'
import { ReportForm } from './ReportForm'
import { useUIStore } from '@/stores/uiStore'
import { useAuth } from '@/lib/auth/AuthProvider'
import { submitReport } from '@/features/report/submitReport'
import { uploadMediaFiles, compressImage } from '@/features/report/mediaUpload'
import { clearDraft } from '@/features/report/useReportDraft'
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

  async function handleFormSubmit(data: ReportFormData, mediaFiles: File[]) {
    if (!user) return

    const db = getFirestore()

    // 1. Generate reportId upfront BEFORE media upload and CF call
    const reportId = doc(collection(db, 'reports')).id

    // 2. Compress images
    const compressedFiles = mediaFiles.length > 0
      ? await Promise.all(mediaFiles.map(f => compressImage(f)))
      : []

    // 3. Upload media files FIRST to Storage → get download URLs
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
      mediaUrls,  // now populated with actual URLs from Storage
      reportId,  // pass pre-generated ID so CF uses the same ID
    })

    // 5. Clear draft
    await clearDraft(user.uid)

    // 6. Close drawer and navigate to track page
    setDrawerOpen(false)
    setActivePanel(null)
    navigate(`/app/track/${reportId}`)
  }

  return <ReportForm onSubmit={handleFormSubmit} />
}
