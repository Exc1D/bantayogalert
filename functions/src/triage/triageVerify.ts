/**
 * triageVerify Cloud Function
 *
 * Transitions a report from pending → verified.
 * Creates activity entries in both report_private and report_ops.
 */
import * as functions from 'firebase-functions'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { z } from 'zod'

import { validateAuthenticated, validateMunicipalAdmin } from '../security'
import { buildActivityEntry, validateVersion, validateTransition } from './shared'
import { WORKFLOW_TO_OWNER_STATUS } from '../types/status'
import { WorkflowState } from '../types/report'

const VerifySchema = z.object({
  reportId: z.string(),
  expectedVersion: z.number(),
})

export const triageVerify = functions.https.onCall(
  async (data: unknown, context: functions.https.CallableContext) => {
    // 1. Validate authentication and role
    validateAuthenticated(context)

    const parsed = VerifySchema.safeParse(data)
    if (!parsed.success) {
      throw new functions.https.HttpsError('invalid-argument', 'Invalid input', parsed.error.issues)
    }
    const { reportId, expectedVersion } = parsed.data

    const db = getFirestore()

    await db.runTransaction(async (tx) => {
      // Read report_ops to validate version
      const opsDoc = await tx.get(db.collection('report_ops').doc(reportId))
      if (!opsDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Report operations document not found')
      }
      const opsData = opsDoc.data()!
      validateVersion(opsData.version, expectedVersion, reportId)

      // Read reports to get current workflowState and municipalityCode
      const reportDoc = await tx.get(db.collection('reports').doc(reportId))
      if (!reportDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Report not found')
      }
      const reportData = reportDoc.data()!
      const currentState = reportData.workflowState as WorkflowState
      const municipalityCode = reportData.municipalityCode as string

      // Validate admin has access to this municipality
      validateMunicipalAdmin(context, municipalityCode)

      // Validate state transition
      validateTransition(currentState, WorkflowState.Verified, reportId)

      // Build activity entry
      const claims = context.auth!.token
      const entry = buildActivityEntry('verified', claims.uid as string)

      // Update reports/{reportId}: workflowState → verified
      tx.update(db.collection('reports').doc(reportId), {
        workflowState: WorkflowState.Verified,
        updatedAt: new Date().toISOString(),
      })

      // Update report_private/{reportId}: ownerStatus → verified
      tx.update(db.collection('report_private').doc(reportId), {
        ownerStatus: WORKFLOW_TO_OWNER_STATUS[WorkflowState.Verified],
        activityLog: FieldValue.arrayUnion(entry),
      })

      // Update report_ops/{reportId}: version + 1, add activity entry
      tx.update(db.collection('report_ops').doc(reportId), {
        version: (opsData.version ?? 1) + 1,
        activity: FieldValue.arrayUnion(entry),
      })
    })

    return { success: true }
  }
)
