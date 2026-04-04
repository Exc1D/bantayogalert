import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { httpsCallable, getFunctions } from 'firebase/functions'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import { useUIStore } from '@/stores/uiStore'
import { PriorityStars } from './PriorityStars'
import { ContactPickerModal } from './ContactPickerModal'
import type { AdminQueueReport } from '@/hooks/useAdminQueueListener'
import { VALID_TRANSITIONS } from '@/types/workflow'
import { WORKFLOW_TO_OWNER_STATUS } from '@/types/status'
import { WorkflowState } from '@/types/report'
import type { Severity } from '@/types/report'
import type { Contact } from '@/types/contact'
import { getMunicipality } from '@/lib/geo/municipality'

const SEVERITY_STYLES: Record<Severity, { bg: string; text: string; border: string }> = {
  critical: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  high: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  medium: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
  low: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
}

const TYPE_LABELS: Record<string, string> = {
  flood: 'Flood',
  landslide: 'Landslide',
  fire: 'Fire',
  earthquake: 'Earthquake',
  medical: 'Medical Emergency',
  vehicle_accident: 'Vehicle Accident',
  crime: 'Crime',
  other: 'Other Incident',
}

interface AdminReportDetailPanelProps {
  reportId: string
}

export function AdminReportDetailPanel({ reportId }: AdminReportDetailPanelProps) {
  const queryClient = useQueryClient()
  const { setActivePanel, setDrawerOpen } = useUIStore()

  // Fetch report from cache
  const { data: report, isLoading } = useQuery<AdminQueueReport>({
    queryKey: ['admin-queue-report', reportId],
    queryFn: async () => {
      const [opsDoc, reportDoc] = await Promise.all([
        getDoc(doc(db, 'report_ops', reportId)),
        getDoc(doc(db, 'reports', reportId)),
      ])
      if (!opsDoc.exists() || !reportDoc.exists()) {
        throw new Error('Report not found')
      }
      return { id: reportId, ...opsDoc.data(), ...reportDoc.data() } as AdminQueueReport
    },
  })

  const [showRejectForm, setShowRejectForm] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [rejectCategory, setRejectCategory] = useState<string>('')
  const [showContactPicker, setShowContactPicker] = useState(false)
  const [internalNotes, setInternalNotes] = useState(report?.assignedContactSnapshot ? '' : '')
  const [versionConflict, setVersionConflict] = useState(false)

  // Mutations state
  const [mutating, setMutating] = useState<string | null>(null)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <span className="text-gray-400 text-sm">Loading...</span>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="p-4 text-center text-gray-500">
        <p className="text-sm">Report not found</p>
      </div>
    )
  }

  // Capture in const so closures don't see it as possibly-undefined
  const currentReport = report

  const municipality = getMunicipality(currentReport.municipalityCode)
  const severityStyle = SEVERITY_STYLES[currentReport.severity]
  const workflowState = currentReport.workflowState as WorkflowState
  const validTransitions = VALID_TRANSITIONS[workflowState] ?? []

  async function callTriageCF<T>(
    name: string,
    payload: Record<string, unknown>
  ): Promise<void> {
    setMutating(name)
    setVersionConflict(false)
    try {
      const fn = getFunctions()
      const callable = httpsCallable<Record<string, unknown>, T>(fn, name)
      await callable({ reportId, expectedVersion: currentReport.version, ...payload })
      queryClient.invalidateQueries({ queryKey: ['admin-queue', currentReport.municipalityCode] })
      setActivePanel(null)
      setDrawerOpen(false)
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string }
      if (
        error.code === 'failed-precondition' &&
        error.message?.includes('Version conflict')
      ) {
        setVersionConflict(true)
      } else {
        console.error(`${name} error:`, err)
      }
    } finally {
      setMutating(null)
    }
  }

  function handleVerify() {
    callTriageCF('triageVerify', {})
  }
  function handleReject() {
    if (!rejectReason.trim()) return
    callTriageCF('triageReject', {
      reason: rejectReason.trim(),
      category: rejectCategory || undefined,
    })
  }
  function handleDispatch(contact: Contact) {
    callTriageCF('triageDispatch', { contactId: contact.id })
    setShowContactPicker(false)
  }
  function handleAcknowledge() {
    callTriageCF('triageAcknowledge', {})
  }
  function handleInProgress() {
    callTriageCF('triageInProgress', {})
  }
  function handleResolve() {
    callTriageCF('triageResolve', {})
  }
  function handleReroute(contact: Contact) {
    callTriageCF('triageReroute', { contactId: contact.id })
    setShowContactPicker(false)
  }
  function handleUpdatePriority(priority: 1 | 2 | 3 | 4 | 5) {
    callTriageCF('triageUpdatePriority', { priority })
  }
  function handleSaveNotes() {
    if (!internalNotes.trim()) return
    callTriageCF('triageUpdateNotes', { internalNotes: internalNotes.trim() })
  }

  const ownerStatusLabel =
    WORKFLOW_TO_OWNER_STATUS[workflowState]?.replace('_', ' ') ?? workflowState

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className={`p-4 border-b ${severityStyle.border} ${severityStyle.bg}`}>
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              {TYPE_LABELS[currentReport.type] ?? currentReport.type}
            </h2>
            <p className="text-sm text-gray-600 mt-0.5">
              {municipality?.name ?? currentReport.municipalityCode}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span
              className={`text-xs px-2 py-1 rounded-full font-medium ${severityStyle.bg} ${severityStyle.text} border ${severityStyle.border}`}
            >
              {currentReport.severity.toUpperCase()}
            </span>
            <span className="text-xs text-gray-500 capitalize">{ownerStatusLabel}</span>
          </div>
        </div>

        {/* Priority stars */}
        <div className="mt-2">
          <PriorityStars
            value={currentReport.priority}
            onChange={handleUpdatePriority}
            size="md"
          />
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Version conflict banner */}
        {versionConflict && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-700 font-medium">
              Another admin already acted on this report.
            </p>
            <button
              onClick={() => setActivePanel(null)}
              className="mt-2 text-xs text-red-600 underline"
            >
              Close and refresh
            </button>
          </div>
        )}

        {/* Description */}
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
            Description
          </h3>
          <p className="text-sm text-gray-700">{currentReport.description}</p>
        </div>

        {/* Location */}
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
            Location
          </h3>
          <p className="text-sm text-gray-700">
            {municipality?.name ?? currentReport.municipalityCode}
            {currentReport.barangayCode ? ` · ${currentReport.barangayCode}` : ''}
          </p>
        </div>

        {/* Media */}
        {currentReport.mediaUrls && currentReport.mediaUrls.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Photos
            </h3>
            <div className="flex gap-2 flex-wrap">
              {currentReport.mediaUrls.map((url, i) => (
                <img
                  key={i}
                  src={url}
                  alt={`Report photo ${i + 1}`}
                  className="w-20 h-20 object-cover rounded border border-gray-200"
                  loading="lazy"
                />
              ))}
            </div>
          </div>
        )}

        {/* Reporter info */}
        <div className="text-xs text-gray-400 space-y-0.5">
          <p>Reported: {new Date(currentReport.createdAt).toLocaleString()}</p>
          <p>Updated: {new Date(currentReport.updatedAt).toLocaleString()}</p>
        </div>

        {/* Triage Actions */}
        <div className="pt-2 border-t border-gray-200">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Triage Actions
          </h3>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2">
            {validTransitions.includes(WorkflowState.Verified) && (
              <button
                onClick={handleVerify}
                disabled={!!mutating}
                className="px-3 py-1.5 text-sm font-medium rounded-md bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
              >
                {mutating === 'Verify' ? 'Verifying...' : 'Verify'}
              </button>
            )}

            {validTransitions.includes(WorkflowState.Rejected) && !showRejectForm && (
              <button
                onClick={() => setShowRejectForm(true)}
                disabled={!!mutating}
                className="px-3 py-1.5 text-sm font-medium rounded-md border border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                Reject
              </button>
            )}

            {validTransitions.includes(WorkflowState.Dispatched) && (
              <button
                onClick={() => setShowContactPicker(true)}
                disabled={!!mutating}
                className="px-3 py-1.5 text-sm font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {mutating === 'Dispatch' ? 'Dispatching...' : 'Dispatch'}
              </button>
            )}

            {validTransitions.includes(WorkflowState.Acknowledged) && (
              <button
                onClick={handleAcknowledge}
                disabled={!!mutating}
                className="px-3 py-1.5 text-sm font-medium rounded-md bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
              >
                {mutating === 'Acknowledge' ? 'Acknowledging...' : 'Acknowledge'}
              </button>
            )}

            {validTransitions.includes(WorkflowState.InProgress) && (
              <button
                onClick={handleInProgress}
                disabled={!!mutating}
                className="px-3 py-1.5 text-sm font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {mutating === 'InProgress' ? 'Updating...' : 'Mark In Progress'}
              </button>
            )}

            {validTransitions.includes(WorkflowState.Resolved) && (
              <button
                onClick={handleResolve}
                disabled={!!mutating}
                className="px-3 py-1.5 text-sm font-medium rounded-md bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
              >
                {mutating === 'Resolve' ? 'Resolving...' : 'Resolve'}
              </button>
            )}
          </div>

          {/* Reject form */}
          {showRejectForm && (
            <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-200 space-y-2">
              <textarea
                placeholder="Rejection reason (required)..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-red-400"
                rows={2}
                autoFocus
              />
              <select
                value={rejectCategory}
                onChange={(e) => setRejectCategory(e.target.value)}
                className="w-full text-sm border border-gray-300 rounded px-2 py-1.5"
              >
                <option value="">Select category (optional)</option>
                <option value="insufficient_info">Insufficient info</option>
                <option value="duplicate">Duplicate</option>
                <option value="out_of_area">Out of area</option>
                <option value="false_report">False report</option>
                <option value="other">Other</option>
              </select>
              <div className="flex gap-2">
                <button
                  onClick={handleReject}
                  disabled={!rejectReason.trim() || !!mutating}
                  className="px-3 py-1.5 text-sm font-medium rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                >
                  Confirm Reject
                </button>
                <button
                  onClick={() => {
                    setShowRejectForm(false)
                    setRejectReason('')
                    setRejectCategory('')
                  }}
                  className="px-3 py-1.5 text-sm font-medium rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Routing Info */}
        {currentReport.assignedContactSnapshot && (
          <div className="pt-2 border-t border-gray-200">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Assigned Responder
            </h3>
            <div className="bg-gray-50 rounded-lg p-3 space-y-1">
              <p className="text-sm font-medium text-gray-900">
                {currentReport.assignedContactSnapshot.name}
              </p>
              <p className="text-xs text-gray-500">
                {currentReport.assignedContactSnapshot.agency}
              </p>
              {currentReport.assignedContactSnapshot.phones.length > 0 && (
                <p className="text-xs text-gray-400">
                  {currentReport.assignedContactSnapshot.phones.join(', ')}
                </p>
              )}
              {currentReport.routingDestination && (
                <p className="text-xs text-gray-400 mt-1">
                  Destination: {currentReport.routingDestination}
                </p>
              )}
              {currentReport.dispatchNotes && (
                <p className="text-xs text-gray-400">Notes: {currentReport.dispatchNotes}</p>
              )}
              {/* Reroute button */}
              {validTransitions.includes(WorkflowState.Dispatched) && (
                <button
                  onClick={() => setShowContactPicker(true)}
                  className="mt-2 text-xs text-blue-600 underline"
                >
                  Reroute to different responder
                </button>
              )}
            </div>
          </div>
        )}

        {/* Internal Notes */}
        <div className="pt-2 border-t border-gray-200">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Internal Notes
          </h3>
          <textarea
            placeholder="Add internal notes (not visible to reporter)..."
            value={internalNotes}
            onChange={(e) => setInternalNotes(e.target.value)}
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
          />
          <button
            onClick={handleSaveNotes}
            disabled={!internalNotes.trim() || !!mutating}
            className="mt-2 px-3 py-1.5 text-sm font-medium rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {mutating === 'UpdateNotes' ? 'Saving...' : 'Save Notes'}
          </button>
        </div>
      </div>

      {/* Contact Picker Modal */}
      <ContactPickerModal
        isOpen={showContactPicker}
        onClose={() => setShowContactPicker(false)}
        onSelect={validTransitions.includes(WorkflowState.Dispatched) ? handleDispatch : handleReroute}
        municipalityCode={currentReport.municipalityCode}
      />
    </div>
  )
}
