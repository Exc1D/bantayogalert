import { useEffect, useRef } from 'react'
import L from 'leaflet'
import { useMap } from '@/app/shell/MapContainerWrapper'
import { getMunicipality } from '@/lib/geo/municipality'
import { useUIStore } from '@/stores/uiStore'

function getBarangayOffset(barangayCode: string): [number, number] {
  const hash = [...barangayCode].reduce(
    (total, char, index) => total + char.charCodeAt(0) * (index + 1),
    0
  )
  const latOffset = ((hash % 11) - 5) * 0.0022
  const lngOffset = ((Math.floor(hash / 11) % 11) - 5) * 0.0022
  return [latOffset, lngOffset]
}

function getColor(count: number): string {
  if (count >= 8) return '#dc2626'
  if (count >= 5) return '#f97316'
  if (count >= 3) return '#f59e0b'
  return '#facc15'
}

export function AnalyticsHeatmapOverlay() {
  const { mapRef, mapReady } = useMap()
  const analyticsHeatmapEnabled = useUIStore((state) => state.analyticsHeatmapEnabled)
  const analyticsHotspots = useUIStore((state) => state.analyticsHotspots)
  const layerGroupRef = useRef<L.LayerGroup | null>(null)

  useEffect(() => {
    if (!mapReady || !mapRef.current) {
      return
    }

    if (!layerGroupRef.current) {
      layerGroupRef.current = L.layerGroup().addTo(mapRef.current)
    }

    const layerGroup = layerGroupRef.current
    layerGroup.clearLayers()

    if (!analyticsHeatmapEnabled) {
      return
    }

    for (const hotspot of analyticsHotspots) {
      const municipality = getMunicipality(hotspot.municipalityCode)
      if (!municipality) {
        continue
      }

      const [latOffset, lngOffset] = getBarangayOffset(hotspot.barangayCode)
      const marker = L.circleMarker(
        [
          municipality.center.lat + latOffset,
          municipality.center.lng + lngOffset,
        ],
        {
          radius: Math.min(34, 10 + hotspot.count * 2),
          color: getColor(hotspot.count),
          fillColor: getColor(hotspot.count),
          fillOpacity: Math.min(0.7, 0.22 + hotspot.count * 0.07),
          opacity: 0.9,
          weight: 1,
        }
      )

      marker.bindTooltip(
        `${municipality.name} / ${hotspot.barangayCode}: ${hotspot.count} report${
          hotspot.count === 1 ? '' : 's'
        }`
      )

      layerGroup.addLayer(marker)
    }

    return () => {
      layerGroup.clearLayers()
    }
  }, [analyticsHeatmapEnabled, analyticsHotspots, mapReady, mapRef])

  useEffect(() => {
    return () => {
      layerGroupRef.current?.remove()
      layerGroupRef.current = null
    }
  }, [])

  return null
}
