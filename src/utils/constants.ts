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

export const REPORT_TYPES = [
  { value: 'flood', label: 'Flood', icon: '🌊' },
  { value: 'landslide', label: 'Landslide', icon: '⛰️' },
  { value: 'fire', label: 'Fire', icon: '🔥' },
  { value: 'earthquake', label: 'Earthquake', icon: '🌍' },
  { value: 'medical', label: 'Medical', icon: '🏥' },
  { value: 'crime', label: 'Crime', icon: '🚔' },
  { value: 'infrastructure', label: 'Infrastructure', icon: '🏗️' },
  { value: 'other', label: 'Other', icon: '⚠️' },
] as const

export const SEVERITY_COLORS = {
  low: '#22c55e',      // green
  medium: '#eab308',   // yellow
  high: '#f97316',     // orange
  critical: '#ef4444', // red
} as const
