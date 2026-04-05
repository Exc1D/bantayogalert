'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import {
  fullReportSchema,
  stepLocationSchema,
  stepDescriptionSchema,
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
import { StepEvidence } from './steps/StepEvidence'
import { StepLocation } from './steps/StepLocation'
import { StepDescriptionReview } from './steps/StepDescriptionReview'

const STEPS = ['Evidence', 'Location', 'Description & Review']

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
  const [compressedFiles, setCompressedFiles] = useState<File[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [statusTone, setStatusTone] = useState<'info' | 'error'>('info')

  const form = useForm<ReportFormData>({
    resolver: zodResolver(fullReportSchema) as any,
    mode: 'onBlur',
    defaultValues: {
      description: '',
      municipalityCode: '',
      barangayCode: '',
      location: { lat: 14.15, lng: 122.9, geohash: '' },
      photos: [],
    },
  })

  useEffect(() => {
    form.setValue('photos', previewUrls, { shouldValidate: false, shouldDirty: false })
  }, [previewUrls, form])

  useEffect(() => {
    if (!retryQueued || !user || !isOnline) return
    let cancelled = false
    void retryQueued().then((retriedCount) => {
      if (cancelled || retriedCount === 0) return
      setStatusTone('info')
      setStatusMessage(
        retriedCount === 1
          ? 'A queued report was retried successfully after reconnection.'
          : `${retriedCount} queued reports were retried successfully after reconnection.`
      )
    })
    return () => { cancelled = true }
  }, [isOnline, lastChangeAt, retryQueued, user])

  useEffect(() => {
    if (!user) return
    loadDraft(user.uid).then((draft) => {
      if (draft) {
        const confirmed = window.confirm(
          'You have a saved draft. Would you like to resume? Click OK to resume or Cancel to start fresh.'
        )
        if (confirmed) {
          if (draft.stepDescription?.description) form.setValue('description', draft.stepDescription.description)
          if (draft.stepLocation?.municipalityCode) form.setValue('municipalityCode', draft.stepLocation.municipalityCode)
          if (draft.stepLocation?.barangayCode) form.setValue('barangayCode', draft.stepLocation.barangayCode)
          if (draft.stepLocation?.location) form.setValue('location', draft.stepLocation.location)
          if (typeof draft.currentStep === 'number') setCurrentStep(draft.currentStep)
        }
      }
    })
  }, [user, form])

  function handleNext() {
    if (currentStep === 0) {
      if (user) {
        saveCurrentDraft(1)
      }
      setCurrentStep((s) => s + 1)
      return
    }

    const schemas = [null, stepLocationSchema, stepDescriptionSchema]
    const currentSchema = schemas[currentStep]
    if (!currentSchema) return
    const fields = Object.keys(currentSchema.shape) as (keyof ReportFormData)[]
    const isValid = form.trigger(fields as any)
    if (!isValid) return

    if (user) {
      saveCurrentDraft(currentStep + 1)
    }
    setCurrentStep((s) => s + 1)
  }

  function saveCurrentDraft(nextStep: number) {
    if (!user) return
    saveDraft(user.uid, {
      stepLocation: {
        municipalityCode: form.getValues('municipalityCode'),
        barangayCode: form.getValues('barangayCode'),
        location: form.getValues('location'),
      },
      stepDescription: { description: form.getValues('description') },
      currentStep: nextStep,
      savedAt: new Date().toISOString(),
    }).catch(console.error)
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

  const showBack = currentStep > 0
  const showNext = currentStep < STEPS.length - 1

  return (
    <div className="flex flex-col h-full">
      {/* Sticky Header */}
      <div className="sticky top-0 bg-white border-b border-neutral-300 p-4 z-10">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-lg font-semibold text-neutral-900">Submit Report</h1>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="text-sm text-neutral-500 hover:text-neutral-700"
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
              ? 'border-status-verifiedBg bg-status-verifiedBg text-status-verified'
              : 'border-[#FED7AA] bg-[#FFF7ED] text-high-text'
          }`}
          aria-live="polite"
        >
          {isOnline
            ? 'Connected. New reports submit immediately, and queued items can retry now.'
            : 'Offline. New reports will be queued on this device and retried automatically once you reconnect.'}
          {isOnline && retryQueued ? (
            <button
              type="button"
              onClick={() => void retryQueued()}
              className="ml-2 font-semibold text-severity-criticalText underline-offset-2 hover:underline"
            >
              Retry queued
            </button>
          ) : null}
        </div>
        {statusMessage && (
          <div
            className={`mb-4 rounded-2xl border px-4 py-3 text-sm ${
              statusTone === 'error'
                ? 'border-severity-criticalBorder bg-severity-criticalBg text-severity-criticalText'
                : 'border-[#BFDBFE] bg-[#EFF6FF] text-low-text'
            }`}
            aria-live="polite"
          >
            {statusMessage}
          </div>
        )}
        {currentStep === 0 && (
          <StepEvidence
            photos={compressedFiles}
            photoUrls={previewUrls}
            onPhotosChange={(files, urls) => {
              setCompressedFiles(files)
              setPreviewUrls(urls)
            }}
          />
        )}
        {currentStep === 1 && (
          <StepLocation
            form={form as any}
            onPreviewUrlsChange={setPreviewUrls}
            onFilesChange={setCompressedFiles}
            photoUrls={previewUrls}
          />
        )}
        {currentStep === 2 && (
          <StepDescriptionReview form={form as any} onSubmit={handleSubmit} isSubmitting={isSubmitting} />
        )}
      </div>

      {/* Navigation Footer */}
      {currentStep < STEPS.length - 1 && (
        <div className="border-t border-neutral-300 p-4 flex gap-3">
          {showBack && (
            <button
              type="button"
              onClick={handleBack}
              className="flex items-center gap-2 px-4 py-2 border border-neutral-300 rounded-lg text-neutral-700 hover:bg-neutral-100 transition-colors text-sm font-medium"
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
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-light transition-colors text-sm font-medium ml-auto"
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
