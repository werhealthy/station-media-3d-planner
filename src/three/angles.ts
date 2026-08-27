/**
 * Exponential angular damping along the shortest arc. A plain numeric lerp can
 * rotate almost 360° when an angle crosses the -PI/PI boundary.
 */
export function dampAngle(
  current: number,
  target: number,
  damping: number,
  delta: number,
): number {
  const shortestDelta = Math.atan2(
    Math.sin(target - current),
    Math.cos(target - current),
  )
  return current + shortestDelta * (1 - Math.exp(-delta * damping))
}

export function angularDistance(left: number, right: number): number {
  return Math.abs(Math.atan2(Math.sin(right - left), Math.cos(right - left)))
}
