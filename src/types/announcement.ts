import { z } from 'zod'

export enum AnnouncementType {
  Alert = 'alert',
  Advisory = 'advisory',
  Update = 'update',
  AllClear = 'all_clear',
}

export enum AnnouncementSeverity {
  Info = 'info',
  Warning = 'warning',
  Critical = 'critical',
}

export enum AnnouncementStatus {
  Draft = 'draft',
  Published = 'published',
  Cancelled = 'cancelled',
}

export interface Announcement {
  id: string
  title: string
  body: string
  type: AnnouncementType
  severity: AnnouncementSeverity
  targetScope: {
    type: 'municipality' | 'province'
    municipalityCode?: string  // required if type = 'municipality'
  }
  status: AnnouncementStatus
  publishedAt?: string
  createdBy: string
  createdAt: string
  updatedAt: string
}

export const AnnouncementSchema = z.object({
  title: z.string().min(3).max(200),
  body: z.string().min(10).max(5000),
  type: z.nativeEnum(AnnouncementType),
  severity: z.nativeEnum(AnnouncementSeverity),
  targetScope: z.discriminatedUnion('type', [
    z.object({ type: z.literal('province') }),
    z.object({ type: z.literal('municipality'), municipalityCode: z.string().min(3).max(4) }),
  ]),
})
