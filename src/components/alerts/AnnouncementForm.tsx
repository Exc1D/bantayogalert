import { useState } from 'react'
import { RoleGate } from '../auth/RoleGate'
import { createAnnouncement } from '../../services/announcementService'
import { useAuth } from '../../contexts/AuthContext'

const MUNICIPALITIES = [
  { code: 'basud', name: 'Basud' },
  { code: 'daet', name: 'Daet' },
  { code: 'josepanganiban', name: 'Jose Pangaoniban' },
  { code: 'labo', name: 'Labo' },
  { code: 'mercedes', name: 'Mercedes' },
  { code: 'paracale', name: 'Paracale' },
  { code: 'sanlorenzo', name: 'San Lorenzo' },
  { code: 'sanvicente', name: 'San Vicente' },
  { code: 'talisay', name: 'Talisay' },
  { code: 'vinzales', name: 'Vinzales' },
  { code: 'capalonga', name: 'Capalonga' },
  { code: 'staelena', name: 'Sta. Elena' },
] as const

type Scope = 'municipality' | 'multi_municipality' | 'province'
type Severity = 'info' | 'warning' | 'critical'

interface AnnouncementFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

export function AnnouncementForm({ onSuccess, onCancel }: AnnouncementFormProps) {
  const { user } = useAuth()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [scope, setScope] = useState<Scope>('municipality')
  const [selectedMunicipalities, setSelectedMunicipalities] = useState<string[]>([])
  const [severity, setSeverity] = useState<Severity>('info')
  const [expiresAt, setExpiresAt] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleMunicipalityToggle = (code: string) => {
    setSelectedMunicipalities((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    )
  }

  const handleSubmit = async (publish: boolean) => {
    if (!user) return
    if (!title.trim()) {
      setError('Title is required')
      return
    }
    if (!body.trim()) {
      setError('Body is required')
      return
    }

    setLoading(true)
    setError(null)

    try {
      let targetMunicipalities: string[] = []
      if (scope === 'municipality' && user.municipality) {
        targetMunicipalities = [user.municipality]
      } else if (scope === 'multi_municipality') {
        targetMunicipalities = selectedMunicipalities
      }
      // province-wide: empty array means all

      await createAnnouncement(
        {
          title: title.trim(),
          body: body.trim(),
          scope,
          targetMunicipalities,
          severity,
          expiresAt: expiresAt ? new Date(expiresAt) : undefined,
          publish,
        },
        user.uid,
        user.role ?? 'citizen',
        user.municipality
      )

      onSuccess?.()
    } catch (err) {
      setError('Failed to create announcement')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (showPreview) {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Preview</h2>
          <button
            onClick={() => setShowPreview(false)}
            className="text-sm text-blue-500 hover:text-blue-600"
          >
            Edit
          </button>
        </div>
        <div className="border rounded-lg p-4 space-y-3">
          <h3 className="font-semibold">{title || '(No title)'}</h3>
          <p className="text-sm text-gray-600 whitespace-pre-wrap">{body || '(No body)'}</p>
          <div className="flex gap-2">
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 capitalize">
              {scope.replace('_', ' ')}
            </span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                severity === 'critical'
                  ? 'bg-red-100 text-red-800'
                  : severity === 'warning'
                  ? 'bg-orange-100 text-orange-800'
                  : 'bg-blue-100 text-blue-800'
              }`}
            >
              {severity}
            </span>
          </div>
        </div>
        <button
          onClick={() => setShowPreview(false)}
          className="w-full py-2 text-sm text-gray-600 hover:text-gray-800"
        >
          Back to Edit
        </button>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4 max-h-screen overflow-auto">
      <h2 className="text-lg font-semibold">Create Announcement</h2>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value.slice(0, 100))}
          maxLength={100}
          placeholder="Enter announcement title"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <p className="text-xs text-gray-500 mt-1 text-right">{title.length}/100</p>
      </div>

      {/* Body */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Body</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value.slice(0, 2000))}
          maxLength={2000}
          rows={5}
          placeholder="Enter announcement details"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
        />
        <p className="text-xs text-gray-500 mt-1 text-right">{body.length}/2000</p>
      </div>

      {/* Scope */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Scope</label>
        <div className="grid grid-cols-3 gap-2">
          {(['municipality', 'multi_municipality', 'province'] as Scope[]).map((s) => (
            <button
              key={s}
              onClick={() => setScope(s)}
              className={`py-2 px-3 text-sm rounded-lg border transition-colors ${
                scope === s
                  ? 'bg-blue-50 border-blue-500 text-blue-700'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {s === 'municipality'
                ? 'Municipality'
                : s === 'multi_municipality'
                ? 'Multi-muni'
                : 'Province'}
            </button>
          ))}
        </div>
      </div>

      {/* Municipality selector for municipality/multi-municipality scope */}
      {scope === 'municipality' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Target Municipality</label>
          <select
            value={user?.municipality ?? ''}
            disabled
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
          >
            <option value={user?.municipality ?? ''}>
              {MUNICIPALITIES.find((m) => m.code === user?.municipality)?.name ?? 'Select municipality'}
            </option>
          </select>
        </div>
      )}

      {scope === 'multi_municipality' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Target Municipalities (select multiple)
          </label>
          <div className="grid grid-cols-2 gap-2 max-h-40 overflow-auto">
            {MUNICIPALITIES.map((m) => (
              <label key={m.code} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={selectedMunicipalities.includes(m.code)}
                  onChange={() => handleMunicipalityToggle(m.code)}
                  className="rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                />
                {m.name}
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Severity */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Severity</label>
        <div className="grid grid-cols-3 gap-2">
          {(['info', 'warning', 'critical'] as Severity[]).map((sev) => (
            <button
              key={sev}
              onClick={() => setSeverity(sev)}
              className={`py-2 px-3 text-sm rounded-lg border transition-colors capitalize ${
                severity === sev
                  ? sev === 'critical'
                    ? 'bg-red-50 border-red-500 text-red-700'
                    : sev === 'warning'
                    ? 'bg-orange-50 border-orange-500 text-orange-700'
                    : 'bg-blue-50 border-blue-500 text-blue-700'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Expires at */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Expires At (optional)
        </label>
        <input
          type="datetime-local"
          value={expiresAt}
          onChange={(e) => setExpiresAt(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <button
          onClick={() => setShowPreview(true)}
          className="flex-1 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
        >
          Preview
        </button>
        <button
          onClick={() => handleSubmit(false)}
          disabled={loading}
          className="flex-1 py-2.5 border border-blue-300 rounded-lg text-blue-700 font-medium hover:bg-blue-50 transition-colors disabled:opacity-50"
        >
          Save Draft
        </button>
      </div>
      <RoleGate roles={['municipal_admin', 'provincial_superadmin']}>
        <button
          onClick={() => handleSubmit(true)}
          disabled={loading}
          className="w-full py-2.5 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:opacity-50"
        >
          {loading ? 'Publishing...' : 'Publish Now'}
        </button>
      </RoleGate>
      {onCancel && (
        <button
          onClick={onCancel}
          className="w-full py-2 text-sm text-gray-500 hover:text-gray-700"
        >
          Cancel
        </button>
      )}
    </div>
  )
}
