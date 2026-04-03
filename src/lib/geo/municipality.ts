export interface Municipality {
  code: string
  name: string
  center: { lat: number; lng: number }
}

export const MUNICIPALITIES: Municipality[] = [
  { code: 'bas', name: 'Basud', center: { lat: 14.30, lng: 122.87 } },
  { code: 'cap', name: 'Capalonga', center: { lat: 14.31, lng: 122.80 } },
  { code: 'dae', name: 'Daet', center: { lat: 14.30, lng: 122.94 } },
  { code: 'ind', name: 'Indan', center: { lat: 14.20, lng: 122.88 } },
  { code: 'jpa', name: 'Jose Panganiban', center: { lat: 14.33, lng: 122.70 } },
  { code: 'lab', name: 'Labo', center: { lat: 14.16, lng: 122.86 } },
  { code: 'mer', name: 'Mercedes', center: { lat: 14.26, lng: 122.97 } },
  { code: 'par', name: 'Paracale', center: { lat: 14.25, lng: 122.80 } },
  { code: 'slr', name: 'San Lorenzo Ruiz', center: { lat: 14.21, lng: 122.75 } },
  { code: 'svi', name: 'San Vicente', center: { lat: 14.28, lng: 123.00 } },
  { code: 'sel', name: 'Sta. Elena', center: { lat: 14.18, lng: 122.73 } },
  { code: 'vin', name: 'Vinzons', center: { lat: 14.23, lng: 122.91 } },
]

export function getMunicipality(code: string): Municipality | undefined {
  return MUNICIPALITIES.find(m => m.code === code)
}

export async function loadMunicipalitiesGeoJSON(): Promise<unknown> {
  const res = await fetch('/data/municipalities.geojson')
  if (!res.ok) throw new Error(`Failed to load municipalities GeoJSON: ${res.status}`)
  return res.json()
}
