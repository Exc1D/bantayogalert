import { createContext, useContext, ReactNode } from 'react'

interface Report {
  id: string
  // Full Report type in Phase 3
}

interface ReportsContextValue {
  // Phase 3: scoped subscriptions
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
