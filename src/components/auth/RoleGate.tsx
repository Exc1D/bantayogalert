import { ReactNode } from 'react'
import { useAuth } from '../../contexts/AuthContext'

/**
 * Valid roles in the system
 */
export type Role = 'citizen' | 'municipal_admin' | 'provincial_superadmin'

/**
 * Municipality codes for Camarines Norte
 */
export type MunicipalityCode =
  | 'basud'
  | 'daet'
  | 'josepanganiban'
  | 'labo'
  | 'mercedes'
  | 'paracale'
  | 'sanlorenzo'
  | 'sanvicente'
  | 'talisay'
  | 'vinzales'
  | 'capalonga'
  | 'staelena'

interface RoleGateProps {
  /** Content to render if authorized */
  children: ReactNode
  /** Allowed roles - single role or array of roles */
  roles: Role | Role[]
  /** Optional - if provided, also checks user.municipality matches */
  municipality?: MunicipalityCode
  /** Optional fallback content to show if not authorized (default: null) */
  fallback?: ReactNode
  /** If true, also requires user to be authenticated */
  requireAuth?: boolean
}

/**
 * RoleGate - Conditional rendering based on user role and municipality scope.
 *
 * Use cases:
 * - Hide admin-only UI from citizens
 * - Restrict municipal admin content to specific municipality
 * - Show province-wide content only to provincial admins
 *
 * @example
 * // Admin-only content
 * <RoleGate roles={['municipal_admin', 'provincial_superadmin']}>
 *   <AdminPanel />
 * </RoleGate>
 *
 * @example
 * // Municipality-scoped content
 * <RoleGate roles={['municipal_admin']} municipality="daet">
 *   <DaetAdminContent />
 * </RoleGate>
 *
 * @example
 * // With fallback for unauthorized users
 * <RoleGate roles={['provincial_superadmin']} fallback={<p>Admin only</p>}>
 *   <ApprovalPanel />
 * </RoleGate>
 */
export function RoleGate({
  children,
  roles,
  municipality,
  fallback = null,
  requireAuth = false,
}: RoleGateProps) {
  const { user, loading } = useAuth()

  // Handle loading state
  if (loading) {
    return null
  }

  // Handle requireAuth - user must be logged in
  if (requireAuth && user === null) {
    return <>{fallback}</>
  }

  // If no roles specified, render children (auth check only via requireAuth)
  if (!roles) {
    return <>{children}</>
  }

  // Normalize roles to array
  const allowedRoles = Array.isArray(roles) ? roles : [roles]

  // Check role authorization
  const hasRole = user !== null && user.role !== null && allowedRoles.includes(user.role)

  // Check municipality scope if provided
  const hasMunicipalityAccess = !municipality || user?.municipality === municipality

  // Render children if authorized, otherwise render fallback
  if (hasRole && hasMunicipalityAccess) {
    return <>{children}</>
  }

  return <>{fallback}</>
}
