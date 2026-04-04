import { useState } from 'react'
import type { AuditEntry } from '@/types/audit'

interface AuditLogTableProps {
  entries: AuditEntry[]
  isLoading: boolean
  errorMessage: string | null
  hasNextPage: boolean
  isLoadingMore: boolean
  onLoadMore: () => void
}

export function AuditLogTable({
  entries,
  isLoading,
  errorMessage,
  hasNextPage,
  isLoadingMore,
  onLoadMore,
}: AuditLogTableProps) {
  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null)

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
        Loading audit entries...
      </div>
    )
  }

  if (errorMessage) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700 shadow-sm">
        {errorMessage}
      </div>
    )
  }

  if (entries.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
        No audit entries matched the current filters.
      </div>
    )
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="border-b border-slate-200 text-left text-slate-500">
            <tr>
              <th className="px-4 py-3">createdAt</th>
              <th className="px-4 py-3">action</th>
              <th className="px-4 py-3">entityType</th>
              <th className="px-4 py-3">actorUid</th>
              <th className="px-4 py-3">municipalityCode</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => {
              const expanded = expandedEntryId === entry.id

              return (
                <FragmentRow
                  key={entry.id}
                  entry={entry}
                  expanded={expanded}
                  onToggle={() =>
                    setExpandedEntryId(expanded ? null : entry.id)
                  }
                />
              )
            })}
          </tbody>
        </table>
      </div>

      {hasNextPage && (
        <div className="border-t border-slate-200 p-4">
          <button
            type="button"
            onClick={onLoadMore}
            disabled={isLoadingMore}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {isLoadingMore ? 'Loading...' : 'Load more'}
          </button>
        </div>
      )}
    </section>
  )
}

function FragmentRow({
  entry,
  expanded,
  onToggle,
}: {
  entry: AuditEntry
  expanded: boolean
  onToggle: () => void
}) {
  return (
    <>
      <tr className="border-b border-slate-100">
        <td className="px-4 py-3 text-slate-700">{entry.createdAt}</td>
        <td className="px-4 py-3 font-medium text-slate-900">{entry.action}</td>
        <td className="px-4 py-3 text-slate-700">{entry.entityType}</td>
        <td className="px-4 py-3 text-slate-700">{entry.actorUid}</td>
        <td className="px-4 py-3 text-slate-700">
          {entry.municipalityCode ?? 'Province'}
        </td>
        <td className="px-4 py-3 text-right">
          <button
            type="button"
            onClick={onToggle}
            className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700"
          >
            View details
          </button>
        </td>
      </tr>
      {expanded && (
        <tr className="border-b border-slate-100 bg-slate-50">
          <td className="px-4 py-3" colSpan={6}>
            <pre className="overflow-x-auto rounded-xl bg-slate-900 p-4 text-xs text-slate-100">
              {JSON.stringify(entry.details, null, 2)}
            </pre>
          </td>
        </tr>
      )}
    </>
  )
}
