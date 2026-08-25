import {
  CircleHelp,
  Footprints,
  Grid2X2,
  MapPin,
  Telescope,
  Route,
  ChevronDown,
  Settings,
} from 'lucide-react'
import { useProjectStore } from '@/stores/projectStore'
import { useViewerStore } from '@/stores/viewerStore'
import { BRAND_ASSETS } from '@/config/brandAssets'
import { usePlaybackStore } from '@/stores/playbackStore'
import { STATIONS, type StationId } from '@/domain/stations'
import { useStationStore } from '@/stores/stationStore'
import { useStationSetupStore } from '@/stores/stationSetupStore'

export function TopBar() {
  const projectName = useProjectStore((s) => s.projectName)
  const mode = useViewerStore((s) => s.navigationMode)
  const setMode = useViewerStore((s) => s.setNavigationMode)
  const play = usePlaybackStore((s) => s.play)
  const stationId = useStationStore((s) => s.selectedStationId)
  const selectStation = useStationStore((s) => s.selectStation)
  const station = STATIONS.find((item) => item.id === stationId) ?? STATIONS[0]
  const setupEnabled = useStationSetupStore((s) => s.enabled)
  const enterSetup = useStationSetupStore((s) => s.enterSetup)
  const modes = [
    ['overview', 'Overview', Grid2X2],
    ['hotspot', 'Hotspot', Telescope],
    ['walkthrough', 'Walkthrough', Footprints],
    ['auto', 'Auto tour', Route],
  ] as const
  return (
    <header className="relative z-10 flex h-[80px] shrink-0 items-center gap-7 border-b border-slate-200/80 bg-white px-7 shadow-[0_1px_12px_rgba(15,23,42,0.06)]">
      <div className="flex items-center gap-3">
        <img
          src={BRAND_ASSETS.q8Logo}
          alt="Q8"
          className="h-12 w-[72px] object-contain"
        />
        <div>
          <p className="text-[17px] font-extrabold tracking-[-0.02em] text-[#12265b]">
            {projectName}
          </p>
          <p className="mt-0.5 text-[11px] font-medium tracking-wide text-slate-500">
            Configuratore creatività
          </p>
        </div>
      </div>
      <label className="relative ml-4 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 hover:bg-slate-50">
        <MapPin size={17} className="text-[#1954c6]" />
        <span className="sr-only">Stazione</span>
        <select
          aria-label="Stazione"
          value={stationId}
          onChange={(event) => selectStation(event.target.value as StationId)}
          className="max-w-[230px] cursor-pointer appearance-none bg-transparent pr-14 font-semibold outline-none"
        >
          {STATIONS.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-8 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
          {station.badge}
        </span>
        <ChevronDown size={15} className="pointer-events-none text-slate-400" />
      </label>
      <div className="ml-auto flex overflow-hidden rounded-xl border border-slate-200 bg-slate-50/80 p-1.5">
        {modes.map(([id, label, Icon]) => (
          <button
            key={id}
            onClick={() => {
              setMode(id)
              if (id === 'auto') play()
            }}
            className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${mode === id ? 'bg-[#1746a2] text-white shadow-md shadow-blue-900/15' : 'text-slate-600 hover:bg-white hover:text-slate-900 hover:shadow-sm'}`}
          >
            <Icon size={17} />
            {label}
          </button>
        ))}
      </div>
      {station.modelType !== 'procedural' && !setupEnabled && (
        <button
          type="button"
          onClick={enterSetup}
          className="flex shrink-0 items-center gap-2 rounded-lg bg-amber-400 px-3 py-2.5 text-sm font-extrabold text-slate-950 shadow-sm transition hover:bg-amber-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500"
        >
          <Settings size={17} />
          Configura stazione
        </button>
      )}
      <button
        className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
        aria-label="Guida"
      >
        <CircleHelp size={22} />
      </button>
    </header>
  )
}
