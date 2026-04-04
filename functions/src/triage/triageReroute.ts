/**
 * triageReroute Cloud Function
 *
 * Updates the assigned contact on a dispatched or in_progress report.
 * Does NOT change workflowState — only updates assignedContactSnapshot and related fields.
 * Only allowed on reports that are dispatched or in_progress.
 */
import * as functions from 'firebase-functions'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { z } from 'zod'

import { validateAuthenticated, validateMunicipalAdmin } from '../security'
import { buildActivityEntry, validateVersion } from './shared'
import { WorkflowState } from '../types/report'
import type { ContactSnapshot } from '../types/contact'
import { appendAuditEntry } from '../audit/shared'
import type { AuditActorRole } from '../types/audit'

const RerouteSchema = z.object({
  reportId: z.string(),
  expectedVersion: z.number(),
  contactId: z.string(),
  routingDestination: z.string().optional(),
  dispatchNotes: z.string().optional(),
})

const REROUTE_ALLOWED_STATES: WorkflowState[] = [
  WorkflowState.Dispatched,
  WorkflowState.InProgress,
]

export const triageReroute = functions.https.onCall(
  async (data: unknown, context: functions.https.CallableContext) => {
    validateAuthenticated(context)

    const parsed = RerouteSchema.safeParse(data)
    if (!parsed.success) {
      throw new functions.https.HttpsError('invalid-argument', 'Invalid input', parsed.error.issues)
    }
    const { reportId, expectedVersion, contactId, routingDestination, dispatchNotes } = parsed.data

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

      // Validate: report must be dispatched or in_progress
      if (!REROUTE_ALLOWED_STATES.includes(currentState)) {
        throw new functions.https.HttpsError(
          'failed-precondition',
          `Cannot reroute a report in '${currentState}' state. Only dispatched or in_progress reports can be rerouted.`
        )
      }

      // Fetch the contact to build new ContactSnapshot
      const contactDoc = await tx.get(db.collection('contacts').doc(contactId))
      if (!contactDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Contact not found')
      }
      const contactData = contactDoc.data()!

      // Get previous contact info for activity log
      const previousContactId = opsData.assignedContactId

      const snapshot: ContactSnapshot = {
        contactId: contactData.id ?? contactId,
        name: contactData.name,
        agency: contactData.agency,
        type: contactData.type,
        phones: contactData.phones ?? [],
        email: contactData.email,
        municipalityCode: contactData.municipalityCode,
      }

      const claims = context.auth!.token
      const now = new Date().toISOString()
      const entry = buildActivityEntry('rerouted', claims.uid as string, {
        previousContactId,
        newContactId: contactId,
        routingDestination,
        dispatchNotes,
      })

      // Note: This is the only triage CF that does NOT update reports/{id}
      // It only updates report_private and report_ops

      tx.update(db.collection('report_private').doc(reportId), {
        activityLog: FieldValue.arrayUnion(entry),
      })

      tx.update(db.collection('report_ops').doc(reportId), {
        version: (opsData.version ?? 1) + 1,
        assignedContactSnapshot: snapshot,
        assignedContactId: contactId,
        routingDestination: routingDestination ?? null,
        dispatchNotes: dispatchNotes ?? null,
        activity: FieldValue.arrayUnion(entry),
      })

      await appendAuditEntry(tx, db, {
        entityType: 'report',
        entityId: reportId,
        action: 'triage_reroute',
        actorUid: context.auth!.uid,
        actorRole: (claims.role as AuditActorRole | undefined) ?? 'citizen',
        municipalityCode,
        provinceCode: 'CMN',
        createdAt: now,
        details: {
          currentState,
          previousContactId: previousContactId ?? null,
          newContactId: contactId,
          contactName: snapshot.name,
          routingDestination: routingDestination ?? null,
          dispatchNotes: dispatchNotes ?? null,
        },
      })
    })

    return { success: true }
  }
)
