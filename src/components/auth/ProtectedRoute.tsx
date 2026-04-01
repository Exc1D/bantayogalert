import { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import type { Role } from './RoleGate'

interface ProtectedRouteProps {
  /** Content to render if authorized */
  children: ReactNode
  /** Optional - if provided, also checks user has one of these roles */
  roles?: Role[]
  /** Redirect destination when not authorized (default: /signin) */
  redirectTo?: string
  /** Optional custom loading component */
  loadingComponent?: ReactNode
}

/**
 * ProtectedRoute - Guards authenticated routes and redirects unauthenticated users.
 *
 * Use cases:
 * - Protect admin-only pages from unauthenticated access
 * - Redirect users to sign-in when session expired
 * - Role-based route protection for admin pages
 *
 * @example
 * // Require authentication only
 * <ProtectedRoute>
 *   <Dashboard />
 * </ProtectedRoute>
 *
 * @example
 * // Require specific roles
 * <ProtectedRoute roles={['municipal_admin', 'provincial_superadmin']}>
 *   <AdminPanel />
 * </ProtectedRoute>
 *
 * @example
 * // Custom redirect and loading
 * <ProtectedRoute redirectTo="/login" loadingComponent={<Spinner />}>
 *   <Profile />
 * </ProtectedRoute>
 */
export function ProtectedRoute({
  children,
  roles,
  redirectTo = '/signin',
  loadingComponent = null,
}: ProtectedRouteProps) {
  const { user, loading } = useAuth()

  // Show loading state while checking authentication
  if (loading) {
    return <>{loadingComponent}</>
  }

  // Redirect to sign-in if user is not authenticated
  if (user === null) {
    return <Navigate to={redirectTo} replace />
  }

  // If roles specified, check if user has required role
  if (roles && roles.length > 0) {
    const hasRequiredRole = user.role !== null && roles.includes(user.role)

    if (!hasRequiredRole) {
      // Redirect to home or unauthorized page - using home for now
      return <Navigate to="/" replace />
    }
  }

  // User is authorized, render children
  return <>{children}</>
}
