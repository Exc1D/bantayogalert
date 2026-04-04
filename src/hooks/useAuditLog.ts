import { useInfiniteQuery, type InfiniteData } from '@tanstack/react-query'
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  where,
  type DocumentData,
  type QueryConstraint,
  type QueryDocumentSnapshot,
} from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import type { AuditEntry, AuditFilters } from '@/types/audit'

const DEFAULT_PAGE_SIZE = 25

interface AuditLogPage {
  entries: AuditEntry[]
  nextCursor: QueryDocumentSnapshot<DocumentData> | null
}

function toStartIso(date: string | null | undefined): string | null {
  if (!date) {
    return null
  }

  return new Date(`${date}T00:00:00`).toISOString()
}

function toEndIso(date: string | null | undefined): string | null {
  if (!date) {
    return null
  }

  return new Date(`${date}T23:59:59.999`).toISOString()
}

export const AUDIT_LOG_QUERY_KEY = (filters: AuditFilters) =>
  [
    'audit-log',
    filters.municipalityCode ?? 'all',
    filters.entityType ?? 'all',
    filters.action ?? 'all',
    filters.actorUid ?? 'all',
    filters.dateFrom ?? 'none',
    filters.dateTo ?? 'none',
  ] as const

export function useAuditLog(filters: AuditFilters, options?: { pageSize?: number }) {
  const pageSize = options?.pageSize ?? DEFAULT_PAGE_SIZE

  const queryResult = useInfiniteQuery<
    AuditLogPage,
    Error,
    InfiniteData<AuditLogPage>,
    ReturnType<typeof AUDIT_LOG_QUERY_KEY>,
    QueryDocumentSnapshot<DocumentData> | null
  >({
    queryKey: AUDIT_LOG_QUERY_KEY(filters),
    initialPageParam: null as QueryDocumentSnapshot<DocumentData> | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    queryFn: async ({ pageParam }) => {
      const constraints: QueryConstraint[] = [
        orderBy('createdAt', 'desc'),
        limit(pageSize),
      ]

      if (filters.municipalityCode) {
        constraints.push(where('municipalityCode', '==', filters.municipalityCode))
      }
      if (filters.entityType) {
        constraints.push(where('entityType', '==', filters.entityType))
      }
      if (filters.action) {
        constraints.push(where('action', '==', filters.action))
      }
      if (filters.actorUid) {
        constraints.push(where('actorUid', '==', filters.actorUid))
      }

      const dateFromIso = toStartIso(filters.dateFrom)
      const dateToIso = toEndIso(filters.dateTo)

      if (dateFromIso) {
        constraints.push(where('createdAt', '>=', dateFromIso))
      }
      if (dateToIso) {
        constraints.push(where('createdAt', '<=', dateToIso))
      }
      if (pageParam) {
        constraints.push(startAfter(pageParam))
      }

      const snapshot = await getDocs(query(collection(db, 'audit'), ...constraints))
      const docs = snapshot.docs

      return {
        entries: docs.map((entry) => ({
          id: entry.id,
          ...entry.data(),
        })) as AuditEntry[],
        nextCursor: docs.length === pageSize ? docs.at(-1) ?? null : null,
      }
    },
  })

  return {
    ...queryResult,
    entries: queryResult.data?.pages.flatMap((page) => page.entries) ?? [],
    hasNextPage: queryResult.hasNextPage ?? false,
    loadMore: () => queryResult.fetchNextPage(),
  }
}
