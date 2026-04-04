import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { AnalyticsQueryResult, AnalyticsDateRange } from '@/hooks/useAnalytics'
import { AnalyticsDateRangeControls } from './AnalyticsDateRangeControls'
import { AnalyticsScopeSelector } from './AnalyticsScopeSelector'
import { AnalyticsSummaryCards } from './AnalyticsSummaryCards'
import { HotspotList } from './HotspotList'
import { UserRole } from '@/types/user'

interface AnalyticsDashboardProps {
  analytics: AnalyticsQueryResult
  role: UserRole
  dateRange: AnalyticsDateRange
  selectedMunicipalityCode: string | null
  onPresetChange: (preset: AnalyticsDateRange['preset']) => void
  onDateChange: (field: 'startDate' | 'endDate', value: string) => void
  onMunicipalityChange: (municipalityCode: string | null) => void
  heatmapEnabled: boolean
  onHeatmapToggle: () => void
}

const PIE_COLORS = ['#f97316', '#f59e0b', '#facc15', '#fb7185', '#38bdf8']

export function AnalyticsDashboard({
  analytics,
  role,
  dateRange,
  selectedMunicipalityCode,
  onPresetChange,
  onDateChange,
  onMunicipalityChange,
  heatmapEnabled,
  onHeatmapToggle,
}: AnalyticsDashboardProps) {
  const typeData = Object.entries(analytics.range.byType).map(([type, count]) => ({
    type,
    count,
  }))

  const severityData = Object.entries(analytics.range.bySeverity).map(
    ([severity, count]) => ({
      severity,
      count,
    })
  )

  const municipalityBreakdown = analytics.range.municipalityBreakdown

  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
        <AnalyticsDateRangeControls
          dateRange={dateRange}
          onPresetChange={onPresetChange}
          onDateChange={onDateChange}
        />
        <div className="space-y-4">
          <AnalyticsScopeSelector
            role={role}
            municipalityCode={selectedMunicipalityCode}
            onMunicipalityChange={onMunicipalityChange}
          />
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-700">Heatmap</p>
                <p className="text-xs text-slate-500">
                  Desktop overlay from aggregate hotspot counts
                </p>
              </div>
              <button
                type="button"
                onClick={onHeatmapToggle}
                className={`hidden xl:inline-flex rounded-full px-3 py-2 text-sm font-medium ${
                  heatmapEnabled
                    ? 'bg-amber-500 text-white'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                {heatmapEnabled ? 'Heatmap On' : 'Heatmap Off'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <AnalyticsSummaryCards counts={analytics.range.byWorkflowState} />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">
              Reports Over Time
            </h2>
            <span className="text-xs uppercase tracking-wide text-slate-500">
              Line chart
            </span>
          </div>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics.timeSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="bucketKey" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#0f172a"
                  strokeWidth={2}
                  name="Total"
                />
                <Line
                  type="monotone"
                  dataKey="resolved"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="Resolved"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        <div className="grid gap-4">
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-medium text-slate-700">
              Avg Verification Minutes
            </p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">
              {analytics.range.avgVerificationMinutes}
            </p>
          </section>
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-medium text-slate-700">
              Avg Resolution Minutes
            </p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">
              {analytics.range.avgResolutionMinutes}
            </p>
          </section>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">
              Reports by Type
            </h2>
            <span className="text-xs uppercase tracking-wide text-slate-500">
              Bar chart
            </span>
          </div>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={typeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="type" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#f97316" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">
              Reports by Severity
            </h2>
            <span className="text-xs uppercase tracking-wide text-slate-500">
              Donut chart
            </span>
          </div>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip />
                <Legend />
                <Pie
                  data={severityData}
                  dataKey="count"
                  nameKey="severity"
                  innerRadius={58}
                  outerRadius={96}
                  paddingAngle={3}
                >
                  {severityData.map((entry, index) => (
                    <Cell
                      key={entry.severity}
                      fill={PIE_COLORS[index % PIE_COLORS.length]}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      {role === UserRole.ProvincialSuperadmin &&
        municipalityBreakdown.length > 0 && (
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">
                Municipality Breakdown
              </h2>
              <span className="text-xs uppercase tracking-wide text-slate-500">
                Province scope
              </span>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="text-left text-slate-500">
                  <tr>
                    <th className="pb-2 pr-4">Municipality</th>
                    <th className="pb-2 pr-4">Total</th>
                    <th className="pb-2 pr-4">Pending</th>
                    <th className="pb-2 pr-4">Verified</th>
                    <th className="pb-2 pr-4">Resolved</th>
                    <th className="pb-2">Rejected</th>
                  </tr>
                </thead>
                <tbody>
                  {municipalityBreakdown.map((entry) => (
                    <tr key={entry.municipalityCode} className="border-t border-slate-100">
                      <td className="py-3 pr-4 font-medium text-slate-900">
                        {entry.municipalityCode.toUpperCase()}
                      </td>
                      <td className="py-3 pr-4">{entry.total}</td>
                      <td className="py-3 pr-4">{entry.pending}</td>
                      <td className="py-3 pr-4">{entry.verified}</td>
                      <td className="py-3 pr-4">{entry.resolved}</td>
                      <td className="py-3">{entry.rejected}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

      <HotspotList hotspots={analytics.range.hotspots} />
    </div>
  )
}
