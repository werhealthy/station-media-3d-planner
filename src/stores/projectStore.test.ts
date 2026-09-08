import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { MediaAsset } from '@/domain/schemas/media'
import { useProjectStore } from './projectStore'

function asset(id: string, url: string): MediaAsset {
  return {
    id,
    name: `${id}.png`,
    mimeType: 'image/png',
    size: 100,
    width: 841,
    height: 1189,
    aspectRatio: 841 / 1189,
    url,
  }
}

describe('projectStore', () => {
  const revokeObjectURL = vi.fn()

  beforeEach(() => {
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: revokeObjectURL,
    })
    revokeObjectURL.mockClear()
    useProjectStore.setState({ assignments: {} })
  })

  it('mantiene valido il blob quando si conferma la stessa creatività', () => {
    const uploaded = asset('original', 'blob:pump-leader')

    useProjectStore.getState().assignAsset('mp-02', uploaded)
    useProjectStore
      .getState()
      .assignAsset('mp-02', { ...uploaded, name: 'confermata.png' })

    expect(revokeObjectURL).not.toHaveBeenCalled()
    expect(useProjectStore.getState().assignments['mp-02']?.url).toBe(
      'blob:pump-leader',
    )
  })

  it('revoca il blob precedente quando viene caricata un’altra creatività', () => {
    useProjectStore
      .getState()
      .assignAsset('mp-07', asset('fondostazione-1', 'blob:first'))
    useProjectStore
      .getState()
      .assignAsset('mp-07', asset('fondostazione-2', 'blob:second'))

    expect(revokeObjectURL).toHaveBeenCalledOnce()
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:first')
  })
})
