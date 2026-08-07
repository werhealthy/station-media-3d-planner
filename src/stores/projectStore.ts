import { create } from 'zustand'
import type { MediaAsset } from '@/domain/schemas/media'
interface ProjectState {
  projectName: string
  assignments: Record<string, MediaAsset>
  assignAsset: (id: string, asset: MediaAsset) => void
  clearAsset: (id: string) => void
}
export const useProjectStore = create<ProjectState>((set) => ({
  projectName: 'Station Media 3D Planner',
  assignments: {},
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
}))
