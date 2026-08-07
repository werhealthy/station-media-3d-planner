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
    position: [2, 3.2, 17],
    target: [1, 2.2, 0],
    fov: 43,
    associatedMediaPointId: 'mp-01',
  },
  {
    id: 'shop-side',
    name: 'Lato shop',
    position: [28, 4.2, 4],
    target: [13, 2.4, -8],
    fov: 44,
    associatedMediaPointId: 'mp-06',
  },
  {
    id: 'totem',
    name: 'Totem Q8',
    position: [-28, 3.5, -1],
    target: [-22, 3.8, -10],
    fov: 40,
    associatedMediaPointId: 'mp-07',
  },
  {
    id: 'forecourt',
    name: 'Centro piazzale',
    position: [-2, 5, 11],
    target: [4, 2.2, -5],
    fov: 48,
  },
]
