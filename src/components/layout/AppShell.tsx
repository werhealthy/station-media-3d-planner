import { TopBar } from './TopBar'
import { MediaPointPanel } from './MediaPointPanel'
import { Canvas } from '@/components/viewer/Canvas'
import {
  eyeHeightFromPersonHeight,
  MAX_PERSON_HEIGHT,
  MIN_PERSON_HEIGHT,
  useViewerStore,
} from '@/stores/viewerStore'
import { Lock, Rotate3D } from 'lucide-react'
import { AutoWalkthroughPanel } from './AutoWalkthroughPanel'
import { useEffect } from 'react'
import { useStationStore } from '@/stores/stationStore'
import { useStationRuntimeStore } from '@/stores/stationRuntimeStore'
import { getStation } from '@/domain/stations'
import { useStationSetupStore } from '@/stores/stationSetupStore'
import { createEmptyStationConfig } from '@/domain/stationConfig'
import { PROCEDURAL_STATION_CONFIG } from '@/domain/stationConfigDefaults'
import { loadStationConfig } from '@/adapters/station-config/stationConfigLoader'
import { restoreStationConfig } from '@/adapters/station-config/stationConfigPersistence'
import { StationSetupPanel } from './StationSetupPanel'
import { JourneyExperienceOverlay } from './JourneyExperienceOverlay'
export function AppShell() {
  const mode = useViewerStore((s) => s.navigationMode)
  const active = useViewerStore((s) => s.activeHotspotId)
  const setHotspot = useViewerStore((s) => s.setActiveHotspot)
  const setMode = useViewerStore((s) => s.setNavigationMode)
  const overviewUnlocked = useViewerStore((s) => s.overviewUnlocked)
  const setOverviewUnlocked = useViewerStore((s) => s.setOverviewUnlocked)
  const personHeight = useViewerStore((s) => s.personHeight)
  const setPersonHeight = useViewerStore((s) => s.setPersonHeight)
  const stationId = useStationStore((s) => s.selectedStationId)
  const resetViewer = useViewerStore((s) => s.resetForStation)
  const resetRuntime = useStationRuntimeStore((s) => s.reset)
  const station = getStation(stationId)
  const setupEnabled = useStationSetupStore((s) => s.enabled)
  const initializeSetup = useStationSetupStore((s) => s.initialize)
  const config = useStationSetupStore((s) => s.config)
  const setSetupWarning = useStationSetupStore((s) => s.setWarning)
  const exploreMode = mode === 'overview' || mode === 'hotspot'
  useEffect(() => {
    resetViewer()
    resetRuntime()
  }, [resetRuntime, resetViewer, stationId])
  useEffect(() => {
    const controller = new AbortController()
    if (station.modelType === 'procedural') {
      initializeSetup(PROCEDURAL_STATION_CONFIG, 'valid')
      return () => controller.abort()
    }
    const empty = createEmptyStationConfig(
      station.id,
      station.modelType,
      station.modelPath,
    )
    try {
      const local = restoreStationConfig(window.localStorage, station.id)
      if (local) {
        initializeSetup(local, 'valid')
        return () => controller.abort()
      }
    } catch (error) {
      if (import.meta.env.DEV)
        console.warn('Local station configuration is invalid', error)
    }
    initializeSetup(empty, 'loading')
    void loadStationConfig(station, controller.signal)
      .then((loaded) =>
        initializeSetup(loaded ?? empty, loaded ? 'valid' : 'not-configured'),
      )
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        if (import.meta.env.DEV)
          console.error('Station configuration loading failed', error)
        initializeSetup(empty, 'invalid')
        setSetupWarning('Impossibile caricare la configurazione.')
      })
    return () => controller.abort()
  }, [initializeSetup, setSetupWarning, station])
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-100 text-slate-900">
      <TopBar />
      <main className="flex min-h-0 flex-1">
        <section className="relative min-w-0 flex-1">
          <Canvas />
          {exploreMode && (
            <button
              type="button"
              aria-pressed={overviewUnlocked}
              onClick={() => setOverviewUnlocked(!overviewUnlocked)}
              className="absolute left-5 top-5 flex items-center gap-2 rounded-xl border border-white/70 bg-white/95 px-4 py-2.5 text-sm font-semibold text-[#153276] shadow-lg shadow-slate-900/10 backdrop-blur transition hover:-translate-y-0.5 hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              {overviewUnlocked ? <Lock size={17} /> : <Rotate3D size={17} />}
              {overviewUnlocked ? 'Blocca vista' : 'Vista libera'}
            </button>
          )}
          {exploreMode && (
            <nav
              aria-label="Hotspot stazione"
              className="absolute left-1/2 top-5 flex -translate-x-1/2 gap-1 rounded-lg border border-slate-200 bg-white p-1.5 shadow-md"
            >
              {config.hotspots.map((spot) => (
                <button
                  key={spot.id}
                  onClick={() => setHotspot(spot.id)}
                  className={`rounded-md px-3 py-2 text-xs font-semibold transition ${active === spot.id ? 'bg-[#1746a2] text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  {spot.name}
                </button>
              ))}
            </nav>
          )}
          {mode === 'auto' && (
            <>
              <JourneyExperienceOverlay />
              <AutoWalkthroughPanel />
            </>
          )}
          {setupEnabled && <StationSetupPanel />}
          {mode === 'walkthrough' ? (
            <div className="absolute bottom-5 left-5 flex items-center gap-4 rounded-lg border border-slate-200 bg-white px-4 py-3 text-xs text-slate-600 shadow-md">
              <span>
                <b className="block text-sm text-slate-900">
                  Modalità prima persona
                </b>
                Click per guardare · WASD/frecce per muoverti · ESC per uscire
              </span>
              <div className="w-52 rounded-md bg-slate-100 px-3 py-2 text-slate-700">
                <div className="flex items-center justify-between gap-2 font-semibold">
                  <label htmlFor="person-height">Altezza persona</label>
                  <span className="flex items-center gap-1 font-bold text-[#1746a2]">
                    <input
                      id="person-height"
                      aria-label="Altezza persona in centimetri"
                      type="number"
                      min={MIN_PERSON_HEIGHT * 100}
                      max={MAX_PERSON_HEIGHT * 100}
                      step={1}
                      value={Math.round(personHeight * 100)}
                      onChange={(event) =>
                        setPersonHeight(Number(event.target.value) / 100)
                      }
                      className="w-12 bg-transparent text-right outline-none"
                    />
                    cm
                  </span>
                </div>
                <input
                  aria-label="Regola altezza persona"
                  type="range"
                  min={MIN_PERSON_HEIGHT}
                  max={MAX_PERSON_HEIGHT}
                  step={0.01}
                  value={personHeight}
                  onChange={(event) =>
                    setPersonHeight(Number(event.target.value))
                  }
                  className="mt-1.5 block w-full accent-[#1746a2]"
                />
                <span className="mt-0.5 block text-[10px] text-slate-500">
                  Quota occhi{' '}
                  {Math.round(eyeHeightFromPersonHeight(personHeight) * 100)} cm
                </span>
              </div>
              <button
                onClick={() => setMode('overview')}
                className="rounded-md border border-slate-300 px-3 py-2 font-semibold text-slate-800 hover:bg-slate-50"
              >
                Esci
              </button>
            </div>
          ) : (
            exploreMode && (
              <div className="pointer-events-none absolute bottom-5 left-5 rounded-lg border border-slate-200 bg-white/95 px-4 py-3 text-xs text-slate-600 shadow-md">
                <b className="block text-sm text-slate-800">
                  Esplora la stazione
                </b>
                {overviewUnlocked
                  ? 'Trascina per ruotare · scorri per avvicinare'
                  : 'Scegli un hotspot o attiva Vista libera per esplorare'}
              </div>
            )
          )}
        </section>
        {!setupEnabled && <MediaPointPanel points={config.mediaPoints} />}
      </main>
    </div>
  )
}
