import { FilePlus2, LayoutList, Bell, Map, User, Shield } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useUIStore, type ActiveTab } from '@/stores/uiStore'
import { useAuth } from '@/lib/auth/hooks'
import { UserRole } from '@/types/user'

interface TabDef {
  id: ActiveTab
  label: string
  icon: typeof FilePlus2
  action?: () => void
}

export function MobileBottomTabs() {
  const { activeTab, setActiveTab } = useUIStore()
  const { customClaims } = useAuth()
  const navigate = useNavigate()

  const role = customClaims?.role ?? UserRole.Citizen
  const isAdmin =
    role === UserRole.MunicipalAdmin || role === UserRole.ProvincialSuperadmin

  const baseTabs: TabDef[] = [
    { id: 'feed', label: 'Feed', icon: LayoutList },
    { id: 'map', label: 'Map', icon: Map },
    { id: 'report', label: 'Report', icon: FilePlus2 },
    { id: 'alerts', label: 'Alerts', icon: Bell },
    { id: 'profile', label: 'Profile', icon: User },
  ]

  // Add Admin tab for admin users
  if (isAdmin) {
    baseTabs.splice(4, 0, {
      id: 'admin',
      label: 'Admin',
      icon: Shield,
    })
  }

  const handleTab = (tab: TabDef) => {
    setActiveTab(tab.id)
    switch (tab.id) {
      case 'report':
        navigate('/app/report')
        break
      case 'alerts':
        navigate('/app/alerts')
        break
      case 'admin':
        navigate('/app/admin')
        break
      default:
        navigate('/app')
        break
    }
  }

  const reportIndex = baseTabs.findIndex((t) => t.id === 'report')

  return (
    <nav
      className="h-16 flex-shrink-0 fixed bottom-0 w-full z-20 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-gray-800 flex items-center justify-around px-2"
      aria-label="Mobile navigation"
    >
      {baseTabs.map((tab, index) => {
        if (index === reportIndex) {
          return (
            <button
              key={tab.id}
              type="button"
              aria-label={`Report ${tab.label}`}
              onClick={() => handleTab(tab)}
              className="flex items-center justify-center bg-primary-600 hover:bg-primary-700 text-white rounded-full w-12 h-12 -mt-4 shadow-lg cursor-pointer transition-colors"
            >
              <tab.icon className="w-6 h-6" />
            </button>
          )
        }

        const isActive =
          tab.id === activeTab ||
          (tab.id === 'alerts' && activeTab === 'alerts')

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => handleTab(tab)}
            aria-label={tab.label}
            className={`flex flex-col items-center justify-center gap-0.5 text-xs ${
              isActive ? 'text-blue-600' : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            <tab.icon className="w-5 h-5" />
            <span>{tab.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
