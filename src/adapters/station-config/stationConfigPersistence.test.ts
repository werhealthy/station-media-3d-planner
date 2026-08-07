import { describe, expect, it } from 'vitest'
import { createEmptyStationConfig } from '@/domain/stationConfig'
import {
  persistStationConfig,
  restoreStationConfig,
  stationConfigStorageKey,
} from './stationConfigPersistence'

describe('station configuration browser persistence', () => {
  it('serializes every editable section under a station-specific key', () => {
    const storage = new Map<string, string>()
    const api = {
      setItem: (key: string, value: string) => storage.set(key, value),
      getItem: (key: string) => storage.get(key) ?? null,
    }
    const config = {
      ...createEmptyStationConfig('random-textured', 'fbx', '/station.FBX'),
      hiddenMeshes: ['scene/sky'],
      ground: { y: 0 },
      transform: {
        scale: [1, 1, 1] as [number, number, number],
        position: [2, 0, 0] as [number, number, number],
        rotation: [0, 1, 0] as [number, number, number],
      },
      walkPath: [
        { id: 'walk-1', position: [0, 0, 0] as [number, number, number] },
      ],
    }

    persistStationConfig(api, config)

    expect(storage.has(stationConfigStorageKey('random-textured'))).toBe(true)
    expect(restoreStationConfig(api, 'random-textured')).toEqual(config)
  })

  it('returns null when the station has no local configuration', () => {
    expect(restoreStationConfig({ getItem: () => null }, 'missing')).toBeNull()
  })
})
