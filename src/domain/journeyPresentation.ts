import type { SmartOptScreen, StationJourney } from './journeys'
import { journeyDuration } from './journeys'

function smoothstep(value: number, min: number, max: number) {
  const normalized = Math.min(1, Math.max(0, (value - min) / (max - min)))
  return normalized * normalized * (3 - 2 * normalized)
}

const TERMINAL_TOUCH_STEP_IDS = new Set([
  'self-terminal-start',
  'self-no-payback',
  'self-select-pump',
  'self-select-fuel',
  'self-select-payment',
  'self-review',
])

export function isTerminalTouchStep(stepId?: string) {
  return Boolean(stepId && TERMINAL_TOUCH_STEP_IDS.has(stepId))
}

export function terminalTouchEnvelope(localProgress: number) {
  return (
    smoothstep(localProgress, 0.16, 0.42) *
    (1 - smoothstep(localProgress, 0.58, 0.82))
  )
}

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

/**
 * Starts obscuring the old POV before a cut step begins, keeps the scene black
 * while the camera switches, then reveals the new POV. No exterior frame can
 * leak before the transition.
 */
export function cinematicFadeOpacity(
  journey: StationJourney,
  stepIndex: number,
  progress: number,
) {
  const step = journey.steps[stepIndex]
  if (!step) return 0
  const local = journeyStepLocalProgress(journey, stepIndex, progress)
  const nextStep = journey.steps[stepIndex + 1]
  if (nextStep?.cameraTransition === 'fade-cut')
    return smoothstep(local, 0.7, 1)
  if (step.cameraTransition === 'fade-cut') {
    if (local <= 0.5) return 1
    return 1 - smoothstep(local, 0.5, 0.82)
  }
  return 0
}

export function presentedTerminalScreen(
  journey: StationJourney,
  stepIndex: number,
  progress: number,
): SmartOptScreen {
  const step = journey.steps[stepIndex]
  const currentScreen = step?.terminalScreen ?? 'idle'
  if (
    step &&
    isTerminalTouchStep(step.id) &&
    journeyStepLocalProgress(journey, stepIndex, progress) >= 0.5
  )
    return journey.steps[stepIndex + 1]?.terminalScreen ?? currentScreen
  return currentScreen
}
