import { create } from 'zustand'

/**
 * Modalita' principale dell'applicazione (barra superiore).
 * "routing" applicativo minimo: non usiamo un router a pagine separate,
 * l'app e' una singola vista 3D con modalita' commutabili in-place.
 */
export type ViewMode = 'overview' | 'hotspot' | 'walkthrough'

export type RightPanelTab =
  | 'assets'
  | 'banners'
  | 'hotspots'
  | 'routes'
  | 'settings'
  | 'analysis'

interface UiState {
  viewMode: ViewMode
  setViewMode: (mode: ViewMode) => void

  activeRightPanelTab: RightPanelTab
  setActiveRightPanelTab: (tab: RightPanelTab) => void

  isBottomPanelOpen: boolean
  setBottomPanelOpen: (open: boolean) => void
}

/** Stato UI puramente transitorio: mai persistito. */
export const useUiStore = create<UiState>((set) => ({
  viewMode: 'overview',
  setViewMode: (mode) => set({ viewMode: mode }),

  activeRightPanelTab: 'banners',
  setActiveRightPanelTab: (tab) => set({ activeRightPanelTab: tab }),

  isBottomPanelOpen: false,
  setBottomPanelOpen: (open) => set({ isBottomPanelOpen: open }),
}))
