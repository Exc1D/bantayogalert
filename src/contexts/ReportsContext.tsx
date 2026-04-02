import {
  collection, doc, addDoc, getDoc,
  query, where, orderBy, limit, onSnapshot,
  serverTimestamp, Timestamp, runTransaction, Firestore,
  QuerySnapshot, DocumentData, FieldValue
} from 'firebase/firestore'
import {
  createContext, useContext, useState, useEffect, useRef, ReactNode
} from 'react'
import { getFirebaseFirestore } from '../config/firebase'
import { useAuth } from './AuthContext'
import type { CreateReportInput } from '../utils/validators'
import DOMPurify from 'dompurify'

// ─── Shared Types (mirrors reportService.ts) ────────────────────────────────

export type ReportType =
  | 'flood' | 'landslide' | 'fire' | 'earthquake'
  | 'medical' | 'crime' | 'infrastructure' | 'other'

export type SeverityLevel = 'low' | 'medium' | 'high' | 'critical'
/** @deprecated use SeverityLevel */
export type Severity = SeverityLevel

export type ReportStatus =
  | 'pending' | 'verified' | 'rejected'
  | 'dispatched' | 'acknowledged' | 'in_progress' | 'resolved'

export const PublicStatusLabel: Record<ReportStatus, string> = {
  pending:         'Pending Review',
  verified:        'Verified',
  rejected:        'Rejected',
  dispatched:      'Responder Dispatched',
  acknowledged:    'Responder En Route',
  in_progress:     'Situation Being Addressed',
  resolved:        'Resolved',
}

export interface Report {
  id: string
  type: string
  category: string
  severity: string
  status: ReportStatus
  publicStatus: string
  description: string
  location: {
    lat: number; lng: number
    barangay: string; municipality: string
    address?: string; geohash?: string
  }
  mediaUrls: string[]
  mediaUploadStatus?: string
  submitterUid: string
  submitterName: string
  submitterAnonymous: boolean
  assignedMunicipality: string
  createdAt: Timestamp
  updatedAt: Timestamp

  // ─── Admin-only fields ───────────────────────────────────────────────
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

  // ─── Backward-compat aliases (old component code expects these) ──────
  /** @deprecated use location.municipality */
  municipality?: string
  /** @deprecated use location.barangay */
  barangay?: string
  /** @deprecated no longer a top-level field */
  title?: string
  /** @deprecated use submitterName */
  reportedByName?: string
  /** @deprecated use createdAt */
  reportedAt?: Timestamp
  /** @deprecated use submitterUid */
  reportedBy?: string
}

export interface ReportActivityEntry {
  id: string
  action: string
  performedBy: string
  performedByName?: string
  timestamp: Timestamp
  notes?: string
}

// ─── State Machine ─────────────────────────────────────────────────────────

const VALID_TRANSITIONS: Record<ReportStatus, ReportStatus[]> = {
  pending:      ['verified', 'rejected'],
  verified:     ['dispatched'],
  dispatched:   ['acknowledged'],
  acknowledged: ['in_progress'],
  in_progress: ['resolved'],
  rejected:    [],
  resolved:    [],
}

// ─── Context Value ─────────────────────────────────────────────────────────

export interface ReportsContextValue {
  reports: Report[]
  loading: boolean
  error: string | null
  createReport: (input: CreateReportInput, submitterUid: string, submitterName: string) => Promise<string>
  updateReportStatus: (
    reportId: string,
    newStatus: ReportStatus,
    actorUid: string,
    actorRole: string,
    actorMunicipality: string | null,
    notes?: string
  ) => Promise<void>
  getReportById: (reportId: string) => Promise<Report | null>
}

// ─── Firestore Helpers ─────────────────────────────────────────────────────

function getDb(): Firestore {
  return getFirebaseFirestore()
}

function docToReport(id: string, data: DocumentData): Report {
  return { id, ...data } as Report
}

// ─── Context ────────────────────────────────────────────────────────────────

const ReportsContext = createContext<ReportsContextValue | null>(null)

export function ReportsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const unsubRef = useRef<(() => void) | null>(null)

  // Subscribe to Firestore reports scoped by role + municipality
  useEffect(() => {
    if (!user) {
      setReports([])
      setLoading(false)
      return
    }

    const db = getDb()
    let q

    if (user.role === 'citizen') {
      // Citizens: only their own reports
      q = query(
        collection(db, 'reports'),
        where('submitterUid', '==', user.uid),
        orderBy('createdAt', 'desc'),
        limit(50)
      )
    } else if (user.role === 'municipal_admin' && user.municipality) {
      // Municipal admin: their municipality only
      q = query(
        collection(db, 'reports'),
        where('assignedMunicipality', '==', user.municipality),
        orderBy('createdAt', 'desc'),
        limit(100)
      )
    } else if (user.role === 'provincial_superadmin') {
      // Provincial admin: everything
      q = query(
        collection(db, 'reports'),
        orderBy('createdAt', 'desc'),
        limit(200)
      )
    } else {
      // No role yet — show nothing
      setReports([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    const unsub = onSnapshot(
      q,
      (snap: QuerySnapshot) => {
        setReports(snap.docs.map(d => docToReport(d.id, d.data())))
        setLoading(false)
      },
      (err) => {
        console.error('[ReportsContext] onSnapshot error:', err)
        setError(err.message)
        setLoading(false)
      }
    )

    unsubRef.current = unsub

    return () => {
      if (unsubRef.current) {
        unsubRef.current()
        unsubRef.current = null
      }
    }
  }, [user?.uid, user?.role, user?.municipality])

  // ─── createReport ─────────────────────────────────────────────────────

  async function createReport(
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
      publicStatus: PublicStatusLabel.pending,
      description: cleanDescription,
      location: input.location,
      mediaUrls: input.mediaUrls ?? [],
      mediaUploadStatus: 'pending',
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

  // ─── updateReportStatus ───────────────────────────────────────────────

  async function updateReportStatus(
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

      const updates: Record<string, FieldValue | string | null> = {
        status: newStatus,
        publicStatus: PublicStatusLabel[newStatus],
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
        action: newStatus,
        previousState: currentStatus,
        newState: newStatus,
        notes: notes ?? null,
        createdAt: serverTimestamp(),
      })
    })
  }

  // ─── getReportById ────────────────────────────────────────────────────

  async function getReportById(reportId: string): Promise<Report | null> {
    const snap = await getDoc(doc(getDb(), 'reports', reportId))
    if (!snap.exists()) return null
    return docToReport(snap.id, snap.data())
  }

  // ─── Provide ──────────────────────────────────────────────────────────

  return (
    <ReportsContext.Provider value={{
      reports, loading, error,
      createReport, updateReportStatus, getReportById
    }}>
      {children}
    </ReportsContext.Provider>
  )
}

export function useReports(): ReportsContextValue {
  const ctx = useContext(ReportsContext)
  if (!ctx) throw new Error('useReports must be used within ReportsProvider')
  return ctx
}
