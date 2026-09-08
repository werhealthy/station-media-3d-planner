import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'
import { useStationSetupStore } from './stores/stationSetupStore'
import { useStationStore } from './stores/stationStore'
vi.mock('./components/viewer/Canvas', () => ({ Canvas: () => null }))
describe('App', () => {
  beforeEach(() => useStationStore.getState().selectStation('low-poly'))
  afterEach(() => {
    vi.unstubAllGlobals()
    useStationStore.getState().selectStation('low-poly')
  })

  it('mostra il planner single-view e i 10 supporti Q8', () => {
    render(<App />)
    expect(screen.getByText('Station Media 3D Planner')).toBeInTheDocument()
    expect(screen.getByText('9 supporti caricabili')).toBeInTheDocument()
    expect(
      screen.getByRole('button', {
        name: /Sovrapompa \/ Cappuccio.*ID 1/,
      }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Giorno' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(
      screen.getByRole('button', { name: 'Vista esterna' }),
    ).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('combobox', { name: 'Stazione' })).toHaveValue(
      'low-poly',
    )
    expect(
      screen.getByRole('option', { name: 'Q8 Roma EUR — In arrivo' }),
    ).toBeDisabled()
    expect(
      screen.getByRole('option', { name: 'Q8 Torino Nord — In arrivo' }),
    ).toBeDisabled()
  })

  it('consente di passare dalla scena giorno alla scena notte', async () => {
    render(<App />)
    await userEvent.click(screen.getByRole('button', { name: 'Notte' }))
    expect(screen.getByRole('button', { name: 'Notte' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
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
