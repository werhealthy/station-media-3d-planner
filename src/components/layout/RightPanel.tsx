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
import { AssetPanel } from './panels/AssetPanel'
import { BannerPanel } from './panels/BannerPanel'

const TABS: { id: RightPanelTab; label: string; icon: LucideIcon }[] = [
  { id: 'assets', label: 'Asset', icon: Image },
  { id: 'banners', label: 'Banner', icon: MonitorPlay },
  { id: 'hotspots', label: 'Hotspot', icon: Radar },
  { id: 'routes', label: 'Percorsi', icon: Route },
  { id: 'settings', label: 'Impostazioni', icon: Settings },
  { id: 'analysis', label: 'Analisi', icon: BarChart3 },
]

function renderTabContent(tabId: RightPanelTab) {
  switch (tabId) {
    case 'assets':
      return <AssetPanel />
    case 'banners':
      return <BannerPanel />
    case 'hotspots':
      return <EmptyPanelState label="Hotspot" phase="Fase 4" />
    case 'routes':
      return <EmptyPanelState label="Percorsi" phase="Fase 5" />
    case 'settings':
      return <EmptyPanelState label="Impostazioni" phase="Fase 1" />
    case 'analysis':
      return <EmptyPanelState label="Analisi" phase="Fase 6" />
    default:
      return <EmptyPanelState label="Sconosciuto" phase="?" />
  }
}

export function RightPanel() {
  const activeTab = useUiStore((s) => s.activeRightPanelTab)
  const setActiveTab = useUiStore((s) => s.setActiveRightPanelTab)

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

      <div className="flex-1 overflow-hidden p-4">{renderTabContent(activeTab)}</div>
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
        Contenuto funzionale disponibile dalla {phase} del piano di implementazione.
      </p>
    </div>
  )
}
