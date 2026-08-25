import { beforeEach, describe, expect, it } from 'vitest'
import { useViewerStore } from './viewerStore'

describe('viewerStore', () => {
  beforeEach(() => {
    useViewerStore.setState({
      navigationMode: 'overview',
      activeHotspotId: null,
      selectedMediaPointId: null,
      overviewUnlocked: false,
      eyeHeight: 1.7,
    })
  })

  it('focuses a selected support from every navigation mode', () => {
    useViewerStore.setState({
      navigationMode: 'hotspot',
      activeHotspotId: 'payment-terminal',
    })

    useViewerStore.getState().selectMediaPoint('mp-05')

    expect(useViewerStore.getState()).toMatchObject({
      navigationMode: 'overview',
      activeHotspotId: null,
      selectedMediaPointId: 'mp-05',
      overviewUnlocked: false,
    })
  })

  it('clamps the selectable human height to realistic limits', () => {
    useViewerStore.getState().setEyeHeight(1.2)
    expect(useViewerStore.getState().eyeHeight).toBe(1.45)

    useViewerStore.getState().setEyeHeight(2.2)
    expect(useViewerStore.getState().eyeHeight).toBe(2)
  })
})
