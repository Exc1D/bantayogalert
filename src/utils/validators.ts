import { z } from 'zod'

export const MunicipalityCode = z.enum([
  'basud', 'daet', 'josepanganiban', 'labo', 'mercedes',
  'paracale', 'sanlorenzo', 'sanvicente', 'talisay', 'vinzales',
  'capalonga', 'staelena'
])
export type MunicipalityCode = z.infer<typeof MunicipalityCode>

export const ReportType = z.enum([
  'flood', 'landslide', 'fire', 'earthquake', 'medical', 'crime', 'infrastructure', 'other'
])
export type ReportType = z.infer<typeof ReportType>

export const ReportCategory = z.enum([
  'water_level', 'fire_size', 'injuries_reported', 'structural_damage',
  'traffic_accident', 'landslide_suspected', 'gas_leak', 'power_outage', 'other'
])
export type ReportCategory = z.infer<typeof ReportCategory>

export const SeverityLevel = z.enum(['low', 'medium', 'high', 'critical'])
export type SeverityLevel = z.infer<typeof SeverityLevel>

export const WorkflowStatus = z.enum([
  'pending', 'verified', 'rejected', 'dispatched', 'acknowledged', 'in_progress', 'resolved'
])
export type WorkflowStatus = z.infer<typeof WorkflowStatus>

export const PublicStatusLabel: Record<WorkflowStatus, string> = {
  pending: 'Pending Review',
  verified: 'Verified',
  rejected: 'Rejected',
  dispatched: 'Responder Dispatched',
  acknowledged: 'Responder En Route',
  in_progress: 'Situation Being Addressed',
  resolved: 'Resolved',
}

export const CreateReportSchema = z.object({
  type: ReportType,
  category: ReportCategory,
  severity: SeverityLevel,
  description: z.string().min(10).max(1000),
  location: z.object({
    lat: z.number().min(13.5).max(15.0),
    lng: z.number().min(121.5).max(124.0),
    barangay: z.string().min(1).max(100),
    municipality: MunicipalityCode,
    address: z.string().max(200).optional(),
  }),
  mediaUrls: z.array(z.string().url()).max(3).optional(),
  submitterAnonymous: z.boolean().optional(),
})
export type CreateReportInput = z.infer<typeof CreateReportSchema>
