import { useEffect, useState } from 'react'
import { MapContainer } from 'react-leaflet'
import { useUIStore, type ActiveTab } from '@/stores/uiStore'

const TABS: { id: ActiveTab; label: string }[] = [
  { id: 'feed', label: 'Feed' },
  { id: 'map', label: 'Map' },
  { id: 'report', label: 'Report' },
  { id: 'alerts', label: 'Alerts' },
  { id: 'profile', label: 'Profile' },
]

function TabContent({ tab }: { tab: ActiveTab }) {
  switch (tab) {
    case 'feed':
      return <div className="p-4">Feed Content</div>
    case 'map':
      return (
        <div className="h-full w-full">
          <MapContainer
            center={[14.15, 122.9]}
            zoom={10}
            style={{ height: '100%', width: '100%' }}
          />
        </div>
      )
    case 'alerts':
      return <div className="p-4">Alerts Content</div>
    case 'profile':
      return <div className="p-4">Profile Content</div>
    case 'report':
      return <div className="p-4">Report Modal</div>
  }
}

export function MobileShell() {
  const [mounted, setMounted] = useState(false)
  const { activeTab, setActiveTab } = useUIStore()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden">
      <div className="flex-1 overflow-hidden relative">
        {TABS.map((t) => (
          <div
            key={t.id}
            className={activeTab === t.id ? 'block h-full' : 'hidden'}
          >
            <TabContent tab={t.id} />
          </div>
        ))}
      </div>
      <div className="h-16 flex-shrink-0 fixed bottom-0 w-full z-20 bg-white border-t border-gray-200 flex">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex-1 flex flex-col items-center justify-center gap-1 text-xs ${
              activeTab === t.id ? 'text-blue-600' : 'text-gray-500'
            }`}
          >
            <div className="w-5 h-5 bg-gray-300 rounded" />
            {t.label}
          </button>
        ))}
      </div>
    </div>
  )
}
