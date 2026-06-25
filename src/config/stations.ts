export interface MetroStation {
  id: string
  name: string
  lat: number
  lng: number
  radius: number // Radius in meters
}

export const METRO_STATIONS: MetroStation[] = [
  { id: 'station_tajrish', name: 'ایستگاه تجریش', lat: 35.8052, lng: 51.4316, radius: 150 },
  { id: 'station_ghods', name: 'ایستگاه شهدای هفتم تیر', lat: 35.7175, lng: 51.4244, radius: 150 },
  { id: 'station_darvazeh_dolat', name: 'ایستگاه دروازه دولت', lat: 35.7014, lng: 51.4215, radius: 150 },
  { id: 'station_emam_khomeini', name: 'ایستگاه امام خمینی', lat: 35.6908, lng: 51.4208, radius: 150 },
  { id: 'station_shahr_e_rey', name: 'ایستگاه شهر ری', lat: 35.5925, lng: 51.4358, radius: 150 },
  { id: 'station_kahrizak', name: 'ایستگاه کهریزک', lat: 35.5235, lng: 51.3592, radius: 200 },
  { id: 'depot_kahrizak', name: 'دپوی کهریزک', lat: 35.5180, lng: 51.3650, radius: 300 },
]

/**
 * Calculates the distance between two points in meters using the Haversine formula
 */
export function getDistanceInMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3 // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180
  const phi2 = (lat2 * Math.PI) / 180
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c
}
