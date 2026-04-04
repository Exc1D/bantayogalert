import { createContext, useContext, useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { MunicipalityBoundaries } from '@/components/map/MunicipalityBoundaries'
import { ReportMarkers } from '@/components/map/ReportMarkers'

interface MapContextValue {
  mapRef: React.RefObject<L.Map | null>
  mapReady: boolean
}

const MapRefContext = createContext<MapContextValue>({ mapRef: { current: null }, mapReady: false })

export function useMap() {
  return useContext(MapRefContext)
}

interface MapContainerWrapperProps {
  className?: string
  children?: React.ReactNode
}

export function MapContainerWrapper({ className = '', children }: MapContainerWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const [mapReady, setMapReady] = useState(false)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    const map = L.map(containerRef.current, {
      zoomControl: false,
      attributionControl: true,
    })
    map.setView([14.15, 122.9], 10)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map)
    L.control.zoom({ position: 'topright' }).addTo(map)
    mapRef.current = map
    setMapReady(true)
    return () => {
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [])

  return (
    <MapRefContext.Provider value={{ mapRef, mapReady }}>
      <div ref={containerRef} className={`h-full w-full ${className}`} />
      <MunicipalityBoundaries />
      <ReportMarkers />
      {children}
    </MapRefContext.Provider>
  )
}
