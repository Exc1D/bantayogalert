import { Phone, Mail, Building2, Shield } from 'lucide-react'
import type { Contact } from '@/types/contact'
import { ContactType } from '@/types/contact'

interface ContactCardProps {
  contact: Contact
  onEdit: (contact: Contact) => void
  onDeactivate: (id: string, deactivate: boolean) => void
  isDeactivating?: boolean
}

const contactTypeLabels: Record<ContactType, string> = {
  [ContactType.Police]: 'Police',
  [ContactType.Fire]: 'Fire',
  [ContactType.Medical]: 'Medical',
  [ContactType.Rescue]: 'Rescue',
  [ContactType.Barangay]: 'Barangay',
  [ContactType.Municipal]: 'Municipal',
  [ContactType.Provincial]: 'Provincial',
  [ContactType.NGO]: 'NGO',
  [ContactType.Other]: 'Other',
}

const contactTypeColors: Record<ContactType, string> = {
  [ContactType.Police]: 'bg-blue-100 text-blue-800',
  [ContactType.Fire]: 'bg-red-100 text-red-800',
  [ContactType.Medical]: 'bg-green-100 text-green-800',
  [ContactType.Rescue]: 'bg-orange-100 text-orange-800',
  [ContactType.Barangay]: 'bg-purple-100 text-purple-800',
  [ContactType.Municipal]: 'bg-indigo-100 text-indigo-800',
  [ContactType.Provincial]: 'bg-pink-100 text-pink-800',
  [ContactType.NGO]: 'bg-teal-100 text-teal-800',
  [ContactType.Other]: 'bg-gray-100 text-gray-800',
}

export function ContactCard({ contact, onEdit, onDeactivate, isDeactivating }: ContactCardProps) {
  const isActive = contact.isActive

  return (
    <div
      className={`border rounded-lg p-4 transition-opacity ${
        isActive ? 'bg-white' : 'bg-gray-50 opacity-60'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-gray-900 truncate">{contact.name}</h3>
            {!isActive && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border border-gray-300 text-gray-500">
                Inactive
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 mt-1 text-sm text-gray-600">
            <Building2 className="w-4 h-4 flex-shrink-0" />
            <span>{contact.agency}</span>
          </div>

          <div className="mt-2">
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                contactTypeColors[contact.type]
              }`}
            >
              {contactTypeLabels[contact.type]}
            </span>
          </div>

          <div className="mt-3 space-y-1.5">
            {contact.phones.map((phone, i) => (
              <div key={i} className="flex items-center gap-1.5 text-sm text-gray-600">
                <Phone className="w-4 h-4 flex-shrink-0" />
                <span>{phone}</span>
              </div>
            ))}

            {contact.email && (
              <div className="flex items-center gap-1.5 text-sm text-gray-600">
                <Mail className="w-4 h-4 flex-shrink-0" />
                <span>{contact.email}</span>
              </div>
            )}
          </div>

          {contact.capabilities.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {contact.capabilities.slice(0, 3).map((cap, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs"
                >
                  <Shield className="w-3 h-3" />
                  {cap}
                </span>
              ))}
              {contact.capabilities.length > 3 && (
                <span className="text-xs text-gray-500">+{contact.capabilities.length - 3} more</span>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <button
            type="button"
            className="px-3 py-1.5 text-sm border border-gray-300 bg-white hover:bg-gray-50 rounded disabled:opacity-50"
            onClick={() => onEdit(contact)}
            disabled={isDeactivating}
          >
            Edit
          </button>
          <button
            type="button"
            className={`px-3 py-1.5 text-sm rounded disabled:opacity-50 ${
              isActive
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-primary-600 hover:bg-primary-700 text-white'
            }`}
            onClick={() => onDeactivate(contact.id, !isActive)}
            disabled={isDeactivating}
          >
            {isActive ? 'Deactivate' : 'Reactivate'}
          </button>
        </div>
      </div>
    </div>
  )
}
