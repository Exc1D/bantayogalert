import { z } from 'zod'

/**
 * Step 1: Evidence (photos — handled via separate state, not Zod)
 * Step 2: Location & Barangay
 * Step 3: Description + Review summary
 *
 * Citizens no longer classify incident type or severity.
 * Type/severity are assigned by admins during triage.
 */

export const stepLocationSchema = z.object({
  municipalityCode: z.string().min(3, 'Select a municipality').max(4, 'Invalid municipality code'),
  barangayCode: z.string().min(6, 'Select a barangay').max(7, 'Invalid barangay code'),
  location: z.object({
    lat: z.number().min(13.8, 'Latitude out of Camarines Norte bounds').max(14.8, 'Latitude out of Camarines Norte bounds'),
    lng: z.number().min(122.3, 'Longitude out of Camarines Norte bounds').max(123.3, 'Longitude out of Camarines Norte bounds'),
    geohash: z.string().length(9, 'Geohash must be 9 characters'),
  }),
})

export const stepDescriptionSchema = z.object({
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(2000, 'Description must not exceed 2000 characters'),
})

export const fullReportSchema = stepLocationSchema
  .merge(stepDescriptionSchema)
  .extend({
    photos: z.array(z.string()).default([]),
  })

export type ReportFormData = z.infer<typeof fullReportSchema>
export type StepLocationData = z.infer<typeof stepLocationSchema>
export type StepDescriptionData = z.infer<typeof stepDescriptionSchema>
