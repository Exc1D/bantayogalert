import { useState } from 'react'
import { Controller, UseFormReturn } from 'react-hook-form'
import { MapPin, Loader2 } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import { MUNICIPALITIES, encodeGeohash } from '@/lib/geo/municipality'
import { detectLocation, findMunicipalityByCoords } from '@/features/report/useLocationDetector'
import { ReportFormData } from '@/features/report/ReportFormSchema'

interface StepLocationProps {
  form: UseFormReturn<ReportFormData>
  onPreviewUrlsChange: (urls: string[]) => void
  onFilesChange: (files: File[]) => void
  photoUrls: string[]
}

export function StepLocation({
  form,
  photoUrls,
}: StepLocationProps) {
  const { control, watch, setValue } = form
  const selectedMunicipality = watch('municipalityCode')

  const [gpsLoading, setGpsLoading] = useState(false)
  const [gpsError, setGpsError] = useState<string | null>(null)

  const { data: barangays = [] } = useQuery({
    queryKey: ['barangays', selectedMunicipality],
    queryFn: async () => {
      if (!selectedMunicipality) return []
      try {
        const snap = await getDocs(
          collection(db, 'municipalities', selectedMunicipality, 'barangays')
        )
        return snap.docs.map((d) => ({ code: d.id, name: d.data().name as string }))
      } catch {
        return []
      }
    },
    enabled: !!selectedMunicipality,
  })

  async function handleUseMyLocation() {
    setGpsLoading(true)
    setGpsError(null)
    try {
      const result = await detectLocation()
      if (result.error) {
        setGpsError(result.error)
      } else {
        setValue('location.lat', result.coords.lat, { shouldValidate: true })
        setValue('location.lng', result.coords.lng, { shouldValidate: true })
        setValue('location.geohash', encodeGeohash(result.coords.lat, result.coords.lng, 9), { shouldValidate: true })
        const municipality = await findMunicipalityByCoords(result.coords.lat, result.coords.lng)
        if (municipality) {
          setValue('municipalityCode', municipality.code)
          setValue('barangayCode', '')
        }
      }
    } finally {
      setGpsLoading(false)
    }
  }

  const lat = watch('location.lat') ?? 14.15
  const lng = watch('location.lng') ?? 122.9

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={handleUseMyLocation}
        disabled={gpsLoading}
        className="flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-light disabled:opacity-50 transition-colors text-sm font-medium"
      >
        {gpsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
        {gpsLoading ? 'Detecting location...' : 'Use My Location'}
      </button>
      {gpsError && <p className="text-severity-critical text-sm">{gpsError}</p>}

      <div className="text-xs text-neutral-500 font-mono">
        {lat.toFixed(6)}, {lng.toFixed(6)}
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1">Municipality</label>
        <Controller
          name="municipalityCode"
          control={control}
          render={({ field }) => (
            <select
              {...field}
              className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-base text-neutral-900 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
            >
              <option value="">Select municipality</option>
              {MUNICIPALITIES.map((m) => (
                <option key={m.code} value={m.code}>{m.name}</option>
              ))}
            </select>
          )}
        />
        {form.formState.errors.municipalityCode && (
          <p className="text-severity-critical text-sm mt-1">{form.formState.errors.municipalityCode.message as string}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1">Barangay</label>
        <Controller
          name="barangayCode"
          control={control}
          render={({ field }) => (
            <select
              {...field}
              disabled={!selectedMunicipality}
              className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-base text-neutral-900 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent disabled:bg-neutral-100 disabled:cursor-not-allowed"
            >
              <option value="">{selectedMunicipality ? 'Select barangay' : 'Select municipality first'}</option>
              {barangays.map((b: { code: string; name: string }) => (
                <option key={b.code} value={b.code}>{b.name}</option>
              ))}
            </select>
          )}
        />
        {form.formState.errors.barangayCode && (
          <p className="text-severity-critical text-sm mt-1">{form.formState.errors.barangayCode.message as string}</p>
        )}
      </div>

      {photoUrls.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {photoUrls.map((url, i) => (
            <img key={i} src={url} alt={`Evidence ${i + 1}`} className="w-full h-20 object-cover rounded-lg" />
          ))}
        </div>
      )}
    </div>
  )
}
