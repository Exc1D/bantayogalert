import type { Report } from '@/types/report'
import type { Feature, Point } from 'geojson'

export function reportToGeoJSON(report: Report): Feature<Point> | null {
  if (!report.location?.lat || !report.location?.lng) return null
  return {
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [report.location.lng, report.location.lat],
    },
    properties: {
      id: report.id,
      type: report.type,
      severity: report.severity,
      workflowState: report.workflowState,
      createdAt: report.createdAt,
    },
  }
}
