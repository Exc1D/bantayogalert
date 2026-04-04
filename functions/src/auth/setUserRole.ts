import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import { setCustomClaims, isSuperadmin, type CustomClaims } from './claims'
import { appendAuditEntry } from '../audit/shared'
import type { AuditActorRole } from '../types/audit'

const VALID_ROLES = ['citizen', 'municipal_admin', 'provincial_superadmin']
const MUNICIPALITY_CODE_REGEX = /^[A-Z]{3,4}$/

interface SetUserRoleRequest {
  uid: string
  role: string
  municipalityCode: string | null
}

export const setUserRole = functions.https.onCall(
  async (data: SetUserRoleRequest, context) => {
    // Validate caller authentication
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'Caller must be authenticated'
      )
    }

    const callerClaims = context.auth.token

    // Verify caller is superadmin
    if (!isSuperadmin(callerClaims)) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Only superadmins can assign roles'
      )
    }

    // Validate required fields
    if (!data.uid) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'uid is required'
      )
    }

    if (!data.role) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'role is required'
      )
    }

    // Validate role value
    if (!VALID_ROLES.includes(data.role)) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}`
      )
    }

    // Role-specific municipalityCode validation
    if (data.role === 'municipal_admin') {
      if (!data.municipalityCode) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'municipalityCode required for municipal_admin role'
        )
      }
      if (!MUNICIPALITY_CODE_REGEX.test(data.municipalityCode)) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'municipalityCode must be 3-4 uppercase letters'
        )
      }
    }

    if (
      (data.role === 'citizen' || data.role === 'provincial_superadmin') &&
      data.municipalityCode !== null
    ) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'municipalityCode must be null for citizen and superadmin roles'
      )
    }

    // Build claims object
    const claims: CustomClaims = {
      role: data.role as CustomClaims['role'],
      municipalityCode: data.municipalityCode,
      provinceCode: 'CMN',
    }

    // Set claims atomically on Firestore doc and ID token
    await setCustomClaims(data.uid, claims)

    await appendAuditEntry(null, admin.firestore(), {
      entityType: 'user',
      entityId: data.uid,
      action: 'user_role_set',
      actorUid: context.auth.uid,
      actorRole:
        (callerClaims.role as AuditActorRole | undefined) ??
        'provincial_superadmin',
      municipalityCode: data.municipalityCode,
      provinceCode: claims.provinceCode,
      details: {
        role: data.role,
        municipalityCode: data.municipalityCode,
      },
    })

    return {
      success: true,
      role: claims.role,
      municipalityCode: claims.municipalityCode,
      provinceCode: claims.provinceCode,
    }
  }
)
