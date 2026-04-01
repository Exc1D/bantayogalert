import { createContext, useContext, useState, ReactNode } from 'react'

interface Viewport {
  lat: number
  lng: number
  zoom: number
}

interface MapContextValue {
  viewport: Viewport
  setViewport: (v: Viewport) => void
  selectedPinId: string | null
  setSelectedPinId: (id: string | null) => void
}

const defaultViewport: Viewport = {
  lat: 14.1, // Camarines Norte center
  lng: 122.9,
  zoom: 10,
}

const MapContext = createContext<MapContextValue | null>(null)

export function MapProvider({ children }: { children: ReactNode }) {
  const [viewport, setViewport] = useState<Viewport>(defaultViewport)
  const [selectedPinId, setSelectedPinId] = useState<string | null>(null)

  return (
    <MapContext.Provider value={{ viewport, setViewport, selectedPinId, setSelectedPinId }}>
      {children}
    </MapContext.Provider>
  )
}

export function useMap(): MapContextValue {
  const ctx = useContext(MapContext)
  if (!ctx) throw new Error('useMap must be used within MapProvider')
  return ctx
}
