import { CircleHelp, MapPin } from 'lucide-react'
import { useProjectStore } from '@/stores/projectStore'

export function TopBar() {
  const projectName = useProjectStore((s) => s.projectName)
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
      <div className="ml-auto flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700">
        <MapPin size={17} className="text-[#1954c6]" />
        Q8 Milano Est
        <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs text-emerald-700">
          Demo
        </span>
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
