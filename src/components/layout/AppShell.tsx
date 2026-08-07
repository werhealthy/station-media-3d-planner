import { TopBar } from './TopBar'
import { MediaPointPanel } from './MediaPointPanel'
import { Canvas } from '@/components/viewer/Canvas'
import { useViewerStore } from '@/stores/viewerStore'
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
import { StationSetupPanel } from './StationSetupPanel'
export function AppShell() {
  const mode = useViewerStore((s) => s.navigationMode)
  const active = useViewerStore((s) => s.activeHotspotId)
  const setHotspot = useViewerStore((s) => s.setActiveHotspot)
  const setMode = useViewerStore((s) => s.setNavigationMode)
  const overviewUnlocked = useViewerStore((s) => s.overviewUnlocked)
  const setOverviewUnlocked = useViewerStore((s) => s.setOverviewUnlocked)
  const stationId = useStationStore((s) => s.selectedStationId)
  const resetViewer = useViewerStore((s) => s.resetForStation)
  const resetRuntime = useStationRuntimeStore((s) => s.reset)
  const station = getStation(stationId)
  const setupEnabled = useStationSetupStore((s) => s.enabled)
  const initializeSetup = useStationSetupStore((s) => s.initialize)
  const config = useStationSetupStore((s) => s.config)
  const setSetupWarning = useStationSetupStore((s) => s.setWarning)
  useEffect(() => {
    resetViewer()
    resetRuntime()
  }, [resetRuntime, resetViewer, stationId])
  useEffect(() => {
    const controller = new AbortController()
    if (station.modelType === 'procedural') {
      initializeSetup(PROCEDURAL_STATION_CONFIG, true)
      return () => controller.abort()
    }
    const empty = createEmptyStationConfig(station.id, station.modelType, station.modelPath)
    initializeSetup(empty, false)
    void loadStationConfig(station, controller.signal)
      .then((loaded) => initializeSetup(loaded ?? empty, Boolean(loaded)))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        if (import.meta.env.DEV) console.error('Station configuration loading failed', error)
        initializeSetup(empty, false)
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
          {mode === 'overview' && (
            <button
              type="button"
              aria-pressed={overviewUnlocked}
              onClick={() => setOverviewUnlocked(!overviewUnlocked)}
              className="absolute left-5 top-5 flex items-center gap-2 rounded-xl border border-white/70 bg-white/95 px-4 py-2.5 text-sm font-semibold text-[#153276] shadow-lg shadow-slate-900/10 backdrop-blur transition hover:-translate-y-0.5 hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              {overviewUnlocked ? <Lock size={17} /> : <Rotate3D size={17} />}
              {overviewUnlocked ? 'Blocca overview' : 'Vista libera'}
            </button>
          )}
          {mode === 'hotspot' && (
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
          {mode === 'auto' && <AutoWalkthroughPanel />}
          {setupEnabled && <StationSetupPanel />}
          {mode === 'walkthrough' ? (
            <div className="absolute bottom-5 left-5 flex items-center gap-4 rounded-lg border border-slate-200 bg-white px-4 py-3 text-xs text-slate-600 shadow-md">
              <span>
                <b className="block text-sm text-slate-900">
                  Modalità prima persona
                </b>
                Click per guardare · WASD/frecce per muoverti · ESC per uscire
              </span>
              <button
                onClick={() => setMode('overview')}
                className="rounded-md border border-slate-300 px-3 py-2 font-semibold text-slate-800 hover:bg-slate-50"
              >
                Esci
              </button>
            </div>
          ) : (
            mode !== 'auto' && (
              <div className="pointer-events-none absolute bottom-5 left-5 rounded-lg border border-slate-200 bg-white/95 px-4 py-3 text-xs text-slate-600 shadow-md">
                <b className="block text-sm text-slate-800">
                  Esplora la stazione
                </b>
                {mode === 'hotspot'
                  ? 'Scegli una vista guidata'
                  : overviewUnlocked
                    ? 'Trascina per ruotare · scorri per avvicinare'
                    : 'Vista editoriale bloccata · attiva Vista libera per esplorare'}
              </div>
            )
          )}
        </section>
        {!setupEnabled && <MediaPointPanel points={config.mediaPoints} />}
      </main>
    </div>
  )
}
