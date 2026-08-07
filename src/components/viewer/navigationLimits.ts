export const SETUP_MIN_DISTANCE = 0.35

export function orbitMinDistance(
  setupEnabled: boolean,
  radius?: number,
): number {
  if (setupEnabled) return SETUP_MIN_DISTANCE
  return radius ? Math.max(0.75, Math.min(2, radius * 0.035)) : 0.75
}
