import { useState, useMemo } from 'react'
import { useContacts } from '@/hooks/useContacts'
import type { Contact } from '@/types/contact'
import { getMunicipality } from '@/lib/geo/municipality'

export interface ContactPickerModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (contact: Contact) => void
  municipalityCode: string
}

export function ContactPickerModal({
  isOpen,
  onClose,
  onSelect,
  municipalityCode,
}: ContactPickerModalProps) {
  const [query, setQuery] = useState('')
  const { contacts, isLoading } = useContacts({ includeInactive: false })

  const filtered = useMemo(() => {
    return contacts.filter(
      (c) =>
        c.municipalityCode === municipalityCode &&
        c.isActive &&
        (c.name.toLowerCase().includes(query.toLowerCase()) ||
          c.agency.toLowerCase().includes(query.toLowerCase()))
    )
  }, [contacts, municipalityCode, query])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-auto mt-20 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900">Select Responder</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
            aria-label="Close"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M15 5L5 15M5 5l10 10"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b border-gray-100">
          <input
            type="text"
            placeholder="Search by name or agency..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
        </div>

        {/* Contact list */}
        <div className="max-h-80 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
              Loading contacts...
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-gray-400 text-sm">
              No contacts found
            </div>
          ) : (
            <ul>
              {filtered.map((contact) => {
                const municipality = getMunicipality(contact.municipalityCode)
                return (
                  <li key={contact.id}>
                    <button
                      type="button"
                      onClick={() => {
                        onSelect(contact)
                        onClose()
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {contact.name}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {contact.agency}
                            {municipality ? ` · ${municipality.name}` : ''}
                          </p>
                        </div>
                        <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 capitalize">
                          {contact.type}
                        </span>
                      </div>
                      {contact.phones.length > 0 && (
                        <p className="text-xs text-gray-400 mt-1">
                          {contact.phones.join(', ')}
                        </p>
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
