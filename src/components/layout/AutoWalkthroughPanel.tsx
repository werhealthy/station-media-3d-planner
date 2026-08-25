import { Pause, Play, RotateCcw, Sparkles } from 'lucide-react'
import { MEDIA_POINTS } from '@/domain/mediaPoints'
import {
  getJourney,
  journeyDuration,
  STATION_JOURNEYS,
  type JourneyId,
} from '@/domain/journeys'
import { estimateAttention } from '@/core/attention/attentionModel'
import { usePlaybackStore } from '@/stores/playbackStore'

const formatTime = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`

export function AutoWalkthroughPanel() {
  const isPlaying = usePlaybackStore((s) => s.isPlaying)
  const progress = usePlaybackStore((s) => s.progress)
  const activeStepIndex = usePlaybackStore((s) => s.activeStepIndex)
  const activeMediaPointId = usePlaybackStore((s) => s.activeMediaPointId)
  const play = usePlaybackStore((s) => s.play)
  const pause = usePlaybackStore((s) => s.pause)
  const stop = usePlaybackStore((s) => s.stop)
  const seekTo = usePlaybackStore((s) => s.seekTo)
  const setActiveStep = usePlaybackStore((s) => s.setActiveStep)
  const activeRouteId = usePlaybackStore((s) => s.activeRouteId)
  const setActiveRouteId = usePlaybackStore((s) => s.setActiveRouteId)
  const journey = getJourney(activeRouteId)
  const duration = journeyDuration(journey)
  const activePoint = MEDIA_POINTS.find(
    (point) => point.id === activeMediaPointId,
  )
  const step = journey.steps[activeStepIndex]
  const estimate = step?.mediaPointId
    ? estimateAttention({
        distanceMeters: 7 + activeStepIndex,
        facing: 0.88,
        screenCoverage: 0.075,
        dwellSeconds: step.dwellSeconds ?? 1,
        speedMetersPerSecond: 1.2,
      })
    : null

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
          <Sparkles size={14} /> Journey simulata
        </span>
        <select
          aria-label="Journey"
          value={journey.id}
          onChange={(event) => {
            stop()
            setActiveRouteId(event.target.value as JourneyId)
            setActiveStep(0, null)
            play()
          }}
          className="journey-select"
        >
          {STATION_JOURNEYS.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
        <strong>{step?.label ?? 'Percorso Q8'}</strong>
        <span>
          {activePoint
            ? `In osservazione · ${activePoint.name}`
            : 'Spostamento nel piazzale'}
        </span>
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
        onClick={() => {
          stop()
          play()
        }}
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
          max="1"
          step="0.001"
          value={progress}
          onChange={(event) => seekTo(Number(event.target.value))}
        />
        <div className="step-dots">
          {journey.steps.map((item, index) => (
            <button
              key={item.id}
              aria-label={`Vai a ${item.label}`}
              className={index === activeStepIndex ? 'active' : ''}
              onClick={() => seekStep(index)}
            />
          ))}
        </div>
      </div>
      {estimate && (
        <div className={`attention-chip ${estimate.level}`}>
          <span>{estimate.seconds.toFixed(1)}s</span>
          <small>attenzione {estimate.level}</small>
        </div>
      )}
    </section>
  )
}
