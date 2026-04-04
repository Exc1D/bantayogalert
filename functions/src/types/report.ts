import { z } from 'zod'

export enum IncidentType {
  Flood = 'flood',
  Landslide = 'landslide',
  Fire = 'fire',
  Earthquake = 'earthquake',
  Medical = 'medical',
  VehicleAccident = 'vehicle_accident',
  Crime = 'crime',
  Other = 'other',
}

export enum Severity {
  Critical = 'critical',
  High = 'high',
  Medium = 'medium',
  Low = 'low',
}

export enum WorkflowState {
  Pending = 'pending',
  Verified = 'verified',
  Rejected = 'rejected',
  Dispatched = 'dispatched',
  Acknowledged = 'acknowledged',
  InProgress = 'in_progress',
  Resolved = 'resolved',
}

export enum ReportStatus {
  Submitted = 'submitted',
  UnderReview = 'under_review',
  Verified = 'verified',
  Rejected = 'rejected',
  Dispatched = 'dispatched',
  Acknowledged = 'acknowledged',
  InProgress = 'in_progress',
  Resolved = 'resolved',
}

export interface GeoLocation {
  lat: number
  lng: number
  geohash: string
}

export interface ReportMedia {
  url: string
  type: 'image/jpeg' | 'image/png' | 'image/webp'
  filename: string
  sizeBytes: number
  uploadedAt: string
}

export interface Report {
  id: string
  type: IncidentType
  severity: Severity
  description: string
  location: GeoLocation
  municipalityCode: string
  barangayCode: string
  mediaUrls: string[]
  createdAt: string
  updatedAt: string
  reporterId: string
  workflowState: WorkflowState
}

export interface ReportPrivate {
  id: string
  exactLocation: { lat: number; lng: number }
  reporterEmail: string
  reporterName: string
  ownerStatus: ReportStatus
  priority?: 1 | 2 | 3 | 4 | 5
  internalNotes?: string
  activityLog: ActivityLogEntry[]
}

export interface ReportOps {
  id: string
  municipalityCode: string  // enables server-side municipality filtering
  version: number            // starts at 1, incremented on each triage action
  activity?: ActivityLogEntry[]  // triage action audit log
  dispatchNotes?: string
  routingDestination?: string
  assignedContactId?: string
  assignedContactSnapshot?: import('./contact').Contact
  classification?: string
}

export interface ActivityLogEntry {
  action: string
  performedBy: string
  performedAt: string
  details?: string
}

export const GeoLocationSchema = z.object({
  lat: z.number().min(13.8).max(14.8),
  lng: z.number().min(122.3).max(123.3),
  geohash: z.string().length(9),
})

export const ReportMediaSchema = z.object({
  url: z.string().url(),
  type: z.enum(['image/jpeg', 'image/png', 'image/webp']),
  filename: z.string().max(255),
  sizeBytes: z.number().max(10 * 1024 * 1024),
  uploadedAt: z.string().datetime(),
})

export const ReportSchema = z.object({
  type: z.nativeEnum(IncidentType),
  severity: z.nativeEnum(Severity),
  description: z.string().min(10).max(2000),
  location: GeoLocationSchema,
  municipalityCode: z.string().length(3),
  barangayCode: z.string().length(6),
  mediaUrls: z.array(z.string().url()).max(5),
})

export const ReportPrivateSchema = z.object({
  exactLocation: z.object({
    lat: z.number().min(13.8).max(14.8),
    lng: z.number().min(122.3).max(123.3),
  }),
  priority: z.number().int().min(1).max(5).optional(),
  internalNotes: z.string().max(5000).optional(),
})

export const ActivityLogEntrySchema = z.object({
  action: z.string(),
  performedBy: z.string(),
  performedAt: z.string().datetime(),
  details: z.string().optional(),
})
