import type { LucideIcon } from 'lucide-react'
import {
  Image,
  MonitorPlay,
  Radar,
  Route,
  Settings,
  BarChart3,
} from 'lucide-react'
import { useUiStore, type RightPanelTab } from '@/stores/uiStore'
import { cn } from '@/lib/cn'

const TABS: { id: RightPanelTab; label: string; icon: LucideIcon; phase: string }[] = [
  { id: 'assets', label: 'Asset', icon: Image, phase: 'Fase 3' },
  { id: 'banners', label: 'Banner', icon: MonitorPlay, phase: 'Fase 3' },
  { id: 'hotspots', label: 'Hotspot', icon: Radar, phase: 'Fase 4' },
  { id: 'routes', label: 'Percorsi', icon: Route, phase: 'Fase 5' },
  { id: 'settings', label: 'Impostazioni', icon: Settings, phase: 'Fase 1' },
  { id: 'analysis', label: 'Analisi', icon: BarChart3, phase: 'Fase 6' },
]

export function RightPanel() {
  const activeTab = useUiStore((s) => s.activeRightPanelTab)
  const setActiveTab = useUiStore((s) => s.setActiveRightPanelTab)

  const current = TABS.find((tab) => tab.id === activeTab) ?? TABS[0]!

  return (
    <aside className="flex w-80 shrink-0 flex-col border-l border-slate-200 bg-white">
      <nav
        aria-label="Sezioni pannello laterale"
        className="flex flex-wrap gap-1 border-b border-slate-200 p-2"
      >
        {TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = tab.id === activeTab
          return (
            <button
              key={tab.id}
              type="button"
              aria-pressed={isActive}
              title={tab.label}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors',
                isActive
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100',
              )}
            >
              <Icon size={14} aria-hidden="true" />
              {tab.label}
            </button>
          )
        })}
      </nav>

      <div className="flex-1 overflow-y-auto p-4">
        <EmptyPanelState label={current.label} phase={current.phase} />
      </div>
    </aside>
  )
}

function EmptyPanelState({ label, phase }: { label: string; phase: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-1 rounded-md border border-dashed border-slate-200 p-6 text-center">
      <p className="text-sm font-medium text-slate-700">
        Sezione &ldquo;{label}&rdquo;
      </p>
      <p className="text-xs text-slate-400">
        Contenuto funzionale disponibile dalla {phase} del piano di
        implementazione.
      </p>
    </div>
  )
}
