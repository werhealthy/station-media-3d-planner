import { Pause, Play, RotateCcw, Sparkles } from 'lucide-react'
import {
  getJourney,
  journeyDuration,
  journeyElapsedAfterStep,
} from '@/domain/journeys'
import { usePlaybackStore } from '@/stores/playbackStore'
import { useJourneyCopyStore } from '@/stores/journeyCopyStore'

const formatTime = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`

export function AutoWalkthroughPanel() {
  const isPlaying = usePlaybackStore((s) => s.isPlaying)
  const progress = usePlaybackStore((s) => s.progress)
  const activeStepIndex = usePlaybackStore((s) => s.activeStepIndex)
  const play = usePlaybackStore((s) => s.play)
  const pause = usePlaybackStore((s) => s.pause)
  const seekTo = usePlaybackStore((s) => s.seekTo)
  const setActiveStep = usePlaybackStore((s) => s.setActiveStep)
  const activeRouteId = usePlaybackStore((s) => s.activeRouteId)
  const serviceChoice = usePlaybackStore((s) => s.serviceChoice)
  const paymentChoice = usePlaybackStore((s) => s.paymentChoice)
  const resetInteractiveJourney = usePlaybackStore(
    (s) => s.resetInteractiveJourney,
  )
  const openDecision = usePlaybackStore((s) => s.openDecision)
  const copyOverrides = useJourneyCopyStore((s) => s.overrides)
  const journey = getJourney(activeRouteId)
  const activeStep = journey.steps[activeStepIndex] ?? journey.steps[0]!
  const activeCopy = copyOverrides[activeStep.id]
  const activePhase = activeCopy?.phase ?? activeStep.phase
  const [phaseCode, ...phaseWords] = activePhase.split(' · ')
  const phaseTitle = phaseWords.join(' · ') || phaseCode
  const journeyLabel = !serviceChoice ? 'Ingresso Q8' : journey.name
  const duration = journeyDuration(journey)
  const choiceLimit = !serviceChoice
    ? journeyElapsedAfterStep(journey, 'common-service-choice') / duration
    : serviceChoice === 'servito' && !paymentChoice
      ? journeyElapsedAfterStep(journey, 'served-payment-choice') / duration
      : 1
  const checkpoints = journey.steps.reduce<
    Array<{
      label: string
      stepIndex: number
      progress: number
      ordinal: number
      decision: boolean
    }>
  >((markers, item, stepIndex) => {
    const elapsed = journey.steps
      .slice(0, stepIndex)
      .reduce((total, step) => total + step.duration, 0)
    const markerProgress = elapsed / duration
    if (item.checkpoint)
      markers.push({
        label: copyOverrides[item.id]?.checkpoint ?? item.checkpoint,
        stepIndex,
        progress: markerProgress,
        ordinal: markers.length + 1,
        decision: Boolean(item.decision),
      })
    return markers
  }, [])

  const seekStep = (index: number) => {
    const seconds = journey.steps
      .slice(0, index)
      .reduce((total, item) => total + item.duration, 0)
    seekTo(seconds / duration)
    setActiveStep(index, journey.steps[index]!.mediaPointId ?? null)
    pause()
  }

  const selectCheckpoint = (marker: (typeof checkpoints)[number]) => {
    if (marker.progress > choiceLimit + 0.0001) {
      if (!serviceChoice) {
        const decisionIndex = journey.steps.findIndex(
          (step) => step.decision === 'service-mode',
        )
        if (decisionIndex >= 0) seekStep(decisionIndex)
        openDecision('service-mode')
        return
      }
      if (serviceChoice === 'servito' && !paymentChoice) {
        const decisionIndex = journey.steps.findIndex(
          (step) => step.decision === 'operator-payment',
        )
        if (decisionIndex >= 0) seekStep(decisionIndex)
        openDecision('operator-payment')
        return
      }
    }
    seekStep(marker.stepIndex)
  }

  return (
    <section className="auto-panel" aria-label="Controlli auto walkthrough">
      <div className="auto-summary">
        <span className="eyebrow">
          <Sparkles size={14} /> {journeyLabel}
        </span>
        <strong>{phaseTitle}</strong>
        <span>{activeCopy?.label ?? activeStep.label}</span>
      </div>
      <button
        className="play-button"
        aria-label={isPlaying ? 'Pausa' : 'Riproduci'}
        onClick={isPlaying ? pause : play}
      >
        {isPlaying ? (
          <Pause size={19} fill="currentColor" />
        ) : (
          <Play size={19} fill="currentColor" />
        )}
      </button>
      <button
        className="icon-button"
        aria-label="Riavvia walkthrough"
        onClick={resetInteractiveJourney}
      >
        <RotateCcw size={17} />
      </button>
      <div className="timeline-wrap">
        <div className="timeline-meta">
          <span>{formatTime(progress * duration)}</span>
          <span>{formatTime(duration)}</span>
        </div>
        <div className="timeline-rail">
          <input
            aria-label="Progresso walkthrough"
            type="range"
            min="0"
            max={choiceLimit}
            step="0.001"
            value={progress}
            onPointerDown={pause}
            onChange={(event) => seekTo(Number(event.target.value))}
          />
          <div className="step-dots" aria-label="Checkpoint della journey">
            {checkpoints.map((marker) => (
              <button
                key={`${marker.label}-${marker.stepIndex}`}
                aria-label={`Vai a ${marker.label} e metti in pausa`}
                title={marker.label}
                style={{
                  left: `${marker.progress * 100}%`,
                }}
                className={`${activeStepIndex === marker.stepIndex ? 'active' : ''} ${marker.decision ? 'decision' : ''} ${marker.progress > choiceLimit + 0.0001 ? 'blocked' : ''}`}
                onClick={() => selectCheckpoint(marker)}
              >
                <b>{marker.ordinal}</b>
                <span>{marker.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
