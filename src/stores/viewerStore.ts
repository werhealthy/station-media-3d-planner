import { create } from 'zustand'
interface ViewerState {
  navigationMode: 'overview' | 'hotspot' | 'walkthrough' | 'auto'
  activeHotspotId: string | null
  selectedMediaPointId: string | null
  hoveredMediaPointId: string | null
  overviewUnlocked: boolean
  eyeHeight: number
  focusRequestId: number
  selectMediaPoint: (id: string | null) => void
  hoverMediaPoint: (id: string | null) => void
  setNavigationMode: (mode: ViewerState['navigationMode']) => void
  setActiveHotspot: (id: string | null) => void
  setOverviewUnlocked: (unlocked: boolean) => void
  setEyeHeight: (height: number) => void
  resetForStation: () => void
}
export const useViewerStore = create<ViewerState>((set) => ({
  navigationMode: 'overview',
  activeHotspotId: null,
  selectedMediaPointId: null,
  hoveredMediaPointId: null,
  overviewUnlocked: false,
  eyeHeight: 1.7,
  focusRequestId: 0,
  selectMediaPoint: (id) =>
    set((state) => ({
      selectedMediaPointId: id,
      ...(id
        ? {
            navigationMode: 'overview' as const,
            activeHotspotId: null,
            overviewUnlocked: false,
            focusRequestId: state.focusRequestId + 1,
          }
        : {}),
    })),
  hoverMediaPoint: (id) => set({ hoveredMediaPointId: id }),
  setNavigationMode: (navigationMode) =>
    set({
      navigationMode,
      activeHotspotId: null,
      overviewUnlocked: false,
    }),
  setActiveHotspot: (activeHotspotId) =>
    set({ activeHotspotId, navigationMode: 'hotspot' }),
  setOverviewUnlocked: (overviewUnlocked) =>
    set((state) => ({
      overviewUnlocked,
      navigationMode: overviewUnlocked ? 'overview' : state.navigationMode,
      activeHotspotId: overviewUnlocked ? null : state.activeHotspotId,
    })),
  setEyeHeight: (eyeHeight) =>
    set({ eyeHeight: Math.min(2, Math.max(1.45, eyeHeight)) }),
  resetForStation: () =>
    set({
      navigationMode: 'overview',
      activeHotspotId: null,
      selectedMediaPointId: null,
      hoveredMediaPointId: null,
      overviewUnlocked: false,
    }),
}))
