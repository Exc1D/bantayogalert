import { Link } from 'react-router-dom'
import { RouteMeta } from '@/lib/seo/RouteMeta'
import { AlertCard } from '@/components/alerts/AlertCard'
import { usePublicAnnouncements } from '@/hooks/usePublicAnnouncements'

export function PublicAlertsPage() {
  const { data: announcements = [], isLoading } = usePublicAnnouncements()

  return (
    <>
      <RouteMeta
        title="Public alerts"
        description="Read official public alerts and advisories published by Bantayog Alert administrators."
        canonicalPath="/public/alerts"
      />
      <main className="min-h-screen bg-slate-950 px-6 py-16 text-white lg:px-10">
        <div className="mx-auto flex max-w-5xl flex-col gap-6">
          <Link
            to="/"
            className="text-sm font-medium text-red-300 transition hover:text-red-200"
          >
            Back to landing page
          </Link>
          <section className="rounded-[2rem] border border-slate-800 bg-slate-900/80 p-8 shadow-2xl shadow-slate-950/40">
            <h1 className="text-3xl font-semibold tracking-tight text-white">
              Public alerts
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
              Published advisories and emergency notices remain publicly
              accessible even when you are not signed in.
            </p>
          </section>
          <section className="grid gap-4">
            {isLoading ? (
              <div className="rounded-[2rem] border border-slate-800 bg-slate-900/80 p-8 text-sm text-slate-300 shadow-2xl shadow-slate-950/40">
                Loading public alerts...
              </div>
            ) : null}
            {!isLoading && announcements.length === 0 ? (
              <div className="rounded-[2rem] border border-dashed border-slate-700 bg-slate-900/40 p-8 text-sm text-slate-300">
                No published public alerts are available yet.
              </div>
            ) : null}
            {announcements.map((announcement) => (
              <AlertCard
                key={announcement.id}
                announcement={announcement}
                href={`/public/alerts/${announcement.id}`}
              />
            ))}
          </section>
        </div>
      </main>
    </>
  )
}
