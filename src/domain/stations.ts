export type StationModelType = 'procedural' | 'fbx' | 'glb'

export interface StationDefinition {
  id: string
  name: string
  description: string
  modelType: StationModelType
  modelPath?: string
  textureBasePath?: string
  configPath?: string
  badge?: string
  available: boolean
  /** Future station-config.json sections can replace these capability flags. */
  mediaPointsConfigured: boolean
}

export const STATIONS = [
  {
    id: 'low-poly',
    name: 'Q8 Milano Stazione X',
    description: 'Stazione configurata secondo il layout media Q8.',
    modelType: 'procedural',
    badge: 'Demo',
    available: true,
    mediaPointsConfigured: true,
  },
  {
    id: 'random-textured',
    name: 'Q8 Roma EUR',
    description: 'Nuovo modello di stazione in preparazione.',
    modelType: 'fbx',
    modelPath: '/models/q8-station/4002336.FBX',
    textureBasePath: '/models/q8-station/Maps/',
    configPath: '/models/q8-station/station-config.json',
    badge: 'In arrivo',
    available: false,
    mediaPointsConfigured: false,
  },
  {
    id: 'q8-torino-nord',
    name: 'Q8 Torino Nord',
    description: 'Nuovo modello di stazione in preparazione.',
    modelType: 'procedural',
    badge: 'In arrivo',
    available: false,
    mediaPointsConfigured: false,
  },
  {
    id: 'q8-bologna-fiera',
    name: 'Q8 Bologna Fiera',
    description: 'Nuovo modello di stazione in preparazione.',
    modelType: 'procedural',
    badge: 'In arrivo',
    available: false,
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
