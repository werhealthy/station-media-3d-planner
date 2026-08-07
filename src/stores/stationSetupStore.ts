import { create } from 'zustand'
import {
  createEmptyStationConfig,
  type CameraView,
  type StationConfig,
} from '@/domain/stationConfig'

export type SetupTool = 'inspect' | 'ground' | 'media' | 'walk' | null
export interface MeshInspection {
  name: string
  path: string
  parent: string
  materials: string[]
  textures: string[]
  position: [number, number, number]
  min: [number, number, number]
  max: [number, number, number]
  size: [number, number, number]
  visible: boolean
  hitPoint: [number, number, number]
  normal: [number, number, number]
}

interface DebugFlags {
  bounds: boolean
  ground: boolean
  hotspots: boolean
  media: boolean
  walkPath: boolean
}

interface SetupState {
  enabled: boolean
  tool: SetupTool
  config: StationConfig
  configLoaded: boolean
  selectedMesh: MeshInspection | null
  selectedMediaPointId: string | null
  currentView: CameraView | null
  warning: string | null
  debug: DebugFlags
  requestedView: CameraView | null
  viewRequestId: number
  enterSetup: () => void
  exitSetup: () => void
  previewView: (view: CameraView) => void
  initialize: (config: StationConfig, loaded: boolean) => void
  setTool: (tool: SetupTool) => void
  setSelectedMesh: (mesh: MeshInspection | null) => void
  setSelectedMediaPoint: (id: string | null) => void
  setCurrentView: (view: CameraView) => void
  updateConfig: (update: (config: StationConfig) => StationConfig) => void
  setWarning: (warning: string | null) => void
  toggleDebug: (key: keyof DebugFlags) => void
}

const enabled =
  typeof window !== 'undefined' &&
  new URLSearchParams(window.location.search).get('setup') === '1'

export const useStationSetupStore = create<SetupState>((set) => ({
  enabled,
  tool: null,
  config: createEmptyStationConfig('low-poly', 'procedural'),
  configLoaded: true,
  selectedMesh: null,
  selectedMediaPointId: null,
  currentView: null,
  warning: null,
  debug: { bounds: false, ground: true, hotspots: true, media: true, walkPath: true },
  requestedView: null,
  viewRequestId: 0,
  enterSetup: () => set({ enabled: true }),
  exitSetup: () => set({ enabled: false, tool: null, selectedMesh: null }),
  previewView: (requestedView) => set((state) => ({ requestedView, viewRequestId: state.viewRequestId + 1 })),
  initialize: (config, configLoaded) =>
    set({ config, configLoaded, tool: null, selectedMesh: null, selectedMediaPointId: null, warning: null }),
  setTool: (tool) => set({ tool }),
  setSelectedMesh: (selectedMesh) => set({ selectedMesh }),
  setSelectedMediaPoint: (selectedMediaPointId) => set({ selectedMediaPointId }),
  setCurrentView: (currentView) => set({ currentView }),
  updateConfig: (update) => set((state) => ({ config: update(state.config) })),
  setWarning: (warning) => set({ warning }),
  toggleDebug: (key) =>
    set((state) => ({ debug: { ...state.debug, [key]: !state.debug[key] } })),
}))
