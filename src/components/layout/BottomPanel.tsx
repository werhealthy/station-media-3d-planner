import { useUiStore } from '@/stores/uiStore'

export function BottomPanel() {
  const isOpen = useUiStore((s) => s.isBottomPanelOpen)

  if (!isOpen) return null

  return (
    <div className="h-40 shrink-0 border-t border-slate-200 bg-white p-4">
      <p className="text-sm font-medium text-slate-700">Metriche di visibilita'</p>
      <p className="mt-1 text-xs text-slate-400">
        Disponibili durante le modalita' Hotspot e Walkthrough, a partire
        dalla Fase 6 del piano di implementazione.
      </p>
    </div>
  )
}
