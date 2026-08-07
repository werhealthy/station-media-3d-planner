import {
  CircleHelp,
  Footprints,
  Grid2X2,
  MapPin,
  Telescope,
  Route,
} from 'lucide-react'
import { useProjectStore } from '@/stores/projectStore'
import { useViewerStore } from '@/stores/viewerStore'
import { BRAND_ASSETS } from '@/config/brandAssets'
import { usePlaybackStore } from '@/stores/playbackStore'

export function TopBar() {
  const projectName = useProjectStore((s) => s.projectName)
  const mode = useViewerStore((s) => s.navigationMode)
  const setMode = useViewerStore((s) => s.setNavigationMode)
  const play = usePlaybackStore((s) => s.play)
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
      <div className="flex items-center gap-3 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700">
        <MapPin size={17} className="text-[#1954c6]" />
        Q8 Milano Est
        <span className="text-xs font-semibold text-emerald-700">Demo</span>
      </div>
      <button
        className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
        aria-label="Guida"
      >
        <CircleHelp size={22} />
      </button>
    </header>
  )
}
