import { beforeEach, describe, expect, it } from 'vitest'
import { createEmptyStationConfig, type CameraView } from '@/domain/stationConfig'
import { useStationSetupStore } from './stationSetupStore'

const view: CameraView = { position: [1, 2, 3], target: [0, 0, 0], fov: 45 }

describe('stationSetupStore', () => {
  beforeEach(() => {
    useStationSetupStore.getState().exitSetup()
    useStationSetupStore.getState().initialize(
      createEmptyStationConfig('random-textured', 'fbx', '/station.FBX'),
      'not-configured',
    )
  })

  it('enters setup and activates mesh inspection', () => {
    useStationSetupStore.getState().enterSetup()
    useStationSetupStore.getState().setTool('inspect')
    expect(useStationSetupStore.getState()).toMatchObject({ enabled: true, tool: 'inspect' })
  })

  it('keeps hidden meshes, overview and setup hotspots in config', () => {
    useStationSetupStore.getState().updateConfig((config) => ({
      ...config,
      hiddenMeshes: ['station/shell'],
      overviewCamera: view,
      hotspots: [{ ...view, id: 'front', name: 'Fronte pompe' }],
    }))
    const config = useStationSetupStore.getState().config
    expect(config.hiddenMeshes).toEqual(['station/shell'])
    expect(config.overviewCamera).toEqual(view)
    expect(config.hotspots).toHaveLength(1)
  })
})
