import { create } from 'zustand'
import type { MediaAsset } from '@/domain/schemas/media'

export interface CreativeDisplaySettings {
  fitMode: 'contain' | 'cover'
  backgroundColor: string
  rotation: number
  offsetX: number
  offsetY: number
}

export const DEFAULT_CREATIVE_DISPLAY: CreativeDisplaySettings = {
  fitMode: 'contain',
  backgroundColor: '#ffffff',
  rotation: 0,
  offsetX: 0,
  offsetY: 0,
}

interface ProjectState {
  projectName: string
  assignments: Record<string, MediaAsset>
  creativeDisplay: Record<string, CreativeDisplaySettings>
  hiddenMediaPointIds: string[]
  assignAsset: (id: string, asset: MediaAsset) => void
  clearAsset: (id: string) => void
  updateCreativeDisplay: (
    id: string,
    settings: Partial<CreativeDisplaySettings>,
  ) => void
  toggleMediaPointVisibility: (id: string) => void
  showAllMediaPoints: () => void
}
export const useProjectStore = create<ProjectState>((set) => ({
  projectName: 'Station Media 3D Planner',
  assignments: {},
  creativeDisplay: {},
  hiddenMediaPointIds: [],
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
  updateCreativeDisplay: (id, settings) =>
    set((state) => ({
      creativeDisplay: {
        ...state.creativeDisplay,
        [id]: {
          ...DEFAULT_CREATIVE_DISPLAY,
          ...state.creativeDisplay[id],
          ...settings,
        },
      },
    })),
  toggleMediaPointVisibility: (id) =>
    set((state) => ({
      hiddenMediaPointIds: state.hiddenMediaPointIds.includes(id)
        ? state.hiddenMediaPointIds.filter((item) => item !== id)
        : [...state.hiddenMediaPointIds, id],
    })),
  showAllMediaPoints: () => set({ hiddenMediaPointIds: [] }),
}))
