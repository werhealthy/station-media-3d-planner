import { create } from 'zustand'
interface ViewerState {
  navigationMode: 'overview' | 'hotspot' | 'walkthrough'
  activeHotspotId: string | null
  selectedMediaPointId: string | null
  hoveredMediaPointId: string | null
  selectMediaPoint: (id: string | null) => void
  hoverMediaPoint: (id: string | null) => void
  setNavigationMode: (mode: ViewerState['navigationMode']) => void
  setActiveHotspot: (id: string | null) => void
}
export const useViewerStore = create<ViewerState>((set) => ({
  navigationMode: 'overview',
  activeHotspotId: null,
  selectedMediaPointId: null,
  hoveredMediaPointId: null,
  selectMediaPoint: (id) => set({ selectedMediaPointId: id }),
  hoverMediaPoint: (id) => set({ hoveredMediaPointId: id }),
  setNavigationMode: (navigationMode) =>
    set({
      navigationMode,
      activeHotspotId: null,
    }),
  setActiveHotspot: (activeHotspotId) =>
    set({ activeHotspotId, navigationMode: 'hotspot' }),
}))
