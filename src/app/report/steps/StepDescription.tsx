import { Controller, UseFormReturn } from 'react-hook-form'
import { ReportFormData } from '@/features/report/ReportFormSchema'

interface StepDescriptionProps {
  form: UseFormReturn<ReportFormData>
}

export function StepDescription({ form }: StepDescriptionProps) {
  const { control } = form

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Description
      </label>
      <Controller
        name="description"
        control={control}
        render={({ field }) => (
          <div>
            <textarea
              {...field}
              rows={6}
              maxLength={2000}
              placeholder="Describe what happened, where, and when. Include any details that might help responders..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 placeholder-gray-400 resize-y focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <div className="text-right text-xs text-gray-400 mt-1">
              {field.value?.length ?? 0} / 2000
            </div>
          </div>
        )}
      />
      {form.formState.errors.description && (
        <p className="text-red-500 text-sm mt-1">{form.formState.errors.description.message as string}</p>
      )}
    </div>
  )
}
