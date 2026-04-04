import { MUNICIPALITIES } from '@/lib/geo/municipality'
import { UserRole } from '@/types/user'

interface AnalyticsScopeSelectorProps {
  role: UserRole
  municipalityCode: string | null
  onMunicipalityChange: (municipalityCode: string | null) => void
}

export function AnalyticsScopeSelector({
  role,
  municipalityCode,
  onMunicipalityChange,
}: AnalyticsScopeSelectorProps) {
  if (role !== UserRole.ProvincialSuperadmin) {
    return null
  }

  return (
    <label className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <span className="mb-2 block text-sm font-medium text-slate-700">
        Municipality scope
      </span>
      <select
        value={municipalityCode ?? ''}
        onChange={(event) => onMunicipalityChange(event.target.value || null)}
        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-900"
      >
        <option value="">Province-wide</option>
        {MUNICIPALITIES.map((municipality) => (
          <option key={municipality.code} value={municipality.code}>
            {municipality.name}
          </option>
        ))}
      </select>
    </label>
  )
}
