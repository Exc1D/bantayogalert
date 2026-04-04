import { Home, Map, PlusCircle, Bell, User, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useUIStore, type ActiveTab } from '@/stores/uiStore'
import { useAuth } from '@/lib/auth/hooks'
import { UserRole } from '@/types/user'
import { NavItem } from './NavItem'

export function MobileBottomTabs() {
  const { activeTab, setActiveTab } = useUIStore()
  const { customClaims } = useAuth()
  const navigate = useNavigate()

  const role = customClaims?.role ?? UserRole.Citizen
  const isAdmin = role === UserRole.MunicipalAdmin || role === UserRole.ProvincialSuperadmin

  // Base tabs always shown
  const baseTabs: { id: ActiveTab; label: string; icon: typeof Home; onClick?: () => void }[] = [
    { id: 'feed', label: 'Feed', icon: Home },
    { id: 'map', label: 'Map', icon: Map },
    { id: 'report', label: 'Report', icon: PlusCircle },
    { id: 'alerts', label: 'Alerts', icon: Bell },
    { id: 'profile', label: 'Profile', icon: User },
  ]

  // Build tabs array based on role
  const tabs: { id: ActiveTab | 'contacts'; label: string; icon: typeof Home; onClick?: () => void }[] = [
    ...baseTabs,
  ]

  // Add Contacts tab for admin users before the center Report button
  if (isAdmin) {
    tabs.splice(2, 0, { id: 'contacts', label: 'Contacts', icon: Users, onClick: () => navigate('/app/contacts') })
  }

  // Find the index of the Report button for center positioning
  const reportIndex = tabs.findIndex((tab) => tab.id === 'report')

  return (
    <div
      className="fixed bottom-0 left-0 right-0 h-16 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 z-20 flex flex-row items-center justify-around px-2"
      role="tablist"
      aria-label="Mobile navigation"
    >
      {tabs.map((tab, index) => {
        const isReport = index === reportIndex

        if (isReport) {
          // Center prominent Report button
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-label="Report emergency"
              onClick={() => setActiveTab(tab.id as ActiveTab)}
              className="flex flex-col items-center justify-center bg-primary-600 hover:bg-primary-700 text-white rounded-full w-12 h-12 -mt-4 shadow-lg cursor-pointer transition-colors"
            >
              <PlusCircle size={28} strokeWidth={2} />
            </button>
          )
        }

        return (
          <NavItem
            key={tab.id}
            icon={tab.icon}
            label={tab.label}
            variant="tab"
            isActive={activeTab === tab.id}
            onClick={tab.onClick ?? (() => setActiveTab(tab.id as ActiveTab))}
          />
        )
      })}
    </div>
  )
}
