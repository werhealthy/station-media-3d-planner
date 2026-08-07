import { create } from 'zustand'
import type { StationModelDiagnostics } from '@/adapters/station-model/types'

export interface RuntimeBounds {
  min: [number, number, number]
  max: [number, number, number]
  center: [number, number, number]
  size: [number, number, number]
}

interface StationRuntimeState {
  bounds: RuntimeBounds | null
  diagnostics: StationModelDiagnostics | null
  loadWarning: string | null
  setLoadedModel: (bounds: RuntimeBounds, diagnostics: StationModelDiagnostics | null) => void
  setLoadWarning: (message: string | null) => void
}

export const useStationRuntimeStore = create<StationRuntimeState>((set) => ({
  bounds: null,
  diagnostics: null,
  loadWarning: null,
  setLoadedModel: (bounds, diagnostics) => set({ bounds, diagnostics }),
  setLoadWarning: (loadWarning) => set({ loadWarning }),
}))
