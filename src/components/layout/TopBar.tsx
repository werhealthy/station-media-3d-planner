import {
  CircleHelp,
  Footprints,
  Grid2X2,
  MapPin,
  Telescope,
} from 'lucide-react'
import { useProjectStore } from '@/stores/projectStore'
import { useViewerStore } from '@/stores/viewerStore'

export function TopBar() {
  const projectName = useProjectStore((s) => s.projectName)
  const mode = useViewerStore((s) => s.navigationMode)
  const setMode = useViewerStore((s) => s.setNavigationMode)
  const modes = [
    ['overview', 'Overview', Grid2X2],
    ['hotspot', 'Hotspot', Telescope],
    ['walkthrough', 'Walkthrough', Footprints],
  ] as const
  return (
    <header className="flex h-[76px] shrink-0 items-center gap-6 border-b border-slate-200 bg-white px-7 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#11347e] text-xl font-black text-white">
          Q8
        </div>
        <div>
          <p className="text-lg font-bold text-[#12265b]">{projectName}</p>
          <p className="text-xs text-slate-500">Configuratore creatività</p>
        </div>
      </div>
      <div className="ml-auto flex overflow-hidden rounded-lg border border-slate-200 bg-slate-50 p-1">
        {modes.map(([id, label, Icon]) => (
          <button
            key={id}
            onClick={() => setMode(id)}
            className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition ${mode === id ? 'bg-[#1746a2] text-white shadow-sm' : 'text-slate-600 hover:bg-white'}`}
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
