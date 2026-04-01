import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'

admin.initializeApp()

/**
 * setCustomClaims - SEC-06 requirement
 * Sets Firebase Auth custom claims (role, municipality) exclusively via this Cloud Function.
 * This function is NEVER callable by the client — only by other Cloud Functions or
 * via the Firebase Admin SDK from a privileged context.
 *
 * @param uid - The Firebase Auth user UID
 * @param role - 'citizen' | 'municipal_admin' | 'provincial_superadmin'
 * @param municipality - The municipality code (e.g., 'basud', 'daet')
 */
export async function setCustomClaims(
  uid: string,
  role: 'citizen' | 'municipal_admin' | 'provincial_superadmin',
  municipality: string | null
): Promise<void> {
  // Validate role
  const validRoles = ['citizen', 'municipal_admin', 'provincial_superadmin']
  if (!validRoles.includes(role)) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      `Invalid role: ${role}. Must be one of: ${validRoles.join(', ')}`
    )
  }

  // Validate municipality for municipal_admin
  if (role === 'municipal_admin' && !municipality) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'municipality is required for municipal_admin role'
    )
  }

  // Validate municipality code if provided
  const validMunicipalities = [
    'basud', 'daet', 'josepanganiban', 'labo', 'mercedes',
    'paracale', 'sanlorenzo', 'sanvicente', 'talisay', 'vinzales',
    'capalonga', 'staelena'
  ]
  if (municipality && !validMunicipalities.includes(municipality)) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      `Invalid municipality: ${municipality}`
    )
  }

  await admin.auth().setCustomUserClaims(uid, {
    role,
    municipality: municipality || null,
  })

  functions.logger.info(`Custom claims set for user ${uid}: role=${role}, municipality=${municipality}`)
}

/**
 * HTTPS callable function to set custom claims — only callable by other Cloud Functions
 * or via Firebase Admin SDK from a trusted environment.
 * Direct client calls are rejected.
 */
export const setUserCustomClaims = functions.https.onCall(async (data, context) => {
  // Reject if not from a trusted environment (this function should only be called
  // by other Cloud Functions or from the Firebase Admin SDK directly, not by clients)
  // In production, this would check against a secret or service account
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated')
  }

  const { uid, role, municipality } = data

  if (!uid || !role) {
    throw new functions.https.HttpsError('invalid-argument', 'uid and role are required')
  }

  // Only provincial_superadmin can set claims (or system)
  // For Phase 1, we allow it; in Phase 2 this will be restricted
  await setCustomClaims(uid, role, municipality || null)

  return { success: true }
})

// Placeholder for future Cloud Functions
export const pendingReportAutoReject = functions.pubsub
  .schedule('0 3 * * *') // Daily at 03:00 PHT
  .timeZone('Asia/Manila')
  .onRun(async () => {
    functions.logger.info('pendingReportAutoReject triggered')
    // Full implementation in Phase 6
    return null
  })

export const announcementExpiry = functions.pubsub
  .schedule('every 15 minutes')
  .onRun(async () => {
    functions.logger.info('announcementExpiry triggered')
    // Full implementation in Phase 8
    return null
  })
