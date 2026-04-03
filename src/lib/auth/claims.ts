import { type IdTokenResult } from 'firebase/auth'
import { UserRole } from '../../types/user'

export interface CustomClaims {
  role: UserRole
  municipalityCode: string | null
  provinceCode: string
}

/**
 * Extract custom claims from an ID token result.
 * Returns null if token is null or claims are missing.
 */
export function extractCustomClaims(
  token: IdTokenResult | null
): CustomClaims | null {
  if (!token) return null

  const { claims } = token

  if (!claims.role) return null

  return {
    role: claims.role as UserRole,
    municipalityCode: claims.municipalityCode as string | null,
    provinceCode: claims.provinceCode as string,
  }
}

/**
 * Check if custom claims indicate a specific role.
 */
export function hasRole(
  customClaims: { role: string } | null,
  role: UserRole
): boolean {
  return customClaims?.role === role
}

/**
 * Check if custom claims indicate a municipal admin (with non-null municipality).
 */
export function isMunicipalAdmin(
  customClaims: { role: string; municipalityCode: string | null } | null
): boolean {
  return (
    customClaims?.role === UserRole.MunicipalAdmin &&
    customClaims?.municipalityCode !== null
  )
}

/**
 * Check if custom claims indicate a provincial superadmin.
 */
export function isSuperadmin(
  customClaims: { role: string } | null
): boolean {
  return customClaims?.role === UserRole.ProvincialSuperadmin
}

/**
 * Get the default claims for a new citizen user.
 */
export function getDefaultClaims(): CustomClaims {
  return {
    role: UserRole.Citizen,
    municipalityCode: null,
    provinceCode: 'CMN',
  }
}
