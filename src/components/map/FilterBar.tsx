import { useFilterStore } from '@/stores/filterStore'
import { IncidentType, Severity } from '@/types/report'
import { MUNICIPALITIES } from '@/lib/geo/municipality'

const INCIDENT_TYPES = Object.values(IncidentType)
const SEVERITIES = Object.values(Severity)

interface FilterChipProps {
  label: string
  onDismiss: () => void
}

function FilterChip({ label, onDismiss }: FilterChipProps) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs">
      {label}
      <button onClick={onDismiss} className="hover:text-blue-600" aria-label={`Remove ${label} filter`}>
        ×
      </button>
    </span>
  )
}

function formatLabel(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1).replace(/_/g, ' ')
}

export function FilterBar() {
  const {
    type, setType,
    severity, setSeverity,
    municipalityCode, setMunicipality,
    clearFilters,
  } = useFilterStore()

  const hasActiveFilters = type !== null || severity !== null || municipalityCode !== null

  return (
    <div className="bg-white border-b border-gray-200 p-3 space-y-2">
      {/* Filter controls row */}
      <div className="flex flex-wrap gap-2">
        {/* Incident type */}
        <select
          value={type ?? ''}
          onChange={(e) => setType(e.target.value ? e.target.value as IncidentType : null)}
          className="text-sm border border-gray-300 rounded px-2 py-1"
          aria-label="Filter by incident type"
        >
          <option value="">All Types</option>
          {INCIDENT_TYPES.map((t) => (
            <option key={t} value={t}>{formatLabel(t)}</option>
          ))}
        </select>

        {/* Severity */}
        <select
          value={severity ?? ''}
          onChange={(e) => setSeverity(e.target.value ? e.target.value as Severity : null)}
          className="text-sm border border-gray-300 rounded px-2 py-1"
          aria-label="Filter by severity"
        >
          <option value="">All Severities</option>
          {SEVERITIES.map((s) => (
            <option key={s} value={s}>{formatLabel(s)}</option>
          ))}
        </select>

        {/* Municipality */}
        <select
          value={municipalityCode ?? ''}
          onChange={(e) => setMunicipality(e.target.value || null)}
          className="text-sm border border-gray-300 rounded px-2 py-1"
          aria-label="Filter by municipality"
        >
          <option value="">All Municipalities</option>
          {MUNICIPALITIES.map((m) => (
            <option key={m.code} value={m.code}>{m.name}</option>
          ))}
        </select>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-sm text-red-600 hover:text-red-800 px-2 py-1"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Active filter chips */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-1">
          {type && <FilterChip label={formatLabel(type)} onDismiss={() => setType(null)} />}
          {severity && <FilterChip label={formatLabel(severity)} onDismiss={() => setSeverity(null)} />}
          {municipalityCode && (
            <FilterChip
              label={MUNICIPALITIES.find(m => m.code === municipalityCode)?.name ?? municipalityCode}
              onDismiss={() => setMunicipality(null)}
            />
          )}
        </div>
      )}
    </div>
  )
}
