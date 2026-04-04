import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import { FieldValue } from 'firebase-admin/firestore'
import { validateMunicipalAdmin } from '../security/validateAuth'

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

  return { success: true, isActive: !deactivate }
})
