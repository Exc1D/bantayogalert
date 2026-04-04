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

export type AnnouncementTargetScope =
  | { type: 'province' }
  | { type: 'municipality'; municipalityCodes: [string] }
  | { type: 'multi_municipality'; municipalityCodes: string[] }

export interface Announcement {
  id: string
  title: string
  body: string
  type: AnnouncementType
  severity: AnnouncementSeverity
  targetScope: AnnouncementTargetScope
  status: AnnouncementStatus
  publishedAt?: string
  cancelledAt?: string
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
    z.object({
      type: z.literal('municipality'),
      municipalityCodes: z.array(z.string()).min(1).max(1),
    }),
    z.object({
      type: z.literal('multi_municipality'),
      municipalityCodes: z.array(z.string()).min(2).max(12),
    }),
  ]),
})
