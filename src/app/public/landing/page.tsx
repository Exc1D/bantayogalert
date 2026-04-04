import { Link } from 'react-router-dom'
import { RouteMeta } from '@/lib/seo/RouteMeta'
import { usePublicAnnouncements } from '@/hooks/usePublicAnnouncements'
import { usePublicVerifiedReports } from '@/hooks/usePublicVerifiedReports'

export function LandingPage() {
  const { data: reports = [] } = usePublicVerifiedReports()
  const { data: announcements = [] } = usePublicAnnouncements({ pageSize: 3 })

  return (
    <>
      <RouteMeta
        title="Disaster reporting"
        description="Report incidents quickly, monitor verified public updates, and follow official alerts across Camarines Norte."
        canonicalPath="/"
      />
      <main className="min-h-screen bg-slate-950 text-white">
        <section className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center gap-10 px-6 py-16 lg:px-10">
          <div className="max-w-3xl space-y-6">
            <p className="text-sm font-semibold uppercase tracking-[0.32em] text-red-300">
              Bantayog Alert
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              Public disaster visibility for Camarines Norte.
            </h1>
            <p className="max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
              Follow verified incidents, view municipality-wide map activity, and
              register to submit reports directly to emergency responders.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              to="/public/map"
              className="inline-flex items-center justify-center rounded-full bg-red-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-red-400"
            >
              View public map
            </Link>
            <Link
              to="/public/alerts"
              className="inline-flex items-center justify-center rounded-full border border-slate-700 px-6 py-3 text-sm font-semibold text-slate-100 transition hover:border-slate-500 hover:bg-slate-900"
            >
              Browse alerts
            </Link>
            <Link
              to="/auth/register"
              className="inline-flex items-center justify-center rounded-full border border-red-400/40 px-6 py-3 text-sm font-semibold text-red-100 transition hover:border-red-300 hover:bg-red-500/10"
            >
              Create an account
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-[1.75rem] border border-slate-800 bg-slate-900/80 p-5">
              <p className="text-sm uppercase tracking-[0.24em] text-slate-400">
                Verified reports
              </p>
              <p className="mt-3 text-3xl font-semibold text-white">
                {reports.length}
              </p>
              <p className="mt-2 text-sm text-slate-300">
                Public incident markers currently visible on the map.
              </p>
            </div>
            <div className="rounded-[1.75rem] border border-slate-800 bg-slate-900/80 p-5">
              <p className="text-sm uppercase tracking-[0.24em] text-slate-400">
                Published alerts
              </p>
              <p className="mt-3 text-3xl font-semibold text-white">
                {announcements.length}
              </p>
              <p className="mt-2 text-sm text-slate-300">
                Recent official advisories and emergency updates.
              </p>
            </div>
            <div className="rounded-[1.75rem] border border-slate-800 bg-slate-900/80 p-5">
              <p className="text-sm uppercase tracking-[0.24em] text-slate-400">
                Public access
              </p>
              <p className="mt-3 text-3xl font-semibold text-white">
                24/7
              </p>
              <p className="mt-2 text-sm text-slate-300">
                View alerts and verified activity without signing in.
              </p>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}
