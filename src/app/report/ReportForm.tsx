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
import { savePendingSubmission } from '@/features/report/usePendingReportSubmission'
import {
  buildSubmitReportPayload,
  createSubmissionId,
  getSubmissionErrorMessage,
  shouldQueueReportSubmission,
} from '@/features/report/reportSubmission'
import { useAuth } from '@/lib/auth/AuthProvider'
import { useConnectionStatus } from '@/hooks/useConnectionStatus'
import { StepIndicator } from './StepIndicator'
import { StepTypeSeverity } from './steps/StepTypeSeverity'
import { StepDescription } from './steps/StepDescription'
import { StepLocationMedia } from './steps/StepLocationMedia'
import { StepReview } from './steps/StepReview'

const STEPS = ['Type & Severity', 'Description', 'Location & Media', 'Review']

interface ReportFormProps {
  onSubmit: (
    data: ReportFormData,
    mediaFiles: File[],
    submissionId: string
  ) => Promise<void>
  retryQueued?: () => Promise<number>
  onCancel?: () => void
}

export function ReportForm({
  onSubmit,
  retryQueued,
  onCancel,
}: ReportFormProps) {
  const { user } = useAuth()
  const { isOnline, lastChangeAt } = useConnectionStatus()
  const [currentStep, setCurrentStep] = useState(0)
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [compressedFiles, setCompressedFiles] = useState<File[]>([])
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [statusTone, setStatusTone] = useState<'info' | 'error'>('info')

  const form = useForm<ReportFormData>({
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

  useEffect(() => {
    if (!retryQueued || !user || !isOnline) {
      return
    }

    let cancelled = false

    void retryQueued().then((retriedCount) => {
      if (cancelled || retriedCount === 0) {
        return
      }

      setStatusTone('info')
      setStatusMessage(
        retriedCount === 1
          ? 'A queued report was retried successfully after reconnection.'
          : `${retriedCount} queued reports were retried successfully after reconnection.`
      )
    })

    return () => {
      cancelled = true
    }
  }, [isOnline, lastChangeAt, retryQueued, user])

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

    const submissionId = createSubmissionId()
    setIsSubmitting(true)
    setStatusMessage(null)

    try {
      await onSubmit(form.getValues(), compressedFiles, submissionId)
      await clearDraft(user.uid)
      setStatusTone('info')
      setStatusMessage('Report submitted successfully.')
    } catch (error) {
      if (!shouldQueueReportSubmission(error) && isOnline) {
        setStatusTone('error')
        setStatusMessage(getSubmissionErrorMessage(error))
        return
      }

      const payload = buildSubmitReportPayload(form.getValues(), submissionId)

      await savePendingSubmission({
        submissionId,
        userId: user.uid,
        payload,
        files: compressedFiles,
        retryCount: 0,
        lastError: getSubmissionErrorMessage(error),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })

      await clearDraft(user.uid)
      setStatusTone('info')
      setStatusMessage(
        'You are offline. This report was queued and will retry automatically when connectivity returns.'
      )
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
              aria-label="Cancel report submission"
            >
              Cancel
            </button>
          )}
        </div>
        <StepIndicator steps={STEPS} current={currentStep} />
      </div>

      {/* Step Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <div
          className={`mb-4 rounded-2xl border px-4 py-3 text-sm ${
            isOnline
              ? 'border-emerald-100 bg-emerald-50 text-emerald-800'
              : 'border-amber-200 bg-amber-50 text-amber-900'
          }`}
          aria-live="polite"
        >
          {isOnline
            ? 'Connected. New reports submit immediately, and queued items can retry now.'
            : 'Offline. New reports will be queued on this device and retried automatically once you reconnect.'}
          {isOnline && retryQueued ? (
            <button
              type="button"
              onClick={() => {
                void retryQueued()
              }}
              className="ml-2 font-semibold text-red-700 underline-offset-2 hover:underline"
            >
              Retry queued
            </button>
          ) : null}
        </div>
        {statusMessage ? (
          <div
            className={`mb-4 rounded-2xl border px-4 py-3 text-sm ${
              statusTone === 'error'
                ? 'border-red-200 bg-red-50 text-red-700'
                : 'border-blue-200 bg-blue-50 text-blue-800'
            }`}
            aria-live="polite"
          >
            {statusMessage}
          </div>
        ) : null}
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
              aria-label="Go back to the previous report step"
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
              aria-label="Continue to the next report step"
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
