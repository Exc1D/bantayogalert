'use client'

import { useState, useRef } from 'react'
import { Controller, UseFormReturn } from 'react-hook-form'
import { MapPin, Loader2 } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import { MUNICIPALITIES, encodeGeohash } from '@/lib/geo/municipality'
import { detectLocation, findMunicipalityByCoords } from '@/features/report/useLocationDetector'
import { compressImage } from '@/features/report/mediaUpload'
import { LocationPickerMap } from '@/components/map/LocationPickerMap'
import { ReportFormData } from '@/features/report/ReportFormSchema'

interface StepLocationMediaProps {
  form: UseFormReturn<ReportFormData>
  setPreviewUrls: (urls: string[]) => void
  onRemovePhoto: (index: number) => void
  onCompressedFilesChange?: (files: File[]) => void
}

export function StepLocationMedia({
  form,
  setPreviewUrls,
  onRemovePhoto,
  onCompressedFilesChange,
}: StepLocationMediaProps) {
  const { control, watch, setValue } = form
  const selectedMunicipality = watch('municipalityCode')

  const [gpsLoading, setGpsLoading] = useState(false)
  const [gpsError, setGpsError] = useState<string | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [compressedFiles, setCompressedFilesLocal] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Fetch barangays for selected municipality
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
        setValue(
          'location.geohash',
          encodeGeohash(result.coords.lat, result.coords.lng, 9),
          { shouldValidate: true }
        )
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

  function handleLocationChange(lat: number, lng: number) {
    setValue('location.lat', lat, { shouldValidate: true })
    setValue('location.lng', lng, { shouldValidate: true })
    setValue('location.geohash', encodeGeohash(lat, lng, 9), { shouldValidate: true })
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return

    const total = compressedFiles.length + files.length
    if (total > 5) {
      setFileError('Maximum 5 photos allowed. Please remove some photos first.')
      return
    }

    setFileError(null)
    try {
      const compressed = await Promise.all(files.map((f) => compressImage(f)))
      const newCompressed = [...compressedFiles, ...compressed]
      setCompressedFilesLocal(newCompressed)
      onCompressedFilesChange?.(newCompressed)

      const blobUrls = newCompressed.map((f) => URL.createObjectURL(f))
      setPreviewUrls(blobUrls)
    } catch {
      setFileError('Failed to compress images. Please try again.')
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  function handleRemovePhoto(index: number) {
    const newFiles = compressedFiles.filter((_, i) => i !== index)
    setCompressedFilesLocal(newFiles)
    onCompressedFilesChange?.(newFiles)

    const blobUrls = newFiles.map((f) => URL.createObjectURL(f))
    setPreviewUrls(blobUrls)
    onRemovePhoto(index)
  }

  const lat = watch('location.lat') ?? 14.15
  const lng = watch('location.lng') ?? 122.9

  return (
    <div className="space-y-4">
      {/* GPS Button */}
      <button
        type="button"
        onClick={handleUseMyLocation}
        disabled={gpsLoading}
        className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors text-sm font-medium"
      >
        {gpsLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <MapPin className="w-4 h-4" />
        )}
        {gpsLoading ? 'Detecting location...' : 'Use My Location'}
      </button>

      {gpsError && (
        <p className="text-red-500 text-sm">{gpsError}</p>
      )}

      {/* Location Picker Map */}
      <LocationPickerMap
        initialLat={lat}
        initialLng={lng}
        onLocationChange={handleLocationChange}
      />

      {/* Coordinates display */}
      <div className="text-xs text-gray-500 font-mono">
        {lat.toFixed(6)}, {lng.toFixed(6)}
      </div>

      {/* Municipality Dropdown */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Municipality
        </label>
        <Controller
          name="municipalityCode"
          control={control}
          render={({ field }) => (
            <select
              {...field}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Select municipality</option>
              {MUNICIPALITIES.map((m) => (
                <option key={m.code} value={m.code}>
                  {m.name}
                </option>
              ))}
            </select>
          )}
        />
        {form.formState.errors.municipalityCode && (
          <p className="text-red-500 text-sm mt-1">
            {form.formState.errors.municipalityCode.message as string}
          </p>
        )}
      </div>

      {/* Barangay Dropdown */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Barangay
        </label>
        <Controller
          name="barangayCode"
          control={control}
          render={({ field }) => (
            <select
              {...field}
              disabled={!selectedMunicipality}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">
                {selectedMunicipality ? 'Select barangay' : 'Select municipality first'}
              </option>
              {barangays.map((b: { code: string; name: string }) => (
                <option key={b.code} value={b.code}>
                  {b.name}
                </option>
              ))}
            </select>
          )}
        />
        {form.formState.errors.barangayCode && (
          <p className="text-red-500 text-sm mt-1">
            {form.formState.errors.barangayCode.message as string}
          </p>
        )}
      </div>

      {/* Photo Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Photos (optional, max 5)
        </label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          capture="environment"
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
        />
        {fileError && (
          <p className="text-red-500 text-sm mt-1">{fileError}</p>
        )}

        {/* Photo Preview Grid */}
        {compressedFiles.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mt-3">
            {compressedFiles.map((file, i) => (
              <div key={i} className="relative group">
                <img
                  src={URL.createObjectURL(file)}
                  alt={`Photo ${i + 1}`}
                  className="w-full h-20 object-cover rounded"
                />
                <button
                  type="button"
                  onClick={() => handleRemovePhoto(i)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
