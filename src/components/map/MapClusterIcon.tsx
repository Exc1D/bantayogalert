import L from 'leaflet'
import { IncidentType, Severity } from '@/types/report'

// Severity → hex color (per DESIGN.md §3.3)
const SEVERITY_COLORS: Record<Severity, string> = {
  [Severity.Critical]: '#DC2626',
  [Severity.High]: '#EA580C',
  [Severity.Medium]: '#65A30D',
  [Severity.Low]: '#2563EB',
}

// Disaster type icon colors — category identifiers, not severity (DESIGN.md §5.2)
const TYPE_COLORS: Record<string, string> = {
  [IncidentType.Flood]: '#2563EB',
  [IncidentType.Landslide]: '#78716C',
  [IncidentType.Fire]: '#EA580C',
  [IncidentType.Earthquake]: '#92400E',
  [IncidentType.Medical]: '#E11D48',
  [IncidentType.VehicleAccident]: '#4B5563',
  [IncidentType.Crime]: '#4338CA',
  [IncidentType.Other]: '#6B7280',
}

// Compact SVG paths using Lucide icon shapes
const ICON_PATHS: Record<string, string> = {
  [IncidentType.Flood]:
    '<path d="M2 16c2-2 4-2 6 0s4 2 6 0 4-2 6 0" stroke="currentColor" fill="none" stroke-width="1.5"/><path d="M2 20c2-2 4-2 6 0s4 2 6 0 4-2 6 0" stroke="currentColor" fill="none" stroke-width="1.5"/>',
  [IncidentType.Landslide]:
    '<path d="M12 3L3 20h18L12 3z" fill="currentColor" opacity="0.3"/><path d="M12 3L3 20h18L12 3z" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M12 10l-5 8h10l-5-8z" fill="currentColor"/>',
  [IncidentType.Fire]:
    '<path d="M12 12c2-2 4-4 2-7-2 2-5 3-6 5a5 5 0 1 0 4 2z" fill="currentColor"/>',
  [IncidentType.Earthquake]:
    '<path d="M2 12l4-4 3 3 4-4 4 4 2-2 3 3" stroke="currentColor" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>',
  [IncidentType.Medical]:
    '<rect x="5" y="10" width="14" height="4" rx="1" fill="currentColor"/><rect x="10" y="5" width="4" height="14" rx="1" fill="currentColor"/>',
  [IncidentType.VehicleAccident]:
    '<path d="M5 17h14M6 11a1 1 0 1 1 2 0 1 1 0 1 1-2 0M16 11a1 1 0 1 1 2 0 1 1 0 1 1-2 0M4 17h16M18 17v3M6 17v3M8 14h8l1-4H7l1 4z" stroke="currentColor" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>',
  [IncidentType.Crime]:
    '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="currentColor" opacity="0.2"/><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>',
  [IncidentType.Other]:
    '<circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.2"/><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M12 8v4M12 16h.01" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',
}

export function createClusterIcon(count: number): L.DivIcon {
  return L.divIcon({
    html: `<div class="cluster-marker-inner">${count}</div>`,
    className: 'custom-cluster-icon',
    iconSize: L.point(44, 44),
    iconAnchor: L.point(22, 22),
    popupAnchor: L.point(0, -22),
  })
}

export function createReportIcon(
  severity: Severity,
  type: IncidentType,
  isSelected = false
): L.DivIcon {
  const ringColor = SEVERITY_COLORS[severity] ?? '#6B7280'
  const fillColor = TYPE_COLORS[type] ?? TYPE_COLORS[IncidentType.Other]
  const iconSvg =
    ICON_PATHS[type] ?? ICON_PATHS[IncidentType.Other]
  const scale = isSelected ? 'scale(1.2)' : 'scale(1)'
  const shadow = isSelected
    ? 'box-shadow: 0 0 0 3px white, 0 0 0 5px rgba(0,0,0,0.3);'
    : ''

  return L.divIcon({
    html: `<div style="background:${fillColor};border:2px solid ${ringColor};${shadow}transform:${scale}"><svg width="16" height="16" viewBox="0 0 24 24" style="color:white">${iconSvg}</svg></div>`,
    className: 'custom-report-icon',
    iconSize: L.point(32, 32),
    iconAnchor: L.point(16, 16),
    popupAnchor: L.point(0, -16),
  })
}
