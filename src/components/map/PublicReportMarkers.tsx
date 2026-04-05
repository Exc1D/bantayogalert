import { useEffect, useMemo, useRef } from 'react'
import L from 'leaflet'
import { useMap } from '@/app/shell/MapContainerWrapper'
import { useMapViewportStore } from '@/hooks/useMapViewport'
import { useSupercluster } from '@/hooks/useSupercluster'
import { reportToGeoJSON } from '@/lib/geo/reportToGeoJSON'
import { createClusterIcon, createReportIcon } from './MapClusterIcon'
import type { Feature, Point, BBox } from 'geojson'
import type { Report } from '@/types/report'

function getClusterExpansionZoom(cluster: Record<string, unknown>): number {
  return typeof cluster.expansion_zoom === 'number'
    ? cluster.expansion_zoom
    : 12
}

interface PublicReportMarkersProps {
  reports: Report[]
}

export function PublicReportMarkers({ reports }: PublicReportMarkersProps) {
  const { mapRef, mapReady } = useMap()
  const layerGroupRef = useRef<L.LayerGroup | null>(null)
  const { mapViewport, setViewport } = useMapViewportStore()

  const features = useMemo<Feature<Point>[]>(
    () => reports.map(reportToGeoJSON).filter((f): f is Feature<Point> => f !== null),
    [reports]
  )

  const bounds: BBox | null = (() => {
    if (!mapRef.current) {
      return null
    }

    const currentBounds = mapRef.current.getBounds()
    return [
      currentBounds.getWest(),
      currentBounds.getSouth(),
      currentBounds.getEast(),
      currentBounds.getNorth(),
    ]
  })()

  const { clusters } = useSupercluster({
    features,
    bounds,
    zoom: mapViewport.zoom,
  })

  useEffect(() => {
    if (!mapRef.current || !mapReady) {
      return
    }

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
  }, [mapReady, mapRef, setViewport])

  useEffect(() => {
    if (!mapReady || !mapRef.current) {
      return
    }

    if (!layerGroupRef.current) {
      layerGroupRef.current = L.layerGroup().addTo(mapRef.current)
    }

    const layerGroup = layerGroupRef.current
    layerGroup.clearLayers()

    clusters.forEach((cluster) => {
      const [lng, lat] = cluster.geometry.coordinates as [number, number]
      const properties = cluster.properties as Record<string, unknown>

      if (properties.cluster) {
        const marker = L.marker([lat, lng], {
          icon: createClusterIcon((properties.point_count as number) ?? 0),
        })

        marker.on('click', () => {
          const expansionZoom = getClusterExpansionZoom(properties)
          mapRef.current?.setView(
            [lat, lng],
            Math.min(expansionZoom, mapRef.current.getZoom() + 2)
          )
        })

        layerGroup.addLayer(marker)
        return
      }

      const marker = L.marker([lat, lng], {
        icon: createReportIcon(
          properties.severity as Report['severity'],
          properties.type as Report['type']
        ),
      })

      marker.bindPopup(
        `<div style="min-width: 180px">
          <strong style="display:block;text-transform:capitalize">${String(
            properties.type ?? 'incident'
          ).replace('_', ' ')}</strong>
          <span style="display:block;margin-top:4px;text-transform:capitalize">${String(
            properties.severity ?? 'unknown'
          )}</span>
          <span style="display:block;margin-top:4px;color:#475569">${new Date(
            String(properties.createdAt ?? Date.now())
          ).toLocaleString()}</span>
        </div>`
      )

      layerGroup.addLayer(marker)
    })

    return () => {
      layerGroup.clearLayers()
    }
  }, [clusters, mapReady, mapRef])

  return null
}
