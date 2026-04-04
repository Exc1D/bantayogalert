import { useQuery } from '@tanstack/react-query'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import {
  AnnouncementStatus,
  type Announcement,
} from '@/types/announcement'

export const PUBLIC_ANNOUNCEMENTS_QUERY_KEY = ['announcements', 'public'] as const

function sortAnnouncements(left: Announcement, right: Announcement) {
  const leftTime = left.publishedAt ?? left.createdAt
  const rightTime = right.publishedAt ?? right.createdAt

  if (leftTime === rightTime) {
    return right.id.localeCompare(left.id)
  }

  return rightTime.localeCompare(leftTime)
}

export function usePublicAnnouncements(options?: { pageSize?: number }) {
  const { pageSize = 20 } = options ?? {}

  return useQuery({
    queryKey: [...PUBLIC_ANNOUNCEMENTS_QUERY_KEY, pageSize],
    staleTime: 1000 * 60,
    queryFn: async (): Promise<Announcement[]> => {
      const snapshot = await getDocs(
        query(
          collection(db, 'announcements'),
          where('status', '==', AnnouncementStatus.Published)
        )
      )

      const announcements = snapshot.docs.map((entry) => ({
        id: entry.id,
        ...entry.data(),
      })) as Announcement[]

      return announcements
        .slice()
        .sort(sortAnnouncements)
        .slice(0, pageSize)
    },
  })
}

export function usePublicAnnouncement(alertId?: string) {
  return useQuery({
    queryKey: [...PUBLIC_ANNOUNCEMENTS_QUERY_KEY, 'detail', alertId ?? 'missing'],
    enabled: Boolean(alertId),
    staleTime: 1000 * 60,
    queryFn: async (): Promise<Announcement | null> => {
      if (!alertId) {
        return null
      }

      const snapshot = await getDoc(doc(db, 'announcements', alertId))
      if (!snapshot.exists()) {
        return null
      }

      const announcement = {
        id: snapshot.id,
        ...snapshot.data(),
      } as Announcement

      return announcement.status === AnnouncementStatus.Published
        ? announcement
        : null
    },
  })
}
