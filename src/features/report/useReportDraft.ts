/**
 * useReportDraft - IndexedDB draft persistence for report form
 * D-101, D-102, D-103, D-104
 */
import { openDB, type IDBPDatabase } from 'idb'

export interface ReportDraft {
  step1?: { type?: string; severity?: string }
  step2?: { description?: string }
  step3?: {
    municipalityCode?: string
    barangayCode?: string
    location?: { lat: number; lng: number; geohash: string }
  }
  currentStep: number
  savedAt: string
}

const DB_NAME = 'bantayogalert'
const STORE_NAME = 'drafts'
const DB_VERSION = 1

let dbPromise: Promise<IDBPDatabase> | null = null

function getDB(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME)
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
  const db = await getDB()
  await db.put(STORE_NAME, { ...draft, savedAt: new Date().toISOString() }, `report-draft-${userId}`)
}

export async function loadDraft(
  userId: string
): Promise<ReportDraft | undefined> {
  const db = await getDB()
  return db.get(STORE_NAME, `report-draft-${userId}`)
}

export async function clearDraft(userId: string): Promise<void> {
  const db = await getDB()
  await db.delete(STORE_NAME, `report-draft-${userId}`)
}
