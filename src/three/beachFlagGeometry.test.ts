import { describe, expect, it } from 'vitest'
import { createBeachFlagGeometry } from './beachFlagGeometry'

describe('beach flag creative frame', () => {
  it('normalizza tutte le UV dentro la sagoma ritagliata', () => {
    const geometry = createBeachFlagGeometry(0.8, 3.6)
    const uv = geometry.getAttribute('uv')
    for (let index = 0; index < uv.count; index += 1) {
      expect(uv.getX(index)).toBeGreaterThanOrEqual(0)
      expect(uv.getX(index)).toBeLessThanOrEqual(1)
      expect(uv.getY(index)).toBeGreaterThanOrEqual(0)
      expect(uv.getY(index)).toBeLessThanOrEqual(1)
    }
    geometry.dispose()
  })
})
