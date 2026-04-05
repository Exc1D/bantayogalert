import { collection, doc } from 'firebase/firestore'
import { uploadMediaFiles } from './mediaUpload'
import { submitReport, type SubmitReportData } from './submitReport'
import {
  loadPendingSubmissions,
  markPendingSubmissionAttempt,
  removePendingSubmission,
} from './usePendingReportSubmission'
import type { ReportFormData } from './ReportFormSchema'
import { IncidentType, Severity } from '@/types/report'
import { db } from '@/lib/firebase/config'

/**
 * Default values for citizen reports — type/severity are assigned during admin triage.
 */
const DEFAULT_INCIDENT_TYPE: IncidentType = IncidentType.Other
const DEFAULT_SEVERITY: Severity = Severity.Low

export function createSubmissionId() {
  return doc(collection(db, 'reports')).id
}

export function buildSubmitReportPayload(
  data: ReportFormData,
  submissionId: string
): SubmitReportData & { reportId: string } {
  return {
    type: DEFAULT_INCIDENT_TYPE,
    severity: DEFAULT_SEVERITY,
    description: data.description,
    municipalityCode: data.municipalityCode,
    barangayCode: data.barangayCode,
    exactLocation: {
      lat: data.location.lat,
      lng: data.location.lng,
    },
    mediaUrls: [],
    reportId: submissionId,
  }
}

export async function executePreparedReportSubmission(
  payload: SubmitReportData & { reportId: string },
  files: File[]
): Promise<{ reportId: string }> {
  const mediaUrls =
    files.length > 0 ? await uploadMediaFiles(files, payload.reportId) : []

  return submitReport({
    ...payload,
    mediaUrls,
  })
}

export function getSubmissionErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === 'string') {
    return error
  }

  return 'Network request failed'
}

export function shouldQueueReportSubmission(error: unknown) {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return true
  }

  if (error && typeof error === 'object') {
    const code =
      'code' in error && typeof error.code === 'string' ? error.code : null
    if (code === 'functions/unavailable' || code === 'unavailable') {
      return true
    }
  }

  const message = getSubmissionErrorMessage(error).toLowerCase()
  return (
    message.includes('network') ||
    message.includes('offline') ||
    message.includes('fetch') ||
    message.includes('unavailable')
  )
}

export async function retryQueuedReportSubmissions(userId: string) {
  const queued = await loadPendingSubmissions(userId)
  let retriedCount = 0

  for (const submission of queued) {
    try {
      await executePreparedReportSubmission(submission.payload, submission.files)
      await removePendingSubmission(userId, submission.submissionId)
      retriedCount += 1
    } catch (error) {
      await markPendingSubmissionAttempt(
        userId,
        submission.submissionId,
        getSubmissionErrorMessage(error)
      )
    }
  }

  return retriedCount
}
