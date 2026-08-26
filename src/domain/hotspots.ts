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
    id: 'road-entry',
    name: 'Ingresso strada',
    position: [-28, 4.8, 21],
    target: [0, 2.5, -2],
    fov: 46,
    associatedMediaPointId: 'mp-09',
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
    id: 'inside-svolta',
    name: 'Da Svolta',
    position: [9.5, 1.7, -6.1],
    target: [0.5, 1.85, 1.8],
    fov: 52,
    associatedMediaPointId: 'mp-04',
  },
]
