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
    name: 'Fronte erogatori',
    position: [1.5, 3.1, 14.2],
    target: [0, 2.05, 1.1],
    fov: 43,
    associatedMediaPointId: 'mp-01',
  },
  {
    id: 'entrance-forecourt',
    name: 'Ingresso e Fondostazione',
    position: [19.4, 3.2, 9.2],
    target: [-2.7, 2.25, -3],
    fov: 44,
    associatedMediaPointId: 'mp-07',
  },
]
