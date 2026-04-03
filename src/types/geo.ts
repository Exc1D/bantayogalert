import { z } from 'zod'

export interface Municipality {
  code: string        // 3-char: 'bas', 'bat', 'cams', 'cap', 'daet', 'jmo', 'labo', 'mer', 'san', 'sip', 'sta', 'vin'
  name: string
  center: { lat: number; lng: number }
  population?: number
}

export interface Barangay {
  code: string        // 6-char: municipalityCode(3) + barangayNumber(3), zero-padded
  municipalityCode: string
  name: string
}

export const MunicipalitySchema = z.object({
  code: z.string().min(3).max(4),
  name: z.string().min(1).max(100),
  center: z.object({ lat: z.number(), lng: z.number() }),
  population: z.number().int().positive().optional(),
})

export const BarangaySchema = z.object({
  code: z.string().min(6).max(7),
  municipalityCode: z.string().min(3).max(4),
  name: z.string().min(1).max(100),
})
