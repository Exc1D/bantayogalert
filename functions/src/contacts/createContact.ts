import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import { FieldValue } from 'firebase-admin/firestore'
import { CreateContactSchema } from '../types/contact'
import { sanitizeContactInput } from '../security/sanitize'
import { validateMunicipalAdmin } from '../security/validateAuth'

export const createContact = functions.https.onCall(async (data, context) => {
  // Validate authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required')
  }

  // Parse and validate input
  const parseResult = CreateContactSchema.safeParse(data)
  if (!parseResult.success) {
    throw new functions.https.HttpsError('invalid-argument', parseResult.error.message)
  }

  const contactData = parseResult.data

  // Validate municipal scope: caller must be admin of the contact's municipality
  validateMunicipalAdmin(context, contactData.municipalityCode)

  // Sanitize input
  const sanitized = sanitizeContactInput(contactData as Record<string, unknown>)

  const db = admin.firestore()
  const contactRef = db.collection('contacts').doc()

  const now = FieldValue.serverTimestamp()

  await contactRef.set({
    id: contactRef.id,
    ...sanitized,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  })

  return {
    success: true,
    id: contactRef.id,
  }
})
