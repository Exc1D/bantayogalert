/**
 * triageDispatch Cloud Function
 *
 * Transitions a report from verified → dispatched.
 * Captures ContactSnapshot and stores routing information.
 */
import * as functions from 'firebase-functions'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { z } from 'zod'

import { validateAuthenticated, validateMunicipalAdmin } from '../security'
import { buildActivityEntry, validateVersion, validateTransition } from './shared'
import { WORKFLOW_TO_OWNER_STATUS } from '../types/status'
import { WorkflowState } from '../types/report'
import type { ContactSnapshot } from '../types/contact'

const DispatchSchema = z.object({
  reportId: z.string(),
  expectedVersion: z.number(),
  contactId: z.string(),
  routingDestination: z.string().optional(),
  dispatchNotes: z.string().optional(),
})

export const triageDispatch = functions.https.onCall(
  async (data: unknown, context: functions.https.CallableContext) => {
    validateAuthenticated(context)

    const parsed = DispatchSchema.safeParse(data)
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
      validateTransition(currentState, WorkflowState.Dispatched, reportId)

      // Fetch the contact to build ContactSnapshot
      const contactDoc = await tx.get(db.collection('contacts').doc(contactId))
      if (!contactDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Contact not found')
      }
      const contactData = contactDoc.data()!

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
      const entry = buildActivityEntry('dispatched', claims.uid as string, {
        contactName: snapshot.name,
        contactAgency: snapshot.agency,
        routingDestination,
        dispatchNotes,
      })

      tx.update(db.collection('reports').doc(reportId), {
        workflowState: WorkflowState.Dispatched,
        updatedAt: new Date().toISOString(),
      })

      tx.update(db.collection('report_private').doc(reportId), {
        ownerStatus: WORKFLOW_TO_OWNER_STATUS[WorkflowState.Dispatched],
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
    })

    return { success: true }
  }
)
