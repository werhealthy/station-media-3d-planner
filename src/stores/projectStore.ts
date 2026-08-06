import { create } from 'zustand'

/**
 * Scaffolding minimo dello store di progetto (Fase 1).
 * Le entita' complete (Station, AdvertisingPoint, Hotspot, WalkingRoute, ...)
 * descritte in docs/DATA_MODEL.md verranno introdotte nelle fasi successive,
 * insieme ai relativi schemi Zod in src/domain/, mano a mano che le
 * funzionalita' corrispondenti vengono implementate (Fase 2 in poi).
 */
interface ProjectState {
  projectName: string
  activeStationId: string | null

  setProjectName: (name: string) => void
  setActiveStationId: (id: string | null) => void
}

export const useProjectStore = create<ProjectState>((set) => ({
  projectName: 'Nuovo progetto',
  activeStationId: null,

  setProjectName: (name) => set({ projectName: name }),
  setActiveStationId: (id) => set({ activeStationId: id }),
}))
