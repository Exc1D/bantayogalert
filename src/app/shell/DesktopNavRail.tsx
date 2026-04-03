import { useState } from 'react'
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
  ClipboardList,
  LogOut,
} from 'lucide-react'
import { useAuth } from '@/lib/auth/hooks'
import { useUIStore } from '@/stores/uiStore'
import { UserRole } from '@/types/user'
import { NavItem, type NavItemProps } from './NavItem'

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

type NavItemConfig = Omit<NavItemProps, 'isActive'>
type PanelType = 'report-detail' | 'contact-detail' | 'announcement-detail' | 'settings' | null

function buildNavItems(
  role: UserRole,
  onPanel: (panel: PanelType) => () => void
): NavItemConfig[] {
  const items: NavItemConfig[] = []

  if (role === UserRole.Citizen || role === UserRole.MunicipalAdmin || role === UserRole.ProvincialSuperadmin) {
    items.push({ icon: Map, label: 'Map', onClick: onPanel(null), variant: 'rail' })
    items.push({ icon: Home, label: 'Feed', onClick: onPanel(null), variant: 'rail' })
    items.push({ icon: Bell, label: 'Alerts', onClick: onPanel('announcement-detail'), variant: 'rail' })
    items.push({ icon: User, label: 'Profile', onClick: onPanel('settings'), variant: 'rail' })
    items.push({ icon: PlusCircle, label: 'Report', onClick: onPanel('report-detail'), variant: 'rail' })
  }

  if (role === UserRole.MunicipalAdmin || role === UserRole.ProvincialSuperadmin) {
    items.push({ icon: LayoutDashboard, label: 'Dashboard', onClick: onPanel('report-detail'), variant: 'rail' })
    items.push({ icon: Users, label: 'Contacts', onClick: onPanel('contact-detail'), variant: 'rail' })
    items.push({ icon: BarChart3, label: 'Analytics', onClick: onPanel('announcement-detail'), variant: 'rail' })
    items.push({ icon: ClipboardList, label: 'Audit', onClick: onPanel('announcement-detail'), variant: 'rail' })
  }

  return items
}

export function DesktopNavRail() {
  const { customClaims } = useAuth()
  const { activePanel, setActivePanel } = useUIStore()
  const [scope, setScope] = useState<string>('all')

  const role = customClaims?.role ?? UserRole.Citizen
  const isSuperadmin = role === UserRole.ProvincialSuperadmin

  const handlePanelClick = (panel: PanelType) => () => {
    setActivePanel(panel)
  }

  const navItems = buildNavItems(role, handlePanelClick)

  return (
    <nav
      className="w-16 flex-shrink-0 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col items-center py-4 gap-1 overflow-y-auto"
      aria-label="Desktop navigation"
    >
      {/* Logo at top */}
      <div className="w-10 h-10 flex items-center justify-center mb-2">
        <Shield className="text-primary-600 dark:text-primary-400" size={32} strokeWidth={1.5} />
      </div>

      {/* Scope selector for superadmin */}
      {isSuperadmin && (
        <select
          value={scope}
          onChange={(e) => setScope(e.target.value)}
          className="w-12 text-[9px] text-center bg-transparent border border-gray-300 dark:border-gray-600 rounded text-gray-700 dark:text-gray-300 cursor-pointer mb-1"
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

      {/* Nav items */}
      <div className="flex flex-col items-center gap-1 w-full px-1">
        {navItems.map((item) => {
          // Determine if this item's panel is active
          let isActive = false
          if (item.label === 'Map' || item.label === 'Feed') {
            isActive = activePanel === null
          } else if (item.label === 'Alerts' || item.label === 'Analytics') {
            isActive = activePanel === 'announcement-detail'
          } else if (item.label === 'Profile') {
            isActive = activePanel === 'settings'
          } else if (item.label === 'Report' || item.label === 'Dashboard') {
            isActive = activePanel === 'report-detail'
          } else if (item.label === 'Contacts') {
            isActive = activePanel === 'contact-detail'
          } else if (item.label === 'Audit') {
            isActive = activePanel === 'announcement-detail'
          }

          return (
            <NavItem
              key={item.label}
              {...item}
              isActive={isActive}
            />
          )
        })}
      </div>

      {/* Bottom: user avatar + logout */}
      <div className="mt-auto flex flex-col items-center gap-2 pt-4">
        <button
          type="button"
          onClick={handlePanelClick('settings')}
          className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          aria-label="User profile"
        >
          <User size={20} className="text-gray-600 dark:text-gray-300" />
        </button>
        <button
          type="button"
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          aria-label="Log out"
          title="Log out"
        >
          <LogOut size={18} />
        </button>
      </div>
    </nav>
  )
}
