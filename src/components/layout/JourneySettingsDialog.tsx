import { RotateCcw, Settings2, X } from 'lucide-react'
import { useState } from 'react'
import { getJourney, type JourneyId } from '@/domain/journeys'
import { usePlaybackStore } from '@/stores/playbackStore'
import { useJourneyCopyStore } from '@/stores/journeyCopyStore'

const routes: Array<{ id: JourneyId; label: string }> = [
  { id: 'self-service', label: 'Self service' },
  { id: 'servito', label: 'Servito' },
  { id: 'servito-svolta', label: 'Servito + Svolta' },
]

export function JourneySettingsDialog() {
  const open = useJourneyCopyStore((state) => state.editorOpen)
  const close = useJourneyCopyStore((state) => state.closeEditor)
  const overrides = useJourneyCopyStore((state) => state.overrides)
  const update = useJourneyCopyStore((state) => state.updateStepCopy)
  const resetStep = useJourneyCopyStore((state) => state.resetStepCopy)
  const resetAll = useJourneyCopyStore((state) => state.resetAllCopy)
  const routeId = usePlaybackStore((state) => state.activeRouteId)
  const [selectedRoute, setSelectedRoute] = useState<JourneyId>(
    (routeId ?? 'self-service') as JourneyId,
  )
  const journey = getJourney(selectedRoute)

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/50 p-6 backdrop-blur-[2px]"
      onMouseDown={close}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="journey-settings-title"
        className="flex max-h-[calc(100dvh-48px)] w-full max-w-4xl flex-col overflow-hidden rounded-[28px] bg-white shadow-[0_28px_90px_rgba(15,23,42,.3)]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="flex shrink-0 items-center gap-4 border-b border-slate-200 px-7 py-5">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-50 text-[#1954c6]">
            <Settings2 size={22} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#1954c6]">
              Impostazioni auto tour
            </p>
            <h2 id="journey-settings-title" className="text-xl font-bold">
              Testi della journey
            </h2>
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="Chiudi impostazioni journey"
            className="grid h-10 w-10 place-items-center rounded-full text-slate-500 hover:bg-slate-100"
          >
            <X size={20} />
          </button>
        </header>

        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-slate-100 bg-slate-50 px-7 py-4">
          <label className="flex items-center gap-3 text-sm font-semibold text-slate-700">
            Percorso
            <select
              aria-label="Percorso da modificare"
              value={selectedRoute}
              onChange={(event) =>
                setSelectedRoute(event.target.value as JourneyId)
              }
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              {routes.map((route) => (
                <option key={route.id} value={route.id}>
                  {route.label}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={resetAll}
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-slate-600 hover:bg-white hover:text-slate-950"
          >
            <RotateCcw size={16} /> Ripristina tutti
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-7 py-5">
          {journey.steps.map((step, index) => {
            const copy = overrides[step.id]
            return (
              <article
                key={step.id}
                className="rounded-2xl border border-slate-200 bg-white p-4"
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                    {index + 1}. {step.id}
                  </p>
                  {copy && (
                    <button
                      type="button"
                      onClick={() => resetStep(step.id)}
                      className="text-xs font-bold text-[#1954c6] hover:underline"
                    >
                      Ripristina
                    </button>
                  )}
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="text-xs font-semibold text-slate-600">
                    Titolo
                    <input
                      value={copy?.phase ?? step.phase}
                      onChange={(event) =>
                        update(step.id, { phase: event.target.value })
                      }
                      className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </label>
                  <label className="text-xs font-semibold text-slate-600">
                    Testo di supporto
                    <input
                      value={copy?.label ?? step.label}
                      onChange={(event) =>
                        update(step.id, { label: event.target.value })
                      }
                      className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </label>
                </div>
                {step.checkpoint && (
                  <label className="mt-3 block text-xs font-semibold text-slate-600">
                    Etichetta timeline
                    <input
                      value={copy?.checkpoint ?? step.checkpoint}
                      onChange={(event) =>
                        update(step.id, { checkpoint: event.target.value })
                      }
                      className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </label>
                )}
              </article>
            )
          })}
        </div>
        <footer className="flex shrink-0 justify-end border-t border-slate-200 px-7 py-4">
          <button
            type="button"
            onClick={close}
            className="rounded-full bg-[#1954c6] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#123f99]"
          >
            Fine
          </button>
        </footer>
      </section>
    </div>
  )
}
