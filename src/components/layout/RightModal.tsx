import { useModal } from '../../contexts/ModalContext'
import { useMap } from '../../contexts/MapContext'
import { FeedList } from '../feed/FeedList'
import { ReportDetail } from '../report/ReportDetail'
import { ProfileView } from '../profile/ProfileView'
import { AlertList } from '../alerts/AlertCard'
import { ContactList } from '../contacts/ContactList'
import { AnnouncementForm } from '../announcements/AnnouncementForm'
import { AdminApprovalPanel } from '../admin/AdminApprovalPanel'
import { RoleGate } from '../auth/RoleGate'

const SECTION_TITLES: Record<string, string> = {
  feed: 'Incident Feed',
  'report-detail': 'Report Details',
  profile: 'My Profile',
  alerts: 'Alerts',
  admin: 'Admin Panel',
  contacts: 'Emergency Contacts',
  'announcement-create': 'New Announcement',
}

export function RightModal() {
  const { isOpen, section, close } = useModal()
  const { selectedPinId } = useMap()

  if (!isOpen) return null

  const title = SECTION_TITLES[section ?? ''] ?? section ?? 'Panel'

  return (
    <div className="absolute inset-y-0 right-0 w-full max-w-md bg-white shadow-xl z-10 flex flex-col">
      {/* Modal header */}
      <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
        <h2 className="text-lg font-semibold">{title}</h2>
        <button
          onClick={close}
          className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"
          aria-label="Close modal"
        >
          ✕
        </button>
      </div>

      {/* Modal content */}
      <div className="flex-1 overflow-auto p-4">
        {section === 'feed' && <FeedList />}

        {section === 'report-detail' && (
          selectedPinId ? (
            <ReportDetail reportId={selectedPinId} />
          ) : (
            <p className="text-gray-500 text-center py-8">No report selected. Click a marker on the map.</p>
          )
        )}

        {section === 'profile' && <ProfileView />}

        {section === 'alerts' && <AlertList />}

        {section === 'admin' && (
          <RoleGate roles={['provincial_superadmin']}>
            <AdminApprovalPanel />
          </RoleGate>
        )}

        {section === 'contacts' && <ContactList />}

        {section === 'announcement-create' && (
          <RoleGate roles={['municipal_admin', 'provincial_superadmin']}>
            <AnnouncementForm />
          </RoleGate>
        )}
      </div>
    </div>
  )
}
