import type { HotspotCount } from '@/types/analytics'
import { getMunicipality } from '@/lib/geo/municipality'

interface HotspotListProps {
  hotspots: HotspotCount[]
}

export function HotspotList({ hotspots }: HotspotListProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-900">Hotspots</h2>
        <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Ranked barangays
        </span>
      </div>

      <div className="mt-4 space-y-3">
        {hotspots.length === 0 ? (
          <p className="rounded-xl bg-slate-50 px-4 py-6 text-sm text-slate-500">
            No hotspot data is available for this range yet.
          </p>
        ) : (
          hotspots.map((hotspot, index) => (
            <div
              key={`${hotspot.municipalityCode}-${hotspot.barangayCode}`}
              className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-3"
            >
              <div>
                <p className="text-sm font-medium text-slate-900">
                  #{index + 1} {hotspot.barangayCode.toUpperCase()}
                </p>
                <p className="text-xs text-slate-500">
                  {getMunicipality(hotspot.municipalityCode)?.name ??
                    hotspot.municipalityCode}
                </p>
              </div>
              <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-900">
                {hotspot.count}
              </span>
            </div>
          ))
        )}
      </div>
    </section>
  )
}
