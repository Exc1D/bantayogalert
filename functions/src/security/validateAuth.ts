/**
 * Auth validation middleware for Cloud Functions.
 *
 * Validates that callers have appropriate role and municipality scope
 * before processing write operations.
 */

import * as functions from 'firebase-functions'
import { isSuperadmin, isMunicipalAdmin } from '../auth/claims'

/**
 * Validate that the caller is a superadmin.
 * Throws permission-denied if not.
 *
 * @param context - The CallableContext from the Cloud Function
 */
export function validateSuperadmin(context: functions.https.CallableContext): void {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required')
  }

  if (!isSuperadmin(context.auth.token)) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Superadmin access required'
    )
  }
}

/**
 * Validate that the caller is a municipal admin for the specified municipality
 * OR a superadmin.
 * Throws permission-denied if not.
 *
 * @param context - The CallableContext from the Cloud Function
 * @param municipalityCode - The municipality code to validate against
 */
export function validateMunicipalAdmin(
  context: functions.https.CallableContext,
  municipalityCode: string
): void {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required')
  }

  const isAdmin =
    isSuperadmin(context.auth.token) ||
    isMunicipalAdmin(context.auth.token, municipalityCode)

  if (!isAdmin) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Admin access required for this municipality'
    )
  }
}

/**
 * Validate that the caller is authenticated.
 * Throws unauthenticated if not.
 *
 * @param context - The CallableContext from the Cloud Function
 */
export function validateAuthenticated(context: functions.https.CallableContext): void {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required')
  }
}

/**
 * Validate write scope for a document creation/update.
 *
 * Superadmin can write to any municipality.
 * Municipal admin can only write to their own municipality.
 * Citizens can only write to their own documents (handled by reporterId check).
 *
 * @param context - The CallableContext from the Cloud Function
 * @param dataMunicipalityCode - Municipality code from the data being written
 * @param resourceMunicipalityCode - Municipality code of the existing resource (null for creates)
 */
export function validateWriteScope(
  context: functions.https.CallableContext,
  dataMunicipalityCode: string | null,
  resourceMunicipalityCode: string | null
): void {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required')
  }

  const claims = context.auth.token

  // Superadmin can write anywhere
  if (isSuperadmin(claims)) {
    return
  }

  // For new documents (creates), the dataMunicipalityCode must match caller's scope
  if (resourceMunicipalityCode === null) {
    // Create operation
    if (dataMunicipalityCode === null) {
      // No municipality scope required for this document type
      return
    }

    // Municipal admin can only create in their municipality
    if (!isMunicipalAdmin(claims, dataMunicipalityCode)) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Cannot create document in this municipality'
      )
    }

    return
  }

  // Update operation - resource already has a municipality
  // Caller must be admin of that municipality
  if (!isMunicipalAdmin(claims, resourceMunicipalityCode)) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Admin access required for this municipality'
    )
  }
}

/**
 * Validate that the caller has the expected role.
 *
 * @param context - The CallableContext from the Cloud Function
 * @param requiredRole - The role required for this operation
 */
export function validateRole(
  context: functions.https.CallableContext,
  requiredRole: 'citizen' | 'municipal_admin' | 'provincial_superadmin'
): void {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required')
  }

  if (context.auth.token.role !== requiredRole) {
    throw new functions.https.HttpsError(
      'permission-denied',
      `Required role: ${requiredRole}`
    )
  }
}
