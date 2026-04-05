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
        layerRef.current?.remove()

        layerRef.current = L.geoJSON(data, {
          style: () => ({
            fillColor: 'transparent',
            fillOpacity: 0,
            color: '#2563EB',
            opacity: 0.4,
            weight: 2,
            dashArray: '8 4',
          }),
          interactive: true,
          onEachFeature: (_feature: unknown, layer: L.Layer) => {
            const pathLayer = layer as any

            pathLayer.on({
              mouseover: (e: any) => {
                const lyr = e.target
                lyr.bringToFront()
                lyr.setStyle({
                  color: '#2563EB',
                  weight: 2,
                  fillOpacity: 0.1,
                  fillColor: '#2563EB',
                })
                const name = lyr.feature?.properties?.name ?? ''
                lyr.bindTooltip(name, { sticky: true })
              },
              mouseout: (e: any) => {
                layerRef.current?.resetStyle(e.target)
                e.target.unbindTooltip()
              },
            })
          },
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

  return null
}
