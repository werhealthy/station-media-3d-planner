import { describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import App from './App'

// jsdom non supporta WebGL: il Canvas 3D reale viene verificato tramite
// Playwright (Chromium reale) in e2e/. Qui si testa solo la UI attorno.
vi.mock('./components/viewer/Canvas', () => ({
  Canvas: () => null,
}))

describe('App', () => {
  it('renders the top bar with the default project name', () => {
    render(<App />)
    expect(screen.getByText('Nuovo progetto')).toBeInTheDocument()
  })

  it('renders the three view mode switches', () => {
    render(<App />)
    const viewModeNav = within(
      screen.getByRole('navigation', { name: "Modalita' di visualizzazione" }),
    )
    expect(
      viewModeNav.getByRole('button', { name: 'Overview' }),
    ).toBeInTheDocument()
    expect(
      viewModeNav.getByRole('button', { name: 'Hotspot' }),
    ).toBeInTheDocument()
    expect(
      viewModeNav.getByRole('button', { name: 'Walkthrough' }),
    ).toBeInTheDocument()
  })
})
