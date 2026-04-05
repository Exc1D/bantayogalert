import L from 'leaflet'
import { IncidentType, Severity } from '@/types/report'
import { getIncidentIconSvg } from '@/lib/icons/incidentIcons'

// Severity → fill + stroke hex colors (DESIGN.md §13.1)
const SEVERITY_COLORS: Record<Severity, { fill: string; stroke: string }> = {
  [Severity.Critical]: { fill: '#DC2626', stroke: '#991B1B' },
  [Severity.High]:     { fill: '#EA580C', stroke: '#9A3412' },
  [Severity.Medium]:   { fill: '#65A30D', stroke: '#3F6212' },
  [Severity.Low]:      { fill: '#2563EB', stroke: '#1E40AF' },
}

// Ordered by urgency — lower index = more urgent
const SEVERITY_ORDER: Severity[] = [Severity.Critical, Severity.High, Severity.Medium, Severity.Low]
const severityPriority = (sev: Severity): number => SEVERITY_ORDER.indexOf(sev)

const worstSeverity = (sevs: Severity[]): Severity => {
  if (sevs.length === 1) return sevs[0]!
  return sevs.reduce(
    (worst, sev) => (severityPriority(sev) < severityPriority(worst) ? sev : worst),
    sevs[0]!
  )
}

export function createClusterIcon(count: number, severs?: Severity[]): L.DivIcon {
  const fill = severs ? SEVERITY_COLORS[worstSeverity(severs)].fill : '#2563EB'
  return L.divIcon({
    html: `<div class="cluster-marker-inner" style="background:${fill}">${count}</div>`,
    className: 'custom-cluster-icon',
    iconSize: L.point(48, 48),
    iconAnchor: L.point(24, 24),
    popupAnchor: L.point(0, -24),
  })
}

export function createReportIcon(severity: Severity, type: IncidentType, isResolved = false, isSelected = false): L.DivIcon {
  const color = SEVERITY_COLORS[severity] ?? SEVERITY_COLORS[Severity.Low]
  const iconSvg = getIncidentIconSvg(type)
  const scale = isSelected ? 'pin-marker-selected' : ''

  const resolvedClass = isResolved ? 'pin-resolved ' : ''
  return L.divIcon({
    html: `
      <div class="${resolvedClass}pin-wrapper ${scale}" style="--pin-fill:${color.fill};--pin-stroke:${color.stroke}">
        <div class="pin-bubble" style="background:var(--pin-fill);border-color:var(--pin-stroke)">${iconSvg}</div>
        <div class="pin-pointer" style="background:var(--pin-fill);border-color:var(--pin-stroke)"></div>
      </div>
    `,
    className: 'custom-report-icon',
    iconSize: L.point(32, 40),  // includes pointer triangle
    iconAnchor: L.point(16, 40), // anchor at bottom of pointer
    popupAnchor: L.point(0, -16),
  })
}

// Re-export for callers that need severity ordering
export { worstSeverity }
