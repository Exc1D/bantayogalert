/**
 * triageUpdatePriority Cloud Function
 *
 * Sets priority (1-5) on a report without changing workflow state.
 * Non-state-change mutation with optimistic concurrency.
 */
import * as functions from 'firebase-functions'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { z } from 'zod'

import { validateAuthenticated, validateMunicipalAdmin } from '../security'
import { buildActivityEntry, validateVersion } from './shared'
import { appendAuditEntry } from '../audit/shared'
import type { AuditActorRole } from '../types/audit'

const UpdatePrioritySchema = z.object({
  reportId: z.string(),
  expectedVersion: z.number(),
  priority: z.number().int().min(1).max(5),
})

export const triageUpdatePriority = functions.https.onCall(
  async (data: unknown, context: functions.https.CallableContext) => {
    validateAuthenticated(context)

    const parsed = UpdatePrioritySchema.safeParse(data)
    if (!parsed.success) {
      throw new functions.https.HttpsError('invalid-argument', 'Invalid input', parsed.error.issues)
    }
    const { reportId, expectedVersion, priority } = parsed.data

    const db = getFirestore()

    await db.runTransaction(async (tx) => {
      const opsDoc = await tx.get(db.collection('report_ops').doc(reportId))
      if (!opsDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Report operations document not found')
      }
      const opsData = opsDoc.data()!
      validateVersion(opsData.version, expectedVersion, reportId)

      // Read report_private to get current priority for activity log
      const privateDoc = await tx.get(db.collection('report_private').doc(reportId))
      if (!privateDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Report private document not found')
      }
      const privateData = privateDoc.data()!
      const previousPriority = privateData.priority

      // Get municipalityCode from report_ops (written at submit time)
      const municipalityCode = opsData.municipalityCode as string
      validateMunicipalAdmin(context, municipalityCode)

      const claims = context.auth!.token
      const now = new Date().toISOString()
      const entry = buildActivityEntry('priority_updated', claims.uid as string, {
        previousPriority,
        newPriority: priority,
      })

      // This does NOT update reports/{id} — no workflowState change
      tx.update(db.collection('report_private').doc(reportId), {
        priority,
        activityLog: FieldValue.arrayUnion(entry),
      })

      tx.update(db.collection('report_ops').doc(reportId), {
        version: (opsData.version ?? 1) + 1,
        activity: FieldValue.arrayUnion(entry),
      })

      await appendAuditEntry(tx, db, {
        entityType: 'report',
        entityId: reportId,
        action: 'triage_update_priority',
        actorUid: context.auth!.uid,
        actorRole: (claims.role as AuditActorRole | undefined) ?? 'citizen',
        municipalityCode,
        provinceCode: 'CMN',
        createdAt: now,
        details: {
          previousPriority: previousPriority ?? null,
          newPriority: priority,
        },
      })
    })

    return { success: true }
  }
)
