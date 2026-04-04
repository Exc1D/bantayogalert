import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import { isSuperadmin } from '../auth/claims'

interface GetContactsRequest {
  municipalityCode?: string  // optional filter
  includeInactive?: boolean  // default false (only active contacts returned)
}

export const getContacts = functions.https.onCall(async (data: GetContactsRequest, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required')
  }

  const { municipalityCode, includeInactive = false } = data
  const claims = context.auth.token

  const db = admin.firestore()
  let query: admin.firestore.Query = db.collection('contacts')

  // Municipal scope enforcement
  if (!isSuperadmin(claims)) {
    // Municipal admin can only see their own municipality's contacts
    const adminMunicipality = claims.municipalityCode
    if (!adminMunicipality) {
      throw new functions.https.HttpsError('permission-denied', 'Municipality scope required')
    }
    query = query.where('municipalityCode', '==', adminMunicipality)
  } else if (municipalityCode) {
    // Superadmin can optionally filter by municipality
    query = query.where('municipalityCode', '==', municipalityCode)
  }

  // Filter inactive contacts unless explicitly requested
  if (!includeInactive) {
    query = query.where('isActive', '==', true)
  }

  query = query.orderBy('name', 'asc')

  const snapshot = await query.get()

  const contacts = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }))

  return { contacts }
})
