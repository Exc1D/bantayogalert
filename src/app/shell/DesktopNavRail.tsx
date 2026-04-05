import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  Shield,
  Map,
  Home,
  Bell,
  User,
  PlusCircle,
  LayoutDashboard,
  Users,
  BarChart3,
  History,
  LogOut,
  type LucideProps,
} from 'lucide-react'
import { useAuth } from '@/lib/auth/hooks'
import { UserRole } from '@/types/user'

// Municipality code → display name mapping
const MUNICIPALITY_LABELS: Record<string, string> = {
  bas: 'Basud',
  bat: 'Bato',
  caps: 'Capalonga',
  daet: 'Daet',
  jmo: 'Jose Panganiban',
  labo: 'Labo',
  mer: 'Mercedes',
  san: 'San Lorenzo',
  sip: 'Sipocot',
  sta: 'Sta. Elena',
  vin: 'Vinzons',
}

const ALL_MUNICIPALITIES = Object.keys(MUNICIPALITY_LABELS)

type NavLinkDef = {
  href: string
  icon: React.ForwardRefExoticComponent<LucideProps>
  label: string
  end?: boolean
}

const CITIZEN_LINKS: NavLinkDef[] = [
  { href: '/', icon: Map, label: 'Map', end: true },
  { href: '/app', icon: Home, label: 'Feed', end: true },
  { href: '/app/alerts', icon: Bell, label: 'Alerts' },
  { href: '/auth/profile', icon: User, label: 'Profile' },
]

const ADMIN_LINKS: NavLinkDef[] = [
  { href: '/app/admin', icon: LayoutDashboard, label: 'Admin Queue', end: true },
  { href: '/app/contacts', icon: Users, label: 'Contacts' },
  { href: '/app/admin/analytics', icon: BarChart3, label: 'Analytics' },
  { href: '/app/admin/audit', icon: History, label: 'Audit' },
]

export function DesktopNavRail() {
  const { customClaims } = useAuth()
  const role = customClaims?.role ?? UserRole.Citizen
  const isAdmin = role === UserRole.MunicipalAdmin || role === UserRole.ProvincialSuperadmin
  const isSuperadmin = role === UserRole.ProvincialSuperadmin

  const citizenLinks = [...CITIZEN_LINKS]
  const adminLinks = isAdmin ? ADMIN_LINKS : []

  const [scope, setScope] = useState<string>('all')

  return (
    <nav
      className="flex-shrink-0 bg-[var(--color-nav)] text-white border-r border-white/10 flex flex-col items-center py-3 gap-2 overflow-y-auto"
      style={{ width: '64px' }}
      aria-label="Desktop navigation"
    >
      {/* Logo */}
      <div className="w-10 h-10 flex items-center justify-center shrink-0">
        <Shield className="text-white" size={28} strokeWidth={1.5} />
      </div>

      {/* Scope selector for superadmin */}
      {isSuperadmin && (
        <select
          value={scope}
          onChange={(e) => setScope(e.target.value)}
          className="w-12 text-[9px] text-center bg-transparent border border-white/20 rounded text-gray-400 cursor-pointer"
          aria-label="Municipality scope"
          title="Select municipality scope"
        >
          <option value="all">All</option>
          {ALL_MUNICIPALITIES.map((code) => (
            <option key={code} value={code}>
              {MUNICIPALITY_LABELS[code] ?? code}
            </option>
          ))}
        </select>
      )}

      {/* Dividers between sections */}
      <div className="w-8 h-px bg-white/10 my-1" />

      {/* Citizen links */}
      {citizenLinks.map(({ href, icon: Icon, label, end }) => (
        <NavRailLink key={href} href={href} end={end} label={label} icon={Icon} />
      ))}

      {/* Admin section */}
      {adminLinks.length > 0 && (
        <>
          <div className="w-8 h-px bg-white/10 my-1" />
          {adminLinks.map(({ href, icon: Icon, label, end }) => (
            <NavRailLink key={href} href={href} end={end} label={label} icon={Icon} />
          ))}
        </>
      )}

      {/* Bottom: Report CTA + User avatar */}
      <div className="mt-auto flex flex-col items-center gap-3 pb-3 pt-2">
        {/* Report CTA — 40px circle in brand blue */}
        <NavLink
          to="/app/report"
          className={({ isActive }) =>
            `w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
              isActive ? 'bg-brand text-white' : 'bg-brand text-white hover:bg-brand-light'
            }`
          }
          aria-label="Submit a report"
          title="Report"
        >
          <PlusCircle className="w-5 h-5" />
        </NavLink>

        {/* User avatar → profile link */}
        <NavLink
          to="/auth/profile"
          className={({ isActive }) =>
            `w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
              isActive
                ? 'bg-white/10 text-white'
                : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
            }`
          }
          aria-label="User profile"
          title="Profile"
        >
          <User size={18} />
        </NavLink>

        {/* Logout button placeholder */}
        <button
          type="button"
          className="text-slate-500 hover:text-slate-300 transition-colors"
          aria-label="Log out"
          title="Log out"
        >
          <LogOut size={16} />
        </button>
      </div>
    </nav>
  )
}

// Internal helper — avoids duplication between citizen and admin links
function NavRailLink({ href, end, label, icon: Icon }: { href: string; end?: boolean; label: string; icon: React.ForwardRefExoticComponent<LucideProps> }) {
  return (
    <NavLink
      to={href}
      end={end}
      className={({ isActive }) =>
        `w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
          isActive
            ? 'bg-white/10 text-white border-l-[3px] border-brand'
            : 'text-slate-400 hover:text-white hover:bg-white/5 border-l-[3px] border-transparent'
        }`
      }
      aria-label={label}
      title={label}
    >
      {({ isActive }) => (
        <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
      )}
    </NavLink>
  )
}
