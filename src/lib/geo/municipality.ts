import type { Municipality } from '@/types'

export const MUNICIPALITIES: Municipality[] = [
  { code: 'bas', name: 'Basud',          center: { lat: 14.0522, lng: 122.8764 } },
  { code: 'bat', name: 'Batobal',        center: { lat: 14.1139, lng: 122.7533 } },
  { code: 'cams', name: 'Camaligan',     center: { lat: 13.9711, lng: 122.9636 } },
  { code: 'cap', name: 'Capalonga',      center: { lat: 14.2917, lng: 122.4853 } },
  { code: 'daet', name: 'Daet',          center: { lat: 14.1022, lng: 122.9136 } },
  { code: 'jmo', name: 'Jose Panganiban', center: { lat: 14.2972, lng: 122.6828 } },
  { code: 'labo', name: 'Labo',          center: { lat: 14.1822, lng: 122.8250 } },
  { code: 'mer', name: 'Mercedes',       center: { lat: 14.0878, lng: 123.0083 } },
  { code: 'san', name: 'San Lorenzo Ruiz', center: { lat: 14.1556, lng: 122.7833 } },
  { code: 'sip', name: 'Sipocot',        center: { lat: 13.9481, lng: 122.9908 } },
  { code: 'sta', name: 'Sta Elena',      center: { lat: 14.0450, lng: 122.7933 } },
  { code: 'vin', name: 'Vinzons',        center: { lat: 14.1822, lng: 122.8667 } },
]

export function getMunicipality(code: string): Municipality | undefined {
  return MUNICIPALITIES.find((m) => m.code === code)
}

export async function loadMunicipalitiesGeoJSON(): Promise<GeoJSON.FeatureCollection> {
  const res = await fetch('/data/municipalities.geojson')
  if (!res.ok) throw new Error(`Failed to load municipalities GeoJSON: ${res.status}`)
  return res.json() as GeoJSON.FeatureCollection
}
