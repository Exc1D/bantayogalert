import { useEffect, useRef, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import L from 'leaflet'
import { useMap } from '@/app/shell/MapContainerWrapper'
import { useSupercluster } from '@/hooks/useSupercluster'
import { useFilterStore } from '@/stores/filterStore'
import { useMapViewportStore } from '@/hooks/useMapViewport'
import { useUIStore } from '@/stores/uiStore'
import { reportToGeoJSON } from '@/lib/geo/reportToGeoJSON'
import { createClusterIcon, createReportIcon } from './MapClusterIcon'
import type { Feature, Point, BBox } from 'geojson'
import type { Report } from '@/types/report'
import { REPORTS_QUERY_KEY } from '@/hooks/useVerifiedReportsListener'

function getClusterExpansionZoom(cluster: Record<string, unknown>): number {
  // Supercluster 8.x: cluster.expansion_zoom or fallback
  return typeof cluster.expansion_zoom === 'number' ? cluster.expansion_zoom : 12
}

export function ReportMarkers() {
  const { mapRef, mapReady } = useMap()
  const layerGroupRef = useRef<L.LayerGroup | null>(null)
  const { mapViewport, setViewport, selectedMarkerId, setSelectedMarkerId } = useMapViewportStore()
  const setActivePanel = useUIStore((s) => s.setActivePanel)
  const setSelectedReportId = useUIStore((s) => s.setSelectedReportId)

  // Filter state
  const filterType = useFilterStore((s) => s.type)
  const filterSeverity = useFilterStore((s) => s.severity)
  const filterMunicipality = useFilterStore((s) => s.municipalityCode)

  // Fetch verified reports from TanStack Query cache
  const { data: reports = [] } = useQuery<Report[]>({
    queryKey: REPORTS_QUERY_KEY,
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
  }, [reports, filterType, filterSeverity, filterMunicipality])

  // Get current map bounds for supercluster
  const bounds = useMemo<BBox | null>(() => {
    if (!mapRef.current) return null
    const b = mapRef.current.getBounds()
    return [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()]
  }, [mapRef.current, mapViewport]) // recalc when viewport changes

  const zoom = mapViewport.zoom

  const { clusters } = useSupercluster({ features, bounds, zoom })

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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const props = cluster.properties as any

      if (props.cluster) {
        // Cluster marker
        const count = props.point_count
        const icon = createClusterIcon(count)
        const marker = L.marker([lat, lng], { icon })
        marker.on('click', () => {
          const expansionZoom = getClusterExpansionZoom(props)
          mapRef.current?.setView([lat, lng], Math.min(expansionZoom, mapRef.current.getZoom() + 2))
        })
        layerGroup.addLayer(marker)
      } else {
        // Individual report marker
        const isSelected = props.id === selectedMarkerId
        const icon = createReportIcon(props.severity, props.type, isSelected)
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
  }, [clusters, selectedMarkerId, mapReady, mapRef, setSelectedMarkerId, setSelectedReportId, setActivePanel])

  return null // Pure side-effect component
}
