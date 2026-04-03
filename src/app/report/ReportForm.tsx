'use client'

import { useEffect, useState } from 'react'
import { useForm, UseFormReturn } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import {
  fullReportSchema,
  step1Schema,
  step2Schema,
  step3Schema,
  ReportFormData,
} from '@/features/report/ReportFormSchema'
import { saveDraft, loadDraft, clearDraft } from '@/features/report/useReportDraft'
import { useAuth } from '@/lib/auth/AuthProvider'
import { StepIndicator } from './StepIndicator'
import { StepTypeSeverity } from './steps/StepTypeSeverity'
import { StepDescription } from './steps/StepDescription'
import { StepLocationMedia } from './steps/StepLocationMedia'
import { StepReview } from './steps/StepReview'

const STEPS = ['Type & Severity', 'Description', 'Location & Media', 'Review']

interface ReportFormProps {
  onSubmit: (data: ReportFormData, mediaFiles: File[]) => Promise<void>
  onCancel?: () => void
}

export function ReportForm({ onSubmit, onCancel }: ReportFormProps) {
  const { user } = useAuth()
  const [currentStep, setCurrentStep] = useState(0)
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [compressedFiles, setCompressedFiles] = useState<File[]>([])

  const form = useForm<ReportFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(fullReportSchema) as any,
    mode: 'onBlur',
    defaultValues: {
      type: undefined,
      severity: undefined,
      description: '',
      municipalityCode: '',
      barangayCode: '',
      location: { lat: 14.15, lng: 122.9, geohash: '' },
      mediaUrls: [],
      photos: [],
    },
  })

  // Keep photos field in sync with previewUrls
  useEffect(() => {
    form.setValue('photos', previewUrls, { shouldValidate: false, shouldDirty: false })
  }, [previewUrls, form])

  // Load draft on mount
  useEffect(() => {
    if (!user) return
    loadDraft(user.uid).then((draft) => {
      if (draft) {
        const confirmed = window.confirm(
          'You have a saved draft. Would you like to resume? Click OK to resume or Cancel to start fresh.'
        )
        if (confirmed) {
          if (draft.step1?.type) form.setValue('type', draft.step1.type as ReportFormData['type'])
          if (draft.step1?.severity) form.setValue('severity', draft.step1.severity as ReportFormData['severity'])
          if (draft.step2?.description) form.setValue('description', draft.step2.description)
          if (draft.step3?.municipalityCode) form.setValue('municipalityCode', draft.step3.municipalityCode)
          if (draft.step3?.barangayCode) form.setValue('barangayCode', draft.step3.barangayCode)
          if (draft.step3?.location) form.setValue('location', draft.step3.location)
          if (typeof draft.currentStep === 'number') setCurrentStep(draft.currentStep)
        }
      }
    })
  }, [user, form])

  async function handleNext() {
    const schemas = [step1Schema, step2Schema, step3Schema]
    const currentSchema = schemas[currentStep]
    if (!currentSchema) return
    const fields = Object.keys(currentSchema.shape) as (keyof ReportFormData)[]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const isValid = await form.trigger(fields as any)
    if (!isValid) return

    // Save draft
    if (user) {
      const draftData = {
        step1: { type: form.getValues('type'), severity: form.getValues('severity') },
        step2: { description: form.getValues('description') },
        step3: {
          municipalityCode: form.getValues('municipalityCode'),
          barangayCode: form.getValues('barangayCode'),
          location: form.getValues('location'),
        },
        currentStep: currentStep + 1,
        savedAt: new Date().toISOString(),
      }
      saveDraft(user.uid, draftData).catch(console.error)
    }

    setCurrentStep((s) => s + 1)
  }

  function handleBack() {
    setCurrentStep((s) => s - 1)
  }

  async function handleSubmit() {
    if (!user) return
    setIsSubmitting(true)
    try {
      await onSubmit(form.getValues(), compressedFiles)
      await clearDraft(user.uid)
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleRemovePhoto(index: number) {
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index))
    setCompressedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  function handleCompressedFilesChange(files: File[]) {
    setCompressedFiles(files)
  }

  const showBack = currentStep > 0
  const showNext = currentStep < STEPS.length - 1

  // Cast form to avoid resolver type noise
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const formAny = form as any as UseFormReturn<ReportFormData>

  return (
    <div className="flex flex-col h-full">
      {/* Sticky Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 p-4 z-10">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-lg font-semibold text-gray-900">Submit Report</h1>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
          )}
        </div>
        <StepIndicator steps={STEPS} current={currentStep} />
      </div>

      {/* Step Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {currentStep === 0 && <StepTypeSeverity form={formAny} />}
        {currentStep === 1 && <StepDescription form={formAny} />}
        {currentStep === 2 && (
          <StepLocationMedia
            form={formAny}
            setPreviewUrls={setPreviewUrls}
            onRemovePhoto={handleRemovePhoto}
            onCompressedFilesChange={handleCompressedFilesChange}
          />
        )}
        {currentStep === 3 && (
          <StepReview
            form={formAny}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        )}
      </div>

      {/* Navigation Footer */}
      {currentStep < STEPS.length - 1 && (
        <div className="border-t border-gray-200 p-4 flex gap-3">
          {showBack && (
            <button
              type="button"
              onClick={handleBack}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          )}
          {showNext && (
            <button
              type="button"
              onClick={handleNext}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium ml-auto"
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </div>
  )
}
