import { Link } from 'react-router-dom'
import { RouteMeta } from '@/lib/seo/RouteMeta'
import { MapContainerWrapper } from '@/app/shell/MapContainerWrapper'
import { PublicReportMarkers } from '@/components/map/PublicReportMarkers'
import { usePublicVerifiedReports } from '@/hooks/usePublicVerifiedReports'

export function PublicMapPage() {
  const { data: reports = [], isLoading } = usePublicVerifiedReports()

  return (
    <>
      <RouteMeta
        title="Public incident map"
        description="View the public map of verified incidents across Camarines Norte."
        canonicalPath="/public/map"
      />
      <main className="min-h-screen bg-slate-950 px-6 py-12 text-white lg:px-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-6">
          <Link
            to="/"
            className="text-sm font-medium text-red-300 transition hover:text-red-200"
          >
            Back to landing page
          </Link>
          <div className="grid gap-6 xl:grid-cols-[1.45fr_0.75fr]">
            <section className="overflow-hidden rounded-[2rem] border border-slate-800 bg-slate-900/80 shadow-2xl shadow-slate-950/40">
              <header className="border-b border-slate-800 px-6 py-5">
                <h1 className="text-3xl font-semibold tracking-tight text-white">
                  Public map
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-300">
                  Municipality boundaries and verified public incident markers.
                </p>
              </header>
              <div className="h-[520px]">
                <MapContainerWrapper
                  showReportMarkers={false}
                  showAnalyticsOverlay={false}
                >
                  <PublicReportMarkers reports={reports} />
                </MapContainerWrapper>
              </div>
            </section>
            <aside className="rounded-[2rem] border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-slate-950/40">
              <h2 className="text-lg font-semibold text-white">
                Verified activity
              </h2>
              <p className="mt-2 text-sm text-slate-300">
                {isLoading
                  ? 'Loading the latest verified public incidents...'
                  : `${reports.length} verified reports are currently available on the public map.`}
              </p>
              <div className="mt-6 space-y-3">
                {reports.slice(0, 5).map((report) => (
                  <div
                    key={report.id}
                    className="rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3"
                  >
                    <p className="text-sm font-semibold capitalize text-white">
                      {report.type.replace('_', ' ')}
                    </p>
                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-red-300">
                      {report.severity}
                    </p>
                    <p className="mt-2 text-xs text-slate-400">
                      {new Date(report.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))}
                {!isLoading && reports.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-700 px-4 py-6 text-sm text-slate-400">
                    No verified public reports are available yet.
                  </div>
                ) : null}
              </div>
            </aside>
          </div>
        </div>
      </main>
    </>
  )
}
