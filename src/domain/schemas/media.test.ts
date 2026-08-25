import { describe, expect, it } from 'vitest'
import { MediaAssetSchema } from './media'

describe('MediaAssetSchema', () => {
  it('accetta un asset PDF con anteprima rasterizzata', () => {
    expect(
      MediaAssetSchema.safeParse({
        id: 'pdf-1',
        name: 'campagna.pdf',
        mimeType: 'application/pdf',
        size: 42000,
        width: 734,
        height: 1280,
        aspectRatio: 734 / 1280,
        url: 'blob:pdf-preview',
      }).success,
    ).toBe(true)
  })
})
