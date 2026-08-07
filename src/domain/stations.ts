export type StationModelType = 'procedural' | 'fbx'

export interface StationDefinition {
  id: string
  name: string
  description: string
  modelType: StationModelType
  modelPath?: string
  textureBasePath?: string
  badge?: string
  /** Future station-config.json sections can replace these capability flags. */
  mediaPointsConfigured: boolean
}

export const STATIONS = [
  {
    id: 'low-poly',
    name: 'Stazione low poly',
    description: 'Demo procedurale configurata con media point.',
    modelType: 'procedural',
    badge: 'Demo',
    mediaPointsConfigured: true,
  },
  {
    id: 'random-textured',
    name: 'Stazione casuale con texture',
    description: 'Modello FBX esterno con texture dedicate.',
    modelType: 'fbx',
    modelPath: '/models/q8-station/4002336.FBX',
    textureBasePath: '/models/q8-station/Maps/',
    badge: 'FBX',
    mediaPointsConfigured: false,
  },
] as const satisfies readonly StationDefinition[]

export type StationId = (typeof STATIONS)[number]['id']

export function getStation(id: string): StationDefinition {
  return STATIONS.find((station) => station.id === id) ?? STATIONS[0]
}

export function stationIdFromQuery(search: string): StationId {
  const override = new URLSearchParams(search).get('stationModel')
  if (override === 'external' || override === 'random-textured')
    return 'random-textured'
  if (override === 'procedural' || override === 'low-poly') return 'low-poly'
  return 'low-poly'
}
