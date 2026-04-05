/**
 * useReportDraft - IndexedDB draft persistence for report form
 * D-101, D-102, D-103, D-104
 */
import { openDB, type IDBPDatabase } from 'idb'

export interface ReportDraft {
  stepLocation?: {
    municipalityCode?: string
    barangayCode?: string
    location?: { lat: number; lng: number; geohash: string }
  }
  stepDescription?: { description?: string }
  currentStep: number
  savedAt: string
}

const DB_NAME = 'bantayogalert'
const STORE_NAME = 'drafts'
export const REPORT_PENDING_STORE_NAME = 'pending-submissions'
export const REPORT_DRAFT_STORE_NAME = STORE_NAME
const DB_VERSION = 2

let dbPromise: Promise<IDBPDatabase> | null = null

export function getReportPersistenceDb(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME)
        }

        if (!db.objectStoreNames.contains(REPORT_PENDING_STORE_NAME)) {
          db.createObjectStore(REPORT_PENDING_STORE_NAME)
        }
      },
    })
  }
  return dbPromise
}

export async function saveDraft(
  userId: string,
  draft: ReportDraft
): Promise<void> {
  const db = await getReportPersistenceDb()
  await db.put(STORE_NAME, { ...draft, savedAt: new Date().toISOString() }, `report-draft-${userId}`)
}

export async function loadDraft(
  userId: string
): Promise<ReportDraft | undefined> {
  const db = await getReportPersistenceDb()
  return db.get(STORE_NAME, `report-draft-${userId}`)
}

export async function clearDraft(userId: string): Promise<void> {
  const db = await getReportPersistenceDb()
  await db.delete(STORE_NAME, `report-draft-${userId}`)
}
