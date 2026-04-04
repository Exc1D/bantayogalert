import { useEffect, useState, useTransition } from 'react'
import { AuditFilters } from '@/components/audit/AuditFilters'
import { AuditLogTable } from '@/components/audit/AuditLogTable'
import { useAuditLog } from '@/hooks/useAuditLog'
import { useAuth } from '@/lib/auth/hooks'
import type { AuditFilters as AuditFiltersShape } from '@/types/audit'
import { UserRole } from '@/types/user'

export function AdminAuditPage() {
  const { customClaims } = useAuth()
  const role = customClaims?.role ?? UserRole.Citizen
  const isSuperadmin = role === UserRole.ProvincialSuperadmin
  const municipalityCode = customClaims?.municipalityCode ?? null
  const [isPending, startTransition] = useTransition()
  const [filters, setFilters] = useState<AuditFiltersShape>({
    municipalityCode: isSuperadmin ? null : municipalityCode,
    entityType: null,
    action: null,
    actorUid: null,
    dateFrom: null,
    dateTo: null,
  })

  useEffect(() => {
    if (!isSuperadmin) {
      setFilters((current) => ({
        ...current,
        municipalityCode,
      }))
    }
  }, [isSuperadmin, municipalityCode])

  const auditQuery = useAuditLog(filters)

  if (!customClaims) {
    return null
  }

  return (
    <div className="space-y-4">
      <header className="rounded-3xl bg-slate-950 px-5 py-6 text-white shadow-lg">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-300">
          Phase 11
        </p>
        <h1 className="mt-3 text-2xl font-semibold">Audit Log</h1>
        <p className="mt-1 text-sm text-slate-300">
          Immutable admin activity records filtered by action, entity, actor, and municipalityCode.
        </p>
      </header>

      <AuditFilters
        filters={filters}
        isSuperadmin={isSuperadmin}
        onChange={(patch) =>
          startTransition(() => {
            setFilters((current) => ({
              ...current,
              ...patch,
            }))
          })
        }
      />

      <AuditLogTable
        entries={auditQuery.entries}
        isLoading={auditQuery.isLoading}
        errorMessage={
          auditQuery.error instanceof Error
            ? auditQuery.error.message
            : auditQuery.error
              ? 'Failed to load audit log.'
              : null
        }
        hasNextPage={auditQuery.hasNextPage}
        isLoadingMore={auditQuery.isFetchingNextPage}
        onLoadMore={auditQuery.loadMore}
      />

      {isPending && (
        <p className="text-sm text-slate-500">Updating audit filters...</p>
      )}
    </div>
  )
}
