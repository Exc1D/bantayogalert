import { Search, X } from 'lucide-react'
import { useContactsFilterStore } from '@/stores/contactsFilterStore'
import { ContactType } from '@/types/contact'

const contactTypeLabels: Partial<Record<ContactType, string>> = {
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

interface ContactsFilterBarProps {
  municipalityOptions?: { code: string; name: string }[]
}

export function ContactsFilterBar({ municipalityOptions = [] }: ContactsFilterBarProps) {
  const {
    searchQuery,
    typeFilter,
    municipalityCode,
    setSearchQuery,
    setTypeFilter,
    setMunicipalityCode,
    clearFilters,
  } = useContactsFilterStore()

  const hasActiveFilters = searchQuery || typeFilter || municipalityCode

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            id="contacts-search"
            type="text"
            aria-label="Search contacts by name or agency"
            placeholder="Search by name or agency..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded text-base focus:outline-none focus:ring-2 focus:ring-brand ring-offset-2"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Type Filter */}
        <select
          aria-label="Filter by contact type"
          value={typeFilter ?? ''}
          onChange={(e) => setTypeFilter(e.target.value ? (e.target.value as ContactType) : null)}
          className="rounded-md border border-gray-300 shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-brand min-w-[140px]"
        >
          <option value="">All Types</option>
          {Object.values(ContactType).map((type) => (
            <option key={type} value={type}>
              {contactTypeLabels[type]}
            </option>
          ))}
        </select>

        {/* Municipality Filter (only shown if options provided) */}
        {municipalityOptions.length > 0 && (
          <select
            aria-label="Filter by municipality"
            value={municipalityCode ?? ''}
            onChange={(e) => setMunicipalityCode(e.target.value || null)}
            className="rounded-md border border-gray-300 shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-brand min-w-[140px]"
          >
            <option value="">All Municipalities</option>
            {municipalityOptions.map((m) => (
              <option key={m.code} value={m.code}>
                {m.name}
              </option>
            ))}
          </select>
        )}

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="px-3 py-2 text-gray-600 hover:text-gray-900 flex items-center gap-1 text-sm"
          >
            <X className="w-4 h-4" />
            Clear
          </button>
        )}
      </div>

      {/* Active Filter Pills */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {searchQuery && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary-100 text-primary-800 rounded text-xs">
              Search: "{searchQuery}"
              <button onClick={() => setSearchQuery('')} className="hover:text-primary-900">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {typeFilter && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary-100 text-primary-800 rounded text-xs">
              Type: {contactTypeLabels[typeFilter]}
              <button onClick={() => setTypeFilter(null)} className="hover:text-primary-900">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {municipalityCode && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary-100 text-primary-800 rounded text-xs">
              Municipality: {municipalityCode}
              <button onClick={() => setMunicipalityCode(null)} className="hover:text-primary-900">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  )
}