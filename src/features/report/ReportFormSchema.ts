/**
 * ReportFormSchema - Zod schemas for multi-step report form validation
 *
 * Four steps:
 * - Step 1: Type & Severity selection
 * - Step 2: Description text entry
 * - Step 3: Location (municipality, barangay, coordinates, geohash) + Media files
 * - Step 4: Review (all fields merged via fullReportSchema)
 *
 * Coordinate bounds: lat 13.8-14.8, lng 122.3-123.3 (Camarines Norte)
 * Geohash: 9-char precision (~2m accuracy)
 * Max images: 5 (enforced in step3Schema and fullReportSchema)
 */

import { z } from 'zod'
import { IncidentType, Severity } from '@/types/report'

/**
 * Step 1: Type & Severity selection
 * D-75: Report form type and severity selection
 */
export const step1Schema = z.object({
  type: z.nativeEnum(IncidentType, {
    errorMap: () => ({ message: 'Select an incident type' }),
  }),
  severity: z.nativeEnum(Severity, {
    errorMap: () => ({ message: 'Select a severity level' }),
  }),
})

/**
 * Step 2: Description text entry
 * D-79: Description must be 10-2000 characters
 */
export const step2Schema = z.object({
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(2000, 'Description must not exceed 2000 characters'),
})

/**
 * Step 3: Location & Media
 * D-84: Coordinate bounds validation
 * D-85: Geohash 9-char precision
 * D-90: Max 5 images
 *
 * Note: mediaFiles (File[]) is handled separately in the component,
 * not included in the schema. mediaUrls is an array of URL strings.
 */
export const step3Schema = z.object({
  municipalityCode: z.string().min(3, 'Select a municipality').max(4, 'Invalid municipality code'),
  barangayCode: z.string().min(6, 'Select a barangay').max(7, 'Invalid barangay code'),
  location: z.object({
    lat: z.number().min(13.8, 'Latitude out of Camarines Norte bounds').max(14.8, 'Latitude out of Camarines Norte bounds'),
    lng: z.number().min(122.3, 'Longitude out of Camarines Norte bounds').max(123.3, 'Longitude out of Camarines Norte bounds'),
    geohash: z.string().length(9, 'Geohash must be 9 characters'),
  }),
  mediaUrls: z.array(z.string().url()).max(5, 'Maximum 5 images allowed').default([]),
})

/**
 * Full report schema - merge of all steps for final submission
 */
export const fullReportSchema = step1Schema.merge(step2Schema).merge(step3Schema)

export type ReportFormData = z.infer<typeof fullReportSchema>

// Re-export individual step types for convenience
export type Step1Data = z.infer<typeof step1Schema>
export type Step2Data = z.infer<typeof step2Schema>
export type Step3Data = z.infer<typeof step3Schema>
