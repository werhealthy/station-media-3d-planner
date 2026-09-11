import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { PROCEDURAL_STATION_CONFIG } from '@/domain/stationConfigDefaults'
import { DEFAULT_CREATIVE_DISPLAY } from '@/stores/projectStore'
import { CreativeWorkspace } from './CreativeWorkspace'

describe('CreativeWorkspace', () => {
  it('permette di continuare con il Pump Leader originale senza generare una variante', async () => {
    const point = PROCEDURAL_STATION_CONFIG.mediaPoints.find(
      (item) => item.supportTypeId === '2',
    )!
    const asset = {
      id: 'pump-leader-original',
      name: 'pump-leader.png',
      mimeType: 'image/png' as const,
      size: 100,
      width: 841,
      height: 1189,
      aspectRatio: 841 / 1189,
      url: 'blob:pump-leader-original',
    }
    const onApply = vi.fn()

    render(
      <CreativeWorkspace
        point={point}
        asset={asset}
        assetIsDraft
        analyzed
        error=""
        onUpload={vi.fn()}
        onAnalyzed={vi.fn()}
        onApply={onApply}
        onClose={vi.fn()}
      />,
    )

    expect(
      screen.getByRole('button', { name: 'Genera versione ottimizzata' }),
    ).toBeVisible()
    await userEvent.click(screen.getByRole('button', { name: 'Continua' }))

    expect(onApply).toHaveBeenCalledOnce()
    expect(onApply).toHaveBeenCalledWith(asset, DEFAULT_CREATIVE_DISPLAY)
  })
})
