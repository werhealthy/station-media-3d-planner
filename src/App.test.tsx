import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'
vi.mock('./components/viewer/Canvas', () => ({ Canvas: () => null }))
describe('App', () => {
  it('mostra il planner single-view e i 10 media point', () => {
    render(<App />)
    expect(screen.getByText('Station Media 3D Planner')).toBeInTheDocument()
    expect(screen.getByText('10 media point')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Pump Topper 1/ }),
    ).toBeInTheDocument()
  })
  it('cambia stazione e nasconde l’inventario procedurale', async () => {
    render(<App />)
    await userEvent.selectOptions(
      screen.getByRole('combobox', { name: 'Stazione' }),
      'random-textured',
    )
    expect(
      screen.getByText(
        'Questa stazione non è ancora configurata con media point.',
      ),
    ).toBeInTheDocument()
    expect(screen.queryByText('10 media point')).not.toBeInTheDocument()
    const setupButton = screen.getByRole('button', { name: 'Configura stazione' })
    expect(setupButton).toBeVisible()
    await userEvent.click(setupButton)
    expect(screen.getByRole('heading', { name: 'STATION SETUP' })).toBeVisible()
    expect(screen.getAllByText('Stazione casuale con texture')).toHaveLength(2)
    await userEvent.click(screen.getByRole('button', { name: 'Inspect Mesh' }))
    expect(screen.getByRole('button', { name: 'Inspect Mesh' })).toHaveClass('bg-amber-400')
    await userEvent.click(screen.getByRole('button', { name: 'Save current view as Overview' }))
    await userEvent.click(screen.getByRole('button', { name: 'Esci da Setup' }))
    expect(screen.queryByRole('heading', { name: 'STATION SETUP' })).not.toBeInTheDocument()
  })
})
