import { useMemo } from 'react'
import { useContacts } from '@/hooks/useContacts'
import { useContactsFilterStore } from '@/stores/contactsFilterStore'
import { ContactsFilterBar } from './ContactsFilterBar'
import { ContactsList } from './ContactsList'

export function ContactsPage() {
  const { contacts, isLoading } = useContacts({ includeInactive: true })
  const { searchQuery, typeFilter } = useContactsFilterStore()
  const hasActiveFilters = Boolean(searchQuery || typeFilter)

  // Client-side filtering based on filter state
  const filteredContacts = useMemo(() => {
    return contacts.filter((contact) => {
      // Search filter: match name or agency (case-insensitive)
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesName = contact.name.toLowerCase().includes(query)
        const matchesAgency = contact.agency.toLowerCase().includes(query)
        if (!matchesName && !matchesAgency) return false
      }

      // Type filter
      if (typeFilter && contact.type !== typeFilter) return false

      return true
    })
  }, [contacts, searchQuery, typeFilter])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <ContactsFilterBar />
      <ContactsList
        contacts={filteredContacts}
        hasActiveFilters={hasActiveFilters}
        totalContacts={contacts.length}
      />
    </div>
  )
}
