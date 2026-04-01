import { ReactNode } from 'react'
import { useAuth } from '../../contexts/AuthContext'

interface AuthGuardProps {
  /** Content to render when auth is resolved */
  children: ReactNode
  /** Optional custom loading indicator */
  loadingIndicator?: ReactNode
}

/**
 * AuthGuard - Handles auth loading state for page-level components.
 *
 * Unlike ProtectedRoute which redirects, AuthGuard simply waits for
 * auth initialization to complete before rendering children.
 *
 * Use cases:
 * - Wrap entire pages that need auth state before rendering
 * - Show loading state while checking authentication
 * - Content renders regardless of auth state once loaded
 *
 * @example
 * // Basic usage
 * <AuthGuard>
 *   <MyPage />
 * </AuthGuard>
 *
 * @example
 * // With custom loading indicator
 * <AuthGuard loadingIndicator={<PageSkeleton />}>
 *   <MyPage />
 * </AuthGuard>
 */
export function AuthGuard({ children, loadingIndicator }: AuthGuardProps) {
  const { loading } = useAuth()

  // Show loading state while auth is initializing
  if (loading) {
    return <>{loadingIndicator}</>
  }

  // Auth resolved - render children (regardless of auth state)
  return <>{children}</>
}
