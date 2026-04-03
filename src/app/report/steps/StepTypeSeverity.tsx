import { Controller, UseFormReturn } from 'react-hook-form'
import { Droplets, Flame, Heart, Shield, Mountain, Car, AlertCircle, Waves } from 'lucide-react'
import { IncidentType, Severity } from '@/types/report'
import { ReportFormData } from '@/features/report/ReportFormSchema'

const INCIDENT_ICONS: Record<IncidentType, React.ComponentType<{ className?: string }>> = {
  [IncidentType.Flood]: Droplets,
  [IncidentType.Landslide]: Mountain,
  [IncidentType.Fire]: Flame,
  [IncidentType.Earthquake]: Waves,
  [IncidentType.Medical]: Heart,
  [IncidentType.VehicleAccident]: Car,
  [IncidentType.Crime]: Shield,
  [IncidentType.Other]: AlertCircle,
}

const SEVERITY_COLORS: Record<Severity, { border: string; bg: string; text: string }> = {
  [Severity.Critical]: { border: 'border-red-500', bg: 'bg-red-50', text: 'text-red-700' },
  [Severity.High]: { border: 'border-orange-500', bg: 'bg-orange-50', text: 'text-orange-700' },
  [Severity.Medium]: { border: 'border-yellow-500', bg: 'bg-yellow-50', text: 'text-yellow-700' },
  [Severity.Low]: { border: 'border-green-500', bg: 'bg-green-50', text: 'text-green-700' },
}

interface StepTypeSeverityProps {
  form: UseFormReturn<ReportFormData>
}

export function StepTypeSeverity({ form }: StepTypeSeverityProps) {
  const { control } = form

  return (
    <div className="space-y-6">
      {/* Incident Type Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Incident Type</label>
        <Controller
          name="type"
          control={control}
          render={({ field }) => (
            <div className="grid grid-cols-2 gap-3">
              {Object.values(IncidentType).map((type) => {
                const Icon = INCIDENT_ICONS[type]
                const isSelected = field.value === type
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => field.onChange(type)}
                    className={`p-3 rounded-lg border-2 text-left transition-colors flex flex-col items-center gap-2
                      ${isSelected
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <Icon className={`w-6 h-6 ${isSelected ? 'text-primary-600' : 'text-gray-500'}`} />
                    <div className="text-sm font-medium capitalize">
                      {type.replace('_', ' ')}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        />
        {form.formState.errors.type && (
          <p className="text-red-500 text-sm mt-1">{form.formState.errors.type.message as string}</p>
        )}
      </div>

      {/* Severity Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Severity</label>
        <Controller
          name="severity"
          control={control}
          render={({ field }) => (
            <div className="flex gap-3">
              {Object.values(Severity).map((severity) => {
                const colors = SEVERITY_COLORS[severity]
                const isSelected = field.value === severity
                return (
                  <button
                    key={severity}
                    type="button"
                    onClick={() => field.onChange(severity)}
                    className={`flex-1 py-2 px-3 rounded-lg border-2 text-center text-sm font-medium capitalize transition-colors
                      ${isSelected
                        ? `${colors.border} ${colors.bg} ${colors.text}`
                        : 'border-gray-200 hover:border-gray-300 text-gray-600'}`}
                  >
                    {severity}
                  </button>
                )
              })}
            </div>
          )}
        />
        {form.formState.errors.severity && (
          <p className="text-red-500 text-sm mt-1">{form.formState.errors.severity.message as string}</p>
        )}
      </div>
    </div>
  )
}
