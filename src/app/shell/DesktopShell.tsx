import { useEffect, useState, type ReactNode } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { Bell, LayoutList, Shield, User, Users } from 'lucide-react'
import { MapContainerWrapper } from './MapContainerWrapper'
import { WorkspaceDrawer } from './WorkspaceDrawer'
import { ReportFeed } from '@/components/report/ReportFeed'
import { FilterBar } from '@/components/map/FilterBar'
import { useVerifiedReportsListener } from '@/hooks/useVerifiedReportsListener'
import { useAuth } from '@/lib/auth/hooks'
import { UserRole } from '@/types/user'

interface DesktopShellProps {
  children?: ReactNode
}

function NavRail() {
  const { customClaims } = useAuth()
  const role = customClaims?.role ?? UserRole.Citizen
  const isAdmin =
    role === UserRole.MunicipalAdmin ||
    role === UserRole.ProvincialSuperadmin

  const items = [
    {
      label: 'Feed',
      href: '/app',
      icon: LayoutList,
      visible: true,
    },
    {
      label: 'Alerts',
      href: '/app/alerts',
      icon: Bell,
      visible: true,
    },
    {
      label: 'Contacts',
      href: '/app/contacts',
      icon: Users,
      visible: isAdmin,
    },
    {
      label: 'Admin',
      href: '/app/admin',
      icon: Shield,
      visible: isAdmin,
    },
    {
      label: 'Profile',
      href: '/auth/profile',
      icon: User,
      visible: true,
    },
  ]

  return (
    <div className="w-20 flex-shrink-0 bg-slate-950 text-white border-r border-slate-800 flex flex-col items-center py-5 gap-3">
      <div className="w-11 h-11 rounded-2xl bg-red-600 flex items-center justify-center text-sm font-semibold">
        BA
      </div>
      {items.filter((item) => item.visible).map(({ href, icon: Icon, label }) => (
        <NavLink
          key={href}
          to={href}
          end={href === '/app'}
          className={({ isActive }) =>
            `w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${
              isActive
                ? 'bg-red-600 text-white'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`
          }
          aria-label={label}
          title={label}
        >
          <Icon className="w-5 h-5" />
        </NavLink>
      ))}
    </div>
  )
}

export function DesktopShell({ children }: DesktopShellProps) {
  const [mounted, setMounted] = useState(false)
  const location = useLocation()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Single shared listener at shell level — feeds both map (ReportMarkers) and feed (ReportFeed)
  useVerifiedReportsListener()

  if (!mounted) return null

  const routeBackedPanelPaths = new Set([
    '/app/alerts',
    '/app/contacts',
    '/app/admin',
    '/app/admin/alerts',
  ])

  const panelContent =
    routeBackedPanelPaths.has(location.pathname) && children ? (
      <div className="flex-1 overflow-y-auto p-4">{children}</div>
    ) : (
      <>
        <FilterBar />
        <ReportFeed />
      </>
    )

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <NavRail />
      <div className="flex-1 relative overflow-hidden flex">
        <div className="flex-[3] relative overflow-hidden">
          <MapContainerWrapper>
            <WorkspaceDrawer />
          </MapContainerWrapper>
        </div>
        <div className="flex-[2] flex flex-col border-l border-gray-200 bg-white overflow-hidden">
          {panelContent}
        </div>
      </div>
    </div>
  )
}
