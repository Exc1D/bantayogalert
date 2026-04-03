/**
 * submitReport - Client-side callable wrapper for the submitReport Cloud Function
 * D-96
 */
import { httpsCallable, getFunctions } from 'firebase/functions'
import type { IncidentType, Severity } from '@/types/report'

interface SubmitReportData {
  type: IncidentType
  severity: Severity
  description: string
  municipalityCode: string
  barangayCode: string
  exactLocation: { lat: number; lng: number }
  mediaUrls: string[]
  reportId?: string  // optional - if provided, CF uses it (for media-first upload)
}

export async function submitReport(
  data: SubmitReportData
): Promise<{ reportId: string }> {
  const fn = getFunctions()
  const callable = httpsCallable<SubmitReportData, { reportId: string }>(
    fn,
    'submitReport'
  )
  const result = await callable(data)
  return result.data
}
