import { beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { getJourney } from '@/domain/journeys'
import { useJourneyCopyStore } from '@/stores/journeyCopyStore'
import { usePlaybackStore } from '@/stores/playbackStore'
import { AutoWalkthroughPanel } from './AutoWalkthroughPanel'
import { JourneySettingsDialog } from './JourneySettingsDialog'

describe('JourneySettingsDialog', () => {
  beforeEach(() => {
    useJourneyCopyStore.setState({ editorOpen: false, overrides: {} })
    usePlaybackStore.getState().setActiveRouteId('self-service')
    usePlaybackStore.getState().setActiveStep(0, null)
  })

  it('modifica i testi mostrati nel pannello della journey', () => {
    const firstStep = getJourney('self-service').steps[0]!
    useJourneyCopyStore.getState().openEditor()
    render(
      <>
        <JourneySettingsDialog />
        <AutoWalkthroughPanel />
      </>,
    )

    fireEvent.change(screen.getAllByLabelText('Titolo')[0]!, {
      target: { value: 'Ingresso · Titolo personalizzato' },
    })
    fireEvent.change(screen.getAllByLabelText('Testo di supporto')[0]!, {
      target: { value: 'Descrizione personalizzata' },
    })

    expect(
      useJourneyCopyStore.getState().overrides[firstStep.id],
    ).toMatchObject({
      phase: 'Ingresso · Titolo personalizzato',
      label: 'Descrizione personalizzata',
    })
    expect(screen.getByText('Titolo personalizzato')).toBeVisible()
    expect(screen.getByText('Descrizione personalizzata')).toBeVisible()
  })
})
