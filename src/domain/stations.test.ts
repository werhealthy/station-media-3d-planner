import { describe, expect, it } from 'vitest'
import { getStation, STATIONS, stationIdFromQuery } from './stations'

describe('station registry', () => {
  it('espone la demo e le stazioni annunciate come non disponibili', () => {
    expect(STATIONS.map(({ id }) => id)).toEqual([
      'low-poly',
      'random-textured',
      'q8-torino-nord',
      'q8-bologna-fiera',
    ])
    expect(getStation('low-poly')).toMatchObject({
      name: 'Q8 Milano Stazione X',
      available: true,
    })
    expect(getStation('random-textured')).toMatchObject({
      name: 'Q8 Roma EUR',
      available: false,
      modelType: 'fbx',
      modelPath: '/models/q8-station/4002336.FBX',
      textureBasePath: '/models/q8-station/Maps/',
      mediaPointsConfigured: false,
    })
    expect(STATIONS.filter((station) => !station.available)).toHaveLength(3)
  })

  it('supporta il query parameter solo come override', () => {
    expect(stationIdFromQuery('?stationModel=external')).toBe('random-textured')
    expect(stationIdFromQuery('')).toBe('low-poly')
  })
})
