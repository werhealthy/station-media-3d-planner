import { describe, expect, it } from 'vitest'
import { analyzeCreativeFit, containedSurfaceSize } from './creativeFit'

describe('creativeFit', () => {
  it('riconosce una creativita con il rapporto esatto del supporto', () => {
    const fit = analyzeCreativeFit({
      assetWidth: 1600,
      assetHeight: 400,
      surfaceWidth: 1.6,
      surfaceHeight: 0.4,
    })

    expect(fit.status).toBe('exact')
    expect(fit.differencePercent).toBe(0)
    expect(fit.containUnusedPercent).toBe(0)
  })

  it('segnala un asset 16:9 assegnato a un supporto 4:1', () => {
    const fit = analyzeCreativeFit({
      assetWidth: 1920,
      assetHeight: 1080,
      surfaceWidth: 1.6,
      surfaceHeight: 0.4,
    })

    expect(fit.status).toBe('mismatch')
    expect(fit.differencePercent).toBeGreaterThan(50)
    expect(fit.coverCropPercent).toBeGreaterThan(50)
  })

  it('calcola un piano contain senza deformare la creativita', () => {
    expect(containedSurfaceSize(1.6, 0.4, 1920, 1080)).toEqual([
      expect.closeTo(0.711, 3),
      0.4,
    ])
  })
})
