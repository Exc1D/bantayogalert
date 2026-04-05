import { useEffect, useRef, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import L from 'leaflet'
import { useMap } from '@/app/shell/MapContainerWrapper'
import { useSupercluster } from '@/hooks/useSupercluster'
import { useFilterStore } from '@/stores/filterStore'
import { useMapViewportStore } from '@/hooks/useMapViewport'
import { useUIStore } from '@/stores/uiStore'
import { reportToGeoJSON } from '@/lib/geo/reportToGeoJSON'
import { createClusterIcon, createReportIcon } from './MapClusterIcon'
import type { Feature, Point, BBox } from 'geojson'
import type { Report, Severity } from '@/types/report'
import { REPORTS_QUERY_KEY } from '@/hooks/useVerifiedReportsListener'
import { WorkflowState } from '@/types/report'

function getClusterExpansionZoom(cluster: Record<string, unknown>): number {
  // Supercluster 8.x: cluster.expansion_zoom or fallback
  return typeof cluster.expansion_zoom === 'number' ? cluster.expansion_zoom : 12
}

export function ReportMarkers() {
  const { mapRef, mapReady } = useMap()
  const layerGroupRef = useRef<L.LayerGroup | null>(null)
  const queryClient = useQueryClient()
  const { mapViewport, setViewport, selectedMarkerId, setSelectedMarkerId } = useMapViewportStore()
  const setActivePanel = useUIStore((s) => s.setActivePanel)
  const setSelectedReportId = useUIStore((s) => s.setSelectedReportId)

  // Filter state
  const filterType = useFilterStore((s) => s.type)
  const filterSeverity = useFilterStore((s) => s.severity)
  const filterMunicipality = useFilterStore((s) => s.municipalityCode)

  // Fetch verified reports from TanStack Query cache (populated by listener)
  const { data: reports = [] } = useQuery<Report[]>({
    queryKey: REPORTS_QUERY_KEY,
    queryFn: () => queryClient.getQueryData<Report[]>(REPORTS_QUERY_KEY) ?? [],
    initialData: () => queryClient.getQueryData<Report[]>(REPORTS_QUERY_KEY) ?? [],
    staleTime: Infinity, // Real-time listener keeps this fresh
  })

  // Derive GeoJSON features from reports, filtered by active filters
  const features = useMemo<Feature<Point>[]>(() => {
    return reports
      .filter((r) => {
        if (filterType && r.type !== filterType) return false
        if (filterSeverity && r.severity !== filterSeverity) return false
        if (filterMunicipality && r.municipalityCode !== filterMunicipality) return false
        return true
      })
      .map(reportToGeoJSON)
      .filter((f): f is Feature<Point> => f !== null)
  }, [reports, filterType, filterSeverity, filterMunicipality])

  // Get current map bounds for supercluster from the latest viewport render.
  const bounds: BBox | null = mapRef.current
    ? (() => {
        const b = mapRef.current!.getBounds()
        return [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()]
      })()
    : null

  const zoom = mapViewport.zoom

  const { clusters, supercluster } = useSupercluster({ features, bounds, zoom })

  // Sync map viewport to Zustand on moveend/zoomend
  useEffect(() => {
    if (!mapRef.current || !mapReady) return
    const map = mapRef.current

    const handleMoveEnd = () => {
      const center = map.getCenter()
      setViewport({ center: [center.lat, center.lng], zoom: map.getZoom() })
    }

    map.on('moveend', handleMoveEnd)
    map.on('zoomend', handleMoveEnd)

    return () => {
      map.off('moveend', handleMoveEnd)
      map.off('zoomend', handleMoveEnd)
    }
  }, [mapRef, mapReady, setViewport])

  // Build a map of report id -> severity for cluster severity coloring
  const severityMap = useMemo<Map<string, Severity>>(() => {
    const m = new Map()
    reports.forEach((r) => m.set(r.id, r.severity))
    return m
  }, [reports])

  // Manage Leaflet layer group imperatively
  useEffect(() => {
    if (!mapReady || !mapRef.current) return

    if (!layerGroupRef.current) {
      layerGroupRef.current = L.layerGroup().addTo(mapRef.current)
    }
    const layerGroup = layerGroupRef.current
    layerGroup.clearLayers()

    clusters.forEach((cluster) => {
      const coords = cluster.geometry.coordinates as [number, number]
      const [lng, lat] = coords
      const props = cluster.properties as any

      if (props.cluster) {
        // Cluster marker — collect severities from children for fill color
        const clusterSeverities: Severity[] = []
        if (supercluster && props.cluster_id) {
          const leaves = supercluster.getLeaves(props.cluster_id, Infinity, 0) as Record<string, any>[]
          for (const leaf of leaves) {
            const sev = severityMap.get(leaf.properties?.id)
            if (sev) clusterSeverities.push(sev)
          }
        }
        const count = props.point_count
        const icon = createClusterIcon(count, clusterSeverities)
        const marker = L.marker([lat, lng], { icon })
        marker.on('click', () => {
          const expansionZoom = getClusterExpansionZoom(props)
          mapRef.current?.setView([lat, lng], Math.min(expansionZoom, mapRef.current.getZoom() + 2))
        })
        layerGroup.addLayer(marker)
      } else {
        // Individual report marker
        const isSelected = props.id === selectedMarkerId
        const isResolved = props.workflowState === WorkflowState.Resolved
        const icon = createReportIcon(props.severity, props.type, isResolved, isSelected)
        const marker = L.marker([lat, lng], { icon })
        marker.on('click', () => {
          setSelectedMarkerId(props.id)
          setSelectedReportId(props.id)
          setActivePanel('report-detail')
        })
        layerGroup.addLayer(marker)
      }
    })

    return () => {
      layerGroup.clearLayers()
    }
  }, [clusters, selectedMarkerId, severityMap, supercluster, mapReady, mapRef, setSelectedMarkerId, setSelectedReportId, setActivePanel])

  return null // Pure side-effect component
}
