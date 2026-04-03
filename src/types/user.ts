import { z } from 'zod'

export enum UserRole {
  Citizen = 'citizen',
  MunicipalAdmin = 'municipal_admin',
  ProvincialSuperadmin = 'provincial_superadmin',
}

export interface NotificationPreferences {
  pushEnabled: boolean
  emailEnabled: boolean
  alertTypes: ('flood' | 'landslide' | 'fire' | 'earthquake' | 'medical' | 'all')[]
}

export interface AppUser {
  id: string
  email: string
  displayName: string
  role: UserRole
  municipalityCode: string | null   // null for provincial_superadmin
  provinceCode: 'CMN'               // Camarines Norte = CMN
  notificationPreferences: NotificationPreferences
  createdAt: string
  updatedAt: string
}

export const NotificationPreferencesSchema = z.object({
  pushEnabled: z.boolean(),
  emailEnabled: z.boolean(),
  alertTypes: z.array(z.enum(['flood', 'landslide', 'fire', 'earthquake', 'medical', 'all'])),
})

export const AppUserSchema = z.object({
  email: z.string().email(),
  displayName: z.string().min(1).max(100),
  role: z.nativeEnum(UserRole),
  municipalityCode: z.string().min(3).max(4).nullable(),
  provinceCode: z.literal('CMN'),
  notificationPreferences: NotificationPreferencesSchema,
})
