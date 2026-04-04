import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import { FieldValue } from 'firebase-admin/firestore'
import { validateMunicipalAdmin } from '../security/validateAuth'
import { appendAuditEntry } from '../audit/shared'
import type { AuditActorRole } from '../types/audit'

export const deactivateContact = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required')
  }

  const { id, deactivate } = data as { id: string; deactivate: boolean }

  if (!id) {
    throw new functions.https.HttpsError('invalid-argument', 'Contact ID is required')
  }

  if (typeof deactivate !== 'boolean') {
    throw new functions.https.HttpsError('invalid-argument', 'deactivate must be a boolean')
  }

  const db = admin.firestore()
  const contactRef = db.collection('contacts').doc(id)

  const contactDoc = await contactRef.get()
  if (!contactDoc.exists) {
    throw new functions.https.HttpsError('not-found', 'Contact not found')
  }

  const contactData = contactDoc.data()!
  validateMunicipalAdmin(context, contactData.municipalityCode)

  await contactRef.update({
    isActive: !deactivate,  // if deactivate=true, set isActive=false; if deactivate=false, reactivate
    updatedAt: FieldValue.serverTimestamp(),
  })

  await appendAuditEntry(null, db, {
    entityType: 'contact',
    entityId: id,
    action: 'contact_deactivate',
    actorUid: context.auth.uid,
    actorRole: (context.auth.token.role as AuditActorRole | undefined) ?? 'citizen',
    municipalityCode: contactData.municipalityCode as string,
    provinceCode: 'CMN',
    details: {
      deactivate,
      isActive: !deactivate,
    },
  })

  return { success: true, isActive: !deactivate }
})
