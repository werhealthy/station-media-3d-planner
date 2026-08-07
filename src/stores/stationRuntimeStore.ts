import { create } from 'zustand'
import type { StationModelDiagnostics } from '@/adapters/station-model/types'
import type * as THREE from 'three'

export interface RuntimeBounds {
  min: [number, number, number]
  max: [number, number, number]
  center: [number, number, number]
  size: [number, number, number]
}

interface StationRuntimeState {
  bounds: RuntimeBounds | null
  root: THREE.Object3D | null
  diagnostics: StationModelDiagnostics | null
  loadWarning: string | null
  setLoadedModel: (
    root: THREE.Object3D,
    bounds: RuntimeBounds,
    diagnostics: StationModelDiagnostics | null,
  ) => void
  setLoadWarning: (message: string | null) => void
  reset: () => void
}

export const useStationRuntimeStore = create<StationRuntimeState>((set) => ({
  bounds: null,
  root: null,
  diagnostics: null,
  loadWarning: null,
  setLoadedModel: (root, bounds, diagnostics) => set({ root, bounds, diagnostics }),
  setLoadWarning: (loadWarning) => set({ loadWarning }),
  reset: () => set({ root: null, bounds: null, diagnostics: null, loadWarning: null }),
}))
