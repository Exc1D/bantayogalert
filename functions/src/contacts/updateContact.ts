import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import { FieldValue } from 'firebase-admin/firestore'
import { UpdateContactSchema } from '../types/contact'
import { sanitizeContactInput } from '../security/sanitize'
import { validateMunicipalAdmin } from '../security/validateAuth'
import { appendAuditEntry } from '../audit/shared'
import type { AuditActorRole } from '../types/audit'

export const updateContact = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required')
  }

  const { id, ...updates } = data as { id: string } & Record<string, unknown>

  if (!id) {
    throw new functions.https.HttpsError('invalid-argument', 'Contact ID is required')
  }

  // Validate input
  const parseResult = UpdateContactSchema.safeParse(updates)
  if (!parseResult.success) {
    throw new functions.https.HttpsError('invalid-argument', parseResult.error.message)
  }

  const db = admin.firestore()
  const contactRef = db.collection('contacts').doc(id)

  const contactDoc = await contactRef.get()
  if (!contactDoc.exists) {
    throw new functions.https.HttpsError('not-found', 'Contact not found')
  }

  const contactData = contactDoc.data()!
  const municipalityCode = contactData.municipalityCode

  // Municipal scope enforcement: caller must be admin of the contact's municipality
  validateMunicipalAdmin(context, municipalityCode)

  // Prevent changing municipalityCode (only superadmin should do this via delete+create)
  const sanitizedUpdates = sanitizeContactInput(updates) as Record<string, unknown>
  delete sanitizedUpdates.municipalityCode

  await contactRef.update({
    ...sanitizedUpdates,
    updatedAt: FieldValue.serverTimestamp(),
  })

  await appendAuditEntry(null, db, {
    entityType: 'contact',
    entityId: id,
    action: 'contact_update',
    actorUid: context.auth.uid,
    actorRole: (context.auth.token.role as AuditActorRole | undefined) ?? 'citizen',
    municipalityCode,
    provinceCode: 'CMN',
    details: {
      updatedFields: Object.keys(sanitizedUpdates).sort(),
    },
  })

  return { success: true }
})
