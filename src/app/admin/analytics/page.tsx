import { useEffect, useState, useTransition } from 'react'
import { useAnalytics, type AnalyticsDateRange } from '@/hooks/useAnalytics'
import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard'
import { useAuth } from '@/lib/auth/hooks'
import { useUIStore } from '@/stores/uiStore'
import { UserRole } from '@/types/user'

function getDateString(offsetDays = 0): string {
  const date = new Date()
  date.setDate(date.getDate() + offsetDays)
  return date.toISOString().slice(0, 10)
}

function buildPresetRange(preset: AnalyticsDateRange['preset']): AnalyticsDateRange {
  if (preset === 'custom') {
    return {
      preset,
      startDate: getDateString(-29),
      endDate: getDateString(0),
    }
  }

  const offsets: Record<Exclude<AnalyticsDateRange['preset'], 'custom'>, number> = {
    '7d': -6,
    '30d': -29,
    '90d': -89,
  }

  return {
    preset,
    startDate: getDateString(offsets[preset]),
    endDate: getDateString(0),
  }
}

export function AdminAnalyticsPage() {
  const { customClaims } = useAuth()
  const role = customClaims?.role ?? UserRole.Citizen
  const defaultMunicipalityCode = customClaims?.municipalityCode ?? null
  const isSuperadmin = role === UserRole.ProvincialSuperadmin
  const [isPending, startTransition] = useTransition()
  const [selectedMunicipalityCode, setSelectedMunicipalityCode] = useState<string | null>(
    null
  )
  const [dateRange, setDateRange] = useState<AnalyticsDateRange>(
    buildPresetRange('30d')
  )
  const analyticsHeatmapEnabled = useUIStore((state) => state.analyticsHeatmapEnabled)
  const setAnalyticsHeatmapEnabled = useUIStore(
    (state) => state.setAnalyticsHeatmapEnabled
  )
  const setAnalyticsHotspots = useUIStore((state) => state.setAnalyticsHotspots)

  const scopeType =
    isSuperadmin && !selectedMunicipalityCode ? 'province' : 'municipality'
  const scopeCode = selectedMunicipalityCode ?? defaultMunicipalityCode ?? 'CMN'

  const analyticsQuery = useAnalytics({
    scopeType,
    scopeCode,
    dateRange,
  })

  useEffect(() => {
    if (analyticsHeatmapEnabled && analyticsQuery.data) {
      setAnalyticsHotspots(analyticsQuery.data.range.hotspots)
      return
    }

    setAnalyticsHotspots([])
  }, [
    analyticsHeatmapEnabled,
    analyticsQuery.data,
    setAnalyticsHotspots,
  ])

  useEffect(() => {
    return () => {
      setAnalyticsHeatmapEnabled(false)
      setAnalyticsHotspots([])
    }
  }, [setAnalyticsHeatmapEnabled, setAnalyticsHotspots])

  if (!customClaims) {
    return null
  }

  return (
    <div className="space-y-4">
      <header className="rounded-3xl bg-slate-950 px-5 py-6 text-white shadow-lg">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-300">
          Phase 11
        </p>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Analytics</h1>
            <p className="mt-1 text-sm text-slate-300">
              Aggregate-only report trends, timings, and disaster hotspots.
            </p>
          </div>
          <span className="rounded-full bg-white/10 px-3 py-1 text-sm text-slate-200">
            {scopeType === 'province'
              ? 'Province-wide'
              : scopeCode.toUpperCase()}
          </span>
        </div>
      </header>

      {analyticsQuery.isLoading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
          Loading analytics...
        </div>
      ) : analyticsQuery.error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700 shadow-sm">
          Failed to load analytics data.
        </div>
      ) : analyticsQuery.data ? (
        <AnalyticsDashboard
          analytics={analyticsQuery.data}
          role={role}
          dateRange={dateRange}
          selectedMunicipalityCode={selectedMunicipalityCode}
          onPresetChange={(preset) =>
            startTransition(() => {
              setDateRange(buildPresetRange(preset))
            })
          }
          onDateChange={(field, value) =>
            startTransition(() => {
              setDateRange((current) => ({
                ...current,
                preset: 'custom',
                [field]: value,
              }))
            })
          }
          onMunicipalityChange={(municipalityCode) =>
            startTransition(() => {
              setSelectedMunicipalityCode(municipalityCode)
            })
          }
          heatmapEnabled={analyticsHeatmapEnabled}
          onHeatmapToggle={() => setAnalyticsHeatmapEnabled(!analyticsHeatmapEnabled)}
        />
      ) : null}

      {isPending && (
        <p className="text-sm text-slate-500">Updating analytics view...</p>
      )}
    </div>
  )
}
