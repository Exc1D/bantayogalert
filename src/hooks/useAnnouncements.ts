import { useQuery } from '@tanstack/react-query'
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  where,
  type QueryConstraint,
} from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import { useAuth } from '@/lib/auth/hooks'
import {
  AnnouncementStatus,
  type Announcement,
} from '@/types/announcement'

export const ANNOUNCEMENTS_QUERY_KEY = ['announcements'] as const

function sortAnnouncements(
  left: Announcement,
  right: Announcement
): number {
  const leftTime = left.publishedAt ?? left.createdAt
  const rightTime = right.publishedAt ?? right.createdAt

  if (leftTime === rightTime) {
    return right.id.localeCompare(left.id)
  }

  return rightTime.localeCompare(leftTime)
}

function buildAnnouncementQuery(constraints: QueryConstraint[]) {
  return query(collection(db, 'announcements'), ...constraints)
}

export function useAnnouncements(options?: { pageSize?: number }) {
  const { pageSize = 20 } = options ?? {}
  const { customClaims, isAuthenticated, isLoading } = useAuth()

  const isSuperadmin = customClaims?.role === 'provincial_superadmin'
  const municipalityCode = customClaims?.municipalityCode ?? null

  return useQuery({
    queryKey: [
      ...ANNOUNCEMENTS_QUERY_KEY,
      municipalityCode,
      isSuperadmin,
      pageSize,
    ],
    enabled: !isLoading && isAuthenticated,
    staleTime: 1000 * 60 * 2,
    queryFn: async (): Promise<Announcement[]> => {
      if (!isSuperadmin && !municipalityCode) {
        const provinceSnapshot = await getDocs(
          buildAnnouncementQuery([
            where('status', '==', AnnouncementStatus.Published),
            where('targetScope.type', '==', 'province'),
            orderBy('publishedAt', 'desc'),
            limit(pageSize),
          ])
        )

        return provinceSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Announcement[]
      }

      if (isSuperadmin) {
        const snapshot = await getDocs(
          buildAnnouncementQuery([
            where('status', '==', AnnouncementStatus.Published),
            orderBy('publishedAt', 'desc'),
            limit(pageSize),
          ])
        )

        return snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Announcement[]
      }

      const [provinceSnapshot, municipalitySnapshot, multiMunicipalitySnapshot] =
        await Promise.all([
          getDocs(
            buildAnnouncementQuery([
              where('status', '==', AnnouncementStatus.Published),
              where('targetScope.type', '==', 'province'),
              orderBy('publishedAt', 'desc'),
              limit(pageSize),
            ])
          ),
          getDocs(
            buildAnnouncementQuery([
              where('status', '==', AnnouncementStatus.Published),
              where('targetScope.type', '==', 'municipality'),
              where(
                'targetScope.municipalityCodes',
                'array-contains',
                municipalityCode
              ),
              orderBy('publishedAt', 'desc'),
              limit(pageSize),
            ])
          ),
          getDocs(
            buildAnnouncementQuery([
              where('status', '==', AnnouncementStatus.Published),
              where('targetScope.type', '==', 'multi_municipality'),
              where(
                'targetScope.municipalityCodes',
                'array-contains',
                municipalityCode
              ),
              orderBy('publishedAt', 'desc'),
              limit(pageSize),
            ])
          ),
        ])

      const deduped = new Map<string, Announcement>()
      for (const snapshot of [
        provinceSnapshot,
        municipalitySnapshot,
        multiMunicipalitySnapshot,
      ]) {
        for (const doc of snapshot.docs) {
          if (!deduped.has(doc.id)) {
            deduped.set(doc.id, {
              id: doc.id,
              ...doc.data(),
            } as Announcement)
          }
        }
      }

      return [...deduped.values()].sort(sortAnnouncements).slice(0, pageSize)
    },
  })
}
