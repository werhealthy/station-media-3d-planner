import { describe, expect, it } from 'vitest'
import {
  createEmptyStationConfig,
  parseStationConfig,
  serializeStationConfig,
} from './stationConfig'

describe('stationConfig', () => {
  it('creates a valid uncalibrated external station without invented content', () => {
    const config = createEmptyStationConfig('random-textured', 'fbx', '/station.fbx')
    expect(config.hotspots).toEqual([])
    expect(config.mediaPoints).toEqual([])
    expect(config.walkPath).toEqual([])
    expect(config.ground).toBeUndefined()
  })

  it('validates ground data in metres', () => {
    const config = parseStationConfig({
      version: 1,
      stationId: 'test',
      modelType: 'glb',
      ground: { y: 1.25, meshName: 'floor', normal: [0, 1, 0] },
    })
    expect(config.ground).toEqual({ y: 1.25, meshName: 'floor', normal: [0, 1, 0] })
  })

  it('rejects invalid and duplicate application data', () => {
    expect(() => parseStationConfig({ version: 2, stationId: 'x', modelType: 'fbx' })).toThrow()
    expect(() => parseStationConfig({
      version: 1,
      stationId: 'x',
      modelType: 'fbx',
      hotspots: [
        { id: 'same', name: 'A', position: [0, 2, 0], target: [0, 0, 0], fov: 40 },
        { id: 'same', name: 'B', position: [1, 2, 0], target: [0, 0, 0], fov: 40 },
      ],
    })).toThrow(/duplicato/)
  })

  it('serializes and deserializes without losing calibration data', () => {
    const original = parseStationConfig({
      version: 1,
      stationId: 'test',
      modelType: 'fbx',
      hiddenMeshes: ['root/dome[2]'],
      ground: { y: 0.4, meshPath: 'root/floor[1]' },
      overviewCamera: { position: [1, 2, 3], target: [0, 1, 0], fov: 50 },
    })
    expect(parseStationConfig(JSON.parse(serializeStationConfig(original)))).toEqual(original)
  })
})
