import type { AnalyticsSnapshot } from '@/types/analytics'

interface AnalyticsSummaryCardsProps {
  counts: AnalyticsSnapshot['byWorkflowState']
}

const CARD_CONFIG = [
  { label: 'Total', valueKey: 'total', tone: 'text-slate-900 bg-slate-100' },
  { label: 'Pending', valueKey: 'pending', tone: 'text-amber-900 bg-amber-100' },
  { label: 'Verified', valueKey: 'verified', tone: 'text-sky-900 bg-sky-100' },
  { label: 'Resolved', valueKey: 'resolved', tone: 'text-emerald-900 bg-emerald-100' },
  { label: 'Rejected', valueKey: 'rejected', tone: 'text-rose-900 bg-rose-100' },
] as const

export function AnalyticsSummaryCards({ counts }: AnalyticsSummaryCardsProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {CARD_CONFIG.map((card) => (
        <article
          key={card.label}
          className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <span
            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${card.tone}`}
          >
            {card.label}
          </span>
          <p className="mt-4 text-3xl font-semibold text-slate-900">
            {counts[card.valueKey]}
          </p>
        </article>
      ))}
    </div>
  )
}
