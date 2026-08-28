import type { StationJourney } from './journeys'
import { journeyDuration } from './journeys'

export function journeyStepLocalProgress(
  journey: StationJourney,
  stepIndex: number,
  progress: number,
) {
  const step = journey.steps[stepIndex]
  if (!step) return 0
  const elapsedBefore = journey.steps
    .slice(0, stepIndex)
    .reduce((total, item) => total + item.duration, 0)
  return Math.min(
    1,
    Math.max(
      0,
      (progress * journeyDuration(journey) - elapsedBefore) /
        Math.max(step.duration, 0.001),
    ),
  )
}

/**
 * Keeps the old POV visible through the fade-out and reveals the new POV only
 * once the screen is black. This prevents a one-frame missing/duplicate car.
 */
export function presentedCameraMode(
  journey: StationJourney,
  stepIndex: number,
  progress: number,
) {
  const step = journey.steps[stepIndex]
  if (!step) return undefined
  if (
    step.cameraTransition === 'fade-cut' &&
    journeyStepLocalProgress(journey, stepIndex, progress) < 0.5
  )
    return journey.steps[Math.max(0, stepIndex - 1)]?.cameraMode
  return step.cameraMode
}
