/**
 * triageResolve Cloud Function
 *
 * Transitions a report from any non-terminal state to resolved.
 * Non-terminal states: pending, verified, dispatched, acknowledged, in_progress.
 * Terminal states: resolved, rejected.
 */
import * as functions from 'firebase-functions'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { z } from 'zod'

import { validateAuthenticated, validateMunicipalAdmin } from '../security'
import { buildActivityEntry, validateVersion } from './shared'
import { WORKFLOW_TO_OWNER_STATUS } from '../types/status'
import { WorkflowState } from '../types/report'
import { updateAnalyticsForStateChange } from '../analytics/updateAnalyticsForStateChange'
import { appendAuditEntry } from '../audit/shared'
import type { AuditActorRole } from '../types/audit'

const ResolveSchema = z.object({
  reportId: z.string(),
  expectedVersion: z.number(),
  resolutionNotes: z.string().max(1000).optional(),
})

const TERMINAL_STATES: WorkflowState[] = [
  WorkflowState.Rejected,
  WorkflowState.Resolved,
]

export const triageResolve = functions.https.onCall(
  async (data: unknown, context: functions.https.CallableContext) => {
    validateAuthenticated(context)

    const parsed = ResolveSchema.safeParse(data)
    if (!parsed.success) {
      throw new functions.https.HttpsError('invalid-argument', 'Invalid input', parsed.error.issues)
    }
    const { reportId, expectedVersion, resolutionNotes } = parsed.data

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

      // Validate: current state must NOT be terminal
      if (TERMINAL_STATES.includes(currentState)) {
        throw new functions.https.HttpsError(
          'failed-precondition',
          `Cannot resolve a report that is already '${currentState}'.`
        )
      }

      const claims = context.auth!.token
      const now = new Date().toISOString()
      const entry = buildActivityEntry('resolved', claims.uid as string, {
        resolutionNotes,
      })

      tx.update(db.collection('reports').doc(reportId), {
        workflowState: WorkflowState.Resolved,
        updatedAt: now,
      })

      tx.update(db.collection('report_private').doc(reportId), {
        ownerStatus: WORKFLOW_TO_OWNER_STATUS[WorkflowState.Resolved],
        activityLog: FieldValue.arrayUnion(entry),
      })

      tx.update(db.collection('report_ops').doc(reportId), {
        version: (opsData.version ?? 1) + 1,
        resolvedAt: now,
        activity: FieldValue.arrayUnion(entry),
      })

      await updateAnalyticsForStateChange(tx, db, {
        reportId,
        municipalityCode,
        provinceCode: 'CMN',
        barangayCode: reportData.barangayCode as string,
        incidentType: reportData.type,
        severity: reportData.severity,
        createdAt: reportData.createdAt as string,
        previousState: currentState,
        nextState: WorkflowState.Resolved,
        verifiedAt: (opsData.verifiedAt as string | undefined) ?? null,
        resolvedAt: now,
        eventAt: now,
      })

      await appendAuditEntry(tx, db, {
        entityType: 'report',
        entityId: reportId,
        action: 'triage_resolve',
        actorUid: context.auth!.uid,
        actorRole: (claims.role as AuditActorRole | undefined) ?? 'citizen',
        municipalityCode,
        provinceCode: 'CMN',
        createdAt: now,
        details: {
          fromState: currentState,
          toState: WorkflowState.Resolved,
          resolutionNotes: resolutionNotes ?? null,
        },
      })
    })

    return { success: true }
  }
)
