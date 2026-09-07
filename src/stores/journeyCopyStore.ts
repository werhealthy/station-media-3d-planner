import { create } from 'zustand'

export interface JourneyStepCopy {
  phase?: string
  label?: string
  checkpoint?: string
}

interface JourneyCopyState {
  editorOpen: boolean
  overrides: Record<string, JourneyStepCopy>
  openEditor: () => void
  closeEditor: () => void
  updateStepCopy: (stepId: string, patch: JourneyStepCopy) => void
  resetStepCopy: (stepId: string) => void
  resetAllCopy: () => void
}

export const useJourneyCopyStore = create<JourneyCopyState>((set) => ({
  editorOpen: false,
  overrides: {},
  openEditor: () => set({ editorOpen: true }),
  closeEditor: () => set({ editorOpen: false }),
  updateStepCopy: (stepId, patch) =>
    set((state) => ({
      overrides: {
        ...state.overrides,
        [stepId]: { ...state.overrides[stepId], ...patch },
      },
    })),
  resetStepCopy: (stepId) =>
    set((state) => {
      const overrides = { ...state.overrides }
      delete overrides[stepId]
      return { overrides }
    }),
  resetAllCopy: () => set({ overrides: {} }),
}))
