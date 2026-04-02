import { useState } from 'react'
import { Button } from '../common/Button'
import { Toast } from '../common/Toast'
import { MUNICIPALITIES } from '../../data/municipalities'
import { getFirebaseFirestore } from '../../config/firebase'
import { collection, addDoc, Timestamp } from 'firebase/firestore'
import { useAuth } from '../../contexts/AuthContext'

const SEVERITIES = ['low', 'medium', 'high', 'critical'] as const

interface AnnouncementFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

export function AnnouncementForm({ onSuccess, onCancel }: AnnouncementFormProps) {
  const { user } = useAuth()
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [severity, setSeverity] = useState<'low' | 'medium' | 'high' | 'critical'>('medium')
  const [municipality, setMunicipality] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'info' | 'success' | 'error' } | null>(null)
  const [success, setSuccess] = useState(false)

  const showToast = (msg: string, type: 'info' | 'success' | 'error') => {
    setToast({ message: msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !title.trim() || !message.trim()) {
      showToast('Please fill in all required fields', 'error')
      return
    }

    setSubmitting(true)
    try {
      const db = getFirebaseFirestore()
      await addDoc(collection(db, 'announcements'), {
        title: title.trim(),
        message: message.trim(),
        severity,
        municipality: municipality || null,
        createdBy: user.uid,
        createdByName: user.displayName,
        createdAt: Timestamp.now(),
      })
      setSuccess(true)
      showToast('Announcement published successfully!', 'success')
      setTitle('')
      setMessage('')
      setSeverity('medium')
      setMunicipality('')
      setTimeout(() => {
        setSuccess(false)
        onSuccess?.()
      }, 1500)
    } catch (err) {
      console.error('Error creating announcement:', err)
      showToast('Failed to publish announcement', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4">
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700">
          ✅ Announcement published!
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} />}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Flood Advisory — Daet"
          className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          required
          maxLength={100}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Message <span className="text-red-500">*</span>
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Detailed announcement message..."
          className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          rows={4}
          required
          maxLength={1000}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
          <select
            value={severity}
            onChange={(e) => setSeverity(e.target.value as typeof severity)}
            className="w-full px-3 py-2 border rounded-lg text-sm"
          >
            {SEVERITIES.map((s) => (
              <option key={s} value={s} className="capitalize">
                {s}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Municipality (optional)</label>
          <select
            value={municipality}
            onChange={(e) => setMunicipality(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm"
          >
            <option value="">All municipalities</option>
            {MUNICIPALITIES.map((m: { code: string; name: string }) => (
              <option key={m.code} value={m.code}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex gap-3">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
        )}
        <Button type="submit" variant="primary" disabled={submitting} className="flex-1">
          {submitting ? 'Publishing...' : 'Publish Announcement'}
        </Button>
      </div>
    </form>
  )
}
