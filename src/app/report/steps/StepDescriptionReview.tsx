'use client'

import { UseFormReturn } from 'react-hook-form'
import { getMunicipality } from '@/lib/geo/municipality'
import { ReportFormData } from '@/features/report/ReportFormSchema'

interface StepDescriptionReviewProps {
  form: UseFormReturn<ReportFormData>
  onSubmit: () => void
  isSubmitting?: boolean
}

export function StepDescriptionReview({ form, onSubmit, isSubmitting }: StepDescriptionReviewProps) {
  const data = form.watch()
  const municipality = getMunicipality(data.municipalityCode)
  const photos: string[] = data.photos ?? []

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="report-description" className="block text-sm font-medium text-neutral-700 mb-2">
          Description
        </label>
        <textarea
          id="report-description"
          name="description"
          value={data.description ?? ''}
          onChange={(e) => form.setValue('description', e.target.value, { shouldValidate: true })}
          rows={6}
          maxLength={2000}
          aria-describedby={form.formState.errors.description ? 'description-error' : undefined}
          placeholder="Describe what happened, where, and when. Include any details that might help responders..."
          className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-base text-neutral-900 placeholder-neutral-500 resize-y focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
        />
        <div className="text-right text-xs text-neutral-500 mt-1">
          {(data.description ?? '').length} / 2000
        </div>
        {form.formState.errors.description && (
          <p id="description-error" className="text-severity-critical text-sm mt-1">{form.formState.errors.description.message as string}</p>
        )}
      </div>

      {/* Review Summary */}
      <div className="bg-neutral-50 rounded-lg p-4 space-y-3">
        <div className="text-sm font-medium text-neutral-900 mb-1">Summary</div>

        <div className="flex justify-between items-start">
          <span className="text-sm text-neutral-500">Location</span>
          <span className="text-sm text-right">
            {municipality?.name ?? data.municipalityCode ?? '—'}
            {data.barangayCode && ` / ${data.barangayCode}`}
          </span>
        </div>

        {data.location && (
          <div className="flex justify-between text-xs text-neutral-400">
            <span>Coordinates</span>
            <span className="font-mono">
              {data.location.lat?.toFixed(4)}, {data.location.lng?.toFixed(4)}
            </span>
          </div>
        )}

        {photos.length > 0 && (
          <div>
            <div className="text-sm text-neutral-500 mb-2">Photos ({photos.length}/5)</div>
            <div className="grid grid-cols-3 gap-2">
              {photos.map((url, i) => (
                <img key={i} src={url} alt={`Photo ${i + 1}`} className="w-full h-20 object-cover rounded" />
              ))}
            </div>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={onSubmit}
        disabled={isSubmitting}
        className="w-full bg-brand text-white py-3 rounded-lg font-medium hover:bg-brand-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? 'Submitting...' : 'Submit Report'}
      </button>
    </div>
  )
}
