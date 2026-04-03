import { useState, useCallback, useEffect, useRef } from 'react'
import {
  collection,
  query,
  where,
  orderBy,
  startAfter,
  limit,
  getDocs,
  type QueryDocumentSnapshot,
  type DocumentData,
} from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import type { Report } from '@/types/report'
import { useFilterStore } from '@/stores/filterStore'

const PAGE_SIZE = 20
const FEED_QUERY_KEY = ['reports', 'feed'] as const

export { FEED_QUERY_KEY }

interface UseReportFeedResult {
  pages: Report[][]
  hasMore: boolean
  isLoading: boolean
  isLoadingMore: boolean
  error: Error | null
  loadMore: () => void
  loadMoreRef: React.RefObject<HTMLDivElement | null>
  resetFeed: () => void
}

export function useReportFeed(): UseReportFeedResult {
  const [pages, setPages] = useState<Report[][]>([])
  const [hasMore, setHasMore] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const lastDocRef = useRef<QueryDocumentSnapshot<DocumentData> | null>(null)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)
  const isLoadingRef = useRef(false)

  const { type, severity, municipalityCode } = useFilterStore()

  // Reset pagination when filters change
  useEffect(() => {
    lastDocRef.current = null
    setPages([])
    setHasMore(true)
    setError(null)
  }, [type, severity, municipalityCode])

  const buildQuery = useCallback((lastDoc: QueryDocumentSnapshot<DocumentData> | null) => {
    let q = query(
      collection(db, 'reports'),
      where('workflowState', '==', 'verified'),
      orderBy('createdAt', 'desc'),
      limit(PAGE_SIZE)
    )
    if (lastDoc) {
      q = query(q, startAfter(lastDoc))
    }
    return q
  }, [])

  const loadMore = useCallback(async () => {
    if (isLoadingRef.current || !hasMore) return
    isLoadingRef.current = true
    setIsLoadingMore(pages.length === 0)
    setIsLoading(pages.length === 0)

    try {
      const q = buildQuery(lastDocRef.current)
      const snapshot = await getDocs(q)
      const newReports = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Report[]

      if (newReports.length === 0) {
        setHasMore(false)
      } else {
        const newLastDoc = snapshot.docs[snapshot.docs.length - 1] ?? null
        lastDocRef.current = newLastDoc
        setPages((prev) => [...prev, newReports])
        setHasMore(newReports.length === PAGE_SIZE)
      }
    } catch (err) {
      setError(err as Error)
    } finally {
      isLoadingRef.current = false
      setIsLoading(false)
      setIsLoadingMore(false)
    }
  }, [buildQuery, hasMore, pages.length])

  // Initial load
  useEffect(() => {
    if (pages.length === 0) {
      loadMore()
    }
  }, [pages.length, loadMore])

  const resetFeed = useCallback(() => {
    lastDocRef.current = null
    setPages([])
    setHasMore(true)
    setError(null)
    setIsLoading(false)
    setIsLoadingMore(false)
  }, [])

  return {
    pages,
    hasMore,
    isLoading,
    isLoadingMore,
    error,
    loadMore,
    loadMoreRef,
    resetFeed,
  }
}
