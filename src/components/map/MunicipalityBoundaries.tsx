import { useEffect, useRef } from 'react'
import L from 'leaflet'
import { useMap } from '@/app/shell/MapContainerWrapper'
import { loadMunicipalitiesGeoJSON } from '@/lib/geo/municipality'

export function MunicipalityBoundaries() {
  const { mapRef, mapReady } = useMap()
  const layerRef = useRef<L.GeoJSON | null>(null)

  useEffect(() => {
    if (!mapReady || !mapRef.current) return

    let mounted = true
    loadMunicipalitiesGeoJSON()
      .then((data) => {
        if (!mounted || !mapRef.current) return
        // Remove existing layer if any (handles hot reload)
        layerRef.current?.remove()
        layerRef.current = L.geoJSON(data, {
          style: {
            fillColor: '#6b7280',
            fillOpacity: 0.05,
            color: '#6b7280',
            weight: 1.5,
          },
          interactive: false, // D-120: non-interactive
        })
        layerRef.current.addTo(mapRef.current)
      })
      .catch((err) => {
        console.error('Failed to load municipality boundaries:', err)
      })

    return () => {
      mounted = false
      layerRef.current?.remove()
      layerRef.current = null
    }
  }, [mapRef, mapReady])

  return null // Pure side-effect component
}
