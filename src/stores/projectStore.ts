import { create } from 'zustand'
import type { MediaAsset } from '@/domain/schemas/media'
import type { CreativeFitMode } from '@/core/creative/creativeFit'
interface ProjectState {
  projectName: string
  assignments: Record<string, MediaAsset>
  fitModes: Record<string, CreativeFitMode>
  assignAsset: (id: string, asset: MediaAsset) => void
  setFitMode: (id: string, fitMode: CreativeFitMode) => void
  clearAsset: (id: string) => void
}
export const useProjectStore = create<ProjectState>((set) => ({
  projectName: 'Station Media 3D Planner',
  assignments: {},
  fitModes: {},
  assignAsset: (id, asset) =>
    set((state) => {
      const previous = state.assignments[id]
      if (previous) URL.revokeObjectURL(previous.url)
      return { assignments: { ...state.assignments, [id]: asset } }
    }),
  setFitMode: (id, fitMode) =>
    set((state) => ({ fitModes: { ...state.fitModes, [id]: fitMode } })),
  clearAsset: (id) =>
    set((state) => {
      const next = { ...state.assignments }
      const nextFitModes = { ...state.fitModes }
      const previous = next[id]
      if (previous) URL.revokeObjectURL(previous.url)
      delete next[id]
      delete nextFitModes[id]
      return { assignments: next, fitModes: nextFitModes }
    }),
}))
