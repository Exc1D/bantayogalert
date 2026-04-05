import L from 'leaflet'
import { IncidentType, Severity } from '@/types/report'
import { getIncidentIconSvg } from '@/lib/icons/incidentIcons'

// Severity → hex color (D-151)
const SEVERITY_COLORS: Record<Severity, string> = {
  [Severity.Critical]: '#dc2626',
  [Severity.High]: '#f97316',
  [Severity.Medium]: '#eab308',
  [Severity.Low]: '#22c55e',
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

const severityColor = (sev: Severity) => SEVERITY_COLORS[sev] ?? '#6b7280'

export function createReportIcon(severity: Severity, type: IncidentType, isSelected = false): L.DivIcon {
  const color = severityColor(severity)
  const iconSvg = getIncidentIconSvg(type)
  const scale = isSelected ? 'scale(1.2)' : 'scale(1)'
  const border = isSelected
    ? 'box-shadow: 0 0 0 3px white, 0 0 0 5px rgba(0,0,0,0.3);'
    : ''

  return L.divIcon({
    html: `<div style="background:${color};${border}transform:${scale}">${iconSvg}</div>`,
    className: 'custom-report-icon',
    iconSize: L.point(32, 32),
    iconAnchor: L.point(16, 16),
    popupAnchor: L.point(0, -16),
  })
}
