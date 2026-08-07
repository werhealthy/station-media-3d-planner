import {
  parseStationConfig,
  serializeStationConfig,
  type StationConfig,
} from '@/domain/stationConfig'

export const stationConfigStorageKey = (stationId: string) =>
  `station-config:${stationId}`

export function persistStationConfig(
  storage: Pick<Storage, 'setItem'>,
  config: StationConfig,
): void {
  storage.setItem(
    stationConfigStorageKey(config.stationId),
    serializeStationConfig(config),
  )
}

export function restoreStationConfig(
  storage: Pick<Storage, 'getItem'>,
  stationId: string,
): StationConfig | null {
  const serialized = storage.getItem(stationConfigStorageKey(stationId))
  return serialized ? parseStationConfig(JSON.parse(serialized)) : null
}
