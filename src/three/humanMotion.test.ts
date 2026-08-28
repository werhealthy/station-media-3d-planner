import { describe, expect, it } from 'vitest'
import {
  advanceGaitPhase,
  gaitWeightForSpeed,
  sampleHumanGait,
} from './humanMotion'

describe('human motion profile', () => {
  it('advances one full cycle for one stride length', () => {
    expect(advanceGaitPhase(0.72, 1.34)).toBeCloseTo(0.72, 8)
  })

  it('does not advance while the actor is stationary', () => {
    expect(advanceGaitPhase(1.2, 0)).toBeCloseTo(1.2)
    expect(gaitWeightForSpeed(0)).toBe(0)
  })

  it('keeps opposing limbs out of phase', () => {
    const gait = sampleHumanGait(Math.PI / 2, 1)
    expect(gait.leftHip).toBeCloseTo(-gait.rightHip)
    expect(gait.leftArm).toBeCloseTo(-gait.rightArm)
    expect(gait.rightKnee).toBeGreaterThan(gait.leftKnee)
  })

  it('fully removes the gait when its blend weight is zero', () => {
    expect(Object.values(sampleHumanGait(1.1, 0))).toEqual(
      expect.arrayContaining([0]),
    )
    expect(
      Object.values(sampleHumanGait(1.1, 0)).every((value) => value === 0),
    ).toBe(true)
  })
})
