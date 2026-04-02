import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'

/**
 * createAdminRequest - Callable Cloud Function for users to request municipal_admin role.
 * Users can only request admin access for their own municipality.
 * Creates a pending request in the adminRequests collection.
 */
export const createAdminRequest = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be signed in')
  }

  const uid = context.auth.uid
  const { municipality, phone } = data

  if (!municipality) {
    throw new functions.https.HttpsError('invalid-argument', 'municipality is required')
  }

  // Validate municipality code
  const validMunicipalities = [
    'basud',
    'daet',
    'josepanganiban',
    'labo',
    'mercedes',
    'paracale',
    'sanlorenzo',
    'sanvicente',
    'talisay',
    'vinzales',
    'capalonga',
    'staelena',
  ]
  if (!validMunicipalities.includes(municipality)) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid municipality')
  }

  // Users can only request admin access for their own municipality.
  // This prevents malicious users from requesting access for other municipalities.
  const tokenMunicipality = context.auth.token.municipality
  if (!tokenMunicipality || tokenMunicipality !== municipality) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'You can only request admin access for your own municipality'
    )
  }

  const db = admin.firestore()

  // Check for existing pending request
  const existing = await db
    .collection('adminRequests')
    .where('uid', '==', uid)
    .where('status', '==', 'pending')
    .get()

  if (!existing.empty) {
    throw new functions.https.HttpsError('already-exists', 'Pending request already exists')
  }

  // Get user details from Firebase Auth
  const userRecord = await admin.auth().getUser(uid)

  // Create request
  await db.collection('adminRequests').add({
    uid,
    email: userRecord.email || '',
    displayName: userRecord.displayName || '',
    municipality,
    phone: phone || null,
    requestedRole: 'municipal_admin',
    status: 'pending',
    requestedAt: admin.firestore.FieldValue.serverTimestamp(),
  })

  functions.logger.info(`Admin request created for user ${uid} in municipality ${municipality}`)

  return { success: true }
})

/**
 * reviewAdminRequest - Callable Cloud Function for provincial_superadmin to approve/reject requests.
 * Only callable by provincial_superadmin.
 */
export const reviewAdminRequest = functions.https.onCall(async (data, context) => {
  if (!context.auth || context.auth.token.role !== 'provincial_superadmin') {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only provincial superadmin can review admin requests'
    )
  }

  const { requestId, action, rejectionReason } = data

  if (!requestId || !action) {
    throw new functions.https.HttpsError('invalid-argument', 'requestId and action are required')
  }

  if (!['approve', 'reject'].includes(action)) {
    throw new functions.https.HttpsError('invalid-argument', 'action must be "approve" or "reject"')
  }

  const db = admin.firestore()
  const requestRef = db.collection('adminRequests').doc(requestId)

  const requestDoc = await requestRef.get()

  if (!requestDoc.exists) {
    throw new functions.https.HttpsError('not-found', 'Admin request not found')
  }

  const requestData = requestDoc.data()!

  if (requestData.status !== 'pending') {
    throw new functions.https.HttpsError(
      'failed-precondition',
      'Request has already been processed'
    )
  }

  if (action === 'approve') {
    // Set custom claims for the user
    await admin.auth().setCustomUserClaims(requestData.uid, {
      role: 'municipal_admin',
      municipality: requestData.municipality,
    })

    // Update user document in Firestore
    await db.collection('users').doc(requestData.uid).update({
      role: 'municipal_admin',
      municipality: requestData.municipality,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    })
  }

  // Update the request status
  await requestRef.update({
    status: action === 'approve' ? 'approved' : 'rejected',
    reviewedAt: admin.firestore.FieldValue.serverTimestamp(),
    reviewedBy: context.auth.uid,
    rejectionReason: action === 'reject' ? rejectionReason || null : null,
  })

  functions.logger.info(`Admin request ${requestId} ${action}d by ${context.auth.uid}`)

  return { success: true }
})
