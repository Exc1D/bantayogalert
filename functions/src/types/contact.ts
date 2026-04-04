/**
 * Cloud Functions contact types (Node runtime, cannot import from src/types)
 */
import { z } from 'zod'

export const ContactType = {
  Police: 'police',
  Fire: 'fire',
  Medical: 'medical',
  Rescue: 'rescue',
  Barangay: 'barangay',
  Municipal: 'municipal',
  Provincial: 'provincial',
  NGO: 'ngo',
  Other: 'other',
} as const

export type ContactType = (typeof ContactType)[keyof typeof ContactType]

/**
 * ContactSnapshot is stored in report_ops routing events when a report is dispatched.
 * This preserves contact details even if the contact is later edited or deactivated.
 */
export interface ContactSnapshot {
  contactId: string
  name: string
  agency: string
  type: ContactType
  phones: string[]
  email?: string
  municipalityCode: string
}

export const CreateContactSchema = z.object({
  name: z.string().min(1).max(200),
  agency: z.string().min(1).max(200),
  type: z.nativeEnum(ContactType),
  phones: z.array(z.string().regex(/^\+?[\d\s-]{7,20}$/)).min(1).max(5),
  email: z.string().email().optional(),
  capabilities: z.array(z.string()).min(1).max(20),
  municipalityCode: z.string().min(3).max(4),
  barangayCode: z.string().min(6).max(7).optional(),
})

export const UpdateContactSchema = CreateContactSchema.partial()
