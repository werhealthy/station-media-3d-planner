import { describe, expect, it } from 'vitest'
import { angularDistance, dampAngle } from './angles'

describe('angular damping', () => {
  it('crosses the PI boundary through the short arc', () => {
    const current = Math.PI - 0.05
    const target = -Math.PI + 0.05
    const next = dampAngle(current, target, 10, 1 / 60)
    expect(angularDistance(current, next)).toBeLessThan(0.05)
    expect(angularDistance(next, target)).toBeLessThan(
      angularDistance(current, target),
    )
  })
})
