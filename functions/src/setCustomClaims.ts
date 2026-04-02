import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'

/**
 * setCustomClaims - Callable Cloud Function for setting Firebase Auth custom claims.
 * SEC-06 requirement: Custom claims set exclusively by privileged Cloud Function (never client-side).
 *
 * Only provincial_superadmin can call this function.
 * Provincial superadmin can only grant municipal_admin for users in their own municipality.
 */
export const setCustomClaims = functions.https.onCall(async (data, context) => {
  // Only provincial_superadmin can call this
  if (!context.auth || context.auth.token.role !== 'provincial_superadmin') {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only provincial superadmin can set custom claims'
    )
  }

  const { uid, role, municipality } = data

  if (!uid || !role) {
    throw new functions.https.HttpsError('invalid-argument', 'uid and role are required')
  }

  // Validate role
  const validRoles = ['citizen', 'municipal_admin', 'provincial_superadmin']
  if (!validRoles.includes(role)) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid role')
  }

  // For municipal_admin, municipality is required
  if (role === 'municipal_admin' && !municipality) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'municipality is required for municipal_admin'
    )
  }

  // SCOPE VALIDATION: Provincial admin can only set municipal_admin claims for users
  // in their own municipality. This prevents cross-municipality privilege escalation.
  if (role === 'municipal_admin' && municipality) {
    const callerMunicipality = context.auth.token.municipality
    if (callerMunicipality && municipality !== callerMunicipality) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Can only grant municipal_admin access for your own municipality'
      )
    }
  }

  // Validate municipality code if provided
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
  if (municipality && !validMunicipalities.includes(municipality)) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid municipality')
  }

  // Set custom claims
  await admin.auth().setCustomUserClaims(uid, {
    role,
    municipality: municipality || null,
  })

  // Also update user document in Firestore
  const db = admin.firestore()
  await db
    .collection('users')
    .doc(uid)
    .update({
      role,
      municipality: municipality || null,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    })

  functions.logger.info(
    `Custom claims set for user ${uid}: role=${role}, municipality=${municipality}`
  )

  return { success: true }
})
