import { useEffect } from 'react'
import { CreditCard, Store, UserRound, Zap } from 'lucide-react'
import {
  getJourney,
  journeyDuration,
  journeyElapsedAfterStep,
  type JourneyId,
} from '@/domain/journeys'
import { usePlaybackStore } from '@/stores/playbackStore'
import { useViewerStore } from '@/stores/viewerStore'

export function JourneyExperienceOverlay() {
  const mode = useViewerStore((state) => state.navigationMode)
  const routeId = usePlaybackStore((state) => state.activeRouteId)
  const activeStepIndex = usePlaybackStore((state) => state.activeStepIndex)
  const pendingDecision = usePlaybackStore((state) => state.pendingDecision)
  const serviceChoice = usePlaybackStore((state) => state.serviceChoice)
  const paymentChoice = usePlaybackStore((state) => state.paymentChoice)
  const openDecision = usePlaybackStore((state) => state.openDecision)
  const continueOnRoute = usePlaybackStore((state) => state.continueOnRoute)
  const journey = getJourney(routeId)
  const step = journey.steps[activeStepIndex]
  const journeyHeading = !serviceChoice
    ? 'Ingresso Q8'
    : serviceChoice === 'self' && !paymentChoice
      ? 'Percorso Self'
      : journey.name

  useEffect(() => {
    if (mode !== 'auto' || !step?.decision || pendingDecision) return
    const alreadyResolved =
      (step.decision === 'service-mode' && serviceChoice) ||
      (step.decision === 'payment-location' && paymentChoice)
    if (!alreadyResolved) openDecision(step.decision)
  }, [
    mode,
    openDecision,
    paymentChoice,
    pendingDecision,
    serviceChoice,
    step?.decision,
  ])

  if (mode !== 'auto' || !step) return null

  const continueAfterDecision = (
    targetRouteId: JourneyId,
    choices: {
      serviceChoice?: 'self' | 'servito'
      paymentChoice?: 'acceptor' | 'svolta'
    },
  ) => {
    const target = getJourney(targetRouteId)
    const decisionId = step.id
    const decisionIndex = target.steps.findIndex(
      (item) => item.id === decisionId,
    )
    const nextIndex = Math.min(target.steps.length - 1, decisionIndex + 1)
    continueOnRoute({
      routeId: targetRouteId,
      progress:
        journeyElapsedAfterStep(target, decisionId) / journeyDuration(target),
      activeStepIndex: nextIndex,
      ...choices,
    })
  }

  return (
    <>
      {!pendingDecision && (
        <div className="journey-phase" aria-live="polite">
          <span>{journeyHeading}</span>
          <strong>{step.phase}</strong>
        </div>
      )}

      {pendingDecision === 'service-mode' && (
        <div className="journey-decision-backdrop" role="dialog" aria-modal>
          <section className="journey-decision-card">
            <span className="decision-kicker">Scelta del servizio</span>
            <h2>Come vuoi fare rifornimento?</h2>
            <p>La scena ripartirà dalla corsia corretta.</p>
            <div className="decision-options">
              <button
                type="button"
                onClick={() =>
                  continueAfterDecision('self-service', {
                    serviceChoice: 'self',
                  })
                }
              >
                <Zap size={25} />
                <span>
                  <b>Self</b>
                  <small>Scendi dall’auto e scegli dove pagare</small>
                </span>
              </button>
              <button
                type="button"
                onClick={() =>
                  continueAfterDecision('servito', {
                    serviceChoice: 'servito',
                  })
                }
              >
                <UserRound size={25} />
                <span>
                  <b>Con gestore</b>
                  <small>Rimani in auto; il gestore pensa al servizio</small>
                </span>
              </button>
            </div>
          </section>
        </div>
      )}

      {pendingDecision === 'payment-location' && (
        <div className="journey-decision-backdrop" role="dialog" aria-modal>
          <section className="journey-decision-card">
            <span className="decision-kicker">Scelta del pagamento</span>
            <h2>Dove vuoi pagare?</h2>
            <p>Il percorso pedonale cambierà in base alla scelta.</p>
            <div className="decision-options">
              <button
                type="button"
                onClick={() =>
                  continueAfterDecision('self-service', {
                    paymentChoice: 'acceptor',
                  })
                }
              >
                <CreditCard size={25} />
                <span>
                  <b>Accettatore Self</b>
                  <small>Segui la sequenza sul terminale digitale</small>
                </span>
              </button>
              <button
                type="button"
                onClick={() =>
                  continueAfterDecision('self-svolta', {
                    paymentChoice: 'svolta',
                  })
                }
              >
                <Store size={25} />
                <span>
                  <b>Cassa Svolta</b>
                  <small>Entra nello store, paga e torna alla pompa</small>
                </span>
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  )
}
