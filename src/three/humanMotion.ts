import * as THREE from 'three'

export const WALK_STRIDE_LENGTH = 1.34

export interface HumanGaitSample {
  bodyLift: number
  bodyRoll: number
  leftArm: number
  rightArm: number
  leftHip: number
  rightHip: number
  leftKnee: number
  rightKnee: number
}

function wrapPhase(phase: number) {
  const turn = Math.PI * 2
  return ((phase % turn) + turn) % turn
}

/**
 * Advances a walk cycle from distance rather than wall-clock time. This keeps
 * the feet visually coherent when a journey accelerates, slows down or pauses.
 */
export function advanceGaitPhase(
  phase: number,
  distanceMeters: number,
  strideLength = WALK_STRIDE_LENGTH,
) {
  if (strideLength <= 0) return wrapPhase(phase)
  return wrapPhase(
    phase + (Math.max(0, distanceMeters) / strideLength) * Math.PI * 2,
  )
}

export function gaitWeightForSpeed(speedMetersPerSecond: number) {
  return THREE.MathUtils.smootherstep(
    THREE.MathUtils.clamp((speedMetersPerSecond - 0.04) / 0.82, 0, 1),
    0,
    1,
  )
}

/** A restrained stylised gait: readable at pitch distance, without a toy bounce. */
export function sampleHumanGait(
  phase: number,
  weight: number,
): HumanGaitSample {
  const blend = THREE.MathUtils.clamp(weight, 0, 1)
  const stride = Math.sin(phase)
  const oppositeStride = -stride
  const leftRecovery = Math.max(0, -Math.sin(phase))
  const rightRecovery = Math.max(0, Math.sin(phase))

  return {
    bodyLift: (Math.abs(Math.cos(phase)) - 0.5) * 0.022 * blend,
    bodyRoll: Math.sin(phase) * 0.016 * blend,
    leftArm: oppositeStride * 0.29 * blend,
    rightArm: stride * 0.29 * blend,
    leftHip: stride * 0.36 * blend,
    rightHip: oppositeStride * 0.36 * blend,
    leftKnee: leftRecovery * 0.48 * blend,
    rightKnee: rightRecovery * 0.48 * blend,
  }
}

export function sampleIdleMotion(elapsedSeconds: number) {
  return {
    lift: Math.sin(elapsedSeconds * 1.55) * 0.004,
    sway: Math.sin(elapsedSeconds * 0.72 + 0.4) * 0.007,
    headYaw: Math.sin(elapsedSeconds * 0.31 + 0.8) * 0.035,
    headPitch: Math.sin(elapsedSeconds * 0.43 + 1.9) * 0.012,
  }
}
