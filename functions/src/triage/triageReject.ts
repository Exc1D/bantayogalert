/**
 * triageReject Cloud Function
 *
 * Transitions a report from pending → rejected.
 * Requires a reason for rejection.
 */
import * as functions from 'firebase-functions'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { z } from 'zod'

import { validateAuthenticated, validateMunicipalAdmin } from '../security'
import { buildActivityEntry, validateVersion, validateTransition } from './shared'
import { WORKFLOW_TO_OWNER_STATUS } from '../types/status'
import { WorkflowState } from '../types/report'

const RejectSchema = z.object({
  reportId: z.string(),
  expectedVersion: z.number(),
  reason: z.string().min(1).max(500),
  category: z
    .enum(['insufficient_info', 'duplicate', 'out_of_area', 'false_report', 'other'])
    .optional(),
})

export const triageReject = functions.https.onCall(
  async (data: unknown, context: functions.https.CallableContext) => {
    validateAuthenticated(context)

    const parsed = RejectSchema.safeParse(data)
    if (!parsed.success) {
      throw new functions.https.HttpsError('invalid-argument', 'Invalid input', parsed.error.issues)
    }
    const { reportId, expectedVersion, reason, category } = parsed.data

    const db = getFirestore()

    await db.runTransaction(async (tx) => {
      const opsDoc = await tx.get(db.collection('report_ops').doc(reportId))
      if (!opsDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Report operations document not found')
      }
      const opsData = opsDoc.data()!
      validateVersion(opsData.version, expectedVersion, reportId)

      const reportDoc = await tx.get(db.collection('reports').doc(reportId))
      if (!reportDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Report not found')
      }
      const reportData = reportDoc.data()!
      const currentState = reportData.workflowState as WorkflowState
      const municipalityCode = reportData.municipalityCode as string

      validateMunicipalAdmin(context, municipalityCode)
      validateTransition(currentState, WorkflowState.Rejected, reportId)

      const claims = context.auth!.token
      const entry = buildActivityEntry('rejected', claims.uid as string, {
        reason,
        category,
      })

      tx.update(db.collection('reports').doc(reportId), {
        workflowState: WorkflowState.Rejected,
        updatedAt: new Date().toISOString(),
      })

      tx.update(db.collection('report_private').doc(reportId), {
        ownerStatus: WORKFLOW_TO_OWNER_STATUS[WorkflowState.Rejected],
        activityLog: FieldValue.arrayUnion(entry),
      })

      tx.update(db.collection('report_ops').doc(reportId), {
        version: (opsData.version ?? 1) + 1,
        activity: FieldValue.arrayUnion(entry),
      })
    })

    return { success: true }
  }
)
