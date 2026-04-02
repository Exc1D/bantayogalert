import { useState } from 'react'
import { MobileFeedTab } from '../mobile/MobileFeedTab'
import { MobileMapTab } from '../mobile/MobileMapTab'
import { MobileAlertsTab } from '../mobile/MobileAlertsTab'
import { MobileProfileTab } from '../mobile/MobileProfileTab'
import { MobileReportFlow } from '../mobile/MobileReportFlow'

type Tab = 'feed' | 'map' | 'alerts' | 'profile'
type ModalView = 'report-flow' | 'report-detail' | null

const tabs: { id: Tab; icon: string; label: string }[] = [
  { id: 'feed', icon: '📋', label: 'Feed' },
  { id: 'map', icon: '📍', label: 'Map' },
  { id: 'alerts', icon: '🔔', label: 'Alerts' },
  { id: 'profile', icon: '👤', label: 'Profile' },
]

export function MobileShell() {
  const [activeTab, setActiveTab] = useState<Tab>('feed')
  const [modal, setModal] = useState<ModalView>(null)
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null)

  const handleNewReport = () => {
    setModal('report-flow')
  }

  const handleReportPress = (reportId: string) => {
    setSelectedReportId(reportId)
    setModal('report-detail')
  }

  const handleCloseModal = () => {
    setModal(null)
    setSelectedReportId(null)
  }

  const handleReportSuccess = () => {
    setModal(null)
    setActiveTab('feed')
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Content area */}
      <main className="flex-1 overflow-hidden">
        {activeTab === 'feed' && (
          <MobileFeedTab
            onNewReport={handleNewReport}
            onReportPress={handleReportPress}
          />
        )}
        {activeTab === 'map' && (
          <MobileMapTab
            onNewReport={handleNewReport}
            onReportPress={handleReportPress}
          />
        )}
        {activeTab === 'alerts' && (
          <MobileAlertsTab
            onAlertPress={(id) => console.log('View alert:', id)}
            onCreateAnnouncement={() => console.log('Create announcement')}
          />
        )}
        {activeTab === 'profile' && (
          <MobileProfileTab
            onReportPress={handleReportPress}
          />
        )}
      </main>

      {/* Report Flow Modal */}
      {modal === 'report-flow' && (
        <div className="fixed inset-0 bg-white z-[1000] flex flex-col">
          <MobileReportFlow
            onSuccess={handleReportSuccess}
            onCancel={handleCloseModal}
          />
        </div>
      )}

      {/* Report Detail Modal */}
      {modal === 'report-detail' && selectedReportId && (
        <div className="fixed inset-0 bg-white z-[1000] flex flex-col">
          <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Report Details</h2>
            <button onClick={handleCloseModal} className="text-gray-500 hover:text-gray-700">
              ✕
            </button>
          </div>
          <div className="flex-1 overflow-auto p-4">
            <p className="text-gray-500">Report ID: {selectedReportId}</p>
            <p className="text-sm text-gray-400 mt-2">Full report detail view coming in Phase 6</p>
          </div>
        </div>
      )}

      {/* Bottom tab bar */}
      <nav className="bg-white border-t border-gray-200 flex-shrink-0" style={{ height: '64px' }}>
        <div className="flex h-full">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 h-full flex flex-col items-center justify-center gap-1 transition-colors ${
                activeTab === tab.id ? 'text-primary-500' : 'text-gray-500'
              }`}
            >
              <span style={{ fontSize: '24px' }}>{tab.icon}</span>
              <span className="text-xs">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}
