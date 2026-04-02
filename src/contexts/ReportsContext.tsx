import { createContext, useContext, ReactNode } from 'react'
import { Timestamp } from 'firebase/firestore'

export type ReportType = 'flood' | 'landslide' | 'fire' | 'earthquake' | 'medical' | 'crime' | 'infrastructure' | 'other'
export type Severity = 'low' | 'medium' | 'high' | 'critical'
export type ReportStatus = 'pending' | 'verified' | 'rejected' | 'dispatched' | 'acknowledged' | 'in_progress' | 'resolved'

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
  type: ReportType
  severity: Severity
  status: ReportStatus
  title: string
  description: string
  municipality: string
  barangay?: string
  location?: { lat: number; lng: number }
  mediaUrls?: string[]
  reportedBy: string
  reportedByName?: string
  reportedAt: Timestamp
  updatedAt?: Timestamp
  assignedTo?: string
  activity?: ReportActivityEntry[]
}

interface ReportsContextValue {
  reports: Report[]
}

const ReportsContext = createContext<ReportsContextValue | null>(null)

export function ReportsProvider({ children }: { children: ReactNode }) {
  // Phase 3: implement scoped Firestore subscriptions
  return (
    <ReportsContext.Provider value={{ reports: [] }}>
      {children}
    </ReportsContext.Provider>
  )
}

export function useReports(): ReportsContextValue {
  const ctx = useContext(ReportsContext)
  if (!ctx) throw new Error('useReports must be used within ReportsProvider')
  return ctx
}
