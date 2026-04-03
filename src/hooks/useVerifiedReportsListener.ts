import { useEffect } from 'react'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { useQueryClient } from '@tanstack/react-query'
import { db } from '@/lib/firebase/config'
import type { Report } from '@/types/report'

const REPORTS_QUERY_KEY = ['reports', 'verified'] as const

export { REPORTS_QUERY_KEY }

export function useVerifiedReportsListener() {
  const queryClient = useQueryClient()

  useEffect(() => {
    const q = query(
      collection(db, 'reports'),
      where('workflowState', '==', 'verified')
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reports: Report[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Report[]
      queryClient.setQueryData<Report[]>(REPORTS_QUERY_KEY, reports)
    }, (error) => {
      console.error('Verified reports listener error:', error)
    })

    return unsubscribe
  }, [queryClient])
}
