import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { getJourney } from '@/domain/journeys'
import { usePlaybackStore } from '@/stores/playbackStore'
import { AutoWalkthroughPanel } from './AutoWalkthroughPanel'

describe('AutoWalkthroughPanel', () => {
  beforeEach(() => {
    usePlaybackStore.setState({
      activeRouteId: 'self-service',
      isPlaying: false,
      progress: 0,
      activeStepIndex: 0,
      pendingDecision: null,
      serviceChoice: null,
      paymentChoice: null,
    })
  })

  it('mostra subito tutti i checkpoint, inclusi quelli oltre la scelta', () => {
    const journey = getJourney('self-service')
    const checkpointCount = journey.steps.filter(
      (step) => step.checkpoint,
    ).length

    render(<AutoWalkthroughPanel />)

    expect(
      screen.getAllByRole('button', { name: /Vai a .* e metti in pausa/ }),
    ).toHaveLength(checkpointCount)
    expect(
      screen.getByRole('button', {
        name: 'Vai a Ripartenza verso l’uscita e metti in pausa',
      }),
    ).toBeVisible()
  })

  it('richiede la scelta obbligatoria prima di saltare a un checkpoint futuro', async () => {
    render(<AutoWalkthroughPanel />)

    await userEvent.click(
      screen.getByRole('button', {
        name: 'Vai a Ripartenza verso l’uscita e metti in pausa',
      }),
    )

    expect(usePlaybackStore.getState()).toMatchObject({
      pendingDecision: 'service-mode',
      isPlaying: false,
    })
    expect(
      getJourney('self-service').steps[
        usePlaybackStore.getState().activeStepIndex
      ]?.decision,
    ).toBe('service-mode')
  })
})
