import { type SubmitReportData } from './submitReport'
import {
  REPORT_PENDING_STORE_NAME,
  getReportPersistenceDb,
} from './useReportDraft'

export interface QueuedReportSubmission {
  submissionId: string
  userId: string
  payload: SubmitReportData & { reportId: string }
  files: File[]
  retryCount: number
  lastError: string | null
  createdAt: string
  updatedAt: string
}

function getPendingSubmissionKey(userId: string, submissionId: string) {
  return `report-pending-${userId}-${submissionId}`
}

export async function savePendingSubmission(
  submission: QueuedReportSubmission
): Promise<void> {
  const db = await getReportPersistenceDb()
  const now = new Date().toISOString()

  await db.put(
    REPORT_PENDING_STORE_NAME,
    {
      ...submission,
      updatedAt: now,
      createdAt: submission.createdAt ?? now,
      lastError: submission.lastError ?? null,
    },
    getPendingSubmissionKey(submission.userId, submission.submissionId)
  )
}

export async function loadPendingSubmissions(
  userId: string
): Promise<QueuedReportSubmission[]> {
  const db = await getReportPersistenceDb()
  const prefix = `report-pending-${userId}-`
  const keys = (await db.getAllKeys(REPORT_PENDING_STORE_NAME)).filter(
    (key): key is string =>
      typeof key === 'string' && key.startsWith(prefix)
  )

  const submissions = await Promise.all(
    keys.map(async (key) => {
      const submission = await db.get(REPORT_PENDING_STORE_NAME, key)
      return submission as QueuedReportSubmission | undefined
    })
  )

  return submissions
    .filter((submission): submission is QueuedReportSubmission =>
      Boolean(submission)
    )
    .sort((left, right) => left.createdAt.localeCompare(right.createdAt))
}

export async function removePendingSubmission(
  userId: string,
  submissionId: string
): Promise<void> {
  const db = await getReportPersistenceDb()
  await db.delete(
    REPORT_PENDING_STORE_NAME,
    getPendingSubmissionKey(userId, submissionId)
  )
}

export async function markPendingSubmissionAttempt(
  userId: string,
  submissionId: string,
  lastError: string | null
): Promise<void> {
  const db = await getReportPersistenceDb()
  const key = getPendingSubmissionKey(userId, submissionId)
  const existing = (await db.get(
    REPORT_PENDING_STORE_NAME,
    key
  )) as QueuedReportSubmission | undefined

  if (!existing) {
    return
  }

  await db.put(
    REPORT_PENDING_STORE_NAME,
    {
      ...existing,
      retryCount: existing.retryCount + 1,
      lastError,
      updatedAt: new Date().toISOString(),
    },
    key
  )
}
