import * as admin from 'firebase-admin'
import { FieldValue } from 'firebase-admin/firestore'

/**
 * UserRole values for Cloud Functions (Node runtime, cannot import from src/types)
 */
const UserRole = {
  Citizen: 'citizen',
  MunicipalAdmin: 'municipal_admin',
  ProvincialSuperadmin: 'provincial_superadmin',
} as const

export type UserRole = (typeof UserRole)[keyof typeof UserRole]

export interface CustomClaims {
  role: UserRole
  municipalityCode: string | null
  provinceCode: 'CMN'
}

/**
 * Set custom claims on both Firestore user document AND ID token.
 * Both must succeed for the operation to be considered complete.
 *
 * @param uid - Firebase Auth user UID
 * @param claims - Custom claims to set
 */
export async function setCustomClaims(
  uid: string,
  claims: CustomClaims
): Promise<{ success: true }> {
  const db = admin.firestore()

  // Update Firestore user document
  await db.doc(`users/${uid}`).set(
    {
      role: claims.role,
      municipalityCode: claims.municipalityCode,
      provinceCode: claims.provinceCode,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  )

  // Set custom claims on ID token
  await admin.auth().setCustomUserClaims(uid, claims)

  return { success: true }
}

/**
 * Verify custom claims structure and optionally check required role.
 */
export function verifyCustomClaims(
  claims: CustomClaims,
  requiredRole?: UserRole
): { valid: true } | { valid: false; reason: string } {
  if (!claims || typeof claims.role !== 'string') {
    return { valid: false, reason: 'Missing or invalid role' }
  }
  if (typeof claims.provinceCode !== 'string') {
    return { valid: false, reason: 'Missing or invalid provinceCode' }
  }
  if (claims.municipalityCode !== null && typeof claims.municipalityCode !== 'string') {
    return { valid: false, reason: 'municipalityCode must be string or null' }
  }

  if (requiredRole && claims.role !== requiredRole) {
    return { valid: false, reason: `Role must be ${requiredRole}` }
  }

  return { valid: true }
}

/**
 * Check if claims indicate a provincial superadmin.
 */
export function isSuperadmin(claims: { role: string }): boolean {
  return claims.role === UserRole.ProvincialSuperadmin
}

/**
 * Check if claims indicate a municipal admin for a specific municipality.
 */
export function isMunicipalAdmin(
  claims: { role: string; municipalityCode: string | null },
  municipalityCode: string
): boolean {
  return (
    claims.role === UserRole.MunicipalAdmin &&
    claims.municipalityCode === municipalityCode
  )
}
