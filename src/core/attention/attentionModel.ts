export type AttentionLevel = 'low' | 'medium' | 'high'

export interface AttentionFactors {
  distanceMeters: number
  facing: number
  screenCoverage: number
  dwellSeconds: number
  speedMetersPerSecond: number
  occluded?: boolean
}

export interface AttentionEstimate {
  score: number
  seconds: number
  level: AttentionLevel
}

/** Transparent planning heuristic, not a scientific audience measurement. */
export function estimateAttention(
  factors: AttentionFactors,
): AttentionEstimate {
  const distance = Math.max(0, 1 - factors.distanceMeters / 32)
  const facing = Math.min(1, Math.max(0, factors.facing))
  const coverage = Math.min(1, Math.max(0, factors.screenCoverage * 7))
  const dwell = Math.min(1, Math.max(0, factors.dwellSeconds / 3))
  const pace = Math.min(
    1,
    Math.max(0.3, 1.6 / Math.max(0.25, factors.speedMetersPerSecond)),
  )
  const score =
    (0.28 * distance + 0.27 * facing + 0.2 * coverage + 0.25 * dwell) *
    pace *
    (factors.occluded ? 0.12 : 1)
  const roundedScore = Math.round(Math.min(1, score) * 100) / 100
  const seconds =
    Math.round(
      Math.min(
        factors.dwellSeconds,
        factors.dwellSeconds * roundedScore * 1.3,
      ) * 10,
    ) / 10
  return {
    score: roundedScore,
    seconds,
    level:
      roundedScore >= 0.66 ? 'high' : roundedScore >= 0.38 ? 'medium' : 'low',
  }
}
