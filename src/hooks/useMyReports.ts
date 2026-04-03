import { useAuth } from '@/lib/auth/AuthProvider'
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import { useState, useEffect } from 'react'
import type { ReportStatus, ActivityLogEntry } from '@/types/report'

interface MyReportSummary {
  id: string
  ownerStatus: ReportStatus
  updatedAt: string
  activityLog: ActivityLogEntry[]
}

export function useMyReports() {
  const { user } = useAuth()
  const [reports, setReports] = useState<MyReportSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setReports([])
      setLoading(false)
      return
    }

    const q = query(
      collection(db, 'report_private'),
      where('reporterId', '==', user.uid),
      orderBy('updatedAt', 'desc')
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: MyReportSummary[] = snapshot.docs.map((doc) => {
        const d = doc.data()
        return {
          id: doc.id,
          ownerStatus: d.ownerStatus,
          updatedAt: d.updatedAt,
          activityLog: d.activityLog ?? [],
        }
      })
      setReports(data)
      setLoading(false)
    })

    return unsubscribe
  }, [user])

  return { reports, loading }
}
