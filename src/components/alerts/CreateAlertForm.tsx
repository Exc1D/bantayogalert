import { useMemo, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { getFunctions, httpsCallable } from 'firebase/functions'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/lib/auth/hooks'
import { MUNICIPALITIES, getMunicipality } from '@/lib/geo/municipality'
import { ANNOUNCEMENTS_QUERY_KEY } from '@/hooks/useAnnouncements'
import {
  AnnouncementSchema,
  AnnouncementSeverity,
  AnnouncementType,
  type AnnouncementTargetScope,
} from '@/types/announcement'
import { UserRole } from '@/types/user'

interface CreateAnnouncementResponse {
  success: boolean
  id: string
}

interface PublishAnnouncementResponse {
  success: boolean
  announcementId: string
}

interface CreateAlertFormProps {
  onSuccess?: (announcementId: string) => void
  onCancel?: () => void
}

export function CreateAlertForm({
  onSuccess,
  onCancel,
}: CreateAlertFormProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { customClaims } = useAuth()

  const role = customClaims?.role ?? UserRole.Citizen
  const isSuperadmin = role === UserRole.ProvincialSuperadmin
  const lockedMunicipality = customClaims?.municipalityCode ?? null

  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [type, setType] = useState(AnnouncementType.Alert)
  const [severity, setSeverity] = useState(AnnouncementSeverity.Warning)
  const [scopeType, setScopeType] = useState<
    'municipality' | 'multi_municipality' | 'province'
  >(lockedMunicipality ? 'municipality' : 'province')
  const [selectedMunicipalities, setSelectedMunicipalities] = useState<string[]>(
    lockedMunicipality ? [lockedMunicipality] : []
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const municipalityLabel = useMemo(
    () =>
      lockedMunicipality
        ? getMunicipality(lockedMunicipality)?.name ?? lockedMunicipality
        : null,
    [lockedMunicipality]
  )

  function buildTargetScope(): AnnouncementTargetScope {
    if (!isSuperadmin && lockedMunicipality) {
      return {
        type: 'municipality',
        municipalityCodes: [lockedMunicipality],
      }
    }

    if (scopeType === 'province') {
      return { type: 'province' }
    }

    if (scopeType === 'municipality') {
      return {
        type: 'municipality',
        municipalityCodes: [selectedMunicipalities[0] ?? ''],
      }
    }

    return {
      type: 'multi_municipality',
      municipalityCodes: selectedMunicipalities,
    }
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
    action: 'draft' | 'publish'
  ) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    const targetScope = buildTargetScope()
    const validation = AnnouncementSchema.safeParse({
      title,
      body,
      type,
      severity,
      targetScope,
    })

    if (!validation.success) {
      setError(validation.error.issues[0]?.message ?? 'Invalid alert details')
      setIsSubmitting(false)
      return
    }

    const functions = getFunctions()
    const createAnnouncement = httpsCallable<
      typeof validation.data,
      CreateAnnouncementResponse
    >(functions, 'createAnnouncement')
    const publishAnnouncement = httpsCallable<
      { announcementId: string },
      PublishAnnouncementResponse
    >(functions, 'publishAnnouncement')

    try {
      const createResult = await createAnnouncement(validation.data)
      const announcementId = createResult.data.id

      if (action === 'publish') {
        await publishAnnouncement({ announcementId })
      }

      await queryClient.invalidateQueries({
        queryKey: ANNOUNCEMENTS_QUERY_KEY,
      })

      onSuccess?.(announcementId)
      navigate('/app/alerts')
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : 'Failed to save alert'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  function toggleMunicipality(municipalityCode: string) {
    setSelectedMunicipalities((current) => {
      if (scopeType === 'municipality') {
        return [municipalityCode]
      }

      return current.includes(municipalityCode)
        ? current.filter((value) => value !== municipalityCode)
        : [...current, municipalityCode]
    })
  }

  return (
    <div className="mx-auto w-full max-w-2xl rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Create Alert</h1>
        <p className="mt-1 text-sm text-gray-500">
          Draft and publish municipality-scoped or province-wide emergency
          announcements.
        </p>
      </div>

      <form
        onSubmit={(event) => void handleSubmit(event, 'publish')}
        className="space-y-6"
      >
        <div>
          <label
            htmlFor="alert-title"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Title
          </label>
          <input
            id="alert-title"
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-100"
            placeholder="Flood advisory for coastal barangays"
          />
        </div>

        <div>
          <label
            htmlFor="alert-body"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Message
          </label>
          <textarea
            id="alert-body"
            value={body}
            onChange={(event) => setBody(event.target.value)}
            rows={5}
            className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-100"
            placeholder="Share the affected area, current risk, and what residents should do next."
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              {Object.values(AnnouncementType).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setType(value)}
                  className={`rounded-2xl border px-3 py-2 text-sm font-medium capitalize ${
                    type === value
                      ? 'border-red-300 bg-red-50 text-red-700'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {value.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Severity
            </label>
            <div className="grid grid-cols-3 gap-2">
              {Object.values(AnnouncementSeverity).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setSeverity(value)}
                  className={`rounded-2xl border px-3 py-2 text-sm font-medium capitalize ${
                    severity === value
                      ? 'border-red-300 bg-red-50 text-red-700'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Target Scope
          </label>

          {!isSuperadmin && municipalityLabel ? (
            <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
              Municipal admin scope locked to {municipalityLabel}.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {(['province', 'municipality', 'multi_municipality'] as const).map(
                  (value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => {
                        setScopeType(value)
                        if (value === 'province') {
                          setSelectedMunicipalities([])
                        }
                      }}
                      className={`rounded-full border px-3 py-1.5 text-sm font-medium ${
                        scopeType === value
                          ? 'border-red-300 bg-red-50 text-red-700'
                          : 'border-gray-200 bg-white text-gray-600'
                      }`}
                    >
                      {value.replace('_', ' ')}
                    </button>
                  )
                )}
              </div>

              {scopeType !== 'province' ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  {MUNICIPALITIES.map((municipality) => {
                    const checked = selectedMunicipalities.includes(
                      municipality.code
                    )

                    return (
                      <label
                        key={municipality.code}
                        className={`flex items-center gap-3 rounded-2xl border px-3 py-2 text-sm ${
                          checked
                            ? 'border-red-300 bg-red-50 text-red-700'
                            : 'border-gray-200 bg-white text-gray-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleMunicipality(municipality.code)}
                          className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                        />
                        <span>{municipality.name}</span>
                      </label>
                    )
                  })}
                </div>
              ) : null}
            </div>
          )}
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={(event) =>
              void handleSubmit(event as unknown as FormEvent<HTMLFormElement>, 'draft')
            }
            disabled={isSubmitting}
            className="rounded-2xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Save Draft
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center rounded-2xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Publishing…
              </>
            ) : (
              'Publish Alert'
            )}
          </button>
          <button
            type="button"
            onClick={() => {
              onCancel?.()
              navigate('/app/admin')
            }}
            className="text-sm font-medium text-gray-500 hover:text-gray-700"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
