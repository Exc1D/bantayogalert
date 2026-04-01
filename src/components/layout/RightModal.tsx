import { useModal } from '../../contexts/ModalContext'
import { AdminApprovalPanel } from '../admin/AdminApprovalPanel'
import { RoleGate } from '../auth/RoleGate'

// Phase 4: Replace with full section-aware modal
export function RightModal() {
  const { isOpen, section, close } = useModal()

  if (!isOpen) return null

  return (
    <div className="absolute inset-y-0 right-0 w-full max-w-md bg-white shadow-xl z-10 flex flex-col">
      {/* Modal header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold capitalize">{section || 'Panel'}</h2>
        <button
          onClick={close}
          className="p-2 hover:bg-gray-100 rounded-lg"
          aria-label="Close modal"
        >
          ✕
        </button>
      </div>

      {/* Modal content - Phase 4 */}
      <div className="flex-1 overflow-auto p-4">
        {section === 'admin' ? (
          <RoleGate roles={['provincial_superadmin']}>
            <AdminApprovalPanel />
          </RoleGate>
        ) : (
          <p className="text-gray-500">Phase 4: {section || 'panel'} content goes here</p>
        )}
      </div>
    </div>
  )
}
