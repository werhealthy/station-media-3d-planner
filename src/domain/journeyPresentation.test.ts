import { describe, expect, it } from 'vitest'
import {
  getJourney,
  journeyDuration,
  journeyElapsedBeforeStep,
} from './journeys'
import {
  cinematicFadeOpacity,
  presentedTerminalScreen,
  presentedCameraMode,
} from './journeyPresentation'

function progressWithinStep(
  journeyId: 'self-service' | 'servito-svolta',
  stepId: string,
  local: number,
) {
  const journey = getJourney(journeyId)
  const step = journey.steps.find((item) => item.id === stepId)!
  return (
    (journeyElapsedBeforeStep(journey, stepId) + step.duration * local) /
    journeyDuration(journey)
  )
}

describe('journey presentation continuity', () => {
  it('cambia schermata SmartOPT quando il dito raggiunge il display', () => {
    const journey = getJourney('self-service')
    const index = journey.steps.findIndex(
      (step) => step.id === 'self-select-pump',
    )
    expect(
      presentedTerminalScreen(
        journey,
        index,
        progressWithinStep('self-service', 'self-select-pump', 0.49),
      ),
    ).toBe('pump')
    expect(
      presentedTerminalScreen(
        journey,
        index,
        progressWithinStep('self-service', 'self-select-pump', 0.51),
      ),
    ).toBe('fuel')
  })

  it('oscura la scena prima dell’uscita dall’auto e la riapre dopo il taglio', () => {
    const journey = getJourney('self-service')
    const exitIndex = journey.steps.findIndex((step) => step.id === 'self-exit')
    const beforeExit = exitIndex - 1

    expect(
      cinematicFadeOpacity(
        journey,
        beforeExit,
        progressWithinStep('self-service', journey.steps[beforeExit]!.id, 0.7),
      ),
    ).toBeCloseTo(0, 8)
    expect(
      cinematicFadeOpacity(
        journey,
        beforeExit,
        progressWithinStep('self-service', journey.steps[beforeExit]!.id, 0.99),
      ),
    ).toBeGreaterThan(0.99)
    expect(
      cinematicFadeOpacity(
        journey,
        exitIndex,
        progressWithinStep('self-service', 'self-exit', 0.1),
      ),
    ).toBe(1)
    expect(
      cinematicFadeOpacity(
        journey,
        exitIndex,
        progressWithinStep('self-service', 'self-exit', 0.85),
      ),
    ).toBe(0)
  })

  it('keeps the cockpit until the exit cut is fully black', () => {
    const journey = getJourney('self-service')
    const index = journey.steps.findIndex((step) => step.id === 'self-exit')
    expect(
      presentedCameraMode(
        journey,
        index,
        progressWithinStep('self-service', 'self-exit', 0.49),
      ),
    ).toBe('vehicle')
    expect(
      presentedCameraMode(
        journey,
        index,
        progressWithinStep('self-service', 'self-exit', 0.51),
      ),
    ).toBe('pedestrian')
  })

  it('keeps the parked car until the re-entry cut is fully black', () => {
    const journey = getJourney('servito-svolta')
    const index = journey.steps.findIndex(
      (step) => step.id === 'svolta-enter-car',
    )
    expect(
      presentedCameraMode(
        journey,
        index,
        progressWithinStep('servito-svolta', 'svolta-enter-car', 0.49),
      ),
    ).toBe('pedestrian')
    expect(
      presentedCameraMode(
        journey,
        index,
        progressWithinStep('servito-svolta', 'svolta-enter-car', 0.51),
      ),
    ).toBe('vehicle')
  })
})
