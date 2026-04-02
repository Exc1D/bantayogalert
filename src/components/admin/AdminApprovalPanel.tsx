import { useState, useEffect } from 'react'
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  runTransaction,
  Timestamp,
} from 'firebase/firestore'
import { getFirebaseFirestore } from '../../config/firebase'
import { getFirebaseFunctions } from '../../config/firebase'
import type { MunicipalityCode } from '../../utils/validators'
import { httpsCallable } from 'firebase/functions'
import { useAuth } from '../../contexts/AuthContext'
import { RoleGate } from '../auth/RoleGate'
import { getMunicipalityName } from '../../data/municipalities'
import { Button } from '../common/Button'
import { Card } from '../common/Card'
import { Badge } from '../common/Badge'
import { Spinner } from '../common/Spinner'
import { Toast } from '../common/Toast'

/**
 * AdminRequest type representing a municipal admin access request
 */
interface AdminRequest {
  id: string
  uid: string
  email: string
  displayName: string
  municipality: MunicipalityCode
  phone: string | null
  requestedRole: 'municipal_admin'
  status: 'pending' | 'approved' | 'rejected'
  requestedAt: Timestamp
  reviewedAt?: Timestamp
  reviewedBy?: string
  rejectionReason?: string
}

/**
 * Toast state for user feedback
 */
interface ToastState {
  message: string
  type: 'info' | 'success' | 'error'
}

/**
 * AdminApprovalPanel - Component for provincial superadmins to manage municipal admin requests.
 *
 * Displays pending admin requests and allows approval (via Cloud Function + Firestore transaction)
 * or rejection (with optional reason).
 */
function AdminApprovalPanelInner() {
  const { user } = useAuth()
  const [requests, setRequests] = useState<AdminRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<ToastState | null>(null)
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set())
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')

  // Subscribe to pending admin requests
  useEffect(() => {
    const db = getFirebaseFirestore()
    const requestsRef = collection(db, 'adminRequests')
    const q = query(requestsRef, where('status', '==', 'pending'))

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const pendingRequests: AdminRequest[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<AdminRequest, 'id'>),
        }))
        // Sort by requestedAt descending
        pendingRequests.sort((a, b) => {
          const aTime = a.requestedAt?.seconds ?? 0
          const bTime = b.requestedAt?.seconds ?? 0
          return bTime - aTime
        })
        setRequests(pendingRequests)
        setLoading(false)
      },
      (err) => {
        console.error('Error fetching admin requests:', err)
        setError('Failed to load admin requests')
        setLoading(false)
      }
    )

    return unsubscribe
  }, [])

  const showToast = (message: string, type: 'info' | 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  const handleApprove = async (request: AdminRequest) => {
    if (!user) return

    setProcessingIds((prev) => new Set(prev).add(request.id))

    try {
      const db = getFirebaseFirestore()
      const functions = getFirebaseFunctions()
      const requestRef = doc(db, 'adminRequests', request.id)

      // Use Firestore transaction to ensure atomicity:
      // Both the Cloud Function call and status update succeed together or fail together
      await runTransaction(db, async (transaction) => {
        const requestDoc = await transaction.get(requestRef)

        if (!requestDoc.exists()) {
          throw new Error('Request document no longer exists')
        }

        const currentStatus = requestDoc.data().status
        if (currentStatus !== 'pending') {
          throw new Error('Request is no longer pending - may have been processed')
        }

        // Call setCustomClaims Cloud Function to set the user's role
        const setCustomClaimsFn = httpsCallable(functions, 'setCustomClaims')
        await setCustomClaimsFn({
          uid: request.uid,
          role: 'municipal_admin',
          municipality: request.municipality,
        })

        // Update request status to approved
        transaction.update(requestRef, {
          status: 'approved',
          reviewedAt: Timestamp.now(),
          reviewedBy: user.uid,
        })
      })

      showToast(
        `Approved ${request.displayName} as municipal admin for ${getMunicipalityName(request.municipality)}`,
        'success'
      )
    } catch (err) {
      console.error('Error approving request:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to approve request'
      showToast(errorMessage, 'error')
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev)
        next.delete(request.id)
        return next
      })
    }
  }

  const openRejectDialog = (requestId: string) => {
    setSelectedRequestId(requestId)
    setRejectionReason('')
    setRejectDialogOpen(true)
  }

  const handleReject = async () => {
    if (!user || !selectedRequestId) return

    const request = requests.find((r) => r.id === selectedRequestId)
    if (!request) return

    setProcessingIds((prev) => new Set(prev).add(selectedRequestId))
    setRejectDialogOpen(false)

    try {
      const db = getFirebaseFirestore()
      const requestRef = doc(db, 'adminRequests', selectedRequestId)

      await updateDoc(requestRef, {
        status: 'rejected',
        reviewedAt: Timestamp.now(),
        reviewedBy: user.uid,
        rejectionReason: rejectionReason.trim() || null,
      })

      showToast(`Rejected request from ${request.displayName}`, 'success')
    } catch (err) {
      console.error('Error rejecting request:', err)
      showToast('Failed to reject request', 'error')
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev)
        next.delete(selectedRequestId)
        return next
      })
      setSelectedRequestId(null)
    }
  }

  const formatDate = (timestamp: Timestamp | undefined) => {
    if (!timestamp) return 'Unknown date'
    const date = timestamp.toDate()
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const isProcessing = (id: string) => processingIds.has(id)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-600">
        <p>{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Admin Approval Requests</h2>
        {requests.length > 0 && <Badge variant="warning">{requests.length} pending</Badge>}
      </div>

      {/* Empty state */}
      {requests.length === 0 && (
        <Card>
          <p className="text-gray-500 text-center py-4">No pending admin requests</p>
        </Card>
      )}

      {/* Request list */}
      {requests.map((request) => (
        <Card key={request.id} className="space-y-3">
          {/* User info */}
          <div>
            <h3 className="font-medium text-lg">{request.displayName || 'Unknown User'}</h3>
            <p className="text-gray-600 text-sm">{request.email}</p>
          </div>

          {/* Request details */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-gray-500">Municipality:</span>
              <span className="ml-2 font-medium">{getMunicipalityName(request.municipality)}</span>
            </div>
            {request.phone && (
              <div>
                <span className="text-gray-500">Phone:</span>
                <span className="ml-2">{request.phone}</span>
              </div>
            )}
          </div>

          <div className="text-sm">
            <span className="text-gray-500">Requested:</span>
            <span className="ml-2">{formatDate(request.requestedAt)}</span>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleApprove(request)}
              disabled={isProcessing(request.id)}
              className="flex-1"
            >
              {isProcessing(request.id) ? 'Processing...' : 'Approve'}
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => openRejectDialog(request.id)}
              disabled={isProcessing(request.id)}
              className="flex-1"
            >
              Reject
            </Button>
          </div>
        </Card>
      ))}

      {/* Reject confirmation dialog */}
      {rejectDialogOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-sm mx-4 p-6 space-y-4">
            <h3 className="text-lg font-semibold">Reject Request</h3>
            <p className="text-gray-600 text-sm">Are you sure you want to reject this request?</p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason (optional)
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter rejection reason..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setRejectDialogOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button variant="danger" size="sm" onClick={handleReject} className="flex-1">
                Reject
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Toast notifications */}
      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  )
}

/**
 * AdminApprovalPanel - Wrapped with RoleGate for provincial_superadmin access only
 */
export function AdminApprovalPanel() {
  return (
    <RoleGate roles={['provincial_superadmin']}>
      <AdminApprovalPanelInner />
    </RoleGate>
  )
}
