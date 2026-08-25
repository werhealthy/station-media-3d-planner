import { beforeEach, describe, expect, it } from 'vitest'
import {
  eyeHeightFromPersonHeight,
  MAX_PERSON_HEIGHT,
  MIN_PERSON_HEIGHT,
  useViewerStore,
} from './viewerStore'

describe('viewerStore', () => {
  beforeEach(() => {
    useViewerStore.setState({
      navigationMode: 'overview',
      activeHotspotId: null,
      selectedMediaPointId: null,
      overviewUnlocked: false,
      personHeight: 1.8,
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
    useViewerStore.getState().setPersonHeight(1.2)
    expect(useViewerStore.getState().personHeight).toBe(MIN_PERSON_HEIGHT)

    useViewerStore.getState().setPersonHeight(2.2)
    expect(useViewerStore.getState().personHeight).toBe(MAX_PERSON_HEIGHT)
  })

  it('places the camera at eye level rather than at the top of the head', () => {
    expect(eyeHeightFromPersonHeight(1.8)).toBeCloseTo(1.69)
  })
})
