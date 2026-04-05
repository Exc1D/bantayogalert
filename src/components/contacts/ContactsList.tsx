import { useState } from 'react'
import { useContacts } from '@/hooks/useContacts'
import { ContactCard } from './ContactCard'
import { ContactForm } from './ContactForm'
import { Plus, Search } from 'lucide-react'
import type { Contact } from '@/types/contact'
import { ContactSchema } from '@/types/contact'
import { z } from 'zod'

type ContactFormData = z.input<typeof ContactSchema>

interface ContactsListProps {
  contacts?: Contact[]  // If provided, displays these contacts instead of fetching
  hasActiveFilters?: boolean
  totalContacts?: number
}

export function ContactsList({
  contacts: propContacts,
  hasActiveFilters = false,
  totalContacts,
}: ContactsListProps = {}) {
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  const {
    contacts: fetchedContacts,
    isLoading,
    error,
    createContact,
    updateContact,
    deactivateContact,
    isCreating: isSubmitting,
  } = useContacts({ includeInactive: true })

  // If propContacts provided, use those; otherwise fetch
  const contacts = propContacts ?? fetchedContacts
  const totalVisibleContacts = totalContacts ?? contacts.length

  const handleCreate = async (data: ContactFormData) => {
    // Transform form data to match what createContact expects
    const submitData = {
      name: data.name,
      agency: data.agency,
      type: data.type,
      phones: data.phones,
      email: data.email ?? '',
      capabilities: data.capabilities,
      municipalityCode: data.municipalityCode,
      barangayCode: data.barangayCode,
    }
    await createContact(submitData)
    setIsCreating(false)
  }

  const handleUpdate = async (data: ContactFormData) => {
    if (!editingContact) return
    const submitData = {
      name: data.name,
      agency: data.agency,
      type: data.type,
      phones: data.phones,
      email: data.email ?? '',
      capabilities: data.capabilities,
      municipalityCode: data.municipalityCode,
      barangayCode: data.barangayCode,
    }
    await updateContact({ id: editingContact.id, ...submitData })
    setEditingContact(null)
  }

  const handleDeactivate = async (id: string, deactivate: boolean) => {
    await deactivateContact({ id, deactivate })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-600">
        Failed to load contacts. Please try again.
      </div>
    )
  }

  const activeContacts = contacts.filter((c) => c.isActive)
  const inactiveContacts = contacts.filter((c) => !c.isActive)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Search className="w-5 h-5 text-gray-400" />
          <span className="text-sm text-gray-600">
            {activeContacts.length} active contact{activeContacts.length !== 1 ? 's' : ''}
          </span>
        </div>
        <button
          type="button"
          className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 flex items-center gap-2"
          onClick={() => setIsCreating(true)}
        >
          <Plus className="w-4 h-4" />
          Add Contact
        </button>
      </div>

      {/* Create/Edit Modal */}
      {(isCreating || editingContact) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4">
                {editingContact ? 'Edit Contact' : 'Add New Contact'}
              </h2>
              <ContactForm
                contact={editingContact ?? undefined}
                onSubmit={editingContact ? handleUpdate : handleCreate}
                onCancel={() => {
                  setEditingContact(null)
                  setIsCreating(false)
                }}
                isLoading={isSubmitting}
              />
            </div>
          </div>
        </div>
      )}

      {/* Active Contacts */}
      {activeContacts.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {activeContacts.map((contact) => (
            <ContactCard
              key={contact.id}
              contact={contact}
              onEdit={setEditingContact}
              onDeactivate={handleDeactivate}
            />
          ))}
        </div>
      ) : hasActiveFilters ? (
        <div className="text-center py-12 text-gray-500">
          <p>No contacts match your filters.</p>
        </div>
      ) : totalVisibleContacts === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>No active contacts yet.</p>
          <p className="text-sm">Click "Add Contact" to create your first responder contact.</p>
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <p>No active contacts found.</p>
          <p className="text-sm">Inactive contacts are listed below when available.</p>
        </div>
      )}

      {/* Inactive Contacts */}
      {inactiveContacts.length > 0 && (
        <div className="pt-6 border-t">
          <h3 className="text-sm font-medium text-gray-500 mb-4">
            Deactivated ({inactiveContacts.length})
          </h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {inactiveContacts.map((contact) => (
              <ContactCard
                key={contact.id}
                contact={contact}
                onEdit={setEditingContact}
                onDeactivate={handleDeactivate}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
