/**
 * Municipality constants for Bantayog Alert
 * 12 municipalities in Camarines Norte, Philippines
 */

export const MUNICIPALITIES = [
  { code: 'basud', name: 'Basud' },
  { code: 'daet', name: 'Daet' },
  { code: 'josepanganiban', name: 'Jose Pangaaniban' },
  { code: 'labo', name: 'Labo' },
  { code: 'mercedes', name: 'Mercedes' },
  { code: 'paracale', name: 'Paracale' },
  { code: 'sanlorenzo', name: 'San Lorenzo' },
  { code: 'sanvicente', name: 'San Vicente' },
  { code: 'talisay', name: 'Talisay' },
  { code: 'vinzales', name: 'Vinzales' },
  { code: 'capalonga', name: 'Capalonga' },
  { code: 'staelena', name: 'Santa Elena' },
] as const

export type MunicipalityCode = (typeof MUNICIPALITIES)[number]['code']

/**
 * Get the display name for a municipality code
 */
export function getMunicipalityName(code: MunicipalityCode): string {
  const municipality = MUNICIPALITIES.find((m) => m.code === code)
  return municipality?.name ?? code
}

/**
 * Get municipality code from display name
 */
export function getMunicipalityCode(name: string): MunicipalityCode | null {
  const municipality = MUNICIPALITIES.find((m) => m.name === name)
  return municipality?.code ?? null
}

/**
 * Check if a string is a valid municipality code
 */
export function isValidMunicipalityCode(code: string): code is MunicipalityCode {
  return MUNICIPALITIES.some((m) => m.code === code)
}
