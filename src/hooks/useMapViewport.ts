import { create } from 'zustand'

export interface MapViewport {
  center: [number, number]  // [lat, lng]
  zoom: number
}

interface MapViewportState {
  mapViewport: MapViewport
  selectedMarkerId: string | null
  setViewport: (viewport: MapViewport) => void
  setSelectedMarkerId: (id: string | null) => void
}

const DEFAULT_VIEWPORT: MapViewport = {
  center: [14.15, 122.9],  // Camarines Norte center
  zoom: 10,
}

export const useMapViewportStore = create<MapViewportState>((set) => ({
  mapViewport: DEFAULT_VIEWPORT,
  selectedMarkerId: null,
  setViewport: (mapViewport) => set({ mapViewport }),
  setSelectedMarkerId: (selectedMarkerId) => set({ selectedMarkerId }),
}))
