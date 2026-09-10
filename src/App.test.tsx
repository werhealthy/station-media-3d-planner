import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'
import { useStationSetupStore } from './stores/stationSetupStore'
import { useStationStore } from './stores/stationStore'
import { useViewerStore } from './stores/viewerStore'
vi.mock('./components/viewer/Canvas', () => ({ Canvas: () => null }))
describe('App', () => {
  beforeEach(() => {
    useStationStore.getState().selectStation('low-poly')
    useViewerStore.setState({ timeOfDay: 'day', weatherCondition: 'clear' })
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    useStationStore.getState().selectStation('low-poly')
  })

  it('mostra la media experience e i 9 supporti disponibili', () => {
    render(<App />)
    expect(screen.getByText('3D Media Experience')).toBeInTheDocument()
    expect(screen.getByText('9 supporti media disponibili')).toBeInTheDocument()
    expect(
      screen.getByText('Specifiche tecniche: last update 14 Settembre'),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', {
        name: /Sovrapompa \/ Cappuccio.*ID 1/,
      }),
    ).toBeInTheDocument()
    expect(screen.getByText('ID 2 · Linea servito')).toBeInTheDocument()
    expect(screen.getByText('ID 11 · Accettatore DSP')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Giorno' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.queryByRole('button', { name: 'Sereno' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Nuvoloso' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
    expect(screen.getByRole('button', { name: 'Pioggia' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
    expect(
      screen.getByRole('button', { name: 'Vista esterna' }),
    ).toHaveAttribute('aria-pressed', 'true')
    expect(
      screen.getByRole('button', { name: 'Ingresso e Fondostazione' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: 'Stazione' })).toHaveValue(
      'low-poly',
    )
    expect(
      screen.getByRole('option', { name: 'Q8 Milano Stazione X' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('option', { name: 'Q8 Roma EUR — In arrivo' }),
    ).toBeDisabled()
    expect(
      screen.getByRole('option', { name: 'Q8 Torino Nord — In arrivo' }),
    ).toBeDisabled()
  })

  it('rende giorno, notte e meteo quattro alternative esclusive', async () => {
    render(<App />)
    await userEvent.click(screen.getByRole('button', { name: 'Notte' }))
    expect(screen.getByRole('button', { name: 'Notte' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )

    await userEvent.click(screen.getByRole('button', { name: 'Pioggia' }))
    expect(screen.getByRole('button', { name: 'Notte' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
    expect(screen.getByRole('button', { name: 'Pioggia' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(useViewerStore.getState()).toMatchObject({
      timeOfDay: 'day',
      weatherCondition: 'rain',
    })

    await userEvent.click(screen.getByRole('button', { name: 'Giorno' }))
    expect(screen.getByRole('button', { name: 'Giorno' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByRole('button', { name: 'Pioggia' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
    expect(useViewerStore.getState()).toMatchObject({
      timeOfDay: 'day',
      weatherCondition: 'clear',
    })
  })
  it('cambia stazione e nasconde l’inventario procedurale', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response('<html>not found</html>', {
          status: 404,
          headers: { 'content-type': 'text/html' },
        }),
      ),
    )
    useStationStore.getState().selectStation('random-textured')
    render(<App />)
    expect(
      screen.getByText(
        'Questa stazione non è ancora configurata con media point.',
      ),
    ).toBeInTheDocument()
    expect(screen.queryByText('10 supporti')).not.toBeInTheDocument()
    const setupButton = screen.getByRole('button', {
      name: 'Configura stazione',
    })
    expect(setupButton).toBeVisible()
    await userEvent.click(setupButton)
    expect(
      screen.getByRole('heading', { name: 'Configura stazione' }),
    ).toBeVisible()
    expect(
      await screen.findByText(/Questa stazione non è ancora configurata/),
    ).toBeVisible()
    expect(useStationSetupStore.getState().configStatus).toBe('not-configured')
    expect(
      screen.queryByText('Impossibile caricare la configurazione.'),
    ).not.toBeInTheDocument()
    expect(screen.getByText('Q8 Roma EUR')).toBeVisible()
    await userEvent.click(
      screen.getByRole('button', { name: 'Seleziona elemento da nascondere' }),
    )
    expect(
      screen.getByRole('button', { name: 'Seleziona nella scena…' }),
    ).toBeVisible()
    expect(screen.queryByText('groundY')).not.toBeInTheDocument()
    expect(screen.queryByText('JSON')).not.toBeInTheDocument()
    await userEvent.click(
      screen.getByRole('button', { name: 'Chiudi configurazione' }),
    )
    expect(
      screen.queryByRole('heading', { name: 'Configura stazione' }),
    ).not.toBeInTheDocument()
  })
})
