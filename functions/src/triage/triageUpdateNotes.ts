/**
 * triageUpdateNotes Cloud Function
 *
 * Saves internal notes on a report without changing workflow state.
 * Admin-only — never visible to the reporter.
 * Non-state-change mutation with optimistic concurrency.
 */
import * as functions from 'firebase-functions'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { z } from 'zod'

import { validateAuthenticated, validateMunicipalAdmin } from '../security'
import { buildActivityEntry, validateVersion } from './shared'
import { appendAuditEntry } from '../audit/shared'
import type { AuditActorRole } from '../types/audit'

const UpdateNotesSchema = z.object({
  reportId: z.string(),
  expectedVersion: z.number(),
  internalNotes: z.string().max(5000),
})

export const triageUpdateNotes = functions.https.onCall(
  async (data: unknown, context: functions.https.CallableContext) => {
    validateAuthenticated(context)

    const parsed = UpdateNotesSchema.safeParse(data)
    if (!parsed.success) {
      throw new functions.https.HttpsError('invalid-argument', 'Invalid input', parsed.error.issues)
    }
    const { reportId, expectedVersion, internalNotes } = parsed.data

    const db = getFirestore()

    await db.runTransaction(async (tx) => {
      const opsDoc = await tx.get(db.collection('report_ops').doc(reportId))
      if (!opsDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Report operations document not found')
      }
      const opsData = opsDoc.data()!
      validateVersion(opsData.version, expectedVersion, reportId)

      const municipalityCode = opsData.municipalityCode as string
      validateMunicipalAdmin(context, municipalityCode)

      const claims = context.auth!.token
      const now = new Date().toISOString()
      const entry = buildActivityEntry('notes_updated', claims.uid as string, {
        notesLength: internalNotes.length,
      })

      // This does NOT update reports/{id} — internalNotes is admin-only
      tx.update(db.collection('report_private').doc(reportId), {
        internalNotes,
        activityLog: FieldValue.arrayUnion(entry),
      })

      tx.update(db.collection('report_ops').doc(reportId), {
        version: (opsData.version ?? 1) + 1,
        activity: FieldValue.arrayUnion(entry),
      })

      await appendAuditEntry(tx, db, {
        entityType: 'report',
        entityId: reportId,
        action: 'triage_update_notes',
        actorUid: context.auth!.uid,
        actorRole: (claims.role as AuditActorRole | undefined) ?? 'citizen',
        municipalityCode,
        provinceCode: 'CMN',
        createdAt: now,
        details: {
          notesLength: internalNotes.length,
        },
      })
    })

    return { success: true }
  }
)
