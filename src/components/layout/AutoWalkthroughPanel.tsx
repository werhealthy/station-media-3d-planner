import { Pause, Play, RotateCcw, Sparkles } from 'lucide-react'
import {
  getJourney,
  journeyDuration,
  journeyElapsedAfterStep,
} from '@/domain/journeys'
import { usePlaybackStore } from '@/stores/playbackStore'

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
  const resetInteractiveJourney = usePlaybackStore(
    (s) => s.resetInteractiveJourney,
  )
  const journey = getJourney(activeRouteId)
  const journeyLabel = !serviceChoice ? 'Ingresso Q8' : journey.name
  const duration = journeyDuration(journey)
  const choiceLimit = !serviceChoice
    ? journeyElapsedAfterStep(journey, 'common-service-choice') / duration
    : 1
  const phaseMarkers = journey.steps.reduce<
    Array<{ phase: string; stepIndex: number }>
  >((markers, item, stepIndex) => {
    const elapsed = journey.steps
      .slice(0, stepIndex)
      .reduce((total, step) => total + step.duration, 0)
    if (
      elapsed / duration <= choiceLimit &&
      markers.at(-1)?.phase !== item.phase
    )
      markers.push({ phase: item.phase, stepIndex })
    return markers
  }, [])

  const seekStep = (index: number) => {
    const seconds = journey.steps
      .slice(0, index)
      .reduce((total, item) => total + item.duration, 0)
    seekTo(seconds / duration)
    setActiveStep(index, journey.steps[index]!.mediaPointId ?? null)
  }

  return (
    <section className="auto-panel" aria-label="Controlli auto walkthrough">
      <div className="auto-summary">
        <span className="eyebrow">
          <Sparkles size={14} /> Tour interattivo
        </span>
        <strong>{journeyLabel}</strong>
          <span>La scena si ferma quando scegli il tipo di servizio</span>
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
        <input
          aria-label="Progresso walkthrough"
          type="range"
          min="0"
          max={choiceLimit}
          step="0.001"
          value={progress}
          onChange={(event) => seekTo(Number(event.target.value))}
        />
        <div className="step-dots" aria-label="Macro-fasi della journey">
          {phaseMarkers.map((marker) => (
            <button
              key={`${marker.phase}-${marker.stepIndex}`}
              aria-label={`Vai a ${marker.phase}`}
              className={
                journey.steps[activeStepIndex]?.phase === marker.phase
                  ? 'active'
                  : ''
              }
              onClick={() => seekStep(marker.stepIndex)}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
