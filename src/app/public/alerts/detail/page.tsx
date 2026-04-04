import { Link, useParams } from 'react-router-dom'
import { RouteMeta } from '@/lib/seo/RouteMeta'
import { getMunicipality } from '@/lib/geo/municipality'
import { usePublicAnnouncement } from '@/hooks/usePublicAnnouncements'

export function PublicAlertDetailPage() {
  const { alertId } = useParams<{ alertId: string }>()
  const { data: announcement, isLoading } = usePublicAnnouncement(alertId)
  const description =
    announcement?.body ??
    'Read the full public alert detail for a published Bantayog Alert announcement.'
  const scopeLabel =
    announcement?.targetScope.type === 'province'
      ? 'Province-wide'
      : announcement?.targetScope.type === 'municipality'
        ? getMunicipality(announcement.targetScope.municipalityCodes[0])?.name ??
          announcement.targetScope.municipalityCodes[0]
        : `${announcement?.targetScope.municipalityCodes.length ?? 0} municipalities`

  return (
    <>
      <RouteMeta
        title={announcement?.title ?? 'Alert details'}
        description={description}
        canonicalPath={`/public/alerts/${alertId ?? ''}`}
      />
      <main className="min-h-screen bg-slate-950 px-6 py-16 text-white lg:px-10">
        <div className="mx-auto flex max-w-4xl flex-col gap-6">
          <Link
            to="/public/alerts"
            className="text-sm font-medium text-red-300 transition hover:text-red-200"
          >
            Back to alerts
          </Link>
          <article className="rounded-[2rem] border border-slate-800 bg-slate-900/80 p-8 shadow-2xl shadow-slate-950/40">
            {isLoading ? (
              <p className="text-sm text-slate-300">Loading alert details...</p>
            ) : null}
            {!isLoading && !announcement ? (
              <>
                <h1 className="text-3xl font-semibold tracking-tight text-white">
                  Alert not found
                </h1>
                <p className="mt-3 text-sm leading-7 text-slate-300">
                  The requested public alert is unavailable or no longer
                  published.
                </p>
              </>
            ) : null}
            {announcement ? (
              <>
                <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.24em] text-red-300">
                  <span>{announcement.severity}</span>
                  <span>{announcement.type.replace('_', ' ')}</span>
                  <span>{scopeLabel}</span>
                </div>
                <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white">
                  {announcement.title}
                </h1>
                <p className="mt-4 max-w-3xl whitespace-pre-wrap text-base leading-8 text-slate-200">
                  {announcement.body}
                </p>
                <div className="mt-8 grid gap-4 border-t border-slate-800 pt-6 text-sm text-slate-300 sm:grid-cols-2">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                      Published
                    </p>
                    <p className="mt-2">
                      {announcement.publishedAt
                        ? new Date(announcement.publishedAt).toLocaleString()
                        : 'Pending timestamp'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                      Alert ID
                    </p>
                    <p className="mt-2 font-mono text-xs text-slate-400">
                      {announcement.id}
                    </p>
                  </div>
                </div>
              </>
            ) : null}
          </article>
        </div>
      </main>
    </>
  )
}
