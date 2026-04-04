import L from 'leaflet'
import { IncidentType, Severity } from '@/types/report'

// Severity → hex color (D-151)
const SEVERITY_COLORS: Record<Severity, string> = {
  [Severity.Critical]: '#dc2626',
  [Severity.High]: '#f97316',
  [Severity.Medium]: '#eab308',
  [Severity.Low]: '#22c55e',
}

// Incident type → icon symbol (D-111)
const TYPE_ICONS: Record<string, string> = {
  [IncidentType.Flood]: '💧',
  [IncidentType.Landslide]: '🔺',
  [IncidentType.Fire]: '🔥',
  [IncidentType.Earthquake]: '⚡',
  [IncidentType.Medical]: '➕',
  [IncidentType.VehicleAccident]: '🚗',
  [IncidentType.Crime]: '🛡️',
  [IncidentType.Other]: '❗',
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

export function createReportIcon(severity: Severity, type: IncidentType, isSelected = false): L.DivIcon {
  const color = SEVERITY_COLORS[severity] ?? '#6b7280'
  const icon = TYPE_ICONS[type] ?? TYPE_ICONS[IncidentType.Other]
  const scale = isSelected ? 'scale(1.2)' : 'scale(1)'
  const border = isSelected
    ? 'box-shadow: 0 0 0 3px white, 0 0 0 5px rgba(0,0,0,0.3);'
    : ''

  return L.divIcon({
    html: `<div style="background:${color};${border}transform:${scale}">${icon}</div>`,
    className: 'custom-report-icon',
    iconSize: L.point(32, 32),
    iconAnchor: L.point(16, 16),
    popupAnchor: L.point(0, -16),
  })
}
