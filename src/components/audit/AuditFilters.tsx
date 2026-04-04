import type { AuditFilters as AuditFiltersShape } from '@/types/audit'
import type { AuditAction, AuditEntityType } from '@/types/audit'
import { MUNICIPALITIES } from '@/lib/geo/municipality'

interface AuditFiltersProps {
  filters: AuditFiltersShape
  isSuperadmin: boolean
  onChange: (patch: Partial<AuditFiltersShape>) => void
}

const ACTION_OPTIONS = [
  'report_submit',
  'triage_verify',
  'triage_reject',
  'triage_dispatch',
  'triage_acknowledge',
  'triage_in_progress',
  'triage_resolve',
  'triage_reroute',
  'triage_update_priority',
  'triage_update_notes',
  'contact_create',
  'contact_update',
  'contact_deactivate',
  'announcement_create',
  'announcement_publish',
  'announcement_cancel',
  'user_role_set',
] as const

const ENTITY_OPTIONS = ['report', 'contact', 'announcement', 'user'] as const

export function AuditFilters({
  filters,
  isSuperadmin,
  onChange,
}: AuditFiltersProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <label className="text-sm text-slate-600">
          <span className="mb-1 block font-medium">Action</span>
          <select
            value={filters.action ?? ''}
            onChange={(event) =>
              onChange({
                action: (event.target.value || null) as AuditAction | null,
              })
            }
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-900"
          >
            <option value="">All actions</option>
            {ACTION_OPTIONS.map((action) => (
              <option key={action} value={action}>
                {action}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm text-slate-600">
          <span className="mb-1 block font-medium">Entity</span>
          <select
            value={filters.entityType ?? ''}
            onChange={(event) =>
              onChange({
                entityType: (event.target.value || null) as AuditEntityType | null,
              })
            }
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-900"
          >
            <option value="">All entities</option>
            {ENTITY_OPTIONS.map((entityType) => (
              <option key={entityType} value={entityType}>
                {entityType}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm text-slate-600">
          <span className="mb-1 block font-medium">Actor</span>
          <input
            type="text"
            value={filters.actorUid ?? ''}
            onChange={(event) => onChange({ actorUid: event.target.value || null })}
            placeholder="actorUid"
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-900"
          />
        </label>

        {isSuperadmin && (
          <label className="text-sm text-slate-600">
            <span className="mb-1 block font-medium">Municipality</span>
            <select
              value={filters.municipalityCode ?? ''}
              onChange={(event) =>
                onChange({ municipalityCode: event.target.value || null })
              }
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-900"
            >
              <option value="">All municipalities</option>
              {MUNICIPALITIES.map((municipality) => (
                <option key={municipality.code} value={municipality.code}>
                  {municipality.name}
                </option>
              ))}
            </select>
          </label>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm text-slate-600">
            <span className="mb-1 block font-medium">From</span>
            <input
              type="date"
              value={filters.dateFrom ?? ''}
              onChange={(event) => onChange({ dateFrom: event.target.value || null })}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-900"
            />
          </label>
          <label className="text-sm text-slate-600">
            <span className="mb-1 block font-medium">To</span>
            <input
              type="date"
              value={filters.dateTo ?? ''}
              onChange={(event) => onChange({ dateTo: event.target.value || null })}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-900"
            />
          </label>
        </div>
      </div>
    </section>
  )
}
