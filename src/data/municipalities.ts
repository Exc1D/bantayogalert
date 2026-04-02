export function getMunicipalityName(code: string): string {
  const found = MUNICIPALITIES.find((m) => m.code === code)
  return found?.name ?? code
}

export const MUNICIPALITIES = [
  { code: 'basud', name: 'Basud' },
  { code: 'daet', name: 'Daet' },
  { code: 'josepanganiban', name: 'Jose Pangańiban' },
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
