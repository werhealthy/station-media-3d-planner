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

  it('conserva la dimensione originale di una creativita compressa', () => {
    const asset = MediaAssetSchema.parse({
      id: 'compressed-1',
      name: 'campagna-compresso.jpg',
      mimeType: 'image/jpeg',
      size: 8 * 1024 * 1024,
      originalSize: 24 * 1024 * 1024,
      width: 4096,
      height: 1024,
      aspectRatio: 4,
      url: 'blob:compressed-preview',
    })
    expect(asset.originalSize).toBe(24 * 1024 * 1024)
  })
})
