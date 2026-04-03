import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/hooks'
import { UserRole } from '../../types/user'

/**
 * ProtectedRoute - Redirects to /auth/login if not authenticated.
 * Renders children once authenticated.
 */
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isLoading, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/auth/login')
    }
  }, [isLoading, isAuthenticated, navigate])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return <>{children}</>
}

/**
 * AdminRoute - Redirects to /app if authenticated but not an admin.
 * Renders children if user has municipal_admin or provincial_superadmin role.
 */
export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isLoading, isAuthenticated, customClaims } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isLoading && isAuthenticated && customClaims) {
      const allowedRoles = [UserRole.MunicipalAdmin, UserRole.ProvincialSuperadmin]
      if (!allowedRoles.includes(customClaims.role)) {
        navigate('/app')
      }
    }
  }, [isLoading, isAuthenticated, customClaims, navigate])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  if (!customClaims) {
    return null
  }

  const allowedRoles = [UserRole.MunicipalAdmin, UserRole.ProvincialSuperadmin]
  if (!allowedRoles.includes(customClaims.role)) {
    return null
  }

  return <>{children}</>
}
