/**
 * LocationPickerMap - Dedicated Leaflet map with draggable marker for location picking
 * D-80, D-81
 */
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Leaflet default icon fix (required for bundlers)
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

interface LocationPickerMapProps {
  initialLat?: number
  initialLng?: number
  onLocationChange: (lat: number, lng: number) => void
}

// DraggableMarker must be inside MapContainer to use useMapEvents
function DraggableMarker({
  markerRef,
  position,
  onDragEnd,
}: {
  markerRef: React.MutableRefObject<L.Marker | null>
  position: [number, number]
  onDragEnd: (lat: number, lng: number) => void
}) {
  // useMapEvents is required inside MapContainer for marker to work properly
  useMapEvents({})

  useEffect(() => {
    if (markerRef.current) {
      markerRef.current.setLatLng(position)
    }
  }, [position, markerRef])

  return (
    <Marker
      draggable={true}
      position={position}
      ref={markerRef}
      eventHandlers={{
        dragend: (e) => {
          const marker = e.target as L.Marker
          const latlng = marker.getLatLng()
          onDragEnd(latlng.lat, latlng.lng)
        },
      }}
    />
  )
}

export function LocationPickerMap({
  initialLat = 14.15,
  initialLng = 122.9,
  onLocationChange,
}: LocationPickerMapProps) {
  const [mounted, setMounted] = useState(false)
  const markerRef = useRef<L.Marker | null>(null)
  const [position, setPosition] = useState<[number, number]>([initialLat, initialLng])

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <MapContainer
      center={[initialLat, initialLng]}
      zoom={12}
      style={{ height: 300, width: '100%' }}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <DraggableMarker
        markerRef={markerRef}
        position={position}
        onDragEnd={(lat, lng) => {
          setPosition([lat, lng])
          onLocationChange(lat, lng)
        }}
      />
    </MapContainer>
  )
}

export default LocationPickerMap
