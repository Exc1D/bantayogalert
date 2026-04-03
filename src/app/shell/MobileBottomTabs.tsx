import { Home, Map, PlusCircle, Bell, User } from 'lucide-react'
import { useUIStore, type ActiveTab } from '@/stores/uiStore'
import { NavItem } from './NavItem'

const TABS: { id: ActiveTab; label: string; icon: typeof Home }[] = [
  { id: 'feed', label: 'Feed', icon: Home },
  { id: 'map', label: 'Map', icon: Map },
  { id: 'report', label: 'Report', icon: PlusCircle },
  { id: 'alerts', label: 'Alerts', icon: Bell },
  { id: 'profile', label: 'Profile', icon: User },
]

const REPORT_INDEX = 2 // Center position (0-indexed)

export function MobileBottomTabs() {
  const { activeTab, setActiveTab } = useUIStore()

  return (
    <div
      className="fixed bottom-0 left-0 right-0 h-16 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 z-20 flex flex-row items-center justify-around px-2"
      role="tablist"
      aria-label="Mobile navigation"
    >
      {TABS.map((tab, index) => {
        const isReport = index === REPORT_INDEX

        if (isReport) {
          // Center prominent Report button
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-label="Report emergency"
              onClick={() => setActiveTab(tab.id)}
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
            onClick={() => setActiveTab(tab.id)}
          />
        )
      })}
    </div>
  )
}
