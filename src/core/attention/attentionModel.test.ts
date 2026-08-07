import { describe, expect, it } from 'vitest'
import { estimateAttention } from './attentionModel'

describe('estimateAttention', () => {
  it('premia prossimità, frontalità e permanenza', () => {
    const strong = estimateAttention({
      distanceMeters: 5,
      facing: 0.95,
      screenCoverage: 0.12,
      dwellSeconds: 2.8,
      speedMetersPerSecond: 1,
    })
    const weak = estimateAttention({
      distanceMeters: 28,
      facing: 0.15,
      screenCoverage: 0.01,
      dwellSeconds: 0.5,
      speedMetersPerSecond: 2,
    })
    expect(strong.level).toBe('high')
    expect(strong.seconds).toBeGreaterThan(weak.seconds)
  })

  it('riduce drasticamente un supporto occluso', () => {
    const visible = estimateAttention({
      distanceMeters: 8,
      facing: 1,
      screenCoverage: 0.08,
      dwellSeconds: 2,
      speedMetersPerSecond: 1.2,
    })
    const hidden = estimateAttention({
      distanceMeters: 8,
      facing: 1,
      screenCoverage: 0.08,
      dwellSeconds: 2,
      speedMetersPerSecond: 1.2,
      occluded: true,
    })
    expect(hidden.score).toBeLessThan(visible.score / 2)
  })
})
