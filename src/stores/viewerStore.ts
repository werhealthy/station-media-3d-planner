import { create } from 'zustand'
interface ViewerState {
  navigationMode: 'overview' | 'hotspot' | 'walkthrough' | 'auto'
  activeHotspotId: string | null
  selectedMediaPointId: string | null
  hoveredMediaPointId: string | null
  overviewUnlocked: boolean
  personHeight: number
  focusRequestId: number
  selectMediaPoint: (id: string | null) => void
  hoverMediaPoint: (id: string | null) => void
  setNavigationMode: (mode: ViewerState['navigationMode']) => void
  setActiveHotspot: (id: string | null) => void
  setOverviewUnlocked: (unlocked: boolean) => void
  setPersonHeight: (height: number) => void
  resetForStation: () => void
}

export const MIN_PERSON_HEIGHT = 1.4
export const MAX_PERSON_HEIGHT = 2.1
export const EYE_TOP_OFFSET = 0.11

export function eyeHeightFromPersonHeight(personHeight: number) {
  return personHeight - EYE_TOP_OFFSET
}

export const useViewerStore = create<ViewerState>((set) => ({
  navigationMode: 'overview',
  activeHotspotId: null,
  selectedMediaPointId: null,
  hoveredMediaPointId: null,
  overviewUnlocked: false,
  personHeight: 1.8,
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
  setPersonHeight: (personHeight) =>
    set({
      personHeight: Math.min(
        MAX_PERSON_HEIGHT,
        Math.max(MIN_PERSON_HEIGHT, personHeight),
      ),
    }),
  resetForStation: () =>
    set({
      navigationMode: 'overview',
      activeHotspotId: null,
      selectedMediaPointId: null,
      hoveredMediaPointId: null,
      overviewUnlocked: false,
    }),
}))
