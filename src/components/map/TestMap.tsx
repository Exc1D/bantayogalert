import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet'
import { useEffect, useState } from 'react'
import { loadMunicipalitiesGeoJSON } from '@/lib/geo/municipality'

export function TestMap() {
  const [geojson, setGeojson] = useState<GeoJSON.GeoJSON | null>(null)

  useEffect(() => {
    loadMunicipalitiesGeoJSON().then(data => setGeojson(data as unknown as GeoJSON.GeoJSON))
  }, [])

  return (
    <MapContainer center={[14.15, 122.9]} zoom={10} style={{ height: 400, width: '100%' }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {geojson && <GeoJSON data={geojson} />}
    </MapContainer>
  )
}
