import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { MediaAsset } from '@/domain/schemas/media'
import {
  PUMP_LEADER_OPTIMIZED_ASSET_ID,
  PUMP_LEADER_OPTIMIZED_URL,
  PumpLeaderAiReview,
} from './PumpLeaderAiReview'

const uploadedAsset: MediaAsset = {
  id: 'uploaded-pump-leader',
  name: 'pump-leader-da-verificare.png',
  mimeType: 'image/png',
  size: 1200,
  width: 1055,
  height: 1491,
  aspectRatio: 1055 / 1491,
  url: 'blob:pump-leader-da-verificare',
}

describe('PumpLeaderAiReview', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('simula analisi, generazione e applicazione della creatività corretta', async () => {
    vi.useFakeTimers()
    const onApply = vi.fn()
    render(<PumpLeaderAiReview asset={uploadedAsset} onApply={onApply} />)

    expect(screen.getByText('Sto analizzando l’asset…')).toBeVisible()

    await act(() => vi.advanceTimersByTimeAsync(1200))
    expect(screen.getByText('3 criticità rilevate')).toBeVisible()
    expect(screen.getByText('Headline poco leggibile')).toBeVisible()
    expect(screen.getByText('Prodotto poco protagonista')).toBeVisible()
    expect(screen.getByText('Gerarchia del footer invertita')).toBeVisible()

    fireEvent.click(
      screen.getByRole('button', { name: 'Genera versione ottimizzata' }),
    )
    expect(screen.getByText('Genero una variante ottimizzata…')).toBeVisible()

    await act(() => vi.advanceTimersByTimeAsync(950))
    expect(screen.getByText('Variante pronta')).toBeVisible()
    fireEvent.click(
      screen.getByRole('button', { name: 'Usa questa versione nel 3D' }),
    )

    expect(onApply).toHaveBeenCalledWith(
      expect.objectContaining({
        id: PUMP_LEADER_OPTIMIZED_ASSET_ID,
        url: PUMP_LEADER_OPTIMIZED_URL,
      }),
    )
  })
})
