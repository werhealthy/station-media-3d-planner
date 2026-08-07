import { describe, expect, it } from 'vitest'
import { getStation, STATIONS, stationIdFromQuery } from './stations'

describe('station registry', () => {
  it('espone esattamente le due stazioni previste', () => {
    expect(STATIONS.map(({ id }) => id)).toEqual([
      'low-poly',
      'random-textured',
    ])
    expect(getStation('random-textured')).toMatchObject({
      modelType: 'fbx',
      modelPath: '/models/q8-station/4002336.FBX',
      textureBasePath: '/models/q8-station/Maps/',
      mediaPointsConfigured: false,
    })
  })

  it('supporta il query parameter solo come override', () => {
    expect(stationIdFromQuery('?stationModel=external')).toBe('random-textured')
    expect(stationIdFromQuery('')).toBe('low-poly')
  })
})
