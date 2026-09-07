export interface StationHotspot {
  id: string
  name: string
  position: [number, number, number]
  target: [number, number, number]
  fov: number
  associatedMediaPointId?: string
}

export const HOTSPOTS: StationHotspot[] = [
  {
    id: 'station-overview',
    name: 'Vista esterna',
    position: [30, 16, 31],
    target: [0, 2.2, -2],
    fov: 43,
  },
  {
    id: 'pump-front',
    name: 'Fronte pompe',
    position: [1.5, 3.1, 14.2],
    target: [0, 2.05, 1.1],
    fov: 43,
    associatedMediaPointId: 'mp-01',
  },
  {
    id: 'station-aerial',
    name: 'Vista dall\u2019alto',
    position: [4, 31, 18],
    target: [0, 0, -1],
    fov: 48,
  },
]
