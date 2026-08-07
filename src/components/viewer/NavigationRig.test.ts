import { describe, expect, it } from 'vitest'
import { orbitMinDistance, SETUP_MIN_DISTANCE } from './navigationLimits'

describe('OrbitControls distance limits', () => {
  it('allows real close-ups in station setup independently of overall bounds', () => {
    expect(orbitMinDistance(true, 500)).toBe(SETUP_MIN_DISTANCE)
    expect(SETUP_MIN_DISTANCE).toBeGreaterThanOrEqual(0.25)
    expect(SETUP_MIN_DISTANCE).toBeLessThanOrEqual(0.5)
  })

  it('keeps free view useful without deriving an excessive minimum from bounds', () => {
    expect(orbitMinDistance(false, 100)).toBe(2)
    expect(orbitMinDistance(false, 10)).toBe(0.75)
  })
})
