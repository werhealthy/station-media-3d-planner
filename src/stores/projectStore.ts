import { create } from 'zustand'
import type { MediaAsset } from '@/domain/schemas/media'
export interface CreativeDisplaySettings {
  fitMode: 'contain' | 'cover'
  backgroundColor: string
  rotation: number
  zoom: number
  offsetX: number
  offsetY: number
}

export const DEFAULT_CREATIVE_DISPLAY: CreativeDisplaySettings = {
  fitMode: 'contain',
  backgroundColor: '#ffffff',
  rotation: 0,
  zoom: 1,
  offsetX: 0,
  offsetY: 0,
}

interface ProjectState {
  projectName: string
  assignments: Record<string, MediaAsset>
  hiddenMediaPointIds: string[]
  creativeDisplay: Record<string, CreativeDisplaySettings>
  assignAsset: (id: string, asset: MediaAsset) => void
  clearAsset: (id: string) => void
  toggleMediaPointVisibility: (id: string) => void
  showAllMediaPoints: () => void
  updateCreativeDisplay: (
    id: string,
    patch: Partial<CreativeDisplaySettings>,
  ) => void
}
export const useProjectStore = create<ProjectState>((set) => ({
  projectName: 'Station Media 3D Planner',
  assignments: {},
  hiddenMediaPointIds: [],
  creativeDisplay: {},
  assignAsset: (id, asset) =>
    set((state) => {
      const previous = state.assignments[id]
      if (previous) URL.revokeObjectURL(previous.url)
      return { assignments: { ...state.assignments, [id]: asset } }
    }),
  clearAsset: (id) =>
    set((state) => {
      const next = { ...state.assignments }
      const previous = next[id]
      if (previous) URL.revokeObjectURL(previous.url)
      delete next[id]
      return { assignments: next }
    }),
  toggleMediaPointVisibility: (id) =>
    set((state) => ({
      hiddenMediaPointIds: state.hiddenMediaPointIds.includes(id)
        ? state.hiddenMediaPointIds.filter((item) => item !== id)
        : [...state.hiddenMediaPointIds, id],
    })),
  showAllMediaPoints: () => set({ hiddenMediaPointIds: [] }),
  updateCreativeDisplay: (id, patch) =>
    set((state) => ({
      creativeDisplay: {
        ...state.creativeDisplay,
        [id]: {
          ...DEFAULT_CREATIVE_DISPLAY,
          ...state.creativeDisplay[id],
          ...patch,
        },
      },
    })),
}))
