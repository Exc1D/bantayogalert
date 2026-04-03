'use client'

import { UseFormReturn } from 'react-hook-form'
import { ReportFormData } from '@/features/report/ReportFormSchema'
import { getMunicipality } from '@/lib/geo/municipality'
import { IncidentType, Severity } from '@/types/report'

interface StepReviewProps {
  form: UseFormReturn<ReportFormData>
  onSubmit: () => void
  isSubmitting?: boolean
}

const SEVERITY_STYLES: Record<Severity, string> = {
  [Severity.Critical]: 'bg-red-100 text-red-700',
  [Severity.High]: 'bg-orange-100 text-orange-700',
  [Severity.Medium]: 'bg-yellow-100 text-yellow-700',
  [Severity.Low]: 'bg-green-100 text-green-700',
}

const INCIDENT_LABELS: Record<IncidentType, string> = {
  [IncidentType.Flood]: 'Flood',
  [IncidentType.Landslide]: 'Landslide',
  [IncidentType.Fire]: 'Fire',
  [IncidentType.Earthquake]: 'Earthquake',
  [IncidentType.Medical]: 'Medical Emergency',
  [IncidentType.VehicleAccident]: 'Vehicle Accident',
  [IncidentType.Crime]: 'Crime',
  [IncidentType.Other]: 'Other',
}

export function StepReview({ form, onSubmit, isSubmitting }: StepReviewProps) {
  const data = form.watch()
  const municipality = getMunicipality(data.municipalityCode)
  const photos: string[] = data.photos ?? []

  return (
    <div className="space-y-4">
      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
        {/* Incident Type */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500">Incident Type</span>
          <span className="font-medium capitalize">
            {data.type ? INCIDENT_LABELS[data.type].toLowerCase() : '—'}
          </span>
        </div>

        {/* Severity */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500">Severity</span>
          <span
            className={`px-2 py-0.5 rounded text-sm font-medium capitalize ${
              data.severity ? SEVERITY_STYLES[data.severity] : ''
            }`}
          >
            {data.severity ?? '—'}
          </span>
        </div>

        {/* Description */}
        <div className="pt-2 border-t">
          <div className="text-sm text-gray-500 mb-1">Description</div>
          <div className="text-sm whitespace-pre-wrap text-gray-900">
            {data.description || '—'}
          </div>
        </div>

        {/* Location */}
        <div className="flex justify-between items-start">
          <span className="text-sm text-gray-500">Location</span>
          <span className="text-sm text-right">
            {municipality?.name ?? data.municipalityCode ?? '—'}
            {data.barangayCode && ` / ${data.barangayCode}`}
          </span>
        </div>

        {/* Coordinates */}
        {data.location && (
          <div className="flex justify-between text-xs text-gray-400">
            <span>Coordinates</span>
            <span className="font-mono">
              {data.location.lat?.toFixed(4)}, {data.location.lng?.toFixed(4)}
            </span>
          </div>
        )}
      </div>

      {/* Photos */}
      {photos.length > 0 && (
        <div>
          <div className="text-sm text-gray-500 mb-2">
            Photos ({photos.length}/5)
          </div>
          <div className="grid grid-cols-3 gap-2">
            {photos.map((url: string, i: number) => (
              <img
                key={i}
                src={url}
                alt={`Photo ${i + 1}`}
                className="w-full h-20 object-cover rounded"
              />
            ))}
          </div>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="button"
        onClick={onSubmit}
        disabled={isSubmitting}
        className="w-full bg-primary-600 text-white py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? 'Submitting...' : 'Submit Report'}
      </button>
    </div>
  )
}
