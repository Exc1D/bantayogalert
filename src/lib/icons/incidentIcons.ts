import {
  Droplets,
  Mountain,
  Flame,
  Waves,
  Heart,
  Car,
  ShieldAlert,
  AlertCircle,
} from 'lucide-react'
import { IncidentType } from '@/types/report'

// Centralized mapping for all incident type icons.
// Used across card components and map markers.

const ALL_ICONS: Record<IncidentType, React.ComponentType<{ className?: string }>> = {
  [IncidentType.Flood]: Droplets,
  [IncidentType.Landslide]: Mountain,
  [IncidentType.Fire]: Flame,
  [IncidentType.Earthquake]: Waves,
  [IncidentType.Medical]: Heart,
  [IncidentType.VehicleAccident]: Car,
  [IncidentType.Crime]: ShieldAlert,
  [IncidentType.Other]: AlertCircle,
}

export function getIncidentIcon(type: IncidentType): React.ComponentType<{ className?: string }> {
  return ALL_ICONS[type] ?? ALL_ICONS[IncidentType.Other]
}

// SVG string versions for Leaflet DivIcon innerHTML rendering.
// Each SVG is a 16x16 Lucide-style icon with white fill and no background.
const ALL_SVGS: Record<IncidentType, string> = {
  [IncidentType.Flood]: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2c0 0-7 4.5-7 9.5C5 14.5 8.5 18 12 18c3.5 0 7-3.5 7-8.5C19 6.5 12 2 12 2Z"/></svg>`,
  [IncidentType.Landslide]: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m22.57 17.5-4-11-4.17 1.21L9.57 2.5l-4.2 12 5.43 4z"/><path d="M13.17 7.5l-4.17 1.21L3.57 19.5l4.99 2H22.4L18 11z"/></svg>`,
  [IncidentType.Fire]: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 16v-4.39A3 3 0 0 0 15 7.03V6a3 3 0 0 0-3.35-3 3 3 0 0 0-2.53 3.12c0 1.55-.9 2.84-2.12 3.88"/><path d="M17.06 15.56c.76.69 1.44 1.45 1.44 2.44 0 3.31-3.63 6-4.5 6C6 24 2 20 2 12c0-2.77.63-5.46 2.3-7.22.85-.89 1.39-2.02 1.7-3.28"/><path d="M12 2a3 3 0 0 0 3 3 3 3 0 0 0-3 3 3 3 0 0 0 0-6Z"/></svg>`,
  [IncidentType.Earthquake]: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12h4l3-8 4 16 3-8h4"/></svg>`,
  [IncidentType.Medical]: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19.5 12h-5.5V6.5a2.5 2.5 0 0 0-5 0V12H6.5a1.5 1.5 0 0 0 0 3H9v5.5a2.5 2.5 0 0 0 5 0V15h5.5a1.5 1.5 0 0 0 0-3Z"/></svg>`,
  [IncidentType.VehicleAccident]: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9L18 10l-1.5-3.5A2 2 0 0 0 14.7 5H13l-2 3H8L5.5 3.5A2 2 0 0 0 3.7 3h-.2a1.5 1.5 0 0 0-1.4 1.1L1 8c-.5 1.4-.1 3 1 4l1 1v6a1 1 0 0 0 1 1h1c.6 0 1-.4 1-1v-1h12v1c0 .6.4 1 1 1h1a1 1 0 0 0 1-1v-5Z"/><circle cx="1.5" cy="15.5" r="1.5"/><circle cx="20.5" cy="15.5" r="1.5"/></svg>`,
  [IncidentType.Crime]: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m13 11-4 4"/><path d="m9 11 4 4"/></svg>`,
  [IncidentType.Other]: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>`,
}

export function getIncidentIconSvg(type: IncidentType): string {
  return ALL_SVGS[type] ?? ALL_SVGS[IncidentType.Other]
}

// Backward-compatible exports for migration
/** @deprecated Use getIncidentIcon() instead */
export const INCIDENT_TYPE_COMPONENTS: Record<IncidentType, React.ComponentType<{ className?: string }>> = ALL_ICONS
/** @deprecated Use getIncidentIconSvg() instead */
export const INCIDENT_TYPE_SVGS: Record<IncidentType, string> = ALL_SVGS
