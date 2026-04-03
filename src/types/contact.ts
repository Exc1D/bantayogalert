import { z } from 'zod'

export enum ContactType {
  Police = 'police',
  Fire = 'fire',
  Medical = 'medical',
  Rescue = 'rescue',
  Barangay = 'barangay',
  Municipal = 'municipal',
  Provincial = 'provincial',
  NGO = 'ngo',
  Other = 'other',
}

export interface Contact {
  id: string
  name: string
  agency: string
  type: ContactType
  phones: string[]
  email: string
  capabilities: string[]
  municipalityCode: string  // 3-char
  barangayCode?: string    // optional, for barangay-level contacts
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export const ContactSchema = z.object({
  name: z.string().min(1).max(200),
  agency: z.string().min(1).max(200),
  type: z.nativeEnum(ContactType),
  phones: z.array(z.string().regex(/^\+?[\d\s-]{7,20}$/)).min(1).max(5),
  email: z.string().email().optional(),
  capabilities: z.array(z.string()).min(1).max(20),
  municipalityCode: z.string().length(3),
  barangayCode: z.string().length(6).optional(),
  isActive: z.boolean().default(true),
})
