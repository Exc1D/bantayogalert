import { useNavigate } from 'react-router-dom'
import { useAuth, type CustomClaims } from './AuthProvider'
import { UserRole } from '../../types/user'

/**
 * useAuth - Returns auth context value.
 * Wraps the useAuth from AuthProvider for convenience.
 */
export { useAuth } from './AuthProvider'

/**
 * useRequireAuth - Redirects to /auth/login if not authenticated.
 * Returns null during loading to prevent flash.
 */
export function useRequireAuth() {
  const { user, isLoading, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  if (!isLoading && !isAuthenticated) {
    navigate('/auth/login')
    return null
  }

  return { user, isLoading, isAuthenticated }
}

/**
 * useRequireRole - Redirects to /app if authenticated but role not in allowedRoles.
 * Returns the custom claims if authorized, null otherwise.
 */
export function useRequireRole(allowedRoles: UserRole[]): CustomClaims | null {
  const { customClaims, isLoading, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  if (!isLoading && isAuthenticated && customClaims) {
    if (!allowedRoles.includes(customClaims.role)) {
      navigate('/app')
      return null
    }
    return customClaims
  }

  return null
}
