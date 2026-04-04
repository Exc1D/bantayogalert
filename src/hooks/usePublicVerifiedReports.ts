import { useQuery } from '@tanstack/react-query'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import { WorkflowState, type Report } from '@/types/report'

export const PUBLIC_VERIFIED_REPORTS_QUERY_KEY = [
  'reports',
  'public',
  'verified',
] as const

function sortReports(left: Report, right: Report) {
  if (left.createdAt === right.createdAt) {
    return right.id.localeCompare(left.id)
  }

  return right.createdAt.localeCompare(left.createdAt)
}

export function usePublicVerifiedReports() {
  return useQuery({
    queryKey: PUBLIC_VERIFIED_REPORTS_QUERY_KEY,
    staleTime: 1000 * 60,
    queryFn: async (): Promise<Report[]> => {
      const snapshot = await getDocs(
        query(
          collection(db, 'reports'),
          where('workflowState', '==', WorkflowState.Verified)
        )
      )

      const reports = snapshot.docs.map((entry) => ({
        id: entry.id,
        ...entry.data(),
      })) as Report[]

      return reports
        .slice()
        .sort(sortReports)
    },
  })
}
