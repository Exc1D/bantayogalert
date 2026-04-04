import { Navigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth/hooks'
import { UserRole } from '@/types/user'
import { ContactsPage } from '@/components/contacts/ContactsPage'

/**
 * ContactsRoute - Admin-only route component.
 * Redirects unauthenticated users to /auth/login.
 * Redirects non-admin users to /app.
 * Renders ContactsPage for municipal_admin and provincial_superadmin roles.
 */
export default function ContactsRoute() {
  const { isLoading, isAuthenticated, customClaims } = useAuth()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />
  }

  const role = customClaims?.role ?? UserRole.Citizen
  const isAdmin = role === UserRole.MunicipalAdmin || role === UserRole.ProvincialSuperadmin

  if (!isAdmin) {
    return <Navigate to="/app" replace />
  }

  return <ContactsPage />
}
