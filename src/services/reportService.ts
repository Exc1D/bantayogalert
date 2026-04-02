import {
  collection, doc, addDoc, getDoc, getDocs,
  query, where, orderBy, limit,
  serverTimestamp, Timestamp, runTransaction, Firestore
} from 'firebase/firestore'
import { getFirebaseFirestore } from '../config/firebase'
import type { CreateReportInput } from '../utils/validators'
import DOMPurify from 'dompurify'

const REPORTS_PER_PAGE = 20

export type ReportStatus =
  | 'pending'
  | 'verified'
  | 'rejected'
  | 'dispatched'
  | 'acknowledged'
  | 'in_progress'
  | 'resolved'

export interface ReportActivityEntry {
  id: string
  action: string
  performedBy: string
  performedByName?: string
  timestamp: Timestamp
  notes?: string
}

export interface Report {
  id: string
  type: string
  category: string
  severity: string
  status: string
  publicStatus: string
  description: string
  location: {
    lat: number
    lng: number
    barangay: string
    municipality: string
    address?: string
  }
  mediaUrls: string[]
  submitterUid: string
  submitterName: string
  submitterAnonymous: boolean
  assignedMunicipality: string
  createdAt: Timestamp
  updatedAt: Timestamp
  verifiedBy?: string | null
  verifiedAt?: Timestamp | null
  rejectedBy?: string | null
  rejectedAt?: Timestamp | null
  rejectedReason?: string | null
  dispatchedTo?: Record<string, unknown> | null
  acknowledgedBy?: string | null
  acknowledgedAt?: Timestamp | null
  inProgressBy?: string | null
  inProgressAt?: Timestamp | null
  resolvedBy?: string | null
  resolvedAt?: Timestamp | null
  resolvedNotes?: string | null
}

function getDb(): Firestore {
  return getFirebaseFirestore()
}

const VALID_TRANSITIONS: Record<ReportStatus, ReportStatus[]> = {
  pending: ['verified', 'rejected'],
  verified: ['dispatched'],
  dispatched: ['acknowledged'],
  acknowledged: ['in_progress'],
  in_progress: ['resolved'],
  rejected: [],
  resolved: [],
}

function getPublicStatusLabel(status: ReportStatus): string {
  const labels: Record<ReportStatus, string> = {
    pending: 'Pending Review',
    verified: 'Verified',
    rejected: 'Rejected',
    dispatched: 'Responder Dispatched',
    acknowledged: 'Responder En Route',
    in_progress: 'Situation Being Addressed',
    resolved: 'Resolved',
  }
  return labels[status]
}

export async function createReport(
  input: CreateReportInput,
  submitterUid: string,
  submitterName: string
): Promise<string> {
  const cleanDescription = DOMPurify.sanitize(input.description)

  const reportRef = await addDoc(collection(getDb(), 'reports'), {
    type: input.type,
    category: input.category,
    severity: input.severity,
    status: 'pending',
    publicStatus: 'Pending Review',
    description: cleanDescription,
    location: input.location,
    mediaUrls: input.mediaUrls ?? [],
    submitterUid,
    submitterName,
    submitterAnonymous: input.submitterAnonymous ?? false,
    assignedMunicipality: input.location.municipality,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    verifiedBy: null,
    verifiedAt: null,
    rejectedBy: null,
    rejectedAt: null,
    rejectedReason: null,
    dispatchedTo: null,
    acknowledgedBy: null,
    acknowledgedAt: null,
    inProgressBy: null,
    inProgressAt: null,
    resolvedBy: null,
    resolvedAt: null,
    resolvedNotes: null,
  })

  await addDoc(collection(getDb(), 'reports', reportRef.id, 'activity'), {
    actorUid: submitterUid,
    actorRole: 'citizen',
    actorMunicipality: input.location.municipality,
    action: 'submitted',
    previousState: null,
    newState: 'pending',
    notes: null,
    createdAt: serverTimestamp(),
  })

  return reportRef.id
}

export async function updateReportStatus(
  reportId: string,
  newStatus: ReportStatus,
  actorUid: string,
  actorRole: string,
  actorMunicipality: string | null,
  notes?: string
): Promise<void> {
  const reportRef = doc(getDb(), 'reports', reportId)

  await runTransaction(getDb(), async (tx) => {
    const snap = await tx.get(reportRef)
    if (!snap.exists()) throw new Error('Report not found')

    const currentStatus = snap.data().status as ReportStatus
    const allowed = VALID_TRANSITIONS[currentStatus]
    if (!allowed.includes(newStatus)) {
      throw new Error(`Invalid transition: ${currentStatus} → ${newStatus}`)
    }

    const updates: Record<string, import('firebase/firestore').FieldValue | Record<string, unknown> | string | null> = {
      status: newStatus,
      publicStatus: getPublicStatusLabel(newStatus),
      updatedAt: serverTimestamp(),
    }

    switch (newStatus) {
      case 'verified':
        updates.verifiedBy = actorUid
        updates.verifiedAt = serverTimestamp()
        break
      case 'rejected':
        updates.rejectedBy = actorUid
        updates.rejectedAt = serverTimestamp()
        updates.rejectedReason = notes ?? null
        break
      case 'dispatched':
        updates.dispatchedTo = notes ?? null
        break
      case 'acknowledged':
        updates.acknowledgedBy = actorUid
        updates.acknowledgedAt = serverTimestamp()
        break
      case 'in_progress':
        updates.inProgressBy = actorUid
        updates.inProgressAt = serverTimestamp()
        break
      case 'resolved':
        updates.resolvedBy = actorUid
        updates.resolvedAt = serverTimestamp()
        updates.resolvedNotes = notes ?? null
        break
    }

    tx.update(reportRef, updates)

    const activityRef = collection(getDb(), 'reports', reportId, 'activity')
    tx.set(doc(activityRef), {
      actorUid,
      actorRole,
      actorMunicipality,
      action: newStatus === 'rejected' ? 'rejected' : newStatus,
      previousState: currentStatus,
      newState: newStatus,
      notes: notes ?? null,
      createdAt: serverTimestamp(),
    })
  })
}

export async function getReports(municipality?: string): Promise<Report[]> {
  let q = query(
    collection(getDb(), 'reports'),
    orderBy('createdAt', 'desc'),
    limit(REPORTS_PER_PAGE)
  )

  if (municipality) {
    q = query(q, where('assignedMunicipality', '==', municipality))
  }

  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Report))
}

export async function getReportById(reportId: string): Promise<Report | null> {
  const snap = await getDoc(doc(getDb(), 'reports', reportId))
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() } as Report
}

export function getReportActivityPath(reportId: string): string {
  return `reports/${reportId}/activity`
}
