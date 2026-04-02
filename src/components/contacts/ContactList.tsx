import { Card } from '../common/Card'

interface Contact {
  id: string
  name: string
  role?: string
  phone?: string
  municipality?: string
  type: 'emergency' | 'municipal' | 'provincial' | 'barangay'
}

const DEMO_CONTACTS: Contact[] = [
  { id: '1', name: 'BantayogAlert Emergency', phone: '911', type: 'emergency' },
  { id: '2', name: 'Provincial DRRM Office', phone: '+63 54 123 4567', municipality: 'Daet', type: 'provincial' },
  { id: '3', name: 'Municipal DRRM Office — Daet', phone: '+63 54 111 2222', municipality: 'Daet', type: 'municipal' },
  { id: '4', name: 'Philippine Red Cross', phone: '143', type: 'emergency' },
  { id: '5', name: 'PNP Emergency', phone: '117', type: 'emergency' },
]

const TYPE_COLORS: Record<Contact['type'], string> = {
  emergency: 'text-red-600',
  municipal: 'text-blue-600',
  provincial: 'text-purple-600',
  barangay: 'text-green-600',
}

const TYPE_ICONS: Record<Contact['type'], string> = {
  emergency: '🚨',
  municipal: '🏛️',
  provincial: '🏢',
  barangay: '🏘️',
}

export function ContactList() {
  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-500">
        Emergency and government contacts for Camarines Norte.
      </p>

      <div className="space-y-2">
        {DEMO_CONTACTS.map((contact) => (
          <Card key={contact.id} className="flex items-center gap-3">
            <span className="text-xl flex-shrink-0">{TYPE_ICONS[contact.type]}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{contact.name}</p>
              {contact.phone && (
                <a
                  href={`tel:${contact.phone}`}
                  className={`text-xs ${TYPE_COLORS[contact.type]} hover:underline`}
                >
                  {contact.phone}
                </a>
              )}
            </div>
          </Card>
        ))}
      </div>

      <p className="text-xs text-gray-400 text-center">
        Contacts will be managed via Firestore in Phase 5.
      </p>
    </div>
  )
}
