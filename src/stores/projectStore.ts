import { create } from 'zustand'
import type { MediaAsset } from '@/domain/schemas/media'
interface ProjectState {
  projectName: string
  assignments: Record<string, MediaAsset>
  hiddenMediaPointIds: string[]
  assignAsset: (id: string, asset: MediaAsset) => void
  clearAsset: (id: string) => void
  toggleMediaPointVisibility: (id: string) => void
  showAllMediaPoints: () => void
}
export const useProjectStore = create<ProjectState>((set) => ({
  projectName: 'Station Media 3D Planner',
  assignments: {},
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
  toggleMediaPointVisibility: (id) =>
    set((state) => ({
      hiddenMediaPointIds: state.hiddenMediaPointIds.includes(id)
        ? state.hiddenMediaPointIds.filter((item) => item !== id)
        : [...state.hiddenMediaPointIds, id],
    })),
  showAllMediaPoints: () => set({ hiddenMediaPointIds: [] }),
}))
