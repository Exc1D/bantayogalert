import type { AnalyticsDateRange } from '@/hooks/useAnalytics'

interface AnalyticsDateRangeControlsProps {
  dateRange: AnalyticsDateRange
  onPresetChange: (preset: AnalyticsDateRange['preset']) => void
  onDateChange: (field: 'startDate' | 'endDate', value: string) => void
}

const PRESETS: AnalyticsDateRange['preset'][] = ['7d', '30d', '90d', 'custom']

export function AnalyticsDateRangeControls({
  dateRange,
  onPresetChange,
  onDateChange,
}: AnalyticsDateRangeControlsProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        {PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => onPresetChange(preset)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              dateRange.preset === preset
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {preset.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="text-sm text-slate-600">
          <span className="mb-1 block font-medium">Start</span>
          <input
            type="date"
            value={dateRange.startDate}
            onChange={(event) => onDateChange('startDate', event.target.value)}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-900"
          />
        </label>
        <label className="text-sm text-slate-600">
          <span className="mb-1 block font-medium">End</span>
          <input
            type="date"
            value={dateRange.endDate}
            onChange={(event) => onDateChange('endDate', event.target.value)}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-900"
          />
        </label>
      </div>
    </div>
  )
}
