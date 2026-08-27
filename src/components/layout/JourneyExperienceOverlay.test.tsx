import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import {
  getJourney,
  journeyDuration,
  journeyElapsedAfterStep,
} from '@/domain/journeys'
import { usePlaybackStore } from '@/stores/playbackStore'
import { useViewerStore } from '@/stores/viewerStore'
import { JourneyExperienceOverlay } from './JourneyExperienceOverlay'

describe('JourneyExperienceOverlay', () => {
  beforeEach(() => {
    useViewerStore.setState({ navigationMode: 'auto' })
    usePlaybackStore.setState({
      activeRouteId: 'self-service',
      isPlaying: false,
      progress: 0,
      activeStepIndex: 5,
      pendingDecision: 'service-mode',
      serviceChoice: null,
      paymentChoice: null,
    })
  })

  it('asks how to pay only after the served refuel has finished', async () => {
    render(<JourneyExperienceOverlay />)

    await userEvent.click(screen.getByRole('button', { name: /Con gestore/ }))

    expect(usePlaybackStore.getState()).toMatchObject({
      activeRouteId: 'servito',
      pendingDecision: null,
      serviceChoice: 'servito',
      paymentChoice: null,
      isPlaying: true,
    })
    expect(
      screen.queryByText(/Il rifornimento è terminato/),
    ).not.toBeInTheDocument()

    const served = getJourney('servito')
    const decisionIndex = served.steps.findIndex(
      (step) => step.id === 'served-payment-choice',
    )
    act(() =>
      usePlaybackStore.setState({
        activeStepIndex: decisionIndex,
        pendingDecision: null,
      }),
    )

    expect(
      await screen.findByText('Il rifornimento è terminato. Come vuoi pagare?'),
    ).toBeVisible()

    await userEvent.click(screen.getByRole('button', { name: /In Svolta/ }))
    expect(usePlaybackStore.getState()).toMatchObject({
      activeRouteId: 'servito-svolta',
      paymentChoice: 'svolta',
      isPlaying: true,
    })
    expect(
      usePlaybackStore.getState().progress *
        journeyDuration(getJourney('servito-svolta')),
    ).toBeCloseTo(
      journeyElapsedAfterStep(
        getJourney('servito-svolta'),
        'served-payment-choice',
      ),
      5,
    )
    expect(
      getJourney('servito-svolta').steps[
        usePlaybackStore.getState().activeStepIndex
      ]?.id,
    ).toBe('svolta-exit')
  })
})
