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
    id: 'self-terminal-closeup',
    name: 'Accettatore self',
    position: [-9, 2.35, 5.1],
    target: [-9, 1.38, 0.3],
    fov: 39,
    associatedMediaPointId: 'mp-05',
  },
]
