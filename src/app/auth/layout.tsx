import { type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { PrivateRouteMeta } from '@/lib/seo/PrivateRouteMeta'

interface AuthLayoutProps {
  children: ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <>
      <PrivateRouteMeta title="Account access" />
      <main className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <Link
              to="/"
              className="text-sm text-blue-600 hover:text-blue-500 font-medium"
            >
              Back to home
            </Link>
          </div>
          {children}
        </div>
      </main>
    </>
  )
}
