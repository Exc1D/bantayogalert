/**
 * Admin queue real-time listener hook.
 *
 * Listens to report_ops collection filtered by municipalityCode,
 * joining each doc with its reports/{id} document for display.
 */
import { useEffect } from 'react'
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
} from 'firebase/firestore'
import { useQueryClient } from '@tanstack/react-query'
import { db } from '@/lib/firebase/config'
import type { WorkflowState } from '@/types/report'
import type { Severity } from '@/types/report'
import type { IncidentType } from '@/types/report'

export interface AdminQueueReport {
  id: string
  type: IncidentType
  severity: Severity
  description: string
  municipalityCode: string
  barangayCode: string
  workflowState: WorkflowState
  createdAt: string
  updatedAt: string
  priority?: 1 | 2 | 3 | 4 | 5
  classification?: string
  version: number
  assignedContactSnapshot?: {
    contactId: string
    name: string
    agency: string
    type: string
    phones: string[]
    email?: string
    municipalityCode: string
  }
  dispatchNotes?: string
  routingDestination?: string
  mediaUrls?: string[]
}

const ADMIN_QUEUE_QUERY_KEY = (municipalityCode: string | null) =>
  ['admin-queue', municipalityCode] as const

export { ADMIN_QUEUE_QUERY_KEY }

export function useAdminQueueListener(municipalityCode: string | null) {
  const queryClient = useQueryClient()

  useEffect(() => {
    let q = query(collection(db, 'report_ops'))
    if (municipalityCode) {
      q = query(q, where('municipalityCode', '==', municipalityCode))
    }

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        // For each report_ops doc, fetch corresponding reports/{id} doc
        const adminReports = await Promise.all(
          snapshot.docs.map(async (opsDoc) => {
            const reportDoc = await getDoc(doc(db, 'reports', opsDoc.id))
            return {
              id: opsDoc.id,
              ...opsDoc.data(),
              ...(reportDoc.exists() ? reportDoc.data() : {}),
            } as AdminQueueReport
          })
        )
        queryClient.setQueryData<AdminQueueReport[]>(
          ADMIN_QUEUE_QUERY_KEY(municipalityCode),
          adminReports
        )
      },
      (error) => {
        console.error('Admin queue listener error:', error)
      }
    )

    return unsubscribe
  }, [queryClient, municipalityCode])
}
