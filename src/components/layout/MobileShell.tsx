import { useState } from 'react'

type Tab = 'feed' | 'map' | 'alerts' | 'profile'

// Placeholder screens - Phase 5 replaces these
function FeedScreen() { return <div className="p-4"><h2 className="text-xl font-bold mb-4">Feed</h2><p className="text-gray-500">Phase 5: Feed content</p></div> }
function MapScreen() { return <div className="p-4"><h2 className="text-xl font-bold mb-4">Map</h2><p className="text-gray-500">Phase 5: Map content</p></div> }
function AlertsScreen() { return <div className="p-4"><h2 className="text-xl font-bold mb-4">Alerts</h2><p className="text-gray-500">Phase 5: Alerts content</p></div> }
function ProfileScreen() { return <div className="p-4"><h2 className="text-xl font-bold mb-4">Profile</h2><p className="text-gray-500">Phase 5: Profile content</p></div> }

{/* Phase 4/5: Replace with full MobileShell implementation */}
export function MobileShell() {
  const [activeTab, setActiveTab] = useState<Tab>('feed')

  const tabs: { id: Tab; icon: string; label: string }[] = [
    { id: 'feed', icon: '📋', label: 'Feed' },
    { id: 'map', icon: '📍', label: 'Map' },
    { id: 'alerts', icon: '🔔', label: 'Alerts' },
    { id: 'profile', icon: '👤', label: 'Profile' },
  ]

  return (
    <div className="flex flex-col h-screen">
      {/* Content area */}
      <main className="flex-1 overflow-auto bg-gray-50">
        {activeTab === 'feed' && <FeedScreen />}
        {activeTab === 'map' && <MapScreen />}
        {activeTab === 'alerts' && <AlertsScreen />}
        {activeTab === 'profile' && <ProfileScreen />}
      </main>

      {/* Bottom tab bar */}
      <nav className="bg-white border-t border-gray-200 flex">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-3 flex flex-col items-center gap-1 text-xs ${
              activeTab === tab.id ? 'text-primary-500' : 'text-gray-500'
            }`}
          >
            <span className="text-xl">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
