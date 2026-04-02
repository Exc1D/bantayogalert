import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  updateDoc,
  doc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore'
import { getFirebaseFirestore } from '../config/firebase'

export interface Announcement {
  id: string
  title: string
  body: string
  scope: 'municipality' | 'multi_municipality' | 'province'
  targetMunicipalities: string[]
  severity: 'info' | 'warning' | 'critical'
  creatorUid: string
  creatorRole: string
  creatorMunicipality: string | null
  createdAt: Timestamp
  publishedAt: Timestamp | null
  expiresAt: Timestamp | null
  active: boolean
}

export async function createAnnouncement(
  input: {
    title: string
    body: string
    scope: Announcement['scope']
    targetMunicipalities: string[]
    severity: Announcement['severity']
    expiresAt?: Date
    publish?: boolean
  },
  creatorUid: string,
  creatorRole: string,
  creatorMunicipality: string | null
): Promise<string> {
  const db = getFirebaseFirestore()
  const now = serverTimestamp()

  const docRef = await addDoc(collection(db, 'announcements'), {
    title: input.title,
    body: input.body,
    scope: input.scope,
    targetMunicipalities: input.targetMunicipalities,
    severity: input.severity,
    creatorUid,
    creatorRole,
    creatorMunicipality,
    createdAt: now,
    publishedAt: input.publish ? now : null,
    expiresAt: input.expiresAt ? Timestamp.fromDate(input.expiresAt) : null,
    active: input.publish ?? false,
  })

  return docRef.id
}

export async function getAnnouncements(
  userMunicipality?: string,
  includeInactive: boolean = false
): Promise<Announcement[]> {
  const db = getFirebaseFirestore()
  const q = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'))

  const snap = await getDocs(q)
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as Announcement))
    .filter((a) => {
      if (!includeInactive && !a.active) return false
      if (a.scope === 'province') return true
      if (a.scope === 'municipality' && userMunicipality) {
        return a.targetMunicipalities.includes(userMunicipality)
      }
      if (a.scope === 'multi_municipality' && userMunicipality) {
        return a.targetMunicipalities.includes(userMunicipality)
      }
      return false
    })
}

export async function updateAnnouncement(
  id: string,
  updates: Partial<Pick<Announcement, 'title' | 'body' | 'scope' | 'targetMunicipalities' | 'severity' | 'expiresAt' | 'active'>>
): Promise<void> {
  const db = getFirebaseFirestore()
  const docRef = doc(db, 'announcements', id)
  await updateDoc(docRef, updates)
}

export async function publishAnnouncement(id: string): Promise<void> {
  const db = getFirebaseFirestore()
  const docRef = doc(db, 'announcements', id)
  await updateDoc(docRef, {
    active: true,
    publishedAt: serverTimestamp(),
  })
}
